<?php
/**<b>Descripcion:</b> Clase que <br/> Contiene las constantes para acceso a servicios restFul
 * <b>Caso de Uso:</b> PANTHER-Seguridad <br/> 
 * @author Josué Nicolás Pinzón Villamil <a href = "mailto:jpinzon@j4sysol.com">jpinzon@j4sysol.com</a>
 */

/**
 * Recursos existentes para servicios restFul
 */
define("RESOURCES_URL", array(
    'users',
    'useraction',
    'roles',
    //Business
    'persons',
    'facturas',
    'empleados', 
    'clientes', 
    'vehiculos', 
    'proveedores', 
    'repuestos', 
    'ordenes',
    'movimientos'
));

/**
 * Cabecera de autenticación del token
 */
define("AUTHORIZATION", "authorization");

/**
 * Nombre del metodo que permite cargar el nombre de la tabla
 */
define("INIT_TABLE", "init");
?>
