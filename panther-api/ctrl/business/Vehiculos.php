<?php

class Vehiculos extends Request {
    const NAME_TABLE = "vehiculo";

    public static function init()
    {
        parent::$nameTable = self::NAME_TABLE;
        parent::$queryInsert = INSERT_VEHICULO;
        parent::$queryUpdate = UPDATE_VEHICULO;
    }


    public static function insertParameter($object, $statement)
{
    $statement->bindParam(1, $object->placa);
    $statement->bindParam(2, $object->modelo);
    $statement->bindParam(3, $object->color);
    $statement->bindParam(4, $object->propietario_id);
    $statement->bindParam(5, $object->fecha_ingreso);
    $statement->bindParam(6, $object->hora_ingreso);
}

public static function updateParameter($object, $statement, $id)
{
    $statement->bindParam(1, $object->placa);
    $statement->bindParam(2, $object->modelo);
    $statement->bindParam(3, $object->color);
    $statement->bindParam(4, $object->propietario_id);
    $statement->bindParam(5, $object->fecha_ingreso);
    $statement->bindParam(6, $object->hora_ingreso);
    $statement->bindParam(7, $id);
}
 }
?>