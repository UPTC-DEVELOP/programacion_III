<?php
/** Gestiona los empleados del taller */
class Empleados extends Request
{
    const NAME_TABLE = "empleado";

    public static function init()
    {
        parent::$nameTable = self::NAME_TABLE;
        parent::$queryInsert = INTSERT_EMPLEADO;
        parent::$queryUpdate = UPDATE_EMPLEADO;
    }

    public static function insertParameter($object, $statement)
    {
        $statement->bindParam(1, $object->nombre);
        $statement->bindParam(2, $object->apellido);
        $statement->bindParam(3, $object->documento);
        $statement->bindParam(4, $object->telefono);
        $statement->bindParam(5, $object->cargo);
        $statement->bindParam(6, $object->correo);
    }

    public static function updateParameter($object, $statement, $id)
    {
        self::insertParameter($object, $statement);
        $statement->bindParam(7, $id);
    }
}
