<?php
/**
 * Clase que representa las facturas
 */
class Facturas extends Request{
    // ...
    /**
     * @var string
     */
    const NAME_TABLE = "factura";

    public static function init()
    {
        parent::$nameTable = self::NAME_TABLE;
        parent::$queryInsert = INTSERT_FACTURA;
        parent::$queryUpdate = UPDATE_FACTURA;
    }
    public static function updateParameter($object, $statement, $id)
    {
        $statement->bindParam(1, $object->fecha);
        $statement->bindParam(2, $object->total);
        $statement->bindParam(3, $id);
    }
public static function insertParameter($object, $statement)
    {
        $statement->bindParam(1, $object->fecha);
        $statement->bindParam(2, $object->total);
     }  }