<?php

declare(strict_types=1);

namespace panther\ctrl\business;

use panther\ctrl\core\commun\Request;
use panther\querys\business\VehiculosQueries;
use PDOStatement;

class Vehiculos extends Request
{
    private const NAME_TABLE = 'vehiculos';

    public function __construct()
    {
        $this->nameTable = self::NAME_TABLE;
        $this->queryInsert = VehiculosQueries::INSERT;
        $this->queryUpdate = VehiculosQueries::UPDATE;
    }

    public function insertParameter(object $object, PDOStatement $statement): void
    {
        $statement->bindValue(1, $object->placa);
        $statement->bindValue(2, $object->marca);
        $statement->bindValue(3, $object->modelo);
        $statement->bindValue(4, $object->color);
        $statement->bindValue(5, $object->tipo);
        $statement->bindValue(6, $object->cliente_id);
    }

    public function updateParameter(object $object, PDOStatement $statement, int|string $id): void
    {
        $statement->bindValue(1, $object->placa);
        $statement->bindValue(2, $object->marca);
        $statement->bindValue(3, $object->modelo);
        $statement->bindValue(4, $object->color);
        $statement->bindValue(5, $object->tipo);
        $statement->bindValue(6, $object->cliente_id);
        $statement->bindValue(7, $id);
    }
}
