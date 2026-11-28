<?php
declare(strict_types=1);
namespace panther\querys\business;

class ProveedoresQueries
{
    public const INSERT = "INSERT INTO proveedores (id) VALUES (?);";
    public const UPDATE = "UPDATE proveedores SET id = ? WHERE id = ?;";
}
