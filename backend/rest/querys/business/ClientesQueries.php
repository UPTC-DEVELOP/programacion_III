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
}