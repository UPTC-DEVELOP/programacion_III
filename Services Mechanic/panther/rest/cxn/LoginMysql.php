<?php
/**<b>Descripcion:</b> Clase que <br/> Contiene los datos de conexión a base de datos
 * <b>Caso de Uso:</b> PANTHER-Seguridad <br/>
 * @author Josué Nicolás Pinzón Villamil <a href = "mailto:jpinzon@j4sysol.com">jpinzon@j4sysol.com</a>
 */

/**
 * Provee las constantes del nombre del host para conectarse a la base de datos
 */
$mysqlPort = getenv('PANTHER_DB_PORT');
$mysqlPort = ($mysqlPort === false || $mysqlPort === '') ? 3307 : $mysqlPort;

if (filter_var($mysqlPort, FILTER_VALIDATE_INT, array(
    'options' => array('min_range' => 1, 'max_range' => 65535)
)) === false) {
    throw new InvalidArgumentException('PANTHER_DB_PORT debe ser un puerto valido entre 1 y 65535.');
}

$hostName = getenv('PANTHER_DB_HOST');
define("HOST_NAME", ($hostName === false || $hostName === '') ? "127.0.0.1" : $hostName);
define("MYSQL_PORT", (int) $mysqlPort);
/**
 * Provee las constantes del nombre de base de datos
 */
$database = getenv('PANTHER_DB_NAME');
define("DATA_BASE", ($database === false || $database === '') ? "panther" : $database);
/**
 * Provee las constantes de usuario para conectarse a la base de datos
 */
$user = getenv('PANTHER_DB_USER');
define("USER", ($user === false || $user === '') ? "root" : $user);
/**
 * Provee las constantes de contraseña para conectarse a la base de datos
 */
$password = getenv('PANTHER_DB_PASSWORD');
define("PASSWORD", $password === false ? "" : $password);
?>
