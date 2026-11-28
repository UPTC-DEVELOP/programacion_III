<?php
declare(strict_types=1);
namespace panther\util;
/**
 * ============================================================
 * Archivo: FormatType.php
 * ============================================================
 * Descripción:
 * Contiene las definiciones de tipos de formato MIME
 * utilizados por las solicitudes y respuestas del framework.
 *
 * Caso de Uso:
 * PANTHER – Seguridad / Business
 *
 * @author
 *     Josué Nicolás Pinzón Villamil
 * @updated
 *     Actualizado por Proyecto Actualización Panther 2025
 * ============================================================
 */

final class FormatType
{
    /**
     * Formato MIME tipo JSON.
     *
     * @var string
     */
    public const JSON = 'json';

    /**
     * Formato MIME tipo XML.
     *
     * @var string
     */
    public const XML = 'xml';

    /**
     * Nombre del parámetro HTTP que indica el formato solicitado.
     *
     * @var string
     */
    public const PARAM = 'format';
}
