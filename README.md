# programacion_III
Repositorio de asignatura TPSI - Caso de estudio **TallerPro**

Usuario: admin 
Contraseña: 12345

## Estructura

| Carpeta | Contenido |
|---|---|
| `index.html`, `crud_*`, `Login`, `api` | Frontend (HTML5, JavaScript y CSS3) |
| `api/panther.js` | Conexión REST del frontend con Panther (login, token y CRUD) |
| `panther-master/backend_panther/panther/rest` | Backend Panther (PHP) |
| `panther-master/database/panther.sql` | Base de datos completa |
| `panther-master/pruebas` | Pruebas de programador de los CRUD (Postman) |
| `despliegue` | Script y guía para publicar en InfinityFree |

## Recursos REST

Base local: `http://localhost/panther/rest`

| Recurso | Tabla | Campos |
|---|---|---|
| `useraction/login` (POST) | `j4user` | `user`, `password` → devuelve `keyAPI` |
| `clientes` | `cliente` | nombre, cedula, email, telefono, empresa, estado |
| `empleados` | `empleado` | nombre, cedula, cargo, telefono |
| `administradores` | `administrador` | nombre, usuario, correo, rol |
| `autos` | `auto` | placa, marca, modelo, anio, color, kilometraje, id_cliente |

Todas las peticiones, menos el login, llevan la cabecera `authorization: <keyAPI>`.
`GET /recurso`, `GET /recurso/{id}`, `POST /recurso`, `PUT /recurso/{id}`, `DELETE /recurso/{id}`.

## Ejecutar en local

1. Enciende **Apache** y **MySQL** en XAMPP.
2. En phpMyAdmin crea la base `panther` e importa `panther-master/database/panther.sql`.
3. Haz que XAMPP sirva el backend del repositorio. En una consola `cmd`:
   ```
   mklink /J C:\xampp\htdocs\panther "<ruta del repo>\panther-master\backend_panther\panther"
   ```
   (o copia esa carpeta `panther` dentro de `C:\xampp\htdocs`).
4. Prueba `http://localhost/panther/rest/clientes`: debe responder *"Se requiere Token"* (code 400).
5. Abre `index.html` (directo o con Live Server) y entra a los CRUD.

## Publicar

Ver [despliegue/README.md](despliegue/README.md).
