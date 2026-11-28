<?php

class Tecnicos
{
    public function init()
    {}

    public static function get($request)
    {
        UserAction::authenticator();
        $pdo = Connection::getInstance()->getConnection();
        $sql = 'SELECT t.id_tecnico, t.cedula, t.nombres, t.apellidos, t.telefono,
                       t.id_cargo, c.nombre AS cargo,
                       t.id_especialidad, e.nombre AS especialidad,
                       t.fecha_ingreso, t.estado
                FROM tecnicos t
                INNER JOIN cargos c ON c.id_cargo = t.id_cargo
                LEFT JOIN especialidades e ON e.id_especialidad = t.id_especialidad';

        if (isset($request[0]) && $request[0] !== '') {
            $id = self::parseId($request[0]);
            $statement = $pdo->prepare($sql . ' WHERE t.id_tecnico = ?');
            $statement->execute(array($id));
        } else {
            $statement = $pdo->query($sql . ' ORDER BY t.apellidos, t.nombres');
        }

        $tecnicos = $statement->fetchAll(PDO::FETCH_ASSOC);
        if (isset($id) && count($tecnicos) === 0) {
            throw new ExcepcionAPI(NOT_FOUND, ST404, error_notExist);
        }

        return new ContentBody(OK, ST200, $tecnicos);
    }

    public static function post($request)
    {
        UserAction::authenticator();
        if (isset($request[0]) && $request[0] !== '') {
            throw new ExcepcionAPI(BAD_REQUEST, ST400, 'Usa la ruta /tecnicos/ para registrar un técnico.');
        }

        $datos = self::validarDatos(JSONUtil::decodeJSON());
        $pdo = Connection::getInstance()->getConnection();
        self::validarReferencias($pdo, $datos);

        try {
            $statement = $pdo->prepare(
                'INSERT INTO tecnicos
                    (cedula, nombres, apellidos, telefono, id_cargo, id_especialidad, fecha_ingreso, estado)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
            );
            $statement->execute(array(
                $datos['cedula'],
                $datos['nombres'],
                $datos['apellidos'],
                $datos['telefono'],
                $datos['id_cargo'],
                $datos['id_especialidad'],
                $datos['fecha_ingreso'],
                $datos['estado']
            ));
        } catch (PDOException $exception) {
            self::convertirErrorDeUnicidad($exception);
            throw $exception;
        }

        return new ContentBody(CREATE, ST201, array('id_tecnico' => $pdo->lastInsertId()));
    }

    public static function put($request)
    {
        UserAction::authenticator();
        $id = self::idDeRuta($request);
        $datos = self::validarDatos(JSONUtil::decodeJSON());
        $pdo = Connection::getInstance()->getConnection();
        self::validarReferencias($pdo, $datos);
        self::asegurarExistencia($pdo, $id);

        try {
            $statement = $pdo->prepare(
                'UPDATE tecnicos
                 SET cedula = ?, nombres = ?, apellidos = ?, telefono = ?, id_cargo = ?,
                     id_especialidad = ?, fecha_ingreso = ?, estado = ?
                 WHERE id_tecnico = ?'
            );
            $statement->execute(array(
                $datos['cedula'],
                $datos['nombres'],
                $datos['apellidos'],
                $datos['telefono'],
                $datos['id_cargo'],
                $datos['id_especialidad'],
                $datos['fecha_ingreso'],
                $datos['estado'],
                $id
            ));
        } catch (PDOException $exception) {
            self::convertirErrorDeUnicidad($exception);
            throw $exception;
        }

        return new ContentBody(OK, ST200, sucessful);
    }

    public static function delete($request)
    {
        UserAction::authenticator();
        $id = self::idDeRuta($request);
        $pdo = Connection::getInstance()->getConnection();
        self::asegurarExistencia($pdo, $id);

        $statement = $pdo->prepare(
            "UPDATE tecnicos SET estado = 'Inactivo' WHERE id_tecnico = ?"
        );
        $statement->execute(array($id));

        return new ContentBody(OK, ST200, sucessful);
    }

    private static function validarDatos($datos)
    {
        if (!is_object($datos)) {
            throw new ExcepcionAPI(BAD_REQUEST, ST400, 'El cuerpo de la solicitud debe ser un objeto JSON.');
        }

        $cedula = self::textoRequerido($datos, 'cedula', 20);
        $nombres = self::textoRequerido($datos, 'nombres', 100);
        $apellidos = self::textoRequerido($datos, 'apellidos', 100);
        $telefono = self::textoOpcional($datos, 'telefono', 20);
        $idCargo = self::idRequerido(isset($datos->id_cargo) ? $datos->id_cargo : null, 'cargo');
        $idEspecialidad = self::idOpcional(isset($datos->id_especialidad) ? $datos->id_especialidad : null);
        $fechaIngreso = self::fechaRequerida(isset($datos->fecha_ingreso) ? $datos->fecha_ingreso : null);
        $estado = isset($datos->estado) ? $datos->estado : 'Activo';

        if (!in_array($estado, array('Activo', 'Inactivo'), true)) {
            throw new ExcepcionAPI(BAD_REQUEST, ST400, 'El estado debe ser Activo o Inactivo.');
        }

        return array(
            'cedula' => $cedula,
            'nombres' => $nombres,
            'apellidos' => $apellidos,
            'telefono' => $telefono,
            'id_cargo' => $idCargo,
            'id_especialidad' => $idEspecialidad,
            'fecha_ingreso' => $fechaIngreso,
            'estado' => $estado
        );
    }

