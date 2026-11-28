<?php
/**<b>Descripcion:</b> Clase que <br/> Contiene los datos de conexión a base de datos
 * <b>Caso de Uso:</b> PANTHER-Seguridad <br/>
 * @author Josué Nicolás Pinzón Villamil <a href = "mailto:jpinzon@j4sysol.com">jpinzon@j4sysol.com</a>
 *
 * En producción (InfinityFree u otro hosting) crea el archivo
 * cxn/LoginMysql.prod.php copiando LoginMysql.prod.example.php y pon ahí
 * los datos del hosting. Ese archivo no se sube a git.
 */
// En local (XAMPP) siempre se usan los datos de abajo, aunque exista el archivo de producción
$hostActual = isset($_SERVER['HTTP_HOST']) ? strtolower(preg_replace('/:\d+$/', '', $_SERVER['HTTP_HOST'])) : 'localhost';
$esLocal = in_array($hostActual, array('localhost', '127.0.0.1', '::1', '[::1]'));
if (! $esLocal && file_exists(__DIR__ . '/LoginMysql.prod.php')) {
    require __DIR__ . '/LoginMysql.prod.php';
    return;
}

/**
 * Provee las constantes del nombre del host para conectarse a la base de datos
 */
define("HOST_NAME", "localhost");
/**
 * Provee las constantes del nombre de base de datos
 */
define("DATA_BASE", "panther");
/**
 * Provee las constantes de usuario para conectarse a la base de datos
 */
define("USER", "root");
/**
 * Provee las constantes de contraseña para conectarse a la base de datos
 */
define("PASSWORD", "");
?>
