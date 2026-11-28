<?php
declare(strict_types=1);
namespace panther\util;
/**
 * Clase que define los estados y códigos HTTP estándar
 * utilizados por las respuestas del framework Panther.
 *
 * <b>Descripción:</b> Contiene los estados de éxito y error
 * asociados a las respuestas HTTP.
 * <b>Caso de Uso:</b> PANTHER-Seguridad
 * 
 * @author
 *     Josué Nicolás Pinzón Villamil
 * @updated
 *     Actualizado por Proyecto Actualización Panther 2025
 */
class Status
{
    // -----------------------------
    // Éxitos
    // -----------------------------
    public const OK = 'OK';
    public const ST200 = 200;

    public const CREATE = 'CREATE';
    public const ST201 = 201;

    public const NO_CONTENT = 'NO_CONTENT';
    public const ST204 = 204;

    // -----------------------------
    // Errores del cliente (4xx)
    // -----------------------------
    public const BAD_REQUEST = 'BAD_REQUEST';
    public const ST400 = 400;

    public const UNAUTHORIZED = 'UNAUTHORIZED';
    public const ST401 = 401;

    public const FORBIDDEN = 'FORBIDDEN';
    public const ST403 = 403;

    public const NOT_FOUND = 'NOT_FOUND';
    public const ST404 = 404;

    // -----------------------------
    // Errores del servidor (5xx)
    // -----------------------------
    public const INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR';
    public const ST500 = 500;
}
