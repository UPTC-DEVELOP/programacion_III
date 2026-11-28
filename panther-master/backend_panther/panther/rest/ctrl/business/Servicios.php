<?php
/** Gestiona los servicios del taller */
class Servicios extends Request
{
    const NAME_TABLE = "servicio";

    public static function init()
    {
        parent::$nameTable = self::NAME_TABLE;
        parent::$queryInsert = INSERT_SERVICIO;
        parent::$queryUpdate = UPDATE_SERVICIO;
    }

    public static function insertParameter($object, $statement)
    {
        $statement->bindParam(1, $object->id_cliente);
        $statement->bindParam(2, $object->id_auto);
        $statement->bindParam(3, $object->fecha);
        $statement->bindParam(4, $object->descripcion);
        $statement->bindParam(5, $object->costo);
        $statement->bindParam(6, $object->estado);
    }

    public static function updateParameter($object, $statement, $id)
    {
        self::insertParameter($object, $statement);
        $statement->bindParam(7, $id);
    }
}