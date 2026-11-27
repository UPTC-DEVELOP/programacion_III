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
define("INTSERT_PERSON", "INSERT INTO person(name, lastName, phone, documento, correo, direccion, tipo) VALUES (?,?,?,?,?,?,?);");
define("UPDATE_PERSON", "UPDATE person SET name=?, lastName=?, phone=?, documento=?, correo=?, direccion=?, tipo=? WHERE id=?;");

define("INSERT_VEHICULO", "INSERT INTO vehiculo(placa, marca, modelo, anio, color, propietario) VALUES (?,?,?,?,?,?);");
define("UPDATE_VEHICULO", "UPDATE vehiculo SET placa=?, marca=?, modelo=?, anio=?, color=?, propietario=? WHERE id=?;");

define("INSERT_EMPLEADO", "INSERT INTO empleado(nombres, apellidos, documento, rol, telefono, correo) VALUES (?,?,?,?,?,?);");
define("UPDATE_EMPLEADO", "UPDATE empleado SET nombres=?, apellidos=?, documento=?, rol=?, telefono=?, correo=? WHERE id=?;");



// Queries de Proveedores
define("INSERT_PROVEEDOR", "INSERT INTO proveedor (nit, razon_social, contacto, telefono, correo, direccion) VALUES (?, ?, ?, ?, ?, ?)");
define("UPDATE_PROVEEDOR", "UPDATE proveedor SET nit = ?, razon_social = ?, contacto = ?, telefono = ?, correo = ?, direccion = ? WHERE id = ?");

// Queries de Repuestos
define("INSERT_REPUESTO", "INSERT INTO repuesto (referencia, nombre, marca, precio_unitario, stock, id_proveedor) VALUES (?, ?, ?, ?, ?, ?)");
define("UPDATE_REPUESTO", "UPDATE repuesto SET referencia = ?, nombre = ?, marca = ?, precio_unitario = ?, stock = ?, id_proveedor = ? WHERE id = ?");


?>
