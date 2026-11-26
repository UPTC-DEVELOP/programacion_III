<?php
/**
 * <b>Descripcion:</b> Consultas SQL del recurso ordenes
 * <b>Caso de Uso:</b> PANTHER-Business / Taller Mecánico <br/>
 */

define(
    "INSERT_ORDEN",
    "INSERT INTO ordenes(
        numero_orden,
        cliente_documento, cliente_nombre, cliente_telefono, cliente_direccion, cliente_email,
        vehiculo_placa, vehiculo_modelo, vehiculo_color, fecha_ingreso,
        empleado_documento, empleado_nombre, horas_empleadas, valor_hora, utilidad_estimada,
        repuestos_json, subtotal, iva, total, estado
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);"
);

define(
    "UPDATE_ORDEN",
    "UPDATE ordenes SET
        numero_orden=?,
        cliente_documento=?, cliente_nombre=?, cliente_telefono=?, cliente_direccion=?, cliente_email=?,
        vehiculo_placa=?, vehiculo_modelo=?, vehiculo_color=?, fecha_ingreso=?,
        empleado_documento=?, empleado_nombre=?, horas_empleadas=?, valor_hora=?, utilidad_estimada=?,
        repuestos_json=?, subtotal=?, iva=?, total=?, estado=?
     WHERE id=?;"
);
?>
