<?php
/**
 * Router para `php -S 127.0.0.1:8080 router.php` (Mac / sin Apache).
 * Emula el RewriteRule de .htaccess → index.php?PATH_INFO=...
 * En Windows con XAMPP no hace falta: Apache usa .htaccess.
 *
 * Silencia deprecaciones PHP 8.5+ que rompen el JSON del fetch (solo este servidor).
 */
ini_set('display_errors', '0');
error_reporting(E_ALL & ~E_DEPRECATED & ~E_USER_DEPRECATED);

/**
 * CORS temprano (Live Server → php -S). index.php repite cabeceras para XAMPP/Apache.
 * Orígenes típicos: http://127.0.0.1:5500, http://localhost:5501, etc.
 */
if (!headers_sent()) {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Origin, Accept, Client-Security-Token, Accept-Encoding');
    header('Access-Control-Max-Age: 1000');
    header('Vary: Origin');
}
if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$uri = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));
$file = __DIR__ . $uri;

if ($uri !== '/' && $uri !== '' && file_exists($file) && !is_dir($file)) {
    return false; // servir estático (.htaccess no aplica aquí)
}

$path = ltrim($uri, '/');
if ($path === '' || $path === 'index.php') {
    $_GET['PATH_INFO'] = isset($_GET['PATH_INFO']) ? $_GET['PATH_INFO'] : '';
} else {
    $_GET['PATH_INFO'] = $path;
}

require __DIR__ . '/index.php';
