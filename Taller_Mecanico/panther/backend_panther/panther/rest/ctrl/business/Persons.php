<?php

/**
 * <b>Descripcion:</b> Clase que <br/>Gestiona las personas
 * <b>Caso de Uso:</b> PANTHER- Business <br/>
 *
 * @author Josué Nicolás Pinzón Villamil <a href = "mailto:jpinzon@j4sysol.com">jpinzon@j4sysol.com</a>
 */
class Persons extends Request
{
    /**
     * Datos de la tabla "person"
     *
     * @var string
     */
    const NAME_TABLE = "person";
    
    public function init()
    {
        parent::$nameTable = self::NAME_TABLE;
        parent::$queryInsert = INTSERT_PERSON;
        parent::$queryUpdate = UPDATE_PERSON;
    }

    public static function get($request)
    {
        UserAction::authenticator();
        $pdo = Connection::getInstance()->getConnection();

        if (is_array($request) && !empty($request[0])) {
            $statement = $pdo->prepare(
                "SELECT * FROM person WHERE id=? AND dateDelete IS NULL"
            );
            $statement->bindValue(1, (int) $request[0], PDO::PARAM_INT);
        } else {
            $statement = $pdo->prepare(
                "SELECT * FROM person WHERE dateDelete IS NULL ORDER BY id"
            );
        }

        $statement->execute();
        return new ContentBody(OK, ST200, $statement->fetchAll(PDO::FETCH_ASSOC));
    }

    public static function updateParameter($object, $statement, $id)
    {
        $statement->bindParam(1, $object->name);
        $statement->bindParam(2, $object->lastName);
        $statement->bindParam(3, $object->phone);
        $statement->bindParam(4, $object->document_type_id);
        $statement->bindParam(5, $object->identitydocument);
        $statement->bindParam(6, $object->email);
        $statement->bindParam(7, $object->address);
        $statement->bindParam(8, $id);
    }

    public static function insertParameter($object, $statement)
    {
        $statement->bindParam(1, $object->name);
        $statement->bindParam(2, $object->lastName);
        $statement->bindParam(3, $object->phone);
        $statement->bindParam(4, $object->document_type_id);
        $statement->bindParam(5, $object->identitydocument);
        $statement->bindParam(6, $object->email);
        $statement->bindParam(7, $object->address);
    }

}

