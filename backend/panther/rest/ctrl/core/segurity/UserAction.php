<?php

class UserAction implements IRequest
{
    const LIMITE_INTENTOS = 5;

    public static function init() {}
    public static function get($request = []) { throw new ExcepcionApi(BAD_REQUEST, ST400, error_url); }
    public static function delete($request = []) { throw new ExcepcionApi(BAD_REQUEST, ST400, error_url); }
    public static function put($request = []) { throw new ExcepcionApi(BAD_REQUEST, ST400, error_url); }

    public static function post($request = [])
    {
        header('Cache-Control: no-store');
        switch ($request[0] ?? '') {
            case 'login':
                return self::loguin();
            case 'logout':
                return self::cerrarSesion();
            default:
                throw new ExcepcionApi(NOT_FOUND, ST404, error_notExist);
        }
    }

    private static function tokenRecibido()
    {
        $headers = array_change_key_case(apache_request_headers(), CASE_LOWER);
        return trim($headers['authorization'] ?? '');
    }

    public static function authenticator($requiereAdmin = false)
    {
        $token = self::tokenRecibido();
        if ($token === '') {
            throw new ExcepcionApi(BAD_REQUEST, ST400, error_KeyAPI);
        }
        $rol = self::rolDeSesion($token);
        if ($rol === false) {
            throw new ExcepcionApi(UNAUTHORIZED, ST401, error_KeyAPI);
        }
        if ($requiereAdmin && (int) $rol !== 1) {
            throw new ExcepcionApi(FORBIDDEN, ST403, 'Se requiere el rol administrador.');
        }
        return new ContentBody(OK, ST200, sucessful);
    }

    public static function validateKeyAPI($token)
    {
        return self::rolDeSesion($token) !== false;
    }

    private static function rolDeSesion($token)
    {
        if (!is_string($token) || !preg_match('/^[a-f0-9]{64}$/D', $token)) {
            return false;
        }
        $db = Connection::getInstance()->getConnection();
        $consulta = $db->prepare(VERIFY_KEYAPI);
        $consulta->execute([hash('sha224', $token)]);
        return $consulta->fetchColumn();
    }

    public static function encrytPassword($passwordPlain)
    {
        return empty($passwordPlain) ? null : password_hash($passwordPlain, PASSWORD_BCRYPT);
    }

    public static function getKeyAPI()
    {
        // Valor interno inicial para el CRUD legado. Sin vencimiento asignado no hay sesión.
        return bin2hex(random_bytes(28));
    }

    private static function bloqueado($segundos)
    {
        header('Retry-After: ' . $segundos);
        return new ContentBody('TOO_MANY_REQUESTS', 429, ['segundos' => $segundos]);
    }

    public static function loguin()
    {
        $datos = JSONUtil::decodeJSON();
        if (!is_string($datos->user ?? null) || !is_string($datos->password ?? null)
            || trim($datos->user) === '' || $datos->password === '') {
            return new ContentBody(BAD_REQUEST, ST400, 'Escribe usuario y contraseña.');
        }

        $db = Connection::getInstance()->getConnection();
        $db->beginTransaction();
        try {
            // La fila queda bloqueada mientras se decide el resultado de este intento.
            $consulta = $db->prepare(SELECT_USER);
            $consulta->execute([trim($datos->user)]);
            $usuario = $consulta->fetch(PDO::FETCH_ASSOC);
            if (!$usuario) {
                $db->commit();
                return new ContentBody(FORBIDDEN, ST403, noAutheticate);
            }
            $espera = (int) $usuario['espera'];
            if ($espera > 0) {
                $db->commit();
                return self::bloqueado($espera);
            }
            if (!password_verify($datos->password, $usuario['password'])) {
                $intentos = (int) $usuario['intentosFallidos'] + 1;
                if ($intentos >= self::LIMITE_INTENTOS) {
                    $consulta = $db->prepare('UPDATE j4user SET intentosFallidos = 0,
                        bloqueoHasta = UTC_TIMESTAMP() + INTERVAL 60 SECOND WHERE id = ?');
                    $consulta->execute([$usuario['id']]);
                    $db->commit();
                    return self::bloqueado(60);
                }
                $consulta = $db->prepare('UPDATE j4user SET intentosFallidos = ?,
                    bloqueoHasta = NULL WHERE id = ?');
                $consulta->execute([$intentos, $usuario['id']]);
                $db->commit();
                return new ContentBody(FORBIDDEN, ST403, noAutheticate);
            }

            $token = bin2hex(random_bytes(32));
            $consulta = $db->prepare('UPDATE j4user SET keyAPI = ?,
                sesionHasta = UTC_TIMESTAMP() + INTERVAL 12 HOUR,
                bloqueoHasta = NULL, intentosFallidos = 0 WHERE id = ?');
            $consulta->execute([hash('sha224', $token), $usuario['id']]);
            $db->commit();
            return new ContentBody(OK, ST200, [
                'user' => $usuario['user'], 'roles' => $usuario['roles'], 'keyAPI' => $token
            ]);
        } catch (Throwable $error) {
            if ($db->inTransaction()) $db->rollBack();
            throw new ExcepcionApi(INTERNAL_SERVER_ERROR, ST500, 'Error al iniciar sesión.');
        }
    }

    private static function cerrarSesion()
    {
        $token = self::tokenRecibido();
        if ($token === '') {
            throw new ExcepcionApi(BAD_REQUEST, ST400, error_KeyAPI);
        }
        $db = Connection::getInstance()->getConnection();
        // Idempotente: un segundo cierre también termina correctamente.
        $consulta = $db->prepare('UPDATE j4user SET sesionHasta = NULL WHERE keyAPI = ?');
        $consulta->execute([hash('sha224', $token)]);
        return new ContentBody(OK, ST200, 'Sesión cerrada.');
    }
}
