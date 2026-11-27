<?php
/** * <b>Descripcion:</b> Clase que <br/> Realiza la administración de las peticiones de usuario
 * <b>Caso de Uso:</b> PANTHER-Seguridad <br/> 
 * @author Josué Nicolás Pinzón Villamil <a href = "mailto:jpinzon@j4sysol.com">jpinzon@j4sysol.com</a>
 */

/**
 * Resuelve Authorization aunque Apache/XAMPP lo haya quitado del request
 * (CGI) o php -S no exponga apache_request_headers nativo.
 */
function panther_resolve_authorization_header(array $headers = array())
{
    foreach ($headers as $name => $value) {
        if (strtolower((string) $name) === 'authorization' && $value !== '' && $value !== null) {
            return $value;
        }
    }
    $serverKeys = array(
        'HTTP_AUTHORIZATION',
        'REDIRECT_HTTP_AUTHORIZATION',
        'Authorization',
        'AUTHORIZATION'
    );
    foreach ($serverKeys as $key) {
        if (!empty($_SERVER[$key])) {
            return $_SERVER[$key];
        }
    }
    return null;
}

/**
 * Polyfill / enriquecimiento de apache_request_headers.
 * Siempre normaliza la clave "authorization" en minúsculas (Panther AUTHORIZATION).
 */
if (!function_exists('apache_request_headers')) {
    function apache_request_headers()
    {
        $headers = array();
        foreach ($_SERVER as $key => $value) {
            if (strpos($key, 'HTTP_') === 0) {
                $name = str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($key, 5)))));
                $headers[$name] = $value;
            } elseif ($key === 'CONTENT_TYPE') {
                $headers['Content-Type'] = $value;
            } elseif ($key === 'CONTENT_LENGTH') {
                $headers['Content-Length'] = $value;
            }
        }
        $auth = panther_resolve_authorization_header($headers);
        if ($auth !== null) {
            $headers['Authorization'] = $auth;
            $headers['authorization'] = $auth;
        }
        return $headers;
    }
} else {
    // Apache ya define la función: envolver para reinyectar Authorization desde $_SERVER
    function panther_request_headers()
    {
        $headers = apache_request_headers();
        if (!is_array($headers)) {
            $headers = array();
        }
        $auth = panther_resolve_authorization_header($headers);
        if ($auth !== null) {
            $headers['Authorization'] = $auth;
            $headers['authorization'] = $auth;
        }
        return $headers;
    }
}

/**
 * CORS para frontend en localhost (Apache/XAMPP u otros).
 */
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Origin, Accept, Client-Security-Token, Accept-Encoding');
header('Access-Control-Max-Age: 1000');
header('Vary: Origin');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

/**
 * *Importa los resources necesarios para el funcionamiento de la clase
 */
require 'cxn/Connection.php';
require 'ctrl/core/commun/Request.php';
require 'ctrl/core/commun/IRequest.php';
require 'ctrl/core/segurity/Users.php';
require 'ctrl/core/segurity/UserAction.php';
require 'ctrl/core/segurity/Roles.php';
require 'view/ViewAPI.php';
require 'view/ViewXML.php';
require 'view/ViewJSON.php';
require 'util/ExcepcionAPI.php';
require 'util/Status.php';
require 'util/MessageUser.php';
require 'util/FormatType.php';
require 'util/ContentBody.php';
require 'util/ResourcesURL.php';
require 'util/JSONUtil.php';
require 'model/core/segurity/User.php';
require 'querys/core/SegurityQuery.php';

//Business
require 'ctrl/business/Persons.php';
require 'model/business/Person.php';
require 'querys/business/BusinessQuery.php';

// Vehiculos y empleados (Kevin)
require 'ctrl/business/Vehiculos.php';
require 'model/business/Vehiculo.php';


require 'ctrl/business/Empleados.php';
require 'model/business/Empleado.php';

// Proveedores y repuestos (Estefanía)
require_once 'model/business/Proveedor.php';
require_once 'ctrl/business/Proveedores.php';

require_once 'model/business/Repuesto.php';
require_once 'ctrl/business/Repuestos.php';

// Ordenes
require 'ctrl/business/Ordenes.php';
require 'model/business/Orden.php';
require 'querys/business/OrdenQuery.php';

// Facturas y Clarisa
require 'util/ClarisaService.php';
require 'ctrl/business/Facturas.php';
require 'model/business/Factura.php';

require 'querys/business/FacturaQuery.php';

// Preparar manejo de excepciones
/**
 * *Formatos permitidos enviados por parametro
 */
$format = isset($_GET[FORMAT]) ? $_GET[FORMAT] : JSON;

switch ($format) {
    case XML:
        $view = new ViewXML();
        break;
    case JSON:
    default:
        $view = new ViewJSON();
}

/**
 * *Manejo de excepciones para el componente
 */
set_exception_handler(function ($exception) use ($view) {
    // Cuando se presente error Call to undefined method Error::getState()
    // comentar linea y descomentar siguiente
    $state = method_exists($exception, 'getState') ? $exception->getState() : INTERNAL_SERVER_ERROR;
    $bodyAnswer = new ContentBody($state, $exception->getCode(), $exception->getMessage());
    // $bodyAnswer = new ContentBody(INTERNAL_SERVER_ERROR,ST500, $exception->getMessage());
    $view->viewPrint($bodyAnswer);
});

// Extraer segmento de la url
if (isset($_GET['PATH_INFO'])){
    $request = explode('/', $_GET['PATH_INFO']);
    //Descomentariar para saber url
   // print_r($request);
}
else{
    throw new ExcepcionAPI(BAD_REQUEST, ST400, error_url);
}

// Separación de resources de la url
$resource = array_shift($request);
// Recursos existentes para servicios rest
$resourcesExisting = RESOURCES_URL;

// Comprobar si existe el resource
if (! in_array($resource, $resourcesExisting)) {
    throw new ExcepcionAPI(NOT_FOUND, ST404, error_notExist);
}

$method = strtolower($_SERVER['REQUEST_METHOD']);

// Filtrar método
switch ($method) {
    case 'get':
    case 'post':
    case 'put':
    case 'delete':
        {
            if (method_exists($resource, $method)) {
                // Innvoca para inicializar nombre de tabla
                call_user_func(array(
                    $resource,
                    INIT_TABLE
                ));
                // Innvoca la funciones http
                $answer = call_user_func(array(
                    $resource,
                    $method
                ), $request);
                $view->viewPrint($answer);
                break;
            }else{
                throw new ExcepcionAPI(BAD_REQUEST, ST400, error_url);
            }
        }
    default:
        {
            // Método no aceptado
            throw new ExcepcionAPI(BAD_REQUEST, ST400, error_url);
            $view->viewPrint($body);
        }
}
?>
