<?php
declare(strict_types=1);

namespace panther\ctrl\business;

use panther\ctrl\core\commun\Request;
use panther\querys\business\InventarioQueries;
use PDOStatement;

class Inventario extends Request
{
    private const NAME_TABLE = 'inventario';

    public function __construct()
    {
        $this->nameTable = self::NAME_TABLE;
        $this->queryInsert = InventarioQueries::INSERT;
        $this->queryUpdate = InventarioQueries::UPDATE;
    }

    public function insertParameter(object $object, PDOStatement $statement): void
    {
    }

    public function updateParameter(object $object, PDOStatement $statement, int|string $id): void
    {
    }
}
