# API de Repuestos de Panther

El recurso base es `{baseUrl}/spareparts`. Todos los endpoints usan JSON y
requieren el token de Panther:

```http
Authorization: Bearer <TOKEN_VALIDO>
Content-Type: application/json
```

Los ejemplos contienen marcadores, no credenciales reales.

## Consultar repuestos — RF14

```http
GET {baseUrl}/spareparts
GET {baseUrl}/spareparts?q=filtro
```

`q` es opcional, se recorta y admite hasta 100 caracteres. Busca coincidencias
en referencia, descripcion o marca. La consulta no modifica datos.

```json
{
  "state": "OK",
  "code": 200,
  "data": {
    "mensaje": "Consulta de repuestos realizada exitosamente.",
    "repuestos": [
      {
        "idRepuesto": "0001",
        "referencia": "REF-EJEMPLO",
        "descripcion": "Filtro de aceite",
        "marca": "Marca ejemplo",
        "precio": "25000.00"
      }
    ]
  }
}
```

Sin registros o coincidencias se devuelve `200`, un arreglo vacio y un mensaje
informativo.

## Registrar repuesto — RF13

```http
POST {baseUrl}/spareparts
```

```json
{
  "referencia": "REF-EJEMPLO",
  "descripcion": "Filtro de aceite",
  "marca": "Marca ejemplo",
  "precio": 25000.00
}
```

`precio` debe enviarse como numero, ser mayor que cero y tener maximo dos
decimales. La columna `DECIMAL(10,2)` admite hasta ocho enteros y dos decimales.

Respuesta `201`:

```json
{
  "state": "CREATE",
  "code": 201,
  "data": {
    "idRepuesto": "0001",
    "mensaje": "Repuesto registrado exitosamente."
  }
}
```

## Actualizar repuesto — RF15

```http
PUT {baseUrl}/spareparts/0001
```

El cuerpo contiene los mismos cuatro campos del registro. `idRepuesto` no es
editable. La operacion usa una transaccion; ante un error conserva los valores
anteriores. Una referencia puede conservarse, pero no pertenecer a otro ID.

Respuesta `200`:

```json
{
  "state": "OK",
  "code": 200,
  "data": {
    "idRepuesto": "0001",
    "mensaje": "Repuesto actualizado exitosamente."
  }
}
```

## Eliminar repuesto — RF16

```http
DELETE {baseUrl}/spareparts/0001
```

```json
{
  "confirmacion": false
}
```

Con `false` se responde `200`, `eliminado: false` y el registro se conserva.
Con `true`, la version actual responde `409` y `eliminado: false` porque todavia
no existe en el esquema versionado una tabla de Servicios ni una relacion que
permita comprobar asociaciones. No se ejecuta ninguna sentencia `DELETE`.

```json
{
  "state": "CONFLICT",
  "code": 409,
  "data": {
    "idRepuesto": "0001",
    "eliminado": false,
    "mensaje": "Eliminacion bloqueada: falta definir la relacion con servicios."
  }
}
```

Para habilitar la eliminacion se requiere definir la tabla de servicios o su
tabla puente, agregar una clave foranea hacia `repuestos.id_repuesto` y documentar
la consulta exacta que comprueba asociaciones antes de borrar por ID.

## Instalacion incremental

Importe `panther/sql/services_mechanic_repuestos.sql` en la base
`services_mechanic`. El script crea solamente la tabla `repuestos` y su trigger;
no elimina tablas ni inserta registros.
