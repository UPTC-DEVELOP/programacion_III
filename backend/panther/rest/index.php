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
require_once 'ctrl/business/Facturas.php';

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