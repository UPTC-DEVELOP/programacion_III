<?php
declare(strict_types=1);
namespace panther\querys\business;

class EmpleadosQueries
{
    public const INSERT = "INSERT INTO empleados (id) VALUES (?);";
    public const UPDATE = "UPDATE empleados SET id = ? WHERE id = ?;";
}
