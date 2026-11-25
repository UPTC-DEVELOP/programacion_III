<?php
/**
 * Respuesta vacía para preflight CORS (OPTIONS).
 * Usado por .htaccess cuando REQUEST_METHOD = OPTIONS.
 */
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Origin, Accept, Client-Security-Token, Accept-Encoding');
header('Access-Control-Max-Age: 1000');
http_response_code(204);
exit;
