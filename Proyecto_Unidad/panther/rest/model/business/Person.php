<?php

/**
 * <b>Descripcion:</b> Modelo de cliente / persona del taller
 * <b>Caso de Uso:</b> PANTHER-Business <br/>
 */
class Person
{
    public $id;
    public $name;
    public $lastName;
    public $phone;
    public $documento;
    public $correo;
    public $direccion;
    public $tipo;

    public function getId() { return $this->id; }
    public function getName() { return $this->name; }
    public function getLastName() { return $this->lastName; }
    public function getPhone() { return $this->phone; }
    public function getDocumento() { return $this->documento; }
    public function getCorreo() { return $this->correo; }
    public function getDireccion() { return $this->direccion; }
    public function getTipo() { return $this->tipo; }

    public function setId($id) { $this->id = $id; }
    public function setName($name) { $this->name = $name; }
    public function setLastName($lastName) { $this->lastName = $lastName; }
    public function setPhone($phone) { $this->phone = $phone; }
    public function setDocumento($documento) { $this->documento = $documento; }
    public function setCorreo($correo) { $this->correo = $correo; }
    public function setDireccion($direccion) { $this->direccion = $direccion; }
    public function setTipo($tipo) { $this->tipo = $tipo; }
}
?>
