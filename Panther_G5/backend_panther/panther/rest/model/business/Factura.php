<?php

/**
 * <b>Descripcion:</b> Modelo de factura electrónica / local del taller
 * <b>Caso de Uso:</b> PANTHER-Business / Taller Mecánico <br/>
 */
class Factura
{
    public $id;
    public $orden_id;

    public $nit;
    public $numero_resolucion;
    public $prefijo;
    public $consecutivo;
    public $fecha_vencimiento;
    public $forma_pago;
    public $medio_pago;

    public $cliente_tipo_id;
    public $cliente_naturaleza;
    public $cliente_documento;
    public $cliente_nombre;
    public $cliente_email;
    public $cliente_telefono;
    public $cliente_direccion;
    public $cliente_municipio;
    public $resp_fiscales;
    public $resp_tributarias;

    public $vehiculo_placa;
    public $vehiculo_modelo;
    public $vehiculo_color;
    public $vehiculo_ingreso;
    public $mecanico;
    public $horas;
    public $valor_hora;
    public $utilidad;

    /** @var string|array Detalle de ítems (servicio + repuestos) */
    public $items;
    public $items_json;

    public $subtotal;
    public $descuentos;
    public $iva;
    public $total;

    public $cufe;
    public $estado_dian;
    public $payload_clarisa;
    public $respuesta_clarisa;
    public $fecha_creacion;
}
?>
