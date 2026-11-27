# Base de datos `panther`

Script único: **`panther.sql`** (seguridad + clientes/vehículos/empleados + órdenes/facturas + proveedores/repuestos).

## Cada developer (BD local propia)

1. Crea la base `panther` en tu MariaDB/MySQL local.
2. Importa este archivo (phpMyAdmin → Importar, o CLI).
3. Copia `../backend_panther/panther/rest/cxn/LoginMysql.example.php` → `LoginMysql.php` y pon **tu** host/puerto/usuario/clave.

No subas `LoginMysql.php` ni dumps personales: están en `.gitignore`.
