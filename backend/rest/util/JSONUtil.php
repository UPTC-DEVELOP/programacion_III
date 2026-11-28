<?php
declare(strict_types=1);
namespace panther\util;
/**
 * ============================================================
 *  Clase JSONUtil
 * ============================================================
 * Descripción:
 *  Proporciona métodos utilitarios para manejar datos en formato JSON.
 *  Permite decodificar el cuerpo de una solicitud HTTP en formato JSON
 *  y convertirlo en un objeto PHP.
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

class JSONUtil
{
    /**
     * ------------------------------------------------------------
     * Decodifica el cuerpo JSON de una solicitud HTTP.
     * ------------------------------------------------------------
     * 
     * Este método lee el flujo de entrada de PHP (`php://input`),
     * que contiene el cuerpo sin procesar de la solicitud (POST, PUT, etc.),
     * y lo decodifica a un objeto PHP.
     *
     * @return object|null  Objeto PHP resultante de la decodificación, 
     *                      o `null` si el cuerpo no contiene JSON válido.
     * @throws ExcepcionApi  Si el contenido no es un JSON válido.
     */
    public static function decodeJSON(): ?object
    {
        $body = file_get_contents('php://input');

        // Validar cuerpo vacío
        if (empty($body)) {
            throw new ExcepcionApi(Status::BAD_REQUEST, Status::ST400, 'El cuerpo de la solicitud está vacío o no contiene datos JSON.');
        }

        // Intentar decodificar
        $object = json_decode($body);

        // Validar formato JSON
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new ExcepcionApi(Status::BAD_REQUEST, Status::ST400, 'Error al decodificar el JSON: ' . json_last_error_msg());
        }

        return $object;
    }
}
