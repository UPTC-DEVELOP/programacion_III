<?php

/**
 * <b>Descripcion:</b> Clase que <br/>Gestiona los roles de la aplicación
 * <b>Caso de Uso:</b> PANTHER-Seguridad <br/>
 *
 * @author Josué Nicolás Pinzón Villamil <a href = "mailto:jpinzon@j4sysol.com">jpinzon@j4sysol.com</a>
 */
class Roles extends Request
{

    /**
     * Datos de la tabla "roles"
     * 
     * @var string
     */
    const NAME_TABLE = "j4rol";

    public static function init()
    {
        parent::$nameTable = self::NAME_TABLE;
        parent::$queryInsert = INTSERT_ROL;
        parent::$queryUpdate = UPDATE_ROL;
    }

    /**
     * {@inheritDoc}
     * @see Request::updateParameter()
     */
    public static function updateParameter($object, $statement, $id)
    {
        $statement->bindParam(1, $object->name);
        $statement->bindParam(2, $object->description);
        $statement->bindParam(3, $id);
    }

    /**
     * {@inheritDoc}
     * @see Request::insertParameter()
     */
    public static function insertParameter($object, $statement)
    {
        $statement->bindParam(1, $object->name);
        $statement->bindParam(2, $object->description);
    }
}
?>

