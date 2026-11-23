<?php

/**
 * <b>Descripcion:</b> Clase que <br/>Gestiona los usuarios de la aplicación
 * <b>Caso de Uso:</b> PANTHER-Seguridad <br/>
 *
 * @author Josué Nicolás Pinzón Villamil <a href = "mailto:jpinzon@j4sysol.com">jpinzon@j4sysol.com</a>
 */
class Users extends Request
{

    /**
     * Datos de la tabla "usuario"
     *
     * @var string
     */
    const NAME_TABLE = "j4user";

    /**
     *
     * {@inheritdoc}
     * @see Request::init()
     */
    public static function init()
    {
        parent::$nameTable = self::NAME_TABLE;
        parent::$queryInsert = INTSERT_USER;
        parent::$queryUpdate = UPDATE_USER;
    }

    /** No se exponen el hash de la contraseña ni la keyAPI de los demas usuarios */
    protected static function baseSelect()
    {
        return "SELECT id, user, roles, dateDelete FROM " . self::NAME_TABLE;
    }

    /**
     *
     * {@inheritdoc}
     * @see Request::insertParameter()
     */
    public static function insertParameter($object, $statement)
    {
        $encryptPassword = UserAction::encrytPassword($object->password);
        $keyApi = UserAction::getKeyAPI();
        
        $statement->bindParam(1, $object->user);
        $statement->bindParam(2, $encryptPassword);
        $statement->bindParam(3, $keyApi);
        $statement->bindParam(4, $object->roles);
    }

    /**
     *
     * {@inheritdoc}
     * @see Request::updateParameter()
     */
    public static function updateParameter($object, $statement, $id)
    {
        $encryptPassword = UserAction::encrytPassword($object->password);
        $keyApi = UserAction::getKeyAPI();
        $statement->bindParam(1, $encryptPassword);
        $statement->bindParam(2, $keyApi);
        $statement->bindParam(3, $object->roles);
        $statement->bindParam(4, $id);
    }
}
?>