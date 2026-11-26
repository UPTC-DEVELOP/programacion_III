<?php
/**
 * Plantilla de conexión local a MariaDB/MySQL.
 *
 * Setup (cada developer, una sola vez):
 *   1. Copia este archivo como LoginMysql.php (mismo folder).
 *   2. Ajusta HOST_NAME / DATA_BASE / USER / PASSWORD a TU máquina.
 *   3. LoginMysql.php está en .gitignore: no se sube al remoto.
 *
 * Ejemplos de HOST_NAME (PDO concatena host=...):
 *   Mac Homebrew MariaDB (puerto 3306):  "127.0.0.1;port=3306"
 *   Windows XAMPP (suele ser 3306):      "127.0.0.1;port=3306"
 *   Windows XAMPP alt / MySQL 3307:      "127.0.0.1;port=3307"
 *   Hosting (InfinityFree, etc.):        "sqlXXX.infinityfree.com"
 *
 * Importar schema:
 *   mysql -h 127.0.0.1 -P 3306 -u root -p panther < ../../../database/panther.sql
 *   (o crear BD `panther` en phpMyAdmin e Importar Panther/database/panther.sql)
 */
define("HOST_NAME", "127.0.0.1;port=3306");
define("DATA_BASE", "panther");
define("USER", "root");
define("PASSWORD", "");
?>
