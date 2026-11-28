<?php
declare(strict_types=1);

namespace panther\ctrl\business;

use panther\ctrl\core\commun\Request;
use panther\querys\business\FacturasQueries;
use PDOStatement;

class Facturas extends Request
{
    private const NAME_TABLE = 'facturas';

    public function __construct()
    {
        $this->nameTable = self::NAME_TABLE;
        $this->queryInsert = FacturasQueries::INSERT;
        $this->queryUpdate = FacturasQueries::UPDATE;
    }

    public function insertParameter(object $object, PDOStatement $statement): void
    {
    }

    public function updateParameter(object $object, PDOStatement $statement, int|string $id): void
    {
    }
}
