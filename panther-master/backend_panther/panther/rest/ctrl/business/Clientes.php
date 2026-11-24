<?php

/**
 * <b>Descripcion:</b> Clase que <br/>Gestiona los clientes de TallerPro
 * <b>Caso de Uso:</b> PANTHER- Business <br/>
 */
class Clientes extends Request
{

    const NAME_TABLE = "cliente";

    public static function init()
    {
        parent::$nameTable = self::NAME_TABLE;
        parent::$queryInsert = INSERT_CLIENTE;
        parent::$queryUpdate = UPDATE_CLIENTE;
    }

    public static function insertParameter($object, $statement)
    {
        $statement->bindParam(1, $object->nombre);
        $statement->bindParam(2, $object->cedula);
        $statement->bindParam(3, $object->email);
        $statement->bindParam(4, $object->telefono);
        $statement->bindParam(5, $object->empresa);
        $statement->bindParam(6, $object->estado);
    }

    public static function updateParameter($object, $statement, $id)
    {
        self::insertParameter($object, $statement);
        $statement->bindParam(7, $id);
    }
}
