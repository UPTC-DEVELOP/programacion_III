<?php

/**
 * <b>Descripcion:</b> Controlador REST del recurso ordenes
 * <b>Caso de Uso:</b> PANTHER-Business / Taller Mecánico <br/>
 */
class Ordenes extends Request
{
    const NAME_TABLE = "ordenes";

    public static function init()
    {
        parent::$nameTable = self::NAME_TABLE;
        parent::$queryInsert = INSERT_ORDEN;
        parent::$queryUpdate = UPDATE_ORDEN;
    }

    public static function insertParameter($object, $statement)
    {
        self::bindOrdenParams($object, $statement, false);
    }

    public static function updateParameter($object, $statement, $id)
    {
        self::bindOrdenParams($object, $statement, true, $id);
    }

    /**
     * Eliminación física: la tabla ordenes no tiene dateDelete del soft-delete genérico.
     */
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

    /**
     * Serializa repuestos (array u string) a LONGTEXT JSON y enlaza parámetros.
     */
    private static function bindOrdenParams($object, $statement, $isUpdate, $id = null)
    {
        $repuestosFuente = isset($object->repuestos)
            ? $object->repuestos
            : (isset($object->repuestos_json) ? $object->repuestos_json : array());

        $object->repuestos_json = is_string($repuestosFuente)
            ? $repuestosFuente
            : json_encode($repuestosFuente, JSON_UNESCAPED_UNICODE);

        if (!isset($object->cliente_email)) {
            $object->cliente_email = null;
        }
        if (!isset($object->valor_hora) || $object->valor_hora === '') {
            $object->valor_hora = 35000;
        }
        if (!isset($object->utilidad_estimada) || $object->utilidad_estimada === '') {
            $object->utilidad_estimada = 0;
        }
        if (!isset($object->subtotal) || $object->subtotal === '') {
            $object->subtotal = 0;
        }
        if (!isset($object->iva) || $object->iva === '') {
            $object->iva = 0;
        }
        if (!isset($object->total) || $object->total === '') {
            $object->total = 0;
        }
        if (!isset($object->estado) || $object->estado === '') {
            $object->estado = 'ABIERTA';
        }

        $statement->bindParam(1, $object->numero_orden);
        $statement->bindParam(2, $object->cliente_documento);
        $statement->bindParam(3, $object->cliente_nombre);
        $statement->bindParam(4, $object->cliente_telefono);
        $statement->bindParam(5, $object->cliente_direccion);
        $statement->bindParam(6, $object->cliente_email);
        $statement->bindParam(7, $object->vehiculo_placa);
        $statement->bindParam(8, $object->vehiculo_modelo);
        $statement->bindParam(9, $object->vehiculo_color);
        $statement->bindParam(10, $object->fecha_ingreso);
        $statement->bindParam(11, $object->empleado_documento);
        $statement->bindParam(12, $object->empleado_nombre);
        $statement->bindParam(13, $object->horas_empleadas);
        $statement->bindParam(14, $object->valor_hora);
        $statement->bindParam(15, $object->utilidad_estimada);
        $statement->bindParam(16, $object->repuestos_json);
        $statement->bindParam(17, $object->subtotal);
        $statement->bindParam(18, $object->iva);
        $statement->bindParam(19, $object->total);
        $statement->bindParam(20, $object->estado);

        if ($isUpdate) {
            $statement->bindParam(21, $id);
        }
    }
}
?>
