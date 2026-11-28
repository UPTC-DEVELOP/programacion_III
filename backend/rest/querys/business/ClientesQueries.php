<?php
declare(strict_types=1);
namespace panther\querys\business;

class ClientesQueries
{
    public const INSERT = "INSERT INTO clientes (id) VALUES (?);";
    public const UPDATE = "UPDATE clientes SET id = ? WHERE id = ?;";
}
