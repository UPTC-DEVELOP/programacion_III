<?php

declare(strict_types=1);

namespace panther\querys\business;

class VehiculosQueries
{
    public const INSERT = "
        INSERT INTO vehiculos (placa, marca, modelo, color, tipo, cliente_id)
        VALUES (?, ?, ?, ?, ?, ?);
    ";

    public const UPDATE = "
        UPDATE vehiculos
        SET placa = ?, marca = ?, modelo = ?, color = ?, tipo = ?, cliente_id = ?
        WHERE id = ?;
    ";
}
