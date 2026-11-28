<?php
declare(strict_types=1);

namespace panther\querys\business;

class ProveedoresQueries
{
    public const INSERT = "
        INSERT INTO proveedores (nit, nombre, telefono, correo, direccion)
        VALUES (?, ?, ?, ?, ?);
    ";

    public const UPDATE = "
        UPDATE proveedores
        SET nit = ?, nombre = ?, telefono = ?, correo = ?, direccion = ?
        WHERE id = ?;
    ";
}
