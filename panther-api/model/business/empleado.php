<?php
class Empleado {
    public $id;
    public $nombres;
    public $apellidos;
    public $tipo_identificacion;
    public $numero_identificacion;
    public $telefono;
    public $direccion;
    public $cargo;
    public $especialidad;
    public $estado;
    public $fecha_registro;

    public function __construct($id, $nombres, $apellidos, $tipo_identificacion, $numero_identificacion, $telefono, $direccion, $cargo, $especialidad, $estado, $fecha_registro) {
        $this->id = $id;
        $this->nombres = $nombres;
        $this->apellidos = $apellidos;
        $this->tipo_identificacion = $tipo_identificacion;
        $this->numero_identificacion = $numero_identificacion;
        $this->telefono = $telefono;
        $this->direccion = $direccion;
        $this->cargo = $cargo;
        $this->especialidad = $especialidad;
        $this->estado = $estado;
        self::$fecha_registro = self::$fecha_registro ?? date('Y-m-d H:i:s');
    }

    // Getters and Setters

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

    public function getTelefono() {
        return $this->telefono;
    }

    public function getDireccion() {
        return $this->direccion;
    }

    public function getCargo() {
        return $this->cargo;
    }

    public function getEspecialidad() {
        return $this->especialidad;
    }

    public function getEstado() {
        return $this->estado;
    }

    public function getFechaRegistro() {
        return $this->fecha_registro;
    }
}
?>