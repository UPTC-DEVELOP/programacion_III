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
    }

    public function updateParameter(object $object, PDOStatement $statement, int|string $id): void
    {
    }
}
