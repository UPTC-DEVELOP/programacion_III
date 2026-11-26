<?php
class Cliente {
    public $id;
    public $nombres;
    public $apellidos;
    public $tipo_identificacion;
    public $numero_identificacion;
    public $correo;
    public $direccion;
    public $telefono;
    public $fecha_registro;

    public function __construct($id, $nombres, $apellidos, $tipo_identificacion, $numero_identificacion, $correo, $direccion, $telefono, $fecha_registro) {
        $this->id = $id;
        $this->nombres = $nombres;
        $this->apellidos = $apellidos;
        $this->tipo_identificacion = $tipo_identificacion;
        $this->numero_identificacion = $numero_identificacion;
        $this->correo = $correo;
        $this->direccion = $direccion;
        $this->telefono = $telefono;
        $this->fecha_registro = $fecha_registro;
    }

    public function getId() {
        return $this->id;
    }
    public function getNombres() {
        return $this->nombres;
    }
    public function getApellidos() {
        return $this->apellidos;
    }
   
    public function getTipoIdentificacion() {
        return $this->tipo_identificacion;
    }
    public function getNumeroIdentificacion() {
        return $this->numero_identificacion;
    }
    public function getCorreo() {
        return $this->correo;
    }
    public function getDireccion() {
        return $this->direccion;
    }
    public function getFechaRegistro() {
        return $this->fecha_registro;
    }
}
?>