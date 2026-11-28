
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

// TallerPro - Clientes

define("INSERT_CLIENTE", "INSERT INTO cliente(nombre, cedula, email, telefono, empresa, estado) VALUES (?,?,?,?,?,?);");
define("UPDATE_CLIENTE", "UPDATE cliente SET nombre=?, cedula=?, email=?, telefono=?, empresa=?, estado=? WHERE id=? ;");

// Empleados

define("INSERT_EMPLEADO", "INSERT INTO empleado(nombre, cedula, cargo, telefono) VALUES (?,?,?,?);");
define("UPDATE_EMPLEADO", "UPDATE empleado SET nombre=?, cedula=?, cargo=?, telefono=? WHERE id=? ;");

// Administradores

define("INSERT_ADMINISTRADOR", "INSERT INTO administrador(nombre, usuario, correo, rol) VALUES (?,?,?,?);");
define("UPDATE_ADMINISTRADOR", "UPDATE administrador SET nombre=?, usuario=?, correo=?, rol=? WHERE id=? ;");

// Vehículos

define("INTSERT_AUTO", "INSERT INTO auto(placa, marca, modelo, anio, color, kilometraje, id_cliente) VALUES (?,?,?,?,?,?,?);");
define("UPDATE_AUTO", "UPDATE auto SET placa=?, marca=?, modelo=?, anio=?, color=?, kilometraje=?, id_cliente=? WHERE id=? ;");

// Gestión de servicios TallerPro

define("INSERT_SERVICIO", "INSERT INTO servicio(id_cliente, id_auto, fecha, descripcion, costo, estado) VALUES (?,?,?,?,?,?);");
define("UPDATE_SERVICIO", "UPDATE servicio SET id_cliente=?, id_auto=?, fecha=?, descripcion=?, costo=?, estado=? WHERE id=? ;");

// Gestión de citas TallerPro

define("INSERT_CITA",
    "INSERT INTO cita
    (nombre, correo, telefono, servicio, mensaje, fecha_cita, hora_cita)
    VALUES (?,?,?,?,?,?,?);"
);

define("SELECT_CITAS",
    "SELECT * FROM cita
    ORDER BY fecha_cita ASC, hora_cita ASC;"
);

define("SELECT_CITA",
    "SELECT * FROM cita WHERE id_cita=?;"
);

define("UPDATE_CITA",
    "UPDATE cita SET fecha_cita=?, hora_cita=?, estado=?
    WHERE id_cita=?;"
);
?>
