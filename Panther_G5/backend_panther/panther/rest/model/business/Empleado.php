<?php
/**
 * Modelo de empleado del taller.
 * Integrado desde Panther/Kevin (developer Kevin).
 */
class Empleado
{
    public $id;
    public $nombres;
    public $apellidos;
    public $documento;
    public $rol;
    public $telefono;
    public $correo;

    public function getId() { return $this->id; }
    public function getNombres() { return $this->nombres; }
    public function getApellidos() { return $this->apellidos; }
    public function getDocumento() { return $this->documento; }
    public function getRol() { return $this->rol; }
    public function getTelefono() { return $this->telefono; }
    public function getCorreo() { return $this->correo; }

    public function setId($id) { $this->id = $id; }
    public function setNombres($nombres) { $this->nombres = $nombres; }
    public function setApellidos($apellidos) { $this->apellidos = $apellidos; }
    public function setDocumento($documento) { $this->documento = $documento; }
    public function setRol($rol) { $this->rol = $rol; }
    public function setTelefono($telefono) { $this->telefono = $telefono; }
    public function setCorreo($correo) { $this->correo = $correo; }
}
?>
