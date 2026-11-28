<?php
declare(strict_types=1);
namespace panther\querys\business;

class InventarioQueries
{
    public const INSERT = "INSERT INTO inventario (id) VALUES (?);";
    public const UPDATE = "UPDATE inventario SET id = ? WHERE id = ?;";
}
