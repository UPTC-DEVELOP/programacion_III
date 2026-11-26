<?php
class Empleados extends Request
{
    const NAME_TABLE = "empleado";
    
    public static function init()
    {
        parent::$nameTable = self::NAME_TABLE;
        parent::$queryInsert = INSERT_EMPLEADO;
        parent::$queryUpdate = UPDATE_EMPLEADO;
    }

    public static function updateParameter($object, $statement, $id)
    {
        $statement->bindParam(1, $object->nombres);
        $statement->bindParam(2, $object->apellidos);
        $statement->bindParam(3, $object->documento);
        $statement->bindParam(4, $object->rol);
        $statement->bindParam(5, $object->telefono);
        $statement->bindParam(6, $object->correo);
        $statement->bindParam(7, $id);
    }

    public static function insertParameter($object, $statement)
    {
        $statement->bindParam(1, $object->nombres);
        $statement->bindParam(2, $object->apellidos);
        $statement->bindParam(3, $object->documento);
        $statement->bindParam(4, $object->rol);
        $statement->bindParam(5, $object->telefono);
        $statement->bindParam(6, $object->correo);
    }
}
?>