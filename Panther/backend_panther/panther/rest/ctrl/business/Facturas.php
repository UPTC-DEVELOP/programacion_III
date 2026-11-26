<?php

/**
 * <b>Descripcion:</b> Controlador REST del recurso facturas
 * <b>Caso de Uso:</b> PANTHER-Business / Taller Mecánico <br/>
 *
 * Flujo: 1° POST guarda en Panther (estado PENDIENTE_ENVIO) →
 *        2° PUT actualiza cufe / estado_dian / respuesta_clarisa tras Clarisa.
 */
class Facturas extends Request
{
    const NAME_TABLE = "facturas";

    public static function init()
    {
        parent::$nameTable = self::NAME_TABLE;
        parent::$queryInsert = INSERT_FACTURA;
        parent::$queryUpdate = UPDATE_FACTURA;
    }

    public static function insertParameter($object, $statement)
    {
        self::bindFacturaParams($object, $statement, false);
    }

    public static function updateParameter($object, $statement, $id)
    {
        self::bindFacturaParams($object, $statement, true, $id);
    }

    /**
     * Eliminación física: la tabla facturas no tiene la columna dateDelete.
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
     * Serializa items / payloads Clarisa y enlaza todos los campos del formulario + DIAN.
     */
    private static function bindFacturaParams($object, $statement, $isUpdate, $id = null)
    {
        $itemsFuente = isset($object->items)
            ? $object->items
            : (isset($object->items_json) ? $object->items_json : array());

        $object->items_json = is_string($itemsFuente)
            ? $itemsFuente
            : json_encode($itemsFuente, JSON_UNESCAPED_UNICODE);

        if (isset($object->payload_clarisa) && !is_string($object->payload_clarisa)) {
            $object->payload_clarisa = json_encode($object->payload_clarisa, JSON_UNESCAPED_UNICODE);
        }
        if (isset($object->respuesta_clarisa) && !is_string($object->respuesta_clarisa)) {
            $object->respuesta_clarisa = json_encode($object->respuesta_clarisa, JSON_UNESCAPED_UNICODE);
        }

        if (!isset($object->orden_id) || $object->orden_id === '') {
            $object->orden_id = null;
        }
        if (!isset($object->prefijo) || $object->prefijo === '') {
            $object->prefijo = 'SETP';
        }
        if (!isset($object->resp_fiscales) || $object->resp_fiscales === '') {
            $object->resp_fiscales = 'NOA';
        }
        if (!isset($object->resp_tributarias) || $object->resp_tributarias === '') {
            $object->resp_tributarias = 'NOA';
        }
        if (!isset($object->descuentos) || $object->descuentos === '') {
            $object->descuentos = 0;
        }
        if (!isset($object->cufe)) {
            $object->cufe = '';
        }
        if (!isset($object->estado_dian) || $object->estado_dian === '') {
            $object->estado_dian = 'PENDIENTE_ENVIO';
        }
        if (!isset($object->payload_clarisa)) {
            $object->payload_clarisa = null;
        }
        if (!isset($object->respuesta_clarisa)) {
            $object->respuesta_clarisa = null;
        }

        $statement->bindParam(1, $object->orden_id);
        $statement->bindParam(2, $object->nit);
        $statement->bindParam(3, $object->numero_resolucion);
        $statement->bindParam(4, $object->prefijo);
        $statement->bindParam(5, $object->consecutivo);
        $statement->bindParam(6, $object->fecha_vencimiento);
        $statement->bindParam(7, $object->forma_pago);
        $statement->bindParam(8, $object->medio_pago);
        $statement->bindParam(9, $object->cliente_tipo_id);
        $statement->bindParam(10, $object->cliente_naturaleza);
        $statement->bindParam(11, $object->cliente_documento);
        $statement->bindParam(12, $object->cliente_nombre);
        $statement->bindParam(13, $object->cliente_email);
        $statement->bindParam(14, $object->cliente_telefono);
        $statement->bindParam(15, $object->cliente_direccion);
        $statement->bindParam(16, $object->cliente_municipio);
        $statement->bindParam(17, $object->resp_fiscales);
        $statement->bindParam(18, $object->resp_tributarias);
        $statement->bindParam(19, $object->vehiculo_placa);
        $statement->bindParam(20, $object->vehiculo_modelo);
        $statement->bindParam(21, $object->vehiculo_color);
        $statement->bindParam(22, $object->vehiculo_ingreso);
        $statement->bindParam(23, $object->mecanico);
        $statement->bindParam(24, $object->horas);
        $statement->bindParam(25, $object->valor_hora);
        $statement->bindParam(26, $object->utilidad);
        $statement->bindParam(27, $object->items_json);
        $statement->bindParam(28, $object->subtotal);
        $statement->bindParam(29, $object->descuentos);
        $statement->bindParam(30, $object->iva);
        $statement->bindParam(31, $object->total);
        $statement->bindParam(32, $object->cufe);
        $statement->bindParam(33, $object->estado_dian);
        $statement->bindParam(34, $object->payload_clarisa);
        $statement->bindParam(35, $object->respuesta_clarisa);

        if ($isUpdate) {
            $statement->bindParam(36, $id);
        }
    }
}
?>
