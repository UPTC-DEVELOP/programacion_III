<?php

/**
 * <b>Descripcion:</b> Clase que <br/>Gestiona las personas
 * <b>Caso de Uso:</b> PANTHER- Business <br/>
 *
 * @author Josué Nicolás Pinzón Villamil <a href = "mailto:jpinzon@j4sysol.com">jpinzon@j4sysol.com</a>
 */
class Persons extends Request
{
    const NAME_TABLE = "person";

    public static function init()
    {
        parent::$nameTable = self::NAME_TABLE;
        parent::$queryInsert = INTSERT_PERSON;
        parent::$queryUpdate = UPDATE_PERSON;
    }

    public static function updateParameter($object, $statement, $id)
    {
        $statement->bindParam(1, $object->name);
        $statement->bindParam(2, $object->lastName);
        $statement->bindParam(3, $object->phone);
        $statement->bindParam(4, $object->documento);
        $statement->bindParam(5, $object->correo);
        $statement->bindParam(6, $object->direccion);
        $statement->bindParam(7, $object->tipo);
        $statement->bindParam(8, $id);
    }

    public static function insertParameter($object, $statement)
    {
        $statement->bindParam(1, $object->name);
        $statement->bindParam(2, $object->lastName);
        $statement->bindParam(3, $object->phone);
        $statement->bindParam(4, $object->documento);
        $statement->bindParam(5, $object->correo);
        $statement->bindParam(6, $object->direccion);
        $statement->bindParam(7, $object->tipo);
    }

    public static function delete($request)
    {
        return self::borrarPorId($request);
    }

    private static function borrarPorId($request)
    {
        UserAction::authenticator();
        try {
            if (empty($request[0])) {
                throw new ExcepcionApi(BAD_REQUEST, ST400, error_noParameter);
            }
            $query = 'DELETE FROM ' . self::NAME_TABLE . ' WHERE id=?';
            $statement = Connection::getInstance()->getConnection()->prepare($query);
            $statement->bindParam(1, $request[0], PDO::PARAM_INT);
            $statement->execute();
            if ($statement->rowCount() > 0) {
                return new ContentBody(OK, ST200, sucessful);
            }
            throw new ExcepcionApi(NO_CONTENT, ST204, error_notExist);
        } catch (ExcepcionApi $e) {
            throw $e;
        } catch (Exception $e) {
            throw new ExcepcionApi(INTERNAL_SERVER_ERROR, ST500, $e->getMessage());
        }
    }
}
