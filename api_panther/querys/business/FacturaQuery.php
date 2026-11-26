<?php
/**
 * <b>Descripcion:</b> Clase que <br/> contiene las consultas para facturas
 * <b>Caso de Uso:</b> PANTHER-Business <br/>
 */

// Definimos la consulta SQL (usando el patrón de signos de interrogación como en Person)
define("INSERT_FACTURA", "INSERT INTO facturas(cufe, nit, consecutivo, total, cliente_nombre, estado_dian) VALUES (?,?,?,?,?,?);");
?>