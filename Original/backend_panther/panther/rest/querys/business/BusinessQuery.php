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
//define("INTSERT_PERSON", "INSERT INTO person(name, lastName, phone) VALUES (?,?,?);");
//define("UPDATE_PERSON", "UPDATE person SET name=?, lastName =? , phone=? WHERE id=? ;");
define("INTSERT_PERSON", "INSERT INTO person(name, lastName, phone, documentTypeId) VALUES (?,?,?,?);");
define("UPDATE_PERSON", "UPDATE person SET name=?, lastName =? , phone=?, documentTypeId=? WHERE id=? ;");

// Tipos de documento
define("INSERT_DOCUMENTTYPE", "INSERT INTO documenttype(longName, shortName) VALUES (?,?);");
define("UPDATE_DOCUMENTTYPE", "UPDATE documenttype SET longName=?, shortName=? WHERE id=? ;");


// ---------------------------------------------------------------
// TallerMax (fase 4)
// ---------------------------------------------------------------

// Clientes: documentTypeId, document, name, phone, email, address
define("INSERT_CUSTOMER", "INSERT INTO customer(documentTypeId, document, name, phone, email, address) VALUES (?,?,?,?,?,?);");
define("UPDATE_CUSTOMER", "UPDATE customer SET documentTypeId=?, document=?, name=?, phone=?, email=?, address=? WHERE id=? ;");

// Autos: plate, model, color, customerId, entryDate, entryTime
define("INSERT_VEHICLE", "INSERT INTO vehicle(plate, model, color, customerId, entryDate, entryTime) VALUES (?,?,?,?,?,?);");
define("UPDATE_VEHICLE", "UPDATE vehicle SET plate=?, model=?, color=?, customerId=?, entryDate=?, entryTime=? WHERE id=? ;");

// Empleados: document, firstName, lastName, position
define("INSERT_EMPLOYEE", "INSERT INTO employee(document, firstName, lastName, position) VALUES (?,?,?,?);");
define("UPDATE_EMPLOYEE", "UPDATE employee SET document=?, firstName=?, lastName=?, position=? WHERE id=? ;");

// Facturas emitidas (historial)
define("INSERT_INVOICE", "INSERT INTO invoice(customerId, customerName, customerDocument, issueDate, total, status, clarisaNumber, items, requestJson, responseJson, createdBy) VALUES (?,?,?,?,?,?,?,?,?,?,?);");
define("UPDATE_INVOICE", "UPDATE invoice SET customerId=?, customerName=?, customerDocument=?, issueDate=?, total=?, status=?, clarisaNumber=?, items=?, requestJson=?, responseJson=?, createdBy=? WHERE id=? ;");

?>
