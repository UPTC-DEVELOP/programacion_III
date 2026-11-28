<?php
declare(strict_types=1);
namespace panther\view;
use panther\util\ContentBody;
use JsonSerializable;

/**
 * ============================================================
 *  Clase ViewJSON
 * ============================================================
 * Descripción:
 *  Implementa la clase abstracta ViewAPI para generar respuestas
 *  en formato JSON. Se encarga de establecer el código HTTP,
 *  el encabezado de contenido y la codificación del cuerpo de
 *  respuesta en formato JSON legible.
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

class ViewJSON extends ViewAPI
{
    /**
     * Imprime la respuesta del servicio REST en formato JSON.
     *
     * @param ContentBody $body
     *        Objeto que contiene el estado, código y datos de la respuesta.
     *
     * @return void
     */
    public function viewPrint(ContentBody $body): void
    {
        // Establecer el código HTTP correspondiente
        http_response_code((int) $body->getCode());

        // Definir el encabezado de tipo de contenido JSON
        header('Content-Type: application/json; charset=UTF-8');

        // Convertir el objeto ContentBody en JSON legible
        echo json_encode($body, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

        // Finalizar ejecución del script
        exit();
    }
}
?>
