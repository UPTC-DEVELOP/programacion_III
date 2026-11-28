<?php
declare(strict_types=1);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Max-Age: 1000');
header('Access-Control-Allow-Headers: Content-Type, Authorization, keyAPI, X-Requested-With, Origin, Accept, Client-Security-Token, Accept-Encoding');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS, DELETE, PUT');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

/**
 * ============================================================
 * PANTHER FRAMEWORK - INDEX PRINCIPAL DEL BACKEND
 * ============================================================
 * Descripción:
 *   Controlador principal que administra las peticiones REST.
 *   Carga el autoload de Composer, inicializa dependencias,
 *   gestiona excepciones y enruta solicitudes a sus controladores.
 *
 * Caso de Uso:
 *   PANTHER-Seguridad / PANTHER-Business
 *
 * Versión:
 *   Actualización Panther 2025 - PHP 8.4 compatible
 *
 * @author
 *     Josué Nicolás Pinzón Villamil
 * @updated
 *     Actualizado por Proyecto Actualización Panther 2025
 * ============================================================
 */

// ------------------------------------------------------------
// AUTOLOAD (COMPOSER O RESPALDO NATIVO PSR-4 PARA panther\)
// ------------------------------------------------------------
$composerAutoload = __DIR__ . '/../vendor/autoload.php';
if (is_file($composerAutoload)) {
    require_once $composerAutoload;
} else {
    spl_autoload_register(static function (string $class): void {
        $prefix = 'panther\\';
        if (!str_starts_with($class, $prefix)) {
            return;
        }
        $relativeClass = substr($class, strlen($prefix));
        $file = __DIR__ . DIRECTORY_SEPARATOR . str_replace('\\', DIRECTORY_SEPARATOR, $relativeClass) . '.php';
        if (is_file($file)) {
            require_once $file;
        }
    });
}


// ------------------------------------------------------------
// CONFIGURACIÓN DEL FORMATO DE RESPUESTA (JSON / XML)
// ------------------------------------------------------------
use panther\view\ViewJSON;
use panther\view\ViewXML;
use panther\util\FormatType;

$format = $_GET[FormatType::PARAM] ?? FormatType::JSON;

$view = match ($format) {
    FormatType::XML => new ViewXML(),
    default         => new ViewJSON(),
};

// ------------------------------------------------------------
// MANEJO GLOBAL DE EXCEPCIONES
// ------------------------------------------------------------
use panther\util\ContentBody;
use panther\util\Status;
use panther\util\MessageUser;
use panther\util\ExcepcionAPI;

set_exception_handler(function (Throwable $exception) use ($view): void {

    // Detectar estado Panther (string) o usar INTERNAL_SERVER_ERROR
    $state = method_exists($exception, 'getState')
        ? $exception->getState()
        : Status::INTERNAL_SERVER_ERROR;

    // Convertir estado Panther a código HTTP verdadero
    $httpCode = match ($state) {
        Status::BAD_REQUEST            => Status::ST400,
        Status::UNAUTHORIZED           => Status::ST401,
        Status::FORBIDDEN              => Status::ST403,
        Status::NOT_FOUND              => Status::ST404,
        Status::INTERNAL_SERVER_ERROR  => Status::ST500,
        default                        => Status::ST500,
    };

    // ENVIAR CÓDIGO HTTP REAL
    http_response_code($httpCode);

    // Construir la respuesta JSON estándar Panther
    $bodyAnswer = new ContentBody(
        $state,
        $exception->getCode() ?: $httpCode,
        $exception->getMessage()
    );

    // Imprimir respuesta (JSON o XML según configuración)
    $view->viewPrint($bodyAnswer);
});
use panther\util\ResourcesURL;
// ------------------------------------------------------------
// PROCESAMIENTO DE LA SOLICITUD REST
// ------------------------------------------------------------
if (!isset($_GET['PATH_INFO'])) {
    throw new ExcepcionAPI(Status::BAD_REQUEST, Status::ST400, MessageUser::ERROR_URL);
}

// Obtener los segmentos de la URL
$request = explode('/', trim($_GET['PATH_INFO'], '/'));

// Recurso solicitado
$resourceRaw = array_shift($request);
$resource = strtolower($resourceRaw);
$resourcesExisting = array_map('strtolower', ResourcesURL::RESOURCES);

if (!in_array($resource, $resourcesExisting, true)) {
    throw new ExcepcionAPI(Status::NOT_FOUND, Status::ST404, MessageUser::ERROR_NOT_EXIST);
}

// Método HTTP
$method = strtolower($_SERVER['REQUEST_METHOD']);

// ------------------------------------------------------------
// INVOCACIÓN DEL CONTROLADOR CORRESPONDIENTE
// ------------------------------------------------------------
// ------------------------------------------------------------
// CONSTRUCCIÓN DINÁMICA DEL NAMESPACE SEGÚN EL MÓDULO
// ------------------------------------------------------------
$coreResources = ['users', 'roles', 'login', 'useraction']; // recursos del módulo Seguridad

if (in_array($resource, $coreResources, true)) {
    $className = 'panther\\ctrl\\core\\segurity\\' . ucfirst($resource);
} else {
    $className = 'panther\\ctrl\\business\\' . ucfirst($resource);
}

if (!class_exists($className)) {
    throw new ExcepcionAPI(Status::NOT_FOUND, Status::ST404, "Clase del recurso '{$className}' no encontrada.");
}

// Instanciar el recurso
$controller = new $className();

// Ejecutar el método HTTP (get, post, put, delete)
if (!method_exists($controller, $method)) {
    throw new ExcepcionAPI(Status::BAD_REQUEST, Status::ST400, MessageUser::ERROR_URL);
}

$answer = $controller->$method($request);

// Enviar respuesta al cliente
$view->viewPrint($answer);
