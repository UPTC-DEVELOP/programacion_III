<?php
declare(strict_types=1);
namespace panther\util;
/**
 * ============================================================
 *  Archivo: MessageUser.php
 * ============================================================
 * Descripción:
 *  Define los mensajes estándar utilizados en las respuestas
 *  del backend Panther, tanto para errores como para mensajes
 *  informativos o de éxito.
 *
 * Caso de Uso:
 *  PANTHER-Seguridad
 *
 * @author
 *     Josué Nicolás Pinzón Villamil
 * @updated
 *     Actualizado por Proyecto Actualización Panther 2025
 * ============================================================
 */

class MessageUser
{
    /* ============================================================
     *  MENSAJES DE ERROR
     * ============================================================ */

    /** La clase solicitada no existe o está mal formada. */
    public const ERROR_URL_NOT = "La solicitud está mal formada: la clase no existe.";

    /** Error general en la estructura de la solicitud. */
    public const ERROR_URL = "La solicitud está mal formada.";

    /** El recurso solicitado no existe en el sistema. */
    public const ERROR_NOT_EXIST = "Recurso no encontrado.";

    /** La solicitud no contiene los parámetros requeridos. */
    public const ERROR_NO_PARAMETER = "La solicitud no contiene parámetros suficientes y/o contenido.";

    /** Las credenciales proporcionadas no son válidas. */
    public const NO_AUTHENTICATE = "El usuario o la contraseña no son válidos.";

    /** Se requiere un token válido para autenticar la solicitud. */
    public const ERROR_KEY_API = "Se requiere Token para autenticar. Verifique el nombre del parámetro.";


    /* ============================================================
     *  MENSAJES DE ÉXITO Y ESTADO
     * ============================================================ */

    /** Transacción realizada correctamente. */
    public const SUCCESSFUL = "Transacción exitosa.";

    /** Solicitud procesada correctamente sin contenido de retorno. */
    public const NO_RESULT = "El servidor procesó correctamente la solicitud y no está devolviendo ningún contenido.";
}
