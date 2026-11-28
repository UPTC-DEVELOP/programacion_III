<?php
declare(strict_types=1);

namespace panther\ctrl\business;

use panther\ctrl\core\commun\Request;
use panther\querys\business\ClientesQueries;
use PDOStatement;

class Clientes extends Request
{
    private const NAME_TABLE = 'clientes';

    public function __construct()
    {
        $this->nameTable = self::NAME_TABLE;
        $this->queryInsert = ClientesQueries::INSERT;
        $this->queryUpdate = ClientesQueries::UPDATE;
    }

    public function insertParameter(object $object, PDOStatement $statement): void
    {
    }

    public function updateParameter(object $object, PDOStatement $statement, int|string $id): void
    {
    }
}
