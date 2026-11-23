<?php

/**
 * Descripcion: Gestiona los autos (vehículos) del taller (CRUD).
 * Caso de Uso: PANTHER - Business (TallerMax)
 */
class Vehicles extends Request
{
    const NAME_TABLE = "vehicle";

    public static function init()
    {
        parent::$nameTable = self::NAME_TABLE;
        parent::$queryInsert = INSERT_VEHICLE;
        parent::$queryUpdate = UPDATE_VEHICLE;
    }

    protected static function baseSelect()
    {
        return "SELECT v.id, v.plate, v.model, v.color, v.customerId, c.document AS customerDocument, c.name AS customerName, "
            . "v.entryDate, v.entryTime, v.dateDelete FROM vehicle v LEFT JOIN customer c ON c.id = v.customerId";
    }

    protected static function prefix()
    {
        return "v.";
    }

    protected static function validate($o, $id = null)
    {
        $plate = strtoupper((string) self::field($o, 'plate'));
        $model = (string) self::field($o, 'model');
        $color = self::field($o, 'color');
        $customerId = self::field($o, 'customerId');
        $date = self::field($o, 'entryDate');
        $time = self::field($o, 'entryTime');

        if (!preg_match('/^[A-Z]{3}[0-9]{3}$/', $plate)) {
            self::invalid("La placa debe tener 3 letras y 3 números (Ej: ABC123).");
        }
        $maxYear = (int) date('Y') + 1;
        if (!preg_match('/^[0-9]{4}$/', $model) || (int) $model < 1950 || (int) $model > $maxYear) {
            self::invalid("El modelo debe ser un año entre 1950 y $maxYear.");
        }
        if (!$color || mb_strlen($color) > 30) {
            self::invalid("El color es obligatorio (máximo 30 caracteres).");
        }
        if (!$customerId) {
            self::invalid("Debe indicar el cliente dueño del auto.");
        }
        $st = self::pdo()->prepare("SELECT COUNT(*) FROM customer WHERE id = ? AND dateDelete IS NULL");
        $st->execute(array((int) $customerId));
        if ($st->fetchColumn() == 0) {
            self::invalid("No hay un cliente registrado con ese id.");
        }
        $d = $date ? DateTime::createFromFormat('Y-m-d', $date) : false;
        if (!$d || $d->format('Y-m-d') !== $date) {
            self::invalid("La fecha de ingreso no es válida (AAAA-MM-DD).");
        }
        if (!$time || !preg_match('/^([01][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/', $time)) {
            self::invalid("La hora de ingreso no es válida (HH:MM).");
        }
        if (self::existsActive(self::NAME_TABLE, 'plate', $plate, $id)) {
            self::conflict("Ya existe un auto con esa placa.");
        }
    }

    private static function bindAll($o, $st)
    {
        $time = self::field($o, 'entryTime');
        $st->bindValue(1, strtoupper(self::field($o, 'plate')));
        $st->bindValue(2, (int) self::field($o, 'model'), PDO::PARAM_INT);
        $st->bindValue(3, self::field($o, 'color'));
        $st->bindValue(4, (int) self::field($o, 'customerId'), PDO::PARAM_INT);
        $st->bindValue(5, self::field($o, 'entryDate'));
        $st->bindValue(6, strlen($time) === 5 ? $time . ':00' : $time);
    }

    public static function insertParameter($object, $statement)
    {
        self::bindAll($object, $statement);
    }

    public static function updateParameter($object, $statement, $id)
    {
        self::bindAll($object, $statement);
        $statement->bindValue(7, $id, PDO::PARAM_INT);
    }
}
?>
