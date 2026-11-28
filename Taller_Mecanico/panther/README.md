# panther

English
Panther Framework PHP-OO is an API to create restful microservices for web applications, based on PHP

Español
Framework Panther PHP-OO es un API para crear microservicios tipo restful para aplicaciones web, basado en PHP

## Base de datos

Para una instalación nueva, cree la base de datos `panther` e importe `database/panther.sql`.
En instalaciones existentes, la API aplica automáticamente las modificaciones de esquema
al abrir la primera conexión a la base de datos. Los campos nuevos de las personas quedan
en `NULL` para registros antiguos que no tienen esa información; los datos existentes se conservan.
El usuario de MySQL configurado en `LoginMysql.php` necesita permisos para crear y modificar tablas.
