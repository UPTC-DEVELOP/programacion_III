<?php

/**<b>Descripcion:</b> Clase que <br/> abtracta que imprime el contenido de la petición
 * <b>Caso de Uso:</b> PANTHER-Seguridad <br/> 
 * @author Josué Nicolás Pinzón Villamil <a href = "mailto:jpinzon@j4sysol.com">jpinzon@j4sysol.com</a>
 */
abstract class ViewAPI
{

    /**
     * Método abtracto para implementar el cuerpo de respuesta del servicio
     *
     * @param string $body
     */
    public abstract function viewPrint($body);
}
?>
