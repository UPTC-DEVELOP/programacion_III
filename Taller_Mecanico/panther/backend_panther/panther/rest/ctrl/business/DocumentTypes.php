<?php
class DocumentTypes
{
    public function init()
    {
    }

    public static function get($request)
    {
        UserAction::authenticator();

        $query = "SELECT id, nombre_corto, nombre_largo
                  FROM documenttype
                  WHERE dateDelete IS NULL
                  ORDER BY nombre_largo";

        $statement = Connection::getInstance()
            ->getConnection()
            ->prepare($query);

        $statement->execute();

        return new ContentBody(
            OK,
            ST200,
            $statement->fetchAll(PDO::FETCH_ASSOC)
        );
    }
}