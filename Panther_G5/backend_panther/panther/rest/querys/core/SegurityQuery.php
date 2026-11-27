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
define("UPDATE_USER", "UPDATE j4user SET  password = ?, keyAPI = ?, roles = ? WHERE id=? ;");
define("SELECT_USER", "SELECT password,user,keyAPI,roles FROM j4user WHERE user like ?");
define("VERIFY_KEYAPI", "SELECT COUNT(user) FROM j4user WHERE keyAPI=?");

define("INTSERT_ROL", "INSERT INTO j4rol(name, description) VALUES (?,?);");
define("UPDATE_ROL", "UPDATE j4rol SET name=?, description =? WHERE id=? ;");

?>
