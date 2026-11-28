<?php
declare(strict_types=1);

namespace panther\querys\business;

class ClientesQueries
{
    public const INSERT =
        "INSERT INTO clientes (cedula, nombre, correo, telefono, direccion) VALUES (?, ?, ?, ?, ?);";

    public const UPDATE =
        "UPDATE clientes SET cedula = ?, nombre = ?, correo = ?, telefono = ?, direccion = ? WHERE id = ? AND dateDelete IS NULL;";

    public const SELECT_BY_ID =
        "SELECT id, cedula, nombre, correo, telefono, direccion FROM clientes WHERE id = ? AND dateDelete IS NULL;";

    public const SELECT_BY_CEDULA =
        "SELECT id, cedula, nombre, correo, telefono, direccion FROM clientes WHERE cedula = ? AND dateDelete IS NULL;";

    public const SELECT_BY_CEDULA_ALL =
        "SELECT id, cedula, nombre, correo, telefono, direccion, dateDelete FROM clientes WHERE cedula = ?;";

    public const REACTIVATE =
        "UPDATE clientes SET nombre = ?, correo = ?, telefono = ?, direccion = ?, dateDelete = NULL WHERE id = ?;";
}