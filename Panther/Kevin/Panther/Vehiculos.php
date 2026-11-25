<?php
/**
 * Clase que gestiona los Vehículos en Panther
 */
class Vehiculos extends Request
{
    const NAME_TABLE = "vehiculo";
    
    public static function init()
    {
        parent::$nameTable = self::NAME_TABLE;
        parent::$queryInsert = INSERT_VEHICULO;
        parent::$queryUpdate = UPDATE_VEHICULO;
    }

    public static function updateParameter($object, $statement, $id)
    {
        $statement->bindParam(1, $object->placa);
        $statement->bindParam(2, $object->marca);
        $statement->bindParam(3, $object->modelo);
        $statement->bindParam(4, $object->anio);
        $statement->bindParam(5, $object->color);
        $statement->bindParam(6, $object->propietario);
        $statement->bindParam(7, $id);
    }

    public static function insertParameter($object, $statement)
    {
        $statement->bindParam(1, $object->placa);
        $statement->bindParam(2, $object->marca);
        $statement->bindParam(3, $object->modelo);
        $statement->bindParam(4, $object->anio);
        $statement->bindParam(5, $object->color);
        $statement->bindParam(6, $object->propietario);
    }
}
?>