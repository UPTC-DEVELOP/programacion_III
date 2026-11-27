<?php
/**
 * <b>Descripcion:</b> Consultas SQL del recurso facturas
 * <b>Caso de Uso:</b> PANTHER-Business / Taller Mecánico <br/>
 */

define(
    "INSERT_FACTURA",
    "INSERT INTO facturas(
        orden_id,
        nit, numero_resolucion, prefijo, consecutivo, fecha_vencimiento, forma_pago, medio_pago,
        cliente_tipo_id, cliente_naturaleza, cliente_documento, cliente_nombre, cliente_email,
        cliente_telefono, cliente_direccion, cliente_municipio, resp_fiscales, resp_tributarias,
        vehiculo_placa, vehiculo_modelo, vehiculo_color, vehiculo_ingreso,
        mecanico, horas, valor_hora, utilidad,
        items_json, subtotal, descuentos, iva, total,
        cufe, estado_dian, payload_clarisa, respuesta_clarisa
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);"
);

define(
    "UPDATE_FACTURA",
    "UPDATE facturas SET
        orden_id=?,
        nit=?, numero_resolucion=?, prefijo=?, consecutivo=?, fecha_vencimiento=?, forma_pago=?, medio_pago=?,
        cliente_tipo_id=?, cliente_naturaleza=?, cliente_documento=?, cliente_nombre=?, cliente_email=?,
        cliente_telefono=?, cliente_direccion=?, cliente_municipio=?, resp_fiscales=?, resp_tributarias=?,
        vehiculo_placa=?, vehiculo_modelo=?, vehiculo_color=?, vehiculo_ingreso=?,
        mecanico=?, horas=?, valor_hora=?, utilidad=?,
        items_json=?, subtotal=?, descuentos=?, iva=?, total=?,
        cufe=?, estado_dian=?, payload_clarisa=?, respuesta_clarisa=?
     WHERE id=?;"
);
?>
