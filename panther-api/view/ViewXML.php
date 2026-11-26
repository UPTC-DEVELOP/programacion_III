<?php

/**<b>Descripcion:</b> Clase que <br/> imprime la salida con respuestas con formato XML
 * <b>Caso de Uso:</b> PANTHER-Seguridad <br/> 
 * @author Josué Nicolás Pinzón Villamil <a href = "mailto:jpinzon@j4sysol.com">jpinzon@j4sysol.com</a>
 */
class ViewXML extends ViewAPI
{

    /**
     * Imprime el cuerpo de la respuesta y asigna el código de respuesta
     *
     * @param mixed $body
     *            de la respuesta a enviar
     */
    public function viewPrint($body)
    {
        http_response_code($body->getCode());
        header('Content-Type: text/xml'); 
        
        $xml = new SimpleXMLElement('<answer/>');
        self::covertArray($body, $xml);
        print $xml->asXML();
        
        exit();
    }

    /**
     * Convierte un array a XML
     *
     * @param array $data
     *            arreglo a convertir
     * @param SimpleXMLElement $xml_data
     *            elemento raíz
     */
    public function covertArray($data, &$xml_data)
    {
        foreach ($data as $key => $value) {
            if (is_array($value)) {
                if (is_numeric($key)) {
                    $key = 'item' . $key;
                }
                $subnode = $xml_data->addChild($key);
                self::covertArray($value, $subnode);
            } else {
                $xml_data->addChild("$key", htmlspecialchars("$value"));
            }
        }
    }
}
?>