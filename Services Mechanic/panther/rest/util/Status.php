<?php
/** <b>Descripcion:</b> Clase que <br/> Contiene estados de error de la solicitud
 * <b>Caso de Uso:</b> PANTHER-Seguridad <br/>
 * @author Josué Nicolás Pinzón Villamil <jpinzon@j4sysol.com>
 */

/**
 * Estado exitoso de la transacción
 */
define("OK", "OK");
define("ST200", 200);
/**
 * Estado exitoso de la transacción con creación
 */
define("CREATE", "CREATE");
define("ST201", 201);

/**
 * Estado exitoso de la transacción no hay contenido
 */
define("NO_CONTENT", "NO_CONTENT");
define("ST204", 204);

/**
 * Solicitud incorrecta por datos o parámetros inválidos
 */
define("BAD_REQUEST", "BAD_REQUEST");
define("ST400", 400);

/**
 * Solicitud sin autenticación válida
 */
define("UNAUTHORIZED", "UNAUTHORIZED");
define("ST401", 401);

/**
 * Acceso prohibido al recurso
 */
define("FORBIDDEN", "FORBIDDEN");
define("ST403", 403);

/**
 * Recurso no encontrado
 */
define("NOT_FOUND", "NOT_FOUND");
define("ST404", 404);
/**
 * Estado de conflicto con el estado actual del recurso
 */
define("CONFLICT", "CONFLICT");
define("ST409", 409);
/**
 * La solicitud es válida, pero sus datos no fueron aceptados.
 */
define("UNPROCESSABLE_ENTITY", "UNPROCESSABLE_ENTITY");
define("ST422", 422);
/**
 * Error interno del servidor
 */
define("INTERNAL_SERVER_ERROR", "INTERNAL_SERVER_ERROR");
define("ST500", 500);

/**
 * La dependencia externa devolvió una respuesta inválida.
 */
define("BAD_GATEWAY", "BAD_GATEWAY");
define("ST502", 502);

/**
 * La dependencia externa no se encuentra disponible.
 */
define("SERVICE_UNAVAILABLE", "SERVICE_UNAVAILABLE");
define("ST503", 503);

/**
 * La dependencia externa excedió el tiempo permitido.
 */
define("GATEWAY_TIMEOUT", "GATEWAY_TIMEOUT");
define("ST504", 504);

?>
