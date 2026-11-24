<?php
/**
 * Plantilla de conexión para producción.
 * 1. Copia este archivo como LoginMysql.prod.php (misma carpeta).
 * 2. Llena los datos que da el panel del hosting
 *    (InfinityFree: "MySQL Databases" en el panel de control).
 * LoginMysql.prod.php está en .gitignore: no subas contraseñas al repositorio.
 */
define("HOST_NAME", "sqlXXX.infinityfree.com");   // MySQL Host Name
define("DATA_BASE", "if0_XXXXXXXX_panther");      // MySQL DB Name
define("USER", "if0_XXXXXXXX");                   // MySQL User Name
define("PASSWORD", "tu_contraseña_del_panel");    // MySQL Password
?>
