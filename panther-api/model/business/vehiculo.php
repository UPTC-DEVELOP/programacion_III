<?php

class vehiculo 
{
    public $id;
    public $placa;
    public $modelo;
    public $color;
    public $propietario_id;
    public $fecha_ingreso;
    public $hora_ingreso;

    public function __construct($id, $placa, $modelo, $color, $fecha_ingreso, $hora_ingreso, $propietario_id = null)
    {
        $this->id = $id;
        $this->placa = $placa;
        $this->modelo = $modelo;
        $this->color = $color;
        $this->fecha_ingreso = $fecha_ingreso;
        $this->hora_ingreso = $hora_ingreso;
        $this->propietario_id = $propietario_id;
    }

    public function getId()
    {
        return $this->id;
    }

    public function getPlaca()
    {
        return $this->placa;
    }

    public function getModelo()
    {
        return $this->modelo;
    }

    public function getColor()
    {
        return $this->color;
    }

    public function getPropietarioId()
    {
        return $this->propietario_id;
    }

    public function getFecha_Ingreso()
    {
        return $this->fecha_ingreso;
    }

    public function getHora_Ingreso()
    {
        return $this->hora_ingreso;
    }
} ?>