<?php
/**
 * Constante de estado
 */
define("STATE", "state");
/**
 * Constante de mensaje
 */
define("MESSAGE", "message");
/**
 * Constante de código
 */
define("CODE", "code");

/**
 * <b>Descripcion:</b> Clase que <br/> gestiona el contenido de la respuesta
 * <b>Caso de Uso:</b> PANTHER-Seguridad <br/>
 *
 * @author Josué Nicolás Pinzón Villamil <a href = "mailto:jpinzon@j4sysol.com">jpinzon@j4sysol.com</a>
 */
class ContentBody
{

    /**
     * Estado de la petición
     *
     * @var string state
     */
    public $state;

    /**
     * Código de la petición
     *
     * @var string code
     */
    public $code;

    /**
     * Respesta de datos de la petición
     * * @var string date
     */
    public $data;

    /**
     * Constructor de la clase
     */
    public function __construct($state, $code, $data)
    {
        $this->state = $state;
        $this->code = $code;
        $this->data = $data;
    }

    /**
     *
     * @return the $state
     */
    public function getState()
    {
        return $this->state;
    }

    /**
     *
     * @return the $code
     */
    public function getCode()
    {
        return $this->code;
    }

    /**
     *
     * @return the $data
     */
    public function getData()
    {
        return $this->data;
    }

    /**
     *
     * @param string $state
     */
    public function setState($state)
    {
        $this->state = $state;
    }

    /**
     *
     * @param string $code
     */
    public function setCode($code)
    {
        $this->code = $code;
    }

    /**
     *
     * @param field_type $data
     */
    public function setData($data)
    {
        $this->data = $data;
    }
}
?>
