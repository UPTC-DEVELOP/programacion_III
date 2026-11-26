<?php
/**
 * <b>Descripcion:</b> Clase que <br/>Gestiona las facturas
 * <b>Caso de Uso:</b> PANTHER- Business <br/>
 */


class Facturas extends Request
{
    const NAME_TABLE = "facturas";
    
   
    public static function init()
    {
        parent::$nameTable = self::NAME_TABLE;
        parent::$queryInsert = INSERT_FACTURA;
    }

    public static function insertParameter($object, $statement)
    {
        $statement->bindParam(1, $object->cufe);
        $statement->bindParam(2, $object->nit);
        $statement->bindParam(3, $object->consecutivo);
        $statement->bindParam(4, $object->total);
        $statement->bindParam(5, $object->cliente_nombre);
        $statement->bindParam(6, $object->estado_dian);
    }

    
    public static function updateParameter($object, $statement, $id) {}
}
?>