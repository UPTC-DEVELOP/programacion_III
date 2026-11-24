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
 * Error interno del servidor
 */
define("INTERNAL_SERVER_ERROR", "INTERNAL_SERVER_ERROR");
define("ST500", 500);

?>
