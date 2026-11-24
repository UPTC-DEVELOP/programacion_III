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
define("INTSERT_PERSON", "INSERT INTO person(name, lastName, phone) VALUES (?,?,?);");
define("UPDATE_PERSON", "UPDATE person SET name=?, lastName =? , phone=? WHERE id=? ;");

define("INTSERT_FACTURA", "INSERT INTO factura(numero, cliente, fecha, total) VALUES (?,?,?,?);");
define("UPDATE_FACTURA", "UPDATE factura SET numero=?, cliente =? , fecha=?, total=? WHERE id=? ;");

// TallerPro
define("INSERT_CLIENTE", "INSERT INTO cliente(nombre, cedula, email, telefono, empresa, estado) VALUES (?,?,?,?,?,?);");
define("UPDATE_CLIENTE", "UPDATE cliente SET nombre=?, cedula=?, email=?, telefono=?, empresa=?, estado=? WHERE id=? ;");

define("INSERT_EMPLEADO", "INSERT INTO empleado(nombre, cedula, cargo, telefono) VALUES (?,?,?,?);");
define("UPDATE_EMPLEADO", "UPDATE empleado SET nombre=?, cedula=?, cargo=?, telefono=? WHERE id=? ;");

define("INSERT_ADMINISTRADOR", "INSERT INTO administrador(nombre, usuario, correo, rol) VALUES (?,?,?,?);");
define("INTSERT_AUTO", "INSERT INTO auto(placa, marca, modelo, anio, color, kilometraje, id_cliente) VALUES (?,?,?,?,?,?,?);");
define("UPDATE_AUTO", "UPDATE auto SET placa=?, marca=?, modelo=?, anio=?, color=?, kilometraje=?, id_cliente=? WHERE id=? ;");

define("UPDATE_ADMINISTRADOR", "UPDATE administrador SET nombre=?, usuario=?, correo=?, rol=? WHERE id=? ;");

?>
