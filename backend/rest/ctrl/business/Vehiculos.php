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
    }

    public function updateParameter(object $object, PDOStatement $statement, int|string $id): void
    {
    }
}
