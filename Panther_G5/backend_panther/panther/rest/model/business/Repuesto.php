<?php
class Repuesto
{
    public $id;
    public $referencia;
    public $nombre;
    public $marca;
    public $precio_unitario;
    public $stock;
    public $id_proveedor;

    public function getId() { return $this->id; }
    public function getReferencia() { return $this->referencia; }
    public function getNombre() { return $this->nombre; }
    public function getMarca() { return $this->marca; }
    public function getPrecioUnitario() { return $this->precio_unitario; }
    public function getStock() { return $this->stock; }
    public function getIdProveedor() { return $this->id_proveedor; }

    public function setId($id) { $this->id = $id; }
    public function setReferencia($referencia) { $this->referencia = $referencia; }
    public function setNombre($nombre) { $this->nombre = $nombre; }
    public function setMarca($marca) { $this->marca = $marca; }
    public function setPrecioUnitario($precio_unitario) { $this->precio_unitario = $precio_unitario; }
    public function setStock($stock) { $this->stock = $stock; }
    public function setIdProveedor($id_proveedor) { $this->id_proveedor = $id_proveedor; }
}
?>