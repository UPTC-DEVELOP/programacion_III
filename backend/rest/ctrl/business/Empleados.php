<?php

declare(strict_types=1);

namespace panther\ctrl\business;

use panther\ctrl\core\commun\Request;
use panther\querys\business\EmpleadosQueries;
use PDOStatement;

class Empleados extends Request
{
    private const NAME_TABLE = 'empleados';

    public function __construct()
    {
        $this->nameTable = self::NAME_TABLE;
        $this->queryInsert = EmpleadosQueries::INSERT;
        $this->queryUpdate = EmpleadosQueries::UPDATE;
    }

    public function insertParameter(object $object, PDOStatement $statement): void
    {
        $statement->bindValue(1, $object->cedula);
        $statement->bindValue(2, $object->nombre);
        $statement->bindValue(3, $object->telefono);
        $statement->bindValue(4, $object->correo);
        $statement->bindValue(5, $object->cargo);
        $statement->bindValue(6, $object->salario);
    }

    public function updateParameter(object $object, PDOStatement $statement, int|string $id): void
    {
        $statement->bindValue(1, $object->cedula);
        $statement->bindValue(2, $object->nombre);
        $statement->bindValue(3, $object->telefono);
        $statement->bindValue(4, $object->correo);
        $statement->bindValue(5, $object->cargo);
        $statement->bindValue(6, $object->salario);
        $statement->bindValue(7, $id);
    }
}
