<?php
/**
 * Gestiona los vehículos del taller.
 * Integrado desde Panther/Kevin (developer Kevin) dentro de panther/rest.
 */
class Vehiculos extends Request
{
    const NAME_TABLE = "vehiculo";

    public static function init()
    {
        parent::$nameTable = self::NAME_TABLE;
        parent::$queryInsert = INSERT_VEHICULO;
        parent::$queryUpdate = UPDATE_VEHICULO;
    }

    public static function updateParameter($object, $statement, $id)
    {
        $statement->bindParam(1, $object->placa);
        $statement->bindParam(2, $object->marca);
        $statement->bindParam(3, $object->modelo);
        $statement->bindParam(4, $object->anio);
        $statement->bindParam(5, $object->color);
        $statement->bindParam(6, $object->propietario);
        $statement->bindParam(7, $id);
    }

    public static function insertParameter($object, $statement)
    {
        $statement->bindParam(1, $object->placa);
        $statement->bindParam(2, $object->marca);
        $statement->bindParam(3, $object->modelo);
        $statement->bindParam(4, $object->anio);
        $statement->bindParam(5, $object->color);
        $statement->bindParam(6, $object->propietario);
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
