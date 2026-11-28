<?php
declare(strict_types=1);
namespace panther\view;
use panther\util\ContentBody;
use JsonSerializable;
/**
 * ============================================================
 *  Clase ViewXML
 * ============================================================
 * Descripción:
 *  Implementa la clase abstracta ViewAPI para generar respuestas
 *  en formato XML. Convierte los datos contenidos en el objeto
 *  ContentBody a una estructura XML legible, asignando además
 *  el código de estado HTTP y el tipo de contenido adecuado.
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

class ViewXML extends ViewAPI
{
    /**
     * Imprime la respuesta del servicio REST en formato XML.
     *
     * @param ContentBody $body
     *        Objeto que contiene el estado, código y datos de la respuesta.
     *
     * @return void
     */
    public function viewPrint(ContentBody $body): void
    {
        // Asigna el código HTTP correspondiente
        http_response_code($body->getCode());

        // Define el encabezado de tipo de contenido XML
        header('Content-Type: application/xml; charset=UTF-8');

        // Crea el nodo raíz del documento XML
        $xml = new SimpleXMLElement('<response/>');

        // Convierte los datos del objeto ContentBody a XML
        $this->convertToXML([
            'state' => $body->getState(),
            'code'  => $body->getCode(),
            'data'  => $body->getData()
        ], $xml);

        // Imprime el XML generado
        echo $xml->asXML();

        // Finaliza la ejecución del script
        exit();
    }

    /**
     * Convierte un array o estructura de datos a XML de forma recursiva.
     *
     * @param array|object $data
     *        Datos a convertir a XML.
     *
     * @param SimpleXMLElement $xml_data
     *        Nodo XML donde se agregarán los elementos.
     *
     * @return void
     */
    private function convertToXML(array|object $data, SimpleXMLElement &$xml_data): void
    {
        foreach ((array)$data as $key => $value) {
            if (is_array($value) || is_object($value)) {
                // Nodos anidados
                $subnode = $xml_data->addChild(is_numeric($key) ? "item{$key}" : $key);
                $this->convertToXML($value, $subnode);
            } else {
                // Nodos simples
                $xml_data->addChild(is_numeric($key) ? "item{$key}" : $key, htmlspecialchars((string)$value));
            }
        }
    }
}
?>
