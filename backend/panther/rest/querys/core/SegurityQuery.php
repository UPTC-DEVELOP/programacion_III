<?php
/**
 * <b>Descripcion:</b> Clase que <br/> contiene las consultas de la aplicación
 * <b>Caso de Uso:</b> PANTHER-Seguridad <br/>
 *
 * @author Josué Nicolás Pinzón Villamil <a href = "mailto:jpinzon@j4sysol.com">jpinzon@j4sysol.com</a>
 */

/**
 * Constante de consultas base de datos
 */
define("INTSERT_USER", "INSERT INTO j4user(user,password,keyAPI,roles) VALUES(?,?,?,?);");
define("UPDATE_USER", "UPDATE j4user SET  password = ?, keyAPI = ?, roles = ?, sesionHasta = NULL WHERE id=? ;");
define("SELECT_USER", "SELECT u.id,u.user,u.password,u.roles,u.intentosFallidos,
 TIMESTAMPDIFF(SECOND,UTC_TIMESTAMP(),u.bloqueoHasta) AS espera
 FROM j4user u JOIN j4rol r ON r.id=u.roles
 LEFT JOIN cuenta_empleado c ON c.usuario_id=u.id
 LEFT JOIN empleado_taller e ON e.cedula=c.cedula
 WHERE u.user=? AND u.dateDelete IS NULL AND (
 (r.name='admin' AND c.usuario_id IS NULL) OR
 (e.estado='Activo' AND e.rol=CASE r.name WHEN 'admin' THEN 'Administrador'
 WHEN 'recepcion' THEN 'Recepción' WHEN 'mecanico' THEN 'Mecánico'
 WHEN 'almacenista' THEN 'Almacenista' WHEN 'jefe_taller' THEN 'Jefe de taller' END)) FOR UPDATE");
define("VERIFY_KEYAPI", "SELECT roles FROM j4user WHERE keyAPI=? AND sesionHasta > UTC_TIMESTAMP() AND dateDelete IS NULL");

define("INTSERT_ROL", "INSERT INTO j4rol(name, description) VALUES (?,?);");
define("UPDATE_ROL", "UPDATE j4rol SET name=?, description =? WHERE id=? ;");

?>
