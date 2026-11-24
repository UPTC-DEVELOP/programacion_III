# Pruebas de programador - CRUD TallerPro

Colección: `TallerPro_Panther.postman_collection.json` (50 peticiones, 74 aserciones).

## Qué se prueba

| Carpeta | Casos |
|---|---|
| 01 Seguridad y login | Login correcto (guarda la keyAPI), contraseña incorrecta (403), usuario inexistente (403 con JSON válido), sin token (400), token inválido (401), cabecera `Authorization` en mayúscula (200), recurso inexistente (404), preflight CORS |
| 02 CRUD Clientes | Crear (201) · listar e incluir el nuevo · consultar por id con los mismos datos · actualizar · verificar cambios · actualizar sin cambios (200) · actualizar id inexistente (404) · eliminar · consultar eliminado (404) · eliminar sin id (400, no borra la tabla) |
| 03 CRUD Empleados | Los mismos casos de clientes |
| 04 CRUD Administradores | Los mismos casos de clientes |
| 05 CRUD Autos | Los mismos casos + crear auto con cliente inexistente (rechazado por llave foránea) |

Cada ejecución crea sus propios registros de prueba (marcados con un sello de tiempo) y los elimina al final.
El borrado es suave (`dateDelete`), así que quedan en la tabla pero no aparecen en la API.

## Cómo ejecutarla

**Postman (interfaz):** *Import* → elegir el archivo → clic derecho en la colección → *Run collection* → *Run*.
Toma captura del resultado como evidencia.

**Postman CLI:**
```
postman collection run panther-master/pruebas/TallerPro_Panther.postman_collection.json
```

Requisitos: XAMPP con Apache y MySQL encendidos y la base importada (`database/panther.sql`).

Para otra URL cambia la variable `baseUrl` de la colección (por defecto `http://localhost/panther/rest`).
En InfinityFree el filtro anti-bots bloquea Postman, así que en producción la verificación se hace desde el navegador.

## Último resultado (local, 24/11/2026)

```
requests     50 ejecutadas, 0 fallidas
assertions   74 ejecutadas, 0 fallidas
```
