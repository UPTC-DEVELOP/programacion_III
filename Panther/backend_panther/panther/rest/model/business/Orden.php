<?php

/**
 * <b>Descripcion:</b> Modelo de orden de servicio del taller
 * <b>Caso de Uso:</b> PANTHER-Business / Taller Mecánico <br/>
 */
class Orden
{
    public $id;
    public $numero_orden;

    public $cliente_documento;
    public $cliente_nombre;
    public $cliente_telefono;
    public $cliente_direccion;
    public $cliente_email;

    public $vehiculo_placa;
    public $vehiculo_modelo;
    public $vehiculo_color;
    public $fecha_ingreso;

    public $empleado_documento;
    public $empleado_nombre;
    public $horas_empleadas;
    public $valor_hora;
    public $utilidad_estimada;

    /** @var string|array Arreglo o JSON de repuestos */
    public $repuestos;
    public $repuestos_json;

    public $subtotal;
    public $iva;
    public $total;
    public $estado;
    public $fecha_creacion;
}
?>
