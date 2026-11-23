<?php
/**<b>Descripcion:</b> Clase que <br/> Contiene los datos de conexión a base de datos
 * <b>Caso de Uso:</b> PANTHER-Seguridad <br/>
 * @author Josué Nicolás Pinzón Villamil <a href = "mailto:jpinzon@j4sysol.com">jpinzon@j4sysol.com</a>
 *
 * CONFIGURACION: edite los valores por defecto (segundo parametro de cfg) con los datos de su
 * hosting (InfinityFree / AlwaysData). Tambien pueden definirse como variables de entorno
 * PANTHER_DB_HOST, PANTHER_DB_NAME, PANTHER_DB_USER, PANTHER_DB_PASS (util para pruebas).
 */
function cfg($nombre, $porDefecto)
{
    $valor = getenv($nombre);
    return ($valor === false || $valor === '') ? $porDefecto : $valor;
}

/** Driver: "mysql" (produccion). "sqlite" solo se usa en las pruebas automaticas. */
define("DB_DRIVER", cfg("PANTHER_DB_DRIVER", "mysql"));
/** Servidor de base de datos (en InfinityFree es algo como sql123.infinityfree.com) */
define("HOST_NAME", cfg("PANTHER_DB_HOST", "mysql-emk.alwaysdata.net"));
/** Nombre de la base de datos */
define("DATA_BASE", cfg("PANTHER_DB_NAME", "emk_panther"));
/** Usuario de la base de datos */
define("USER", cfg("PANTHER_DB_USER", "emk"));
/** Contraseña de la base de datos */
define("PASSWORD", cfg("PANTHER_DB_PASS", "contraseña"));

/**
 * Integración con Clarisa (modo "proxy": el backend llama a Clarisa por cURL).
 */
define("CLARISA_LOGIN_URL", cfg("CLARISA_LOGIN_URL", "https://pru.clarisacloud.com:8443/seguridad/rest/api/v1/login/"));
define("CLARISA_FACTURA_URL", cfg("CLARISA_FACTURA_URL", "https://pru.clarisacloud.com:8443/api/factura/rest/v1/factura/nacional"));
/** Cabecera y prefijo con que Clarisa espera el token en la factura (ajustar segun la guia) */
define("CLARISA_TOKEN_HEADER", cfg("CLARISA_TOKEN_HEADER", "Authorization"));
define("CLARISA_TOKEN_PREFIX", cfg("CLARISA_TOKEN_PREFIX", "Bearer "));
/**
 * Si es "1", el endpoint useraction/clarisa-enlace acepta un usuario + token de Clarisa SIN
 * poder verificarlos (solo para el modo "directo" del frontend). Dejar en "0" en produccion
 * cuando el hosting permita cURL saliente (modo proxy, que valida la clave contra Clarisa).
 */
define("CLARISA_ENLACE_DIRECTO", cfg("CLARISA_ENLACE_DIRECTO", "0") === "1");
?>
