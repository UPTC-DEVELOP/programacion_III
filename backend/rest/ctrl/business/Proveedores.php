<?php
declare(strict_types=1);

namespace panther\ctrl\business;

use panther\ctrl\core\commun\Request;
use panther\querys\business\ProveedoresQueries;
use PDOStatement;

class Proveedores extends Request
{
    private const NAME_TABLE = 'proveedores';

    public function __construct()
    {
        $this->nameTable = self::NAME_TABLE;
        $this->queryInsert = ProveedoresQueries::INSERT;
        $this->queryUpdate = ProveedoresQueries::UPDATE;
    }

    public function insertParameter(object $object, PDOStatement $statement): void
    {
    }

    public function updateParameter(object $object, PDOStatement $statement, int|string $id): void
    {
    }
}
