<?php
/**
 * Clase que representa el controlador de Clientes
 */
class Clientes extends Request {

    const NAME_TABLE = "cliente";

    public static function init()
    {
        parent::$nameTable = self::NAME_TABLE;
        parent::$queryInsert = INSERT_CLIENTE;
        parent::$queryUpdate = UPDATE_CLIENTE;
    }
    

    public static function insertParameter($object, $statement)
    {
        $statement->bindParam(1, $object->nombres);
        $statement->bindParam(2, $object->apellidos);
        $statement->bindParam(3, $object->tipo_identificacion);
        $statement->bindParam(4, $object->numero_identificacion);
        $statement->bindParam(5, $object->correo);
        $statement->bindParam(6, $object->direccion);
        $statement->bindParam(7, $object->telefono);
    }

    public static function updateParameter($object, $statement, $id)
    {
        $statement->bindParam(1, $object->nombres);
        $statement->bindParam(2, $object->apellidos);
        $statement->bindParam(3, $object->tipo_identificacion);
        $statement->bindParam(4, $object->numero_identificacion);
        $statement->bindParam(5, $object->correo);
        $statement->bindParam(6, $object->direccion);
        $statement->bindParam(7, $object->telefono);
        $statement->bindParam(8, $id);
    }
}
?>
    
  