<?php

/**
 * Descripcion: Guarda en la base de datos Panther cada factura que se emite contra Clarisa
 * (historial). El frontend envía la factura, la respuesta de Clarisa y el estado.
 * Caso de Uso: PANTHER - Business (TallerMax)
 */
class Invoices extends Request
{
    const NAME_TABLE = "invoice";

    public static function init()
    {
        parent::$nameTable = self::NAME_TABLE;
        parent::$queryInsert = INSERT_INVOICE;
        parent::$queryUpdate = UPDATE_INVOICE;
    }

    protected static function validate($o, $id = null)
    {
        $status = self::field($o, 'status');
        if (!in_array($status, array('EMITIDA', 'ERROR', 'PENDIENTE'), true)) {
            self::invalid("El estado de la factura debe ser EMITIDA, ERROR o PENDIENTE.");
        }
        $name = self::field($o, 'customerName');
        $doc = self::field($o, 'customerDocument');
        if (!$name || !$doc) {
            self::invalid("La factura requiere nombre y documento del cliente.");
        }
        $total = self::field($o, 'total');
        if (!is_numeric($total) || $total < 0) {
            self::invalid("El total de la factura no es válido.");
        }
        $date = self::field($o, 'issueDate');
        $d = $date ? DateTime::createFromFormat('Y-m-d', $date) : false;
        if (!$d || $d->format('Y-m-d') !== $date) {
            self::invalid("La fecha de emisión no es válida (AAAA-MM-DD).");
        }
    }

    /** Convierte arreglos/objetos (items, request, response) a texto JSON */
    private static function asText($o, $name)
    {
        $v = self::field($o, $name);
        if ($v === null) {
            return null;
        }
        return is_string($v) ? $v : json_encode($v, JSON_UNESCAPED_UNICODE);
    }

    private static function bindAll($o, $st)
    {
        $cid = self::field($o, 'customerId');
        $st->bindValue(1, $cid ? (int) $cid : null, $cid ? PDO::PARAM_INT : PDO::PARAM_NULL);
        $st->bindValue(2, self::field($o, 'customerName'));
        $st->bindValue(3, self::field($o, 'customerDocument'));
        $st->bindValue(4, self::field($o, 'issueDate'));
        $st->bindValue(5, number_format((float) self::field($o, 'total'), 2, '.', ''));
        $st->bindValue(6, self::field($o, 'status'));
        $st->bindValue(7, self::field($o, 'clarisaNumber'));
        $st->bindValue(8, self::asText($o, 'items'));
        $st->bindValue(9, self::asText($o, 'requestJson'));
        $st->bindValue(10, self::asText($o, 'responseJson'));
        $st->bindValue(11, self::field($o, 'createdBy'));
    }

    public static function insertParameter($object, $statement)
    {
        self::bindAll($object, $statement);
    }

    public static function updateParameter($object, $statement, $id)
    {
        self::bindAll($object, $statement);
        $statement->bindValue(12, $id, PDO::PARAM_INT);
    }
}
?>
