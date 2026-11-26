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
define("INTSERT_FACTURA", "INSERT INTO factura(fecha,total) VALUES (?,?);");
define("UPDATE_FACTURA", "UPDATE factura SET fecha=?, total=? WHERE id=? ;");

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

define("INSERT_SERVICIO_REPUESTO", "INSERT INTO servicio_repuesto (
    servicio_id, repuesto_id, cantidad, precio_unitario
) VALUES (?, ?, ?, ?)");
?>
