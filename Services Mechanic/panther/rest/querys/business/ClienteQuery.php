<?php

/**
 * Consultas del recurso clients.
 * El identificador numerico de la base se expone siempre con cuatro caracteres.
 */
define("CLIENT_SELECT_FIELDS", "LPAD(CAST(id_cliente AS CHAR), 4, '0') AS idCliente, cedula, nombres, apellidos, telefono, direccion");
define("SELECT_CLIENTS", "SELECT " . CLIENT_SELECT_FIELDS . " FROM clientes ORDER BY id_cliente ASC");
define("SEARCH_CLIENTS", "SELECT " . CLIENT_SELECT_FIELDS . " FROM clientes WHERE LOCATE(?, cedula) > 0 OR LOCATE(?, nombres) > 0 OR LOCATE(?, apellidos) > 0 ORDER BY id_cliente ASC");
define("SELECT_CLIENT_BY_ID", "SELECT " . CLIENT_SELECT_FIELDS . " FROM clientes WHERE id_cliente = ?");
define("COUNT_CLIENT_BY_CEDULA", "SELECT COUNT(*) FROM clientes WHERE cedula = ?");
define("COUNT_OTHER_CLIENT_BY_CEDULA", "SELECT COUNT(*) FROM clientes WHERE cedula = ? AND id_cliente <> ?");
define("INSERT_CLIENT", "INSERT INTO clientes (cedula, nombres, apellidos, telefono, direccion) VALUES (?, ?, ?, ?, ?)");
define("UPDATE_CLIENT", "UPDATE clientes SET cedula = ?, nombres = ?, apellidos = ?, telefono = ?, direccion = ? WHERE id_cliente = ?");
