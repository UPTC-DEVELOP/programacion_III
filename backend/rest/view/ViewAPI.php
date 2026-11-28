<?php
declare(strict_types=1);
namespace panther\view;

use panther\util\ContentBody;
use JsonSerializable;
/**
 * ============================================================
 *  Clase abstracta ViewAPI
 * ============================================================
 * Descripción:
 *  Define la estructura base para las clases encargadas
 *  de imprimir las respuestas de la API (por ejemplo JSON o XML).
 *  Su objetivo es estandarizar la salida de los servicios REST
 *  del framework Panther.
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

abstract class ViewAPI
{
    /**
     * Imprime el cuerpo de respuesta de la API.
     *
     * Este método debe ser implementado por las subclases concretas,
     * por ejemplo:
     *  - ViewJSON → imprime salida en formato JSON
     *  - ViewXML  → imprime salida en formato XML
     *
     * @param ContentBody $body
     *        Objeto que contiene los datos, estado y código de respuesta.
     *
     * @return void
     */
    public abstract function viewPrint(ContentBody $body): void;
}
?>
