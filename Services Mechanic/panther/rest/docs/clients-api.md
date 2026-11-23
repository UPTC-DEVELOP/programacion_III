# API de Clientes de Panther

Contrato de la etapa 1 del modulo Clientes. Todos los endpoints usan JSON y
requieren un token valido de Panther.

## Autenticacion

Enviar el token en cada solicitud. El formato recomendado es:

```http
Authorization: Bearer <token-de-panther>
Content-Type: application/json
```

Por compatibilidad, Panther tambien acepta el token directamente en
`Authorization`. Los ejemplos no incluyen credenciales reales.

La URL base depende de la carpeta configurada en Apache. En los ejemplos se usa
`{baseUrl}` para representar la ruta hasta `panther/rest`.

## Consultar clientes

```http
GET {baseUrl}/clients
GET {baseUrl}/clients?q=Gomez
```

`q` es opcional, elimina espacios iniciales y finales y permite maximo 40
caracteres. Busca coincidencias literales en cedula, nombres o apellidos.

Respuesta con resultados:

```json
{
  "state": "OK",
  "code": 200,
  "data": {
    "message": "Consulta de clientes realizada exitosamente.",
    "clientes": [
      {
        "idCliente": "0001",
        "cedula": "1012345678",
        "nombres": "Maria-Jose",
        "apellidos": "Gomez O'Neill",
        "telefono": "3001234567",
        "direccion": "Calle 10 # 20-30"
      }
    ]
  }
}
```

Sin coincidencias se responde `200` con un mensaje informativo y
`"clientes": []`. No se modifica ningun dato.

## Registrar cliente

```http
POST {baseUrl}/clients
```

```json
{
  "cedula": "1012345678",
  "nombres": "Maria-Jose",
  "apellidos": "Gomez O'Neill",
  "telefono": "3001234567",
  "direccion": "Calle 10 # 20-30"
}
```

No se debe enviar `idCliente`; la base genera el valor interno y Panther lo
devuelve con cuatro caracteres.

```json
{
  "state": "CREATE",
  "code": 201,
  "data": {
    "message": "Cliente registrado exitosamente.",
    "idCliente": "0001"
  }
}
```

## Actualizar cliente

```http
PUT {baseUrl}/clients/0001
```

Se envian los cinco campos obligatorios con las mismas reglas del registro:

```json
{
  "cedula": "1012345678",
  "nombres": "Maria Jose",
  "apellidos": "Gomez O'Neill",
  "telefono": "3109876543",
  "direccion": "Carrera 15 # 40-20"
}
```

Respuesta:

```json
{
  "state": "OK",
  "code": 200,
  "data": {
    "message": "Cliente actualizado exitosamente.",
    "idCliente": "0001"
  }
}
```

El ID de la URL debe tener cuatro digitos y no se puede cambiar. Toda la
validacion ocurre antes del `UPDATE`, y la operacion usa una transaccion.

## Solicitar eliminacion

```http
DELETE {baseUrl}/clients/0001
```

```json
{
  "confirmacion": true
}
```

En esta etapa el endpoint valida autenticacion, ID, confirmacion y existencia,
pero siempre bloquea la eliminacion de un cliente existente con `409`:

```json
{
  "state": "CONFLICT",
  "code": 409,
  "data": "Eliminacion deshabilitada: falta integrar la comprobacion de autos, servicios y facturas asociados."
}
```

No hay una sentencia `DELETE` ni se llama al borrado generico de `Request.php`.
Cuando existan las tablas relacionadas, se deben consultar las tres relaciones
y mantener claves foraneas `ON DELETE RESTRICT` antes de habilitar el borrado.

## Reglas de validacion

- `cedula`: texto de 1 a 10 digitos y valor unico.
- `nombres` y `apellidos`: texto de 1 a 40 caracteres; admite letras Unicode,
  espacios, tildes, ene, guiones y apostrofos.
- `telefono`: texto de exactamente 10 digitos.
- `direccion`: texto no vacio de maximo 80 caracteres y sin controles.
- Ningun campo admite un valor vacio o compuesto solamente por espacios.
- Los errores de validacion responden `400`; duplicados o conflictos, `409`;
  recursos inexistentes, `404`; y token ausente o invalido, `401`.

## Instalacion posterior en phpMyAdmin

1. Abrir phpMyAdmin con un usuario autorizado para crear bases y tablas.
2. Elegir la pestana **Importar**.
3. Seleccionar `panther/sql/services_mechanic_install.sql`.
4. Confirmar que el formato sea SQL y ejecutar la importacion.
5. Verificar que se crearon `j4rol`, `j4user`, `person`, `clientes` y
   `trg_clientes_limite_id`.
6. Crear localmente un rol y un administrador siguiendo `panther/sql/README.md`.
7. Configurar `PANTHER_DB_NAME=services_mechanic` y reiniciar Apache.

No se debe importar el script sobre la base `panther`. Si el servidor no permite
`CREATE DATABASE`, un administrador debe crear `services_mechanic`, seleccionarla
y ejecutar solamente desde `CREATE TABLE` en adelante.

## Integraciones pendientes

- Crear las tablas de vehiculos, servicios y facturas y habilitar la comprobacion
  de relaciones para RF4.
- Definir expiracion, revocacion y permisos por rol para los tokens existentes.
- Restringir `Access-Control-Allow-Origin` a los dominios autorizados cuando se
  conozca la URL definitiva del frontend; la plantilla actual permite cualquier
  origen.
- Ejecutar pruebas de integracion contra una base de desarrollo despues de que
  el equipo autorice la instalacion del SQL.
