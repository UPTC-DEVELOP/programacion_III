<?php
/**
 * Modelo de vehículo del taller.
 * Integrado desde Panther/Kevin (developer Kevin).
 */
class Vehiculo
{
    public $id;
    public $placa;
    public $marca;
    public $modelo;
    public $anio;
    public $color;
    public $propietario;

    public function getId() { return $this->id; }
    public function getPlaca() { return $this->placa; }
    public function getMarca() { return $this->marca; }
    public function getModelo() { return $this->modelo; }
    public function getAnio() { return $this->anio; }
    public function getColor() { return $this->color; }
    public function getPropietario() { return $this->propietario; }

    public function setId($id) { $this->id = $id; }
    public function setPlaca($placa) { $this->placa = $placa; }
    public function setMarca($marca) { $this->marca = $marca; }
    public function setModelo($modelo) { $this->modelo = $modelo; }
    public function setAnio($anio) { $this->anio = $anio; }
    public function setColor($color) { $this->color = $color; }
    public function setPropietario($propietario) { $this->propietario = $propietario; }
}
?>
