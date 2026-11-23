<?php

/**
 * Descripcion: Gestiona los clientes del taller (CRUD).
 * Caso de Uso: PANTHER - Business (TallerMax)
 */
class Customers extends Request
{
    const NAME_TABLE = "customer";

    public static function init()
    {
        parent::$nameTable = self::NAME_TABLE;
        parent::$queryInsert = INSERT_CUSTOMER;
        parent::$queryUpdate = UPDATE_CUSTOMER;
    }

    /** Une el tipo de documento y cuenta los autos activos del cliente */
    protected static function baseSelect()
    {
        return "SELECT c.id, c.documentTypeId, d.shortName AS documentType, c.document, c.name, c.phone, c.email, c.address, "
            . "c.dateDelete, (SELECT COUNT(*) FROM vehicle v WHERE v.customerId = c.id AND v.dateDelete IS NULL) AS vehicles "
            . "FROM customer c LEFT JOIN documenttype d ON d.id = c.documentTypeId";
    }

    protected static function prefix()
    {
        return "c.";
    }

    protected static function validate($o, $id = null)
    {
        $name = self::field($o, 'name');
        $document = self::field($o, 'document');
        $phone = self::field($o, 'phone');
        $email = self::field($o, 'email');
        $address = self::field($o, 'address');
        $typeId = self::field($o, 'documentTypeId');

        if (!$name || mb_strlen($name) > 100) {
            self::invalid("El nombre es obligatorio (máximo 100 caracteres).");
        }
        if (!$document || !preg_match('/^[0-9A-Za-z\-]{5,20}$/', $document)) {
            self::invalid("El documento es obligatorio (5 a 20 caracteres, sin espacios).");
        }
        if (!$phone || !preg_match('/^[0-9+\s]{7,15}$/', $phone)) {
            self::invalid("El teléfono es obligatorio (7 a 15 dígitos).");
        }
        if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($email) > 100) {
            self::invalid("El correo no es válido.");
        }
        if (!$address || mb_strlen($address) > 150) {
            self::invalid("La dirección es obligatoria (máximo 150 caracteres).");
        }
        if ($typeId !== null && $typeId !== '') {
            $st = self::pdo()->prepare("SELECT COUNT(*) FROM documenttype WHERE id = ? AND dateDelete IS NULL");
            $st->execute(array((int) $typeId));
            if ($st->fetchColumn() == 0) {
                self::invalid("El tipo de documento no existe.");
            }
        }
        if (self::existsActive(self::NAME_TABLE, 'document', $document, $id)) {
            self::conflict("Ya existe un cliente con ese documento.");
        }
    }

    protected static function beforeDelete($id)
    {
        $st = self::pdo()->prepare("SELECT COUNT(*) FROM vehicle WHERE customerId = ? AND dateDelete IS NULL");
        $st->execute(array($id));
        if ($st->fetchColumn() > 0) {
            self::conflict("No se puede eliminar: el cliente tiene autos registrados. Elimine primero sus autos.");
        }
    }

    private static function bindAll($o, $st)
    {
        $typeId = self::field($o, 'documentTypeId');
        $st->bindValue(1, ($typeId === null || $typeId === '') ? null : (int) $typeId, $typeId === null || $typeId === '' ? PDO::PARAM_NULL : PDO::PARAM_INT);
        $st->bindValue(2, self::field($o, 'document'));
        $st->bindValue(3, self::field($o, 'name'));
        $st->bindValue(4, self::field($o, 'phone'));
        $st->bindValue(5, self::field($o, 'email'));
        $st->bindValue(6, self::field($o, 'address'));
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
