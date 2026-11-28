<?php
declare(strict_types=1);
namespace panther\querys\business;

class FacturasQueries
{
    public const INSERT = "INSERT INTO facturas (id) VALUES (?);";
    public const UPDATE = "UPDATE facturas SET id = ? WHERE id = ?;";
}
