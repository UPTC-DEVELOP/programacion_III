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
 * Estado exitoso de la transacción no procesada por error cliente
 */
define("BAD_REQUEST", "BAD_REQUEST");
define("ST400", 400);

/**
 * Estado exitoso de la transacción no procesada por error cliente
 */
define("UNAUTHORIZED", "UNAUTHORIZED");
define("ST401", 401);

/**
 * Estado exitoso de la transacción no procesada por error cliente
 */
define("FORBIDDEN", "FORBIDDEN");
define("ST403", 403);

/**
 * Estado exitoso de la transacción no encontrado
 */
define("NOT_FOUND", "NOT_FOUND");
define("ST404", 404);
/**
 * Estado exitoso de la transacción con error interno
 */
define("INTERNAL_SERVER_ERROR", "INTERNAL_SERVER_ERROR");
define("ST500", 500);

?>
