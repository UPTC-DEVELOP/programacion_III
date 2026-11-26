<?php
/**
 * Gestiona los empleados del taller.
 * Integrado desde Panther/Kevin + DELETE físico (sin dateDelete).
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

    public static function delete($request)
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
?>
