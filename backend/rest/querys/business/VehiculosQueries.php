<?php
declare(strict_types=1);
namespace panther\querys\business;

class VehiculosQueries
{
    public const INSERT = "INSERT INTO vehiculos (id) VALUES (?);";
    public const UPDATE = "UPDATE vehiculos SET id = ? WHERE id = ?;";
}
