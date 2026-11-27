<?php
/**
 * Respuesta CORS para preflight OPTIONS (Live Server → XAMPP / Apache).
 * .htaccess reescribe OPTIONS aquí; debe devolver Allow-Headers con Authorization.
 */
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Origin, Accept, Client-Security-Token, Accept-Encoding');
header('Access-Control-Max-Age: 1000');
header('Vary: Origin');
http_response_code(204);
exit;
