<?php

class Especialidades
{
    public function init()
    {}

    public static function get($request)
    {
        UserAction::authenticator();
        self::validarRutaDeColeccion($request);
        $statement = Connection::getInstance()
            ->getConnection()
            ->query('SELECT id_especialidad, nombre FROM especialidades ORDER BY nombre');

        return new ContentBody(OK, ST200, $statement->fetchAll(PDO::FETCH_ASSOC));
    }

    private static function validarRutaDeColeccion($request)
    {
        if (isset($request[0]) && $request[0] !== '') {
            throw new ExcepcionAPI(BAD_REQUEST, ST400, 'Usa la ruta /especialidades/ para consultar o crear especialidades.');
        }
    }
}
