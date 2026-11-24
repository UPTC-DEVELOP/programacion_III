<?php

class factura extends request
{
    

    const NAME_TABLE = "factura";
     public static function init()
    {
        parent::$nameTable = self::NAME_TABLE;
        parent::$queryInsert = INTSERT_FACTURA;
        parent::$queryUpdate = UPDATE_FACTURA;
    }

    public static function insertParameter($object, $statement)
    {
        $statement->bindParam(1, $object->numero);
        $statement->bindParam(2, $object->cliente);
        $statement->bindParam(3, $object->fecha);
        $statement->bindParam(4, $object->total);
    }

    public static function updateParameter($object, $statement, $id)
    {
        $statement->bindParam(1, $object->numero);
        $statement->bindParam(2, $object->cliente);
        $statement->bindParam(3, $object->fecha);
        $statement->bindParam(4, $object->total);
        $statement->bindParam(5, $id);
    }

}
