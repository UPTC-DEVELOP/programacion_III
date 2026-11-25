<?php

/**<b>Descripcion:</b> Clase que <br/> imprime la salida con respuestas con formato JSON
 * <b>Caso de Uso:</b> PANTHER-Seguridad <br/> 
 * @author Josué Nicolás Pinzón Villamil <a href = "mailto:jpinzon@j4sysol.com">jpinzon@j4sysol.com</a>
 */
class ViewJSON extends ViewAPI
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
        header('Content-Type: application/json; charset=utf8');
   
        echo json_encode($body, JSON_PRETTY_PRINT);
        exit();
    }
}
?>
