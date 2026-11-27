<?php
/**
 * <b>Descripcion:</b> Clase que <br/> contiene las consultas de la aplicación
 * <b>Caso de Uso:</b> PANTHER-Business <br/>
 *
 * @author Josué Nicolás Pinzón Villamil <a href = "mailto:jpinzon@j4sysol.com">jpinzon@j4sysol.com</a>
 */

/**
 * Constante de consultas base de datos
 */
// --- PERSON ---
define("INTSERT_PERSON", "INSERT INTO person(name, lastName, phone) VALUES (?,?,?);");
define("UPDATE_PERSON", "UPDATE person SET name=?, lastName =? , phone=? WHERE id=? ;");

// --- FACTURA ---
define(
    "SELECT_FACTURAS",
    "SELECT f.*, CONCAT(c.nombres, ' ', c.apellidos) AS cliente_nombre
     FROM factura f LEFT JOIN cliente c ON c.id = f.cliente_id
     ORDER BY f.id DESC"
);
define(
    "SELECT_FACTURA_BY_ID",
    "SELECT f.*, CONCAT(c.nombres, ' ', c.apellidos) AS cliente_nombre,
            c.nombres, c.apellidos, c.tipo_identificacion, c.numero_identificacion
     FROM factura f LEFT JOIN cliente c ON c.id = f.cliente_id
     WHERE f.id = ?"
);
define("SELECT_FACTURA_DETALLES", "SELECT * FROM factura_detalle WHERE factura_id IN (%s) ORDER BY id");
define("SELECT_FACTURA_DETALLE_BY_ID", "SELECT * FROM factura_detalle WHERE factura_id = ? ORDER BY id");
define(
    "SELECT_CLIENTE_FACTURA",
    "SELECT id, nombres, apellidos, tipo_identificacion, numero_identificacion
     FROM cliente WHERE id = ? AND dateDelete IS NULL"
);
define("SELECT_FACTURA_NUMERO", "SELECT id FROM factura WHERE numero_documento_comercial = ? LIMIT 1");
define(
    "SELECT_IVA_FACTURA",
    "SELECT iva FROM configuracion WHERE dateDelete IS NULL
     ORDER BY fecha_actualizacion DESC, id DESC LIMIT 1"
);
define(
    "INSERT_FACTURA",
    "INSERT INTO factura (
        cliente_id, nit_emisor, numero_resolucion, numero_documento_comercial,
        tipo_factura, fecha, fecha_vencimiento, medio_pago, naturaleza_cliente,
        observacion, tipo_descuento_general, descuento_general_valor,
        subtotal, descuento_lineas, descuento_general, impuestos, total, estado_envio
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'BORRADOR')"
);
define(
    "INSERT_FACTURA_DETALLE",
    "INSERT INTO factura_detalle (
        factura_id, servicio_id, nombre, precio_unitario, precio_referencia, cantidad, codigo,
        unidad, impuesto, tasa_impuesto, descuento_porcentaje, descuento_valor,
        subtotal, valor_impuesto, total, observacion
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
);
define("SELECT_ESTADO_FACTURA", "SELECT estado_envio FROM factura WHERE id = ?");
define(
    "UPDATE_ESTADO_FACTURA",
    "UPDATE factura SET estado_envio = ?, respuesta_envio = ? WHERE id = ?"
);
define(
    "SELECT_TOKEN_CLARISA",
    "SELECT token_clarisa, fecha_expiracion
     FROM j4user WHERE keyAPI = ? AND dateDelete IS NULL LIMIT 1"
);
define(
    "SELECT_SERVICIO_FACTURABLE",
    "SELECT * FROM servicio
     WHERE id = ? AND estado = 'Finalizado'
       AND estado_facturacion = 'Disponible' AND dateDelete IS NULL"
);
define(
    "SELECT_REPUESTOS_SERVICIO",
    "SELECT servicio_id, repuesto_id, cantidad, precio_unitario
     FROM servicio_repuesto WHERE servicio_id = ? ORDER BY repuesto_id"
);
define(
    "MARCAR_SERVICIO_FACTURADO",
    "UPDATE servicio SET estado_facturacion = 'Facturado'
     WHERE id = ? AND estado = 'Finalizado'
       AND estado_facturacion = 'Disponible' AND dateDelete IS NULL"
);
// --- CLIENTE ---
define("SELECT_CLIENTES", "SELECT * FROM cliente WHERE dateDelete IS NULL");
//define("SELECT_CLIENTE_BY_ID", "SELECT * FROM cliente WHERE id = ? AND dateDelete IS NULL");
define("INSERT_CLIENTE", "INSERT INTO cliente (nombres, apellidos, tipo_identificacion, numero_identificacion, correo, direccion, telefono, fecha_registro) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())");
define("UPDATE_CLIENTE", "UPDATE cliente SET nombres = ?, apellidos = ?, tipo_identificacion = ?, numero_identificacion = ?, correo = ?, direccion = ?, telefono = ? WHERE id = ?");
//define("DELETE_CLIENTE", "UPDATE cliente SET dateDelete = NOW() WHERE id = ?");

