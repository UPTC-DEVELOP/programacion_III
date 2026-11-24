<?php

/**
 * <b>Descripcion:</b> Clase que <br/>Gestiona los empleados de TallerPro
 * <b>Caso de Uso:</b> PANTHER- Business <br/>
 */
class Empleados extends Request
{

    const NAME_TABLE = "empleado";

    public static function init()
    {
        parent::$nameTable = self::NAME_TABLE;
        parent::$queryInsert = INSERT_EMPLEADO;
        parent::$queryUpdate = UPDATE_EMPLEADO;
    }

    public static function insertParameter($object, $statement)
    {
        $statement->bindParam(1, $object->nombre);
        $statement->bindParam(2, $object->cedula);
        $statement->bindParam(3, $object->cargo);
        $statement->bindParam(4, $object->telefono);
    }

    public static function updateParameter($object, $statement, $id)
    {
        self::insertParameter($object, $statement);
        $statement->bindParam(5, $id);
    }
}
