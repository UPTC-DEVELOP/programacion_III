<?php

 // Class implementation
class Empleados  extends Request {
const NAME_TABLE = "empleado";
   
public static function init()
{
    parent::$nameTable = self::NAME_TABLE;
    parent::$queryInsert = INSERT_EMPLEADO;
    parent::$queryUpdate = UPDATE_EMPLEADO;
}
public static function get($request)
{
    UserAction::authenticator();

    $pdo = Connection::getInstance()->getConnection();

    // Mapeo de slugs/valores de URL -> valor exacto del ENUM en MariaDB
    $mapaEstados = [
        'disponible'     => 'Disponible',
        'ocupado'        => 'Ocupado',
        'no-disponible'  => 'No disponible',
        'no_disponible'  => 'No disponible',
        'no disponible'  => 'No disponible',
    ];

    if (!empty($request[0])) {
        if (is_numeric($request[0])) {
            $statement = $pdo->prepare(SELECT_EMPLEADO_BY_ID);
            $id = (int) $request[0];
            $statement->bindParam(1, $id, PDO::PARAM_INT);
        } else {
            // Decodifica URL, reemplaza '+' por espacio y pasa a minúsculas para comparar
            $claveEstado = strtolower(str_replace('+', ' ', urldecode($request[0])));

            if (isset($mapaEstados[$claveEstado])) {
                $estadoBD = $mapaEstados[$claveEstado];
                $statement = $pdo->prepare(SELECT_EMPLEADOS_BY_ESTADO);
                $statement->bindParam(1, $estadoBD, PDO::PARAM_STR);
            } else {
                throw new ExcepcionApi(
                    BAD_REQUEST,
                    ST400,
                    "Parámetro no válido. Use un ID numérico o un estado válido (disponible, ocupado, no-disponible)."
                );
            }
        }
    } else {
        $statement = $pdo->prepare(SELECT_EMPLEADOS);
    }

    $statement->execute();
    $empleados = $statement->fetchAll(PDO::FETCH_ASSOC);

    if (count($empleados) === 0) {
        throw new ExcepcionApi(NO_CONTENT, ST204, no_result);
    }

    return new ContentBody(OK, ST200, $empleados);
}
public static function insertParameter($object, $statement)
{
    $statement->bindParam(1, $object->nombres);
    $statement->bindParam(2, $object->apellidos);
    $statement->bindParam(3, $object->tipo_identificacion);
    $statement->bindParam(4, $object->identificacion);
    $statement->bindParam(5, $object->telefono);
    $statement->bindParam(6, $object->direccion);
    $statement->bindParam(7, $object->cargo);
    $statement->bindParam(8, $object->especialidad);
    $statement->bindParam(9, $object->estado);
}
public static function updateParameter($object, $statement, $id)
{
    $statement->bindParam(1, $object->nombres);
    $statement->bindParam(2, $object->apellidos);
    $statement->bindParam(3, $object->tipo_identificacion);
    $statement->bindParam(4, $object->identificacion);
    $statement->bindParam(5, $object->telefono);
    $statement->bindParam(6, $object->direccion);
    $statement->bindParam(7, $object->cargo);
    $statement->bindParam(8, $object->especialidad);
    $statement->bindParam(9, $object->estado);
    $statement->bindParam(10, $id);
}
}
?> 