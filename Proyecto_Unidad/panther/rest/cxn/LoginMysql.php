<?php
/**<b>Descripcion:</b> Clase que <br/> Contiene los datos de conexión a base de datos
 * <b>Caso de Uso:</b> PANTHER-Seguridad <br/>
 * @author Josué Nicolás Pinzón Villamil <a href = "mailto:jpinzon@j4sysol.com">jpinzon@j4sysol.com</a>
 *
 * ---------------------------------------------------------------------------
 * CONFIGURACIÓN DE BASE DE DATOS
 * ---------------------------------------------------------------------------
 * Entorno LOCAL (XAMPP / Laragon) — valores activos por defecto:
 *   HOST_NAME  => "localhost"     (si MySQL usa otro puerto: "localhost:3307")
 *   DATA_BASE  => "panther"
 *   USER       => "root"
 *   PASSWORD   => ""
 *
 * Entorno PRODUCCIÓN (InfinityFree u otro hosting compartido) — ejemplo:
 *   HOST_NAME  => "sqlXXX.infinityfree.com"
 *   DATA_BASE  => "if0_XXXXXX_panther"
 *   USER       => "if0_XXXXXX"
 *   PASSWORD   => "tu_password_de_hosting"
 *
 * Cambia solo las cuatro constantes de abajo según el entorno.
 * ---------------------------------------------------------------------------
 */

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
