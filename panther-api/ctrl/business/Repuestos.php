<?php
class Repuestos extends Request{
    
    const NAME_TABLE = "repuesto";

    public static function init()
    {
        parent::$nameTable = self::NAME_TABLE;
        parent::$queryInsert = INSERT_REPUESTO;
        parent::$queryUpdate = UPDATE_REPUESTO;
    }

    public static function insertParameter($object, $statement)
    {
        $statement->bindParam(1, $object->referencia);
        $statement->bindParam(2, $object->descripcion);
        $statement->bindParam(3, $object->marca);
        $statement->bindParam(4, $object->precio_unitario);
        $statement->bindParam(5, $object->stock_actual);
        $statement->bindParam(6, $object->stock_minimo);
        $statement->bindParam(7, $object->stock_maximo);
       
    }

    public static function updateParameter($object, $statement, $id)
    {
        $statement->bindParam(1, $object->referencia);
        $statement->bindParam(2, $object->descripcion);
        $statement->bindParam(3, $object->marca);
        $statement->bindParam(4, $object->precio_unitario);
        $statement->bindParam(5, $object->stock_actual);
        $statement->bindParam(6, $object->stock_minimo);
        $statement->bindParam(7, $object->stock_maximo);
        $statement->bindParam(8, $id);
    }
 }
?>