<?php
/**
 * Gestiona los repuestos / productos del taller.
 * DELETE físico (tabla sin dateDelete).
 */
class Repuestos extends Request
{
    const NAME_TABLE = "repuesto";

    public static function init()
    {
        parent::$nameTable = self::NAME_TABLE;
        parent::$queryInsert = INSERT_REPUESTO;
        parent::$queryUpdate = UPDATE_REPUESTO;
    }

    public static function updateParameter($object, $statement, $id)
    {
        $statement->bindParam(1, $object->referencia);
        $statement->bindParam(2, $object->nombre);
        $statement->bindParam(3, $object->marca);
        $statement->bindParam(4, $object->precio_unitario);
        $statement->bindParam(5, $object->stock);
        $statement->bindParam(6, $object->id_proveedor);
        $statement->bindParam(7, $id);
    }

    public static function insertParameter($object, $statement)
    {
        $statement->bindParam(1, $object->referencia);
        $statement->bindParam(2, $object->nombre);
        $statement->bindParam(3, $object->marca);
        $statement->bindParam(4, $object->precio_unitario);
        $statement->bindParam(5, $object->stock);
        $statement->bindParam(6, $object->id_proveedor);
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
