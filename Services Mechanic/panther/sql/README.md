# Instalacion de la base de datos

El instalador principal es `services_mechanic_install.sql`. Crea una base nueva
llamada `services_mechanic` con las tablas `j4rol`, `j4user`, `person` y
`clientes`, ademas del trigger que limita los IDs publicos de clientes.

No contiene registros iniciales y no ejecuta instrucciones sobre `panther`.
`services_mechanic_clients.sql` queda como instalador modular para una base
`services_mechanic` que ya tenga la seguridad de Panther.

## Importacion desde phpMyAdmin

1. Ingrese a phpMyAdmin con un usuario que pueda crear bases y tablas.
2. Abra la pestana **Importar** desde la pagina principal.
3. Seleccione `services_mechanic_install.sql`.
4. Mantenga el formato SQL y ejecute la importacion.
5. Compruebe que la base seleccionada sea `services_mechanic` y que existan
   `j4rol`, `j4user`, `person`, `clientes` y `trg_clientes_limite_id`.
6. Configure `PANTHER_DB_NAME=services_mechanic` y reinicie Apache solamente
   despues de completar la importacion y crear un administrador local.

Si el proveedor no permite `CREATE DATABASE`, cree `services_mechanic`
manualmente con `utf8mb4_unicode_ci`, seleccionela y ejecute el script desde la
instruccion `CREATE TABLE j4rol` en adelante.

## Administrador de desarrollo

No escriba la contrasena ni el token en archivos del proyecto. Genere ambos
localmente con el PHP de XAMPP. El hash debe crearse con el mismo algoritmo que
usa `UserAction::encrytPassword()`:

```powershell
$securePassword = Read-Host 'Contrasena del administrador de desarrollo' -AsSecureString
$passwordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
try {
    $plainPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPointer)
    $passwordHash = $plainPassword | & 'C:\xampp\php\php.exe' -r '$value = rtrim(stream_get_contents(STDIN), "\r\n"); echo password_hash($value, PASSWORD_BCRYPT);'
} finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer)
    $plainPassword = $null
}
$apiToken = & 'C:\xampp\php\php.exe' -r 'echo bin2hex(random_bytes(16));'
```

En phpMyAdmin cree primero un rol de desarrollo:

```sql
INSERT INTO j4rol (name, description)
VALUES ('ADMIN_DEV', 'Administrador local de desarrollo');

SELECT id FROM j4rol
WHERE name = 'ADMIN_DEV' AND dateDelete IS NULL;
```

Luego obtenga su `id` y cree el usuario sustituyendo los marcadores por valores
generados localmente. No guarde esta sentencia con valores reales:

```sql
INSERT INTO j4user (`user`, `password`, `keyAPI`, `roles`)
VALUES ('<USUARIO_LOCAL>', '<HASH_PASSWORD_HASH>', '<TOKEN_ALEATORIO>', <ID_ROL>);
```

`password_hash()` genera un valor distinto en cada ejecucion. Panther lo valida
con `password_verify()`. El token se usa en `Authorization: Bearer <token>`.

Cuando termine, no copie sus valores al repositorio, capturas o documentacion y
elimine las variables sensibles de la sesion:

```powershell
$securePassword = $null
$passwordHash = $null
$apiToken = $null
```
