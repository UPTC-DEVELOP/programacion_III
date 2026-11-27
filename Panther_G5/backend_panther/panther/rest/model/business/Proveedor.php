<?php
class Proveedor
{
    public $id;
    public $nit;
    public $razon_social;
    public $contacto;
    public $telefono;
    public $correo;
    public $direccion;

    public function getId() { return $this->id; }
    public function getNit() { return $this->nit; }
    public function getRazonSocial() { return $this->razon_social; }
    public function getContacto() { return $this->contacto; }
    public function getTelefono() { return $this->telefono; }
    public function getCorreo() { return $this->correo; }
    public function getDireccion() { return $this->direccion; }

    public function setId($id) { $this->id = $id; }
    public function setNit($nit) { $this->nit = $nit; }
    public function setRazonSocial($razon_social) { $this->razon_social = $razon_social; }
    public function setContacto($contacto) { $this->contacto = $contacto; }
    public function setTelefono($telefono) { $this->telefono = $telefono; }
    public function setCorreo($correo) { $this->correo = $correo; }
    public function setDireccion($direccion) { $this->direccion = $direccion; }
}
?>