<?php

/**
 * Descripcion: Clase que gestiona los tipos de documento (CC, TI, CE...)
 * Caso de Uso: PANTHER - Business
 */
class DocumentTypes extends Request
{
    /**
     * Nombre de la tabla en la base de datos
     *
     * @var string
     */
    const NAME_TABLE = "documenttype";

    // Le dice a Request qué tabla y qué consultas usar
    public static function init()
    {
        parent::$nameTable = self::NAME_TABLE;
        parent::$queryInsert = INSERT_DOCUMENTTYPE;
        parent::$queryUpdate = UPDATE_DOCUMENTTYPE;
    }

    // Llena los signos ? de la consulta UPDATE (en el mismo orden)
    public static function updateParameter($object, $statement, $id)
    {
        $statement->bindParam(1, $object->longName);
        $statement->bindParam(2, $object->shortName);
        $statement->bindParam(3, $id);
    }

    // Llena los signos ? de la consulta INSERT (en el mismo orden)
    public static function insertParameter($object, $statement)
    {
        $statement->bindParam(1, $object->longName);
        $statement->bindParam(2, $object->shortName);
    }
}
?>