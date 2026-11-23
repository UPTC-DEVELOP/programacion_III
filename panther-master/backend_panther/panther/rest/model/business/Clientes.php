<?php
/** Gestiona los clientes del taller */
class Clientes extends Request
{
    const NAME_TABLE = "cliente";

    public static function init()
    {
        parent::$nameTable = self::NAME_TABLE;
        parent::$queryInsert = INTSERT_CLIENTE;
        parent::$queryUpdate = UPDATE_CLIENTE;
    }

    public static function insertParameter($object, $statement)
    {
        $statement->bindParam(1, $object->nombre);
        $statement->bindParam(2, $object->apellido);
        $statement->bindParam(3, $object->documento);
        $statement->bindParam(4, $object->telefono);
        $statement->bindParam(5, $object->correo);
        $statement->bindParam(6, $object->direccion);
    }

    public static function updateParameter($object, $statement, $id)
    {
        self::insertParameter($object, $statement);
        $statement->bindParam(7, $id);
    }
}
