<?php

/**
 * <b>Descripcion:</b> Clase que <br/>Gestiona los administradores de TallerPro
 * <b>Caso de Uso:</b> PANTHER- Business <br/>
 */
class Administradores extends Request
{

    const NAME_TABLE = "administrador";

    public static function init()
    {
        parent::$nameTable = self::NAME_TABLE;
        parent::$queryInsert = INSERT_ADMINISTRADOR;
        parent::$queryUpdate = UPDATE_ADMINISTRADOR;
    }

    public static function insertParameter($object, $statement)
    {
        $statement->bindParam(1, $object->nombre);
        $statement->bindParam(2, $object->usuario);
        $statement->bindParam(3, $object->correo);
        $statement->bindParam(4, $object->rol);
    }

    public static function updateParameter($object, $statement, $id)
    {
        self::insertParameter($object, $statement);
        $statement->bindParam(5, $id);
    }
}