    private static function textoRequerido($datos, $campo, $longitudMaxima)
    {
        if (!isset($datos->$campo) || !is_string($datos->$campo)) {
            throw new ExcepcionAPI(BAD_REQUEST, ST400, 'El campo ' . $campo . ' es obligatorio.');
        }

        $valor = trim($datos->$campo);
        if ($valor === '' || strlen($valor) > $longitudMaxima) {
            throw new ExcepcionAPI(
                BAD_REQUEST,
                ST400,
                'El campo ' . $campo . ' debe tener entre 1 y ' . $longitudMaxima . ' caracteres.'
            );
        }

        return $valor;
    }

    private static function textoOpcional($datos, $campo, $longitudMaxima)
    {
        if (!isset($datos->$campo) || $datos->$campo === null) {
            return null;
        }

        if (!is_string($datos->$campo)) {
            throw new ExcepcionAPI(BAD_REQUEST, ST400, 'El campo ' . $campo . ' debe ser texto.');
        }

        $valor = trim($datos->$campo);
        if (strlen($valor) > $longitudMaxima) {
            throw new ExcepcionAPI(
                BAD_REQUEST,
                ST400,
                'El campo ' . $campo . ' no puede superar ' . $longitudMaxima . ' caracteres.'
            );
        }

        return $valor === '' ? null : $valor;
    }

    private static function idRequerido($valor, $campo)
    {
        $id = self::idOpcional($valor);
        if ($id === null) {
            throw new ExcepcionAPI(BAD_REQUEST, ST400, 'Selecciona un ' . $campo . ' válido.');
        }

        return $id;
    }

    private static function idOpcional($valor)
    {
        if ($valor === null || $valor === '') {
            return null;
        }

        if (!is_int($valor) && !is_string($valor) || !ctype_digit((string) $valor) || (int) $valor < 1) {
            throw new ExcepcionAPI(BAD_REQUEST, ST400, 'Los identificadores deben ser enteros positivos.');
        }

        return (int) $valor;
    }

    private static function fechaRequerida($valor)
    {
        if (!is_string($valor)) {
            throw new ExcepcionAPI(BAD_REQUEST, ST400, 'La fecha de ingreso es obligatoria.');
        }

        $fecha = DateTime::createFromFormat('!Y-m-d', $valor);
        $errores = DateTime::getLastErrors();
        if (
            $fecha === false ||
            $errores !== false && ($errores['warning_count'] > 0 || $errores['error_count'] > 0) ||
            $fecha->format('Y-m-d') !== $valor
        ) {
            throw new ExcepcionAPI(BAD_REQUEST, ST400, 'La fecha de ingreso no es válida.');
        }

        return $valor;
    }

    private static function validarReferencias(PDO $pdo, $datos)
    {
        self::asegurarReferencia($pdo, 'cargos', 'id_cargo', $datos['id_cargo'], 'El cargo seleccionado no existe.');

        if ($datos['id_especialidad'] !== null) {
            self::asegurarReferencia(
                $pdo,
                'especialidades',
                'id_especialidad',
                $datos['id_especialidad'],
                'La especialidad seleccionada no existe.'
            );
        }
    }

    private static function asegurarReferencia(PDO $pdo, $tabla, $columna, $id, $mensaje)
    {
        $statement = $pdo->prepare('SELECT COUNT(*) FROM ' . $tabla . ' WHERE ' . $columna . ' = ?');
        $statement->execute(array($id));
        if ((int) $statement->fetchColumn() === 0) {
            throw new ExcepcionAPI(BAD_REQUEST, ST400, $mensaje);
        }
    }

    private static function idDeRuta($request)
    {
        if (!isset($request[0]) || $request[0] === '') {
            throw new ExcepcionAPI(BAD_REQUEST, ST400, 'Se requiere el identificador del técnico.');
        }

        return self::parseId($request[0]);
    }

    private static function parseId($valor)
    {
        if (!ctype_digit((string) $valor) || (int) $valor < 1) {
            throw new ExcepcionAPI(BAD_REQUEST, ST400, 'El identificador del técnico no es válido.');
        }

        return (int) $valor;
    }

    private static function asegurarExistencia(PDO $pdo, $id)
    {
        $statement = $pdo->prepare('SELECT COUNT(*) FROM tecnicos WHERE id_tecnico = ?');
        $statement->execute(array($id));
        if ((int) $statement->fetchColumn() === 0) {
            throw new ExcepcionAPI(NOT_FOUND, ST404, error_notExist);
        }
    }

    private static function convertirErrorDeUnicidad(PDOException $exception)
    {
        if (
            (string) $exception->getCode() === '23000' &&
            isset($exception->errorInfo[1]) &&
            (int) $exception->errorInfo[1] === 1062
        ) {
            throw new ExcepcionAPI('CONFLICT', 409, 'Ya existe un técnico con esa cédula.');
        }
    }
}
