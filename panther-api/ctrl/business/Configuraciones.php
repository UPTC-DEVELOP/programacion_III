<?php

class Configuraciones extends Request
{
    const NAME_TABLE = "configuracion";

    public static function init()
    {
        parent::$nameTable = self::NAME_TABLE;
        parent::$queryInsert = INSERT_CONFIGURACION;
        parent::$queryUpdate = UPDATE_CONFIGURACION;
    }

    public static function get($request)
    {
        UserAction::authenticator();
        $pdo = Connection::getInstance()->getConnection();
        if (!empty($request[0])) {
            if (!is_numeric($request[0])) {
                throw new ExcepcionApi(BAD_REQUEST, ST400, "Debe indicar un ID numérico válido.");
            }
            $statement = $pdo->prepare(
                "SELECT id, iva, valor_mano_obra, porcentaje_utilidad, fecha_actualizacion
                 FROM configuracion WHERE id = ? AND dateDelete IS NULL"
            );
            $statement->execute(array((int) $request[0]));
        } else {
            $statement = $pdo->query(
                "SELECT id, iva, valor_mano_obra, porcentaje_utilidad, fecha_actualizacion
                 FROM configuracion WHERE dateDelete IS NULL
                 ORDER BY fecha_actualizacion DESC, id DESC"
            );
        }

        return new ContentBody(OK, ST200, $statement->fetchAll(PDO::FETCH_ASSOC));
    }

    private static function obtenerTokenAuthorization(): string
    {
        $headers = function_exists('getallheaders') ? getallheaders() : [];
        foreach ($headers as $key => $value) {
            if (strtolower((string) $key) === 'authorization') {
                return trim((string) $value);
            }
        }
        if (!empty($_SERVER['HTTP_AUTHORIZATION'])) {
            return trim((string) $_SERVER['HTTP_AUTHORIZATION']);
        }
        return '';
    }

    private static function exigirRolAdmin(): void
    {
        UserAction::authenticator();

        $token = self::obtenerTokenAuthorization();
        if ($token === '') {
            throw new ExcepcionApi(BAD_REQUEST, ST400, "Token de autorización requerido.");
        }

        $pdo = Connection::getInstance()->getConnection();
        $stmt = $pdo->prepare("SELECT id, roles FROM j4user WHERE keyAPI = ? AND dateDelete IS NULL LIMIT 1");
        $stmt->bindParam(1, $token, PDO::PARAM_STR);
        $stmt->execute();
        $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$usuario || (int) $usuario['roles'] !== 1) {
            throw new ExcepcionApi(FORBIDDEN, ST403, "Acceso denegado: solo el rol administrador puede modificar la configuración.");
        }
    }

    public static function post($request)
    {
        self::exigirRolAdmin();

        $body = file_get_contents('php://input');
        $object = json_decode($body);
        $cfg = self::validarYConstruir($object);

        $pdo = Connection::getInstance()->getConnection();
        $statement = $pdo->prepare(self::$queryInsert);
        self::insertParameter($cfg, $statement);
        $statement->execute();

        return new ContentBody(OK, ST200, "Configuración registrada correctamente.");
    }

    public static function put($request)
    {
        self::exigirRolAdmin();

        if (empty($request[0]) || !is_numeric($request[0])) {
            throw new ExcepcionApi(BAD_REQUEST, ST400, "Debe indicar un ID numérico válido.");
        }

        $id = (int) $request[0];
        $body = file_get_contents('php://input');
        $object = json_decode($body);
        $cfg = self::validarYConstruir($object);

        $pdo = Connection::getInstance()->getConnection();
        $statement = $pdo->prepare(self::$queryUpdate);
        self::updateParameter($cfg, $statement, $id);
        $statement->execute();

        return new ContentBody(OK, ST200, "Configuración actualizada correctamente.");
    }

    public static function insertParameter($object, $statement)
    {
        $cfg = ($object instanceof Configuracion) ? $object : self::validarYConstruir($object);
        $iva = $cfg->getIva();
        $manoObra = $cfg->getValorManoObra();
        $utilidad = $cfg->getPorcentajeUtilidad();

        $statement->bindParam(1, $iva);
        $statement->bindParam(2, $manoObra);
        $statement->bindParam(3, $utilidad);
    }

    public static function updateParameter($object, $statement, $id)
    {
        $cfg = ($object instanceof Configuracion) ? $object : self::validarYConstruir($object);
        $iva = $cfg->getIva();
        $manoObra = $cfg->getValorManoObra();
        $utilidad = $cfg->getPorcentajeUtilidad();

        $statement->bindParam(1, $iva);
        $statement->bindParam(2, $manoObra);
        $statement->bindParam(3, $utilidad);
        $statement->bindParam(4, $id, PDO::PARAM_INT);
    }

    private static function validarYConstruir($object): Configuracion
    {
        if (!is_object($object)) {
            throw new ExcepcionApi(BAD_REQUEST, ST400, "El cuerpo debe ser un objeto JSON válido.");
        }

        if (!isset($object->iva) || !isset($object->valor_mano_obra) || !isset($object->porcentaje_utilidad)
            || !is_numeric($object->iva) || !is_numeric($object->valor_mano_obra) || !is_numeric($object->porcentaje_utilidad)) {
            throw new ExcepcionApi(
                BAD_REQUEST,
                ST400,
                "iva, valor_mano_obra y porcentaje_utilidad son obligatorios y numéricos."
            );
        }

        $iva = (float) $object->iva;
        $manoObra = (float) $object->valor_mano_obra;
        $utilidad = (float) $object->porcentaje_utilidad;

        if (!Configuracion::validarConfiguracion($iva, $manoObra, $utilidad)) {
            throw new ExcepcionApi(
                BAD_REQUEST,
                ST400,
                "El IVA debe ser 15 o 19, y valor_mano_obra y porcentaje_utilidad no pueden ser negativos."
            );
        }

        return new Configuracion([
            'iva' => $iva,
            'valor_mano_obra' => $manoObra,
            'porcentaje_utilidad' => $utilidad
        ]);
    }
}
?>