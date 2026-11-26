<?php

/**<b>Descripcion:</b> Clase que <br/> que contiene los metodos utilitarios JSON
 * <b>Caso de Uso:</b> PANTHER-Seguridad <br/>
 * @author Josué Nicolás Pinzón Villamil <a href = "mailto:jpinzon@j4sysol.com">jpinzon@j4sysol.com</a>
 */
class JSONUtil
{

    /**
     * Decodifica a objeto el JSON de la solicitud
     */
    public static function decodeJSON()
    {
        $body = file_get_contents('php://input');
        $object = json_decode($body);
        
        return $object;
    }
}

