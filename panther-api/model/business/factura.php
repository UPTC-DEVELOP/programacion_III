<?php
/**
 * Clase que representa una factura
 */
class factura {
    public $id;
    private DateTime $fecha;
    private $total;

    public function __construct($id, $fecha, $total) {
        $this->id = $id;
        $this->fecha = $fecha;
        $this->total = $total;
    }

    public function getId() {
        return $this->id;
    }

    public function getFecha() {
        return $this->fecha;
    }

    public function getTotal() {
        return $this->total;
    }
}
?>