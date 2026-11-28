<?php
declare(strict_types=1);

namespace panther\querys\business;

class EmpleadosQueries
{
    public const INSERT = "
        INSERT INTO empleados (cedula, nombre, telefono, correo, cargo, salario)
        VALUES (?, ?, ?, ?, ?, ?);
    ";

    public const UPDATE = "
        UPDATE empleados
        SET cedula = ?, nombre = ?, telefono = ?, correo = ?, cargo = ?, salario = ?
        WHERE id = ?;
    ";
}
