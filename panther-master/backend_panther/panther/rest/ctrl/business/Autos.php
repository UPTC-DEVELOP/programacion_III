<?php
/** Gestiona los autos del taller */
class Autos extends Request
{
    const NAME_TABLE = "auto";

    public static function init()
    {
        parent::$nameTable = self::NAME_TABLE;
        parent::$queryInsert = INTSERT_AUTO;
        parent::$queryUpdate = UPDATE_AUTO;
    }

    public static function insertParameter($object, $statement)
    {
        $statement->bindParam(1, $object->placa);
        $statement->bindParam(2, $object->marca);
        $statement->bindParam(3, $object->modelo);
        $statement->bindParam(4, $object->anio);
        $statement->bindParam(5, $object->color);
        $statement->bindParam(6, $object->kilometraje);
        $statement->bindParam(7, $object->id_cliente);
    }

    public static function updateParameter($object, $statement, $id)
    {
        self::insertParameter($object, $statement);
        $statement->bindParam(8, $id);
    }
}