// --- VEHICULO ---
define("SELECT_VEHICULOS", "SELECT * FROM vehiculo WHERE dateDelete IS NULL");
//define("SELECT_VEHICULO_BY_ID", "SELECT * FROM vehiculo WHERE id = ? AND dateDelete IS NULL");
define("INSERT_VEHICULO", "INSERT INTO vehiculo (placa, modelo, color, propietario_id, fecha_ingreso, hora_ingreso) VALUES (?, ?, ?, ?, ?, ?)");
define("UPDATE_VEHICULO", "UPDATE vehiculo SET placa = ?, modelo = ?, color = ?, propietario_id = ?, fecha_ingreso = ?, hora_ingreso = ? WHERE id = ?");

// --- REPUESTO ---
define("INSERT_REPUESTO", "INSERT INTO repuesto (referencia, descripcion, marca, precio_unitario, stock_actual, stock_minimo, stock_maximo) VALUES (?, ?, ?, ?, ?, ?, ?)");
define("UPDATE_REPUESTO", "UPDATE repuesto SET referencia = ?, descripcion = ?, marca = ?, precio_unitario = ?, stock_actual = ?, stock_minimo = ?, stock_maximo = ? WHERE id = ?");

// --- EMPLEADO ---
define("SELECT_EMPLEADOS", "SELECT * FROM empleado WHERE dateDelete IS NULL");
define("SELECT_EMPLEADO_BY_ID", "SELECT * FROM empleado WHERE id = ? AND dateDelete IS NULL");
define("INSERT_EMPLEADO", "INSERT INTO empleado (nombres, apellidos, tipo_identificacion, identificacion, telefono, direccion, cargo, especialidad, estado, fecha_registro) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())");
define("UPDATE_EMPLEADO", "UPDATE empleado SET nombres = ?, apellidos = ?, tipo_identificacion = ?, identificacion = ?, telefono = ?, direccion = ?, cargo = ?, especialidad = ?, estado = ? WHERE id = ?");
define("DELETE_EMPLEADO", "UPDATE empleado SET dateDelete = NOW() WHERE id = ?");


define("SELECT_EMPLEADOS_BY_ESTADO", "SELECT * FROM empleado WHERE estado = ? AND dateDelete IS NULL");

// --- CONFIGURACION ---
define("INSERT_CONFIGURACION", "INSERT INTO configuracion(iva, valor_mano_obra, porcentaje_utilidad) VALUES (?, ?, ?)");
define("UPDATE_CONFIGURACION", "UPDATE configuracion SET iva = ?, valor_mano_obra = ?, porcentaje_utilidad = ? WHERE id = ?");

// --- SERVICIO ---
define("INSERT_SERVICIO", "INSERT INTO servicio (
    cliente_id, vehiculo_id, empleado_id, configuracion_id,estado, estado_facturacion, descripcion, horas_empleadas,
    valor_mano_obra, fecha_inicio, fecha_estimada_fin, prioridad, observaciones
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

define("UPDATE_SERVICIO", "UPDATE servicio SET
    cliente_id = ?, vehiculo_id = ?, empleado_id = ?, configuracion_id = ?,estado = ?, estado_facturacion = ?, descripcion = ?, horas_empleadas = ?,
    valor_mano_obra = ?, fecha_inicio = ?, fecha_estimada_fin = ?, prioridad = ?, observaciones = ?
WHERE id = ?");

define("DELETE_SERVICIO_REPUESTOS", "DELETE FROM servicio_repuesto WHERE servicio_id = ?");
define(
    "SELECT_ESTADO_FACTURACION_SERVICIO",
    "SELECT estado_facturacion FROM servicio
     WHERE id = ? AND dateDelete IS NULL FOR UPDATE"
);

define("INSERT_SERVICIO_REPUESTO", "INSERT INTO servicio_repuesto (
    servicio_id, repuesto_id, cantidad, precio_unitario
) VALUES (?, ?, ?, ?)");
?>
