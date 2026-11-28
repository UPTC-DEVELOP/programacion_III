<?php
declare(strict_types=1);
namespace panther\querys\business;

class OrdenesQueries
{
    public const INSERT = "INSERT INTO ordenes (id) VALUES (?);";
    public const UPDATE = "UPDATE ordenes SET id = ? WHERE id = ?;";
}
