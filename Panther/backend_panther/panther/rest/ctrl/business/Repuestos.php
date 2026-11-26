<?php

class Repuestos extends Request
{
    const NAME_TABLE = "repuesto";

    public static function init()
    {
        parent::$nameTable = self::NAME_TABLE;
        parent::$queryInsert = INSERT_REPUESTO;
        parent::$queryUpdate = UPDATE_REPUESTO;
    }

    public static function updateParameter($object, $statement, $id)
    {
        $statement->bindParam(1, $object->referencia);
        $statement->bindParam(2, $object->nombre);
        $statement->bindParam(3, $object->marca);
        $statement->bindParam(4, $object->precio_unitario);
        $statement->bindParam(5, $object->stock);
        $statement->bindParam(6, $object->id_proveedor);
        $statement->bindParam(7, $id);
    }

    public static function insertParameter($object, $statement)
    {
        $statement->bindParam(1, $object->referencia);
        $statement->bindParam(2, $object->nombre);
        $statement->bindParam(3, $object->marca);
        $statement->bindParam(4, $object->precio_unitario);
        $statement->bindParam(5, $object->stock);
        $statement->bindParam(6, $object->id_proveedor);
    }
}
?>