<?php

class Proveedores extends Request
{
    const NAME_TABLE = "proveedor";

    public static function init()
    {
        parent::$nameTable = self::NAME_TABLE;
        parent::$queryInsert = INSERT_PROVEEDOR;
        parent::$queryUpdate = UPDATE_PROVEEDOR;
    }

    public static function updateParameter($object, $statement, $id)
    {
        $statement->bindParam(1, $object->nit);
        $statement->bindParam(2, $object->razon_social);
        $statement->bindParam(3, $object->contacto);
        $statement->bindParam(4, $object->telefono);
        $statement->bindParam(5, $object->correo);
        $statement->bindParam(6, $object->direccion);
        $statement->bindParam(7, $id);
    }

    public static function insertParameter($object, $statement)
    {
        $statement->bindParam(1, $object->nit);
        $statement->bindParam(2, $object->razon_social);
        $statement->bindParam(3, $object->contacto);
        $statement->bindParam(4, $object->telefono);
        $statement->bindParam(5, $object->correo);
        $statement->bindParam(6, $object->direccion);
    }
}
?>