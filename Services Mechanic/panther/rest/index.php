<?php
/** * <b>Descripcion:</b> Clase que <br/> Realiza la administración de las peticiones de usuario
 * <b>Caso de Uso:</b> PANTHER-Seguridad <br/>
 * @author Josué Nicolás Pinzón Villamil <a href = "mailto:jpinzon@j4sysol.com">jpinzon@j4sysol.com</a>
 */
/**
 * *Importa los resources necesarios para el funcionamiento de la clase
 */
require 'cxn/Connection.php';
require 'ctrl/core/commun/Request.php';
require 'ctrl/core/commun/IRequest.php';
require 'ctrl/core/segurity/Users.php';
require_once 'integration/clarisa/ServicioCacheClarisa.php';
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
require 'ctrl/business/Clients.php';
require 'model/business/Client.php';
require 'ctrl/business/Repuestos.php';
require 'model/business/Repuesto.php';
require 'querys/business/BusinessQuery.php';
require 'querys/business/ClienteQuery.php';
require 'querys/business/RepuestoQuery.php';
require 'querys/business/FacturacionQuery.php';
require 'ctrl/business/Facturacion.php';

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


// Extraer segmento de la url
if (isset($_GET['PATH_INFO'])){
    $request = explode('/', $_GET['PATH_INFO']);
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
$controllerClass = isset(RESOURCE_CONTROLLERS[$resource])
    ? RESOURCE_CONTROLLERS[$resource]
    : $resource;

// Filtrar método

switch ($method) {

    case 'get':
    case 'post':
    case 'put':
    case 'delete':

        if (method_exists($controllerClass, $method)) {

            // Crear una instancia del controlador
            $controller = new $controllerClass();

            // Inicializar el recurso
            call_user_func(array(
                $controller,
                INIT_TABLE
            ));

            // Ejecutar el metodo HTTP solicitado
            $answer = call_user_func(array(
                $controller,
                $method
            ), $request);

            $view->viewPrint($answer);
            break;

        } else {
            throw new ExcepcionAPI(BAD_REQUEST, ST400, error_url);
        }

    default:
        // Metodo no aceptado
        throw new ExcepcionAPI(BAD_REQUEST, ST400, error_url);
}
?>
