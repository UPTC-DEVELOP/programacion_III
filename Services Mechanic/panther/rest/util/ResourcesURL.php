
<?php

/**
 * Recursos existentes para servicios REST.
 */
define("RESOURCES_URL", array(
    'users',
    'useraction',
    'roles',
    // Business
    'persons',
    'clients',
    'spareparts',
    'facturacion',
    'empleados'
));

/**
 * Relaciona endpoints con sus controladores.
 */
define("RESOURCE_CONTROLLERS", array(
    'spareparts' => 'Repuestos',
    'empleados' => 'Empleados'
));


define("AUTHORIZATION", "authorization");

/**
 * Método para inicializar el nombre de la tabla.
 */
define("INIT_TABLE", "init");

?>
