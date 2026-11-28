
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
        $statement->bindValue(1, $object->nit);
        $statement->bindValue(2, $object->nombre);
        $statement->bindValue(3, $object->telefono);
        $statement->bindValue(4, $object->correo);
        $statement->bindValue(5, $object->direccion);
    }

    public function updateParameter(object $object, PDOStatement $statement, int|string $id): void
    {
        $statement->bindValue(1, $object->nit);
        $statement->bindValue(2, $object->nombre);
        $statement->bindValue(3, $object->telefono);
        $statement->bindValue(4, $object->correo);
        $statement->bindValue(5, $object->direccion);
        $statement->bindValue(6, $id);
    }
}