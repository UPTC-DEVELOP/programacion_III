<?php

/**
 * Gestiona las solicitudes de citas de TallerPro.
 */
class Citas
{
    public static function init()
    {
    }

    // Registrar una solicitud pública de cita.
    public static function post($request)
    {
        if (!empty($request[0])) {
            throw new ExcepcionApi(BAD_REQUEST, ST400, 'Ruta no valida.');
        }

        $datos = self::leerDatos();

        $nombre = self::campo($datos, 'nombre', 120);
        $correo = self::campo($datos, 'correo', 150);
        $telefono = self::campo($datos, 'telefono', 15);
        $servicio = self::campo($datos, 'servicio', 100);
        $mensaje = self::campo($datos, 'mensaje', 2000);
        $fecha = self::campo($datos, 'fecha_cita', 10);
        $hora = self::campo($datos, 'hora_cita', 8);

        if (!filter_var($correo, FILTER_VALIDATE_EMAIL)) {
            throw new ExcepcionApi(BAD_REQUEST, ST400, 'Correo no valido.');
        }

        if (!preg_match('/^[0-9]{7,10}$/D', $telefono)) {
            throw new ExcepcionApi(BAD_REQUEST, ST400, 'Telefono no valido.');
        }

        $servicios = array(
            'mantenimiento',
            'diagnostico',
            'reparacion',
            'alineacion'
        );

        if (!in_array($servicio, $servicios, true)) {
            throw new ExcepcionApi(BAD_REQUEST, ST400, 'Servicio no valido.');
        }

        self::validarFechaHora($fecha, $hora, true);

        $pdo = Connection::getInstance()->getConnection();

        self::ejecutar(INSERT_CITA, array(
            $nombre,
            $correo,
            $telefono,
            $servicio,
            $mensaje,
            $fecha,
            $hora
        ));

        return new ContentBody(CREATE, ST201, array(
            'id_cita' => (int) $pdo->lastInsertId(),
            'estado' => 'Pendiente',
            'mensaje' => 'Solicitud registrada correctamente.'
        ));
    }

    // Consultar citas: solo administradores.
    public static function get($request)
    {
        self::autorizarAdministrador();

        if (empty($request[0])) {
            $statement = self::ejecutar(SELECT_CITAS);
        } else {
            $id = self::validarId($request[0]);

            $statement = self::ejecutar(
                SELECT_CITA,
                array($id)
            );
        }

        $citas = $statement->fetchAll(PDO::FETCH_ASSOC);

        if (!empty($request[0]) && count($citas) === 0) {
            throw new ExcepcionApi(NOT_FOUND, ST404, 'Cita no encontrada.');
        }

        return new ContentBody(OK, ST200, $citas);
    }

    // Confirmar, reprogramar o cancelar citas.
    public static function put($request)
    {
        self::autorizarAdministrador();

        $id = self::validarId($request[0] ?? null);
        $datos = self::leerDatos();

        $fecha = self::campo($datos, 'fecha_cita', 10);
        $hora = self::campo($datos, 'hora_cita', 8);
        $estado = self::campo($datos, 'estado', 20);

        $estados = array(
            'Pendiente',
            'Confirmada',
            'Cancelada',
            'Atendida'
        );

        if (!in_array($estado, $estados, true)) {
            throw new ExcepcionApi(BAD_REQUEST, ST400, 'Estado no valido.');
        }

        self::validarFechaHora(
            $fecha,
            $hora,
            in_array($estado, array('Pendiente', 'Confirmada'), true)
        );

        $actual = self::ejecutar(SELECT_CITA, array($id));

        if (!$actual->fetch(PDO::FETCH_ASSOC)) {
            throw new ExcepcionApi(NOT_FOUND, ST404, 'Cita no encontrada.');
        }

        self::ejecutar(UPDATE_CITA, array(
            $fecha,
            $hora,
            $estado,
            $id
        ));

        return new ContentBody(OK, ST200, array(
            'mensaje' => 'Cita actualizada correctamente.'
        ));
    }

    // Verificar token y rol administrativo en la base de datos.
    private static function autorizarAdministrador()
    {
        UserAction::authenticator();

        $heads = function_exists('apache_request_headers')
            ? array_change_key_case(apache_request_headers(), CASE_LOWER)
            : array();

        $token = $heads[AUTHORIZATION]
            ?? $_SERVER['HTTP_AUTHORIZATION']
            ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
            ?? '';

        $query = "SELECT COUNT(*)
                  FROM j4user u
                  INNER JOIN j4rol r
                  ON CAST(u.roles AS CHAR) = CAST(r.id AS CHAR)
                  WHERE u.keyAPI = ?
                  AND r.name = 'admin'";

        $statement = self::ejecutar($query, array($token));

        if ((int) $statement->fetchColumn() === 0) {
            throw new ExcepcionApi(
                FORBIDDEN,
                ST403,
                'Acceso exclusivo para administradores.'
            );
        }
    }

    private static function leerDatos()
    {
        $datos = json_decode(file_get_contents('php://input'));

        if (!is_object($datos)) {
            throw new ExcepcionApi(BAD_REQUEST, ST400, 'JSON no valido.');
        }

        return $datos;
    }

    private static function campo($datos, $nombre, $maximo)
    {
        $valor = $datos->$nombre ?? null;

        if (!is_string($valor)) {
            throw new ExcepcionApi(
                BAD_REQUEST,
                ST400,
                'Campo no valido: ' . $nombre
            );
        }

        $valor = trim($valor);

        if ($valor === '' || strlen($valor) > $maximo) {
            throw new ExcepcionApi(
                BAD_REQUEST,
                ST400,
                'Campo obligatorio o longitud incorrecta: ' . $nombre
            );
        }

        return $valor;
    }

    private static function validarId($valor)
    {
        $id = filter_var($valor, FILTER_VALIDATE_INT, array(
            'options' => array('min_range' => 1)
        ));

        if ($id === false) {
            throw new ExcepcionApi(BAD_REQUEST, ST400, 'ID no valido.');
        }

        return $id;
    }

    private static function validarFechaHora($fecha, $hora, $futura)
    {
        $zona = new DateTimeZone('America/Bogota');

        if (strlen($hora) === 5) {
            $hora .= ':00';
        }

        $valor = $fecha . ' ' . $hora;

        $cita = DateTimeImmutable::createFromFormat(
            '!Y-m-d H:i:s',
            $valor,
            $zona
        );

        if (!$cita || $cita->format('Y-m-d H:i:s') !== $valor) {
            throw new ExcepcionApi(BAD_REQUEST, ST400, 'Fecha u hora no valida.');
        }

        if ($futura && $cita <= new DateTimeImmutable('now', $zona)) {
            throw new ExcepcionApi(BAD_REQUEST, ST400, 'La cita debe ser futura.');
        }
    }

    private static function ejecutar($query, $parametros = array())
    {
        try {
            $pdo = Connection::getInstance()->getConnection();
            $statement = $pdo->prepare($query);
            $statement->execute($parametros);

            return $statement;
        } catch (PDOException $e) {
            error_log('[TallerPro][Citas] ' . $e->getMessage());

            throw new ExcepcionApi(
                INTERNAL_SERVER_ERROR,
                ST500,
                'No fue posible procesar la cita.'
            );
        }
    }
}
