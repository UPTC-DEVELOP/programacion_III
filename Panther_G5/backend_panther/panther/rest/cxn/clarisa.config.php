<?php
// Config Clarisa Sandbox

if (!defined('CLARISA_SANDBOX_BASE_URL')) {
    define('CLARISA_SANDBOX_BASE_URL', 'https://pru.clarisacloud.com:8443');
}

if (!defined('CLARISA_SANDBOX_USER')) {
    define('CLARISA_SANDBOX_USER', 'demo_api');
}

if (!defined('CLARISA_LOGIN_PATH')) {
    define('CLARISA_LOGIN_PATH', '/seguridad/rest/api/v1/login/');
}

if (!defined('CLARISA_FACTURA_PATH')) {
    define('CLARISA_FACTURA_PATH', '/api/factura/rest/v1/factura/nacional');
}

if (!defined('CLARISA_VALIDACION_PATH')) {
    define('CLARISA_VALIDACION_PATH', '/api/factura/rest/v1/factura/validacion');
}

if (!defined('CLARISA_TIMEOUT_SECONDS')) {
    define('CLARISA_TIMEOUT_SECONDS', 45);
}

if (!defined('CLARISA_PERMISO_FACTURACION')) {
    define('CLARISA_PERMISO_FACTURACION', 'GESTIONAR_FACTURACION_ELECTRONICA');
}
?>
