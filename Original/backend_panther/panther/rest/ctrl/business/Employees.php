<?php

/**
 * Descripcion: Gestiona los empleados del taller (CRUD).
 * Caso de Uso: PANTHER - Business (TallerMax)
 */
class Employees extends Request
{
    const NAME_TABLE = "employee";

    /** Cargos permitidos (los mismos del formulario original) */
    const POSITIONS = array('Mecánico', 'Electricista automotriz', 'Recepcionista', 'Administrador', 'Ayudante de taller');

    public static function init()
    {
        parent::$nameTable = self::NAME_TABLE;
        parent::$queryInsert = INSERT_EMPLOYEE;
        parent::$queryUpdate = UPDATE_EMPLOYEE;
    }

    protected static function validate($o, $id = null)
    {
        $document = (string) self::field($o, 'document');
        $first = self::field($o, 'firstName');
        $last = self::field($o, 'lastName');
        $position = self::field($o, 'position');

        if (!preg_match('/^[0-9]{10}$/', $document)) {
            self::invalid("La cédula debe tener exactamente 10 dígitos.");
        }
        if (!$first || mb_strlen($first) > 60) {
            self::invalid("Los nombres son obligatorios (máximo 60 caracteres).");
        }
        if (!$last || mb_strlen($last) > 60) {
            self::invalid("Los apellidos son obligatorios (máximo 60 caracteres).");
        }
        if (!in_array($position, self::POSITIONS, true)) {
            self::invalid("El cargo seleccionado no es válido.");
        }
        if (self::existsActive(self::NAME_TABLE, 'document', $document, $id)) {
            self::conflict("Ya existe un empleado con esa cédula.");
        }
    }

    private static function bindAll($o, $st)
    {
        $st->bindValue(1, self::field($o, 'document'));
        $st->bindValue(2, self::field($o, 'firstName'));
        $st->bindValue(3, self::field($o, 'lastName'));
        $st->bindValue(4, self::field($o, 'position'));
    }

    public static function insertParameter($object, $statement)
    {
        self::bindAll($object, $statement);
    }

    public static function updateParameter($object, $statement, $id)
    {
        self::bindAll($object, $statement);
        $statement->bindValue(5, $id, PDO::PARAM_INT);
    }
}
?>
