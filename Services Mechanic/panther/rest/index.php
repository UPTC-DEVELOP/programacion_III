
<?php
/**
 * Descripcion: Clase que realiza la administración de las peticiones.
 * Caso de Uso: PANTHER-Seguridad
 */

 // Conexión y clases principales
require_once 'cxn/Connection.php';
require_once 'ctrl/core/commun/Request.php';
require_once 'ctrl/core/commun/IRequest.php';
require_once 'ctrl/core/segurity/Users.php';
require_once 'ctrl/core/segurity/UserAction.php';
require_once 'integration/clarisa/ServicioCacheClarisa.php';

// Vistas
require_once 'view/ViewAPI.php';
require_once 'view/ViewXML.php';
require_once 'view/ViewJSON.php';

// Utilidades
require_once 'util/ExcepcionAPI.php';
require_once 'util/Status.php';
require_once 'util/MessageUser.php';
require_once 'util/FormatType.php';
require_once 'util/ContentBody.php';
require_once 'util/ResourcesURL.php';
require_once 'util/JSONUtil.php';

// Modelos de seguridad
require_once 'model/core/segurity/User.php';
require_once 'querys/core/SegurityQuery.php';

// Modelos de negocio
require_once 'model/business/Person.php';
require_once 'model/business/Client.php';
require_once 'model/business/Empleado.php';
require_once 'model/business/Repuesto.php';

// Consultas de negocio
require_once 'querys/business/BusinessQuery.php';
require_once 'querys/business/ClienteQuery.php';
require_once 'querys/business/EmpleadoQuery.php';
require_once 'querys/business/RepuestoQuery.php';
require_once 'querys/business/FacturacionQuery.php';

// Controladores de negocio
require_once 'ctrl/business/Persons.php';
require_once 'ctrl/business/Clients.php';
require_once 'ctrl/business/Empleados.php';
require_once 'ctrl/business/Repuestos.php';
require_once 'ctrl/business/Facturacion.php';

// Seleccionar formato de respuesta
$format = isset($_GET[FORMAT]) ? $_GET[FORMAT] : JSON;

switch ($format) {
    case XML:
        $view = new ViewXML();
        break;

    case JSON:
    default:
        $view = new ViewJSON();
        break;
}

// Configurar manejo de excepciones
set_exception_handler(function (Throwable $exception) use ($view) {

    if ($exception instanceof ExcepcionAPI) {
        $bodyAnswer = new ContentBody(
            $exception->getState(),
            $exception->getCode(),
            $exception->getMessage()
        );
    } else {
        error_log('[Panther] ' . (string) $exception);

        $bodyAnswer = new ContentBody(
            INTERNAL_SERVER_ERROR,
            ST500,
            'Error interno del servidor'
        );
    }

    $view->viewPrint($bodyAnswer);
});

if (!isset($_GET['PATH_INFO'])) {
    throw new ExcepcionAPI(BAD_REQUEST, ST400, error_url);
}

$request = explode('/', $_GET['PATH_INFO']);
$resource = array_shift($request);

$resourcesExisting = RESOURCES_URL;

if (!in_array($resource, $resourcesExisting, true)) {
    throw new ExcepcionAPI(NOT_FOUND, ST404, error_notExist);
}

// Obtener controlador correspondiente
$controllerClass = isset(RESOURCE_CONTROLLERS[$resource])
    ? RESOURCE_CONTROLLERS[$resource]
    : $resource;

// Comprobar que exista la clase
if (!class_exists($controllerClass)) {
    throw new ExcepcionAPI(
        INTERNAL_SERVER_ERROR,
        ST500,
        'No se encontró el controlador solicitado'
    );
}

// Obtener método HTTP
$method = strtolower($_SERVER['REQUEST_METHOD']);

$allowedMethods = array('get', 'post', 'put', 'delete');

if (!in_array($method, $allowedMethods, true)) {
    throw new ExcepcionAPI(BAD_REQUEST, ST400, error_url);
}

// Comprobar que el controlador tenga el método solicitado
if (!method_exists($controllerClass, $method)) {
    throw new ExcepcionAPI(BAD_REQUEST, ST400, error_url);
}

// Crear instancia del controlador
$controller = new $controllerClass();

// Inicializar recurso
if (method_exists($controller, INIT_TABLE)) {
    call_user_func(array($controller, INIT_TABLE));
}

// Ejecutar petición
$answer = call_user_func(array(
    $controller,
    $method
), $request);

// Mostrar respuesta
$view->viewPrint($answer);
?>
