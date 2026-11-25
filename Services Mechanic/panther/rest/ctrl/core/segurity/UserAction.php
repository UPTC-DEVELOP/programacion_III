<?php

/**
 * <b>Descripcion:</b> Clase que <br/>Gestiona la seguridad de un usuario
 * <b>Caso de Uso:</b> PANTHER-Seguridad <br/>
 *
 * @author Josué Nicolás Pinzón Villamil <a href = "mailto:jpinzon@j4sysol.com">jpinzon@j4sysol.com</a>
 */
class UserAction implements IRequest
{

    /**
     * Constante de metodo Login
     *
     * @var string
     */
    const LOGIN = "login";

    /**
     * {@inheritdoc}
     * @see IRequest::init()
     */
    public function init()
    {}

    /**
     * {@inheritdoc}
     * @see IRequest::get()
     */
    public static function get()
    {}

    /**
     * {@inheritdoc}
     * @see IRequest::delete()
     */
    public static function delete()
    {}
    /**
     * {@inheritdoc}
     * @see IRequest::put()
     */
    public static function put($request)
    {}

    /**
     * Metodo de logueo para un usuario
     *
     * @param unknown $request
     *            Datos de credenciales
     * @throws ExcepcionApi Lanza una excepcion si no encuetra ek metodo
     * @return ContentBody Retorna una respuesta de la solicitud
     */
    public static function post($request)
    {
        if ($request[0] == self::LOGIN) {
            return self::loguin();
        } else {
            throw new ExcepcionApi(NOT_FOUND, ST404, error_notExist);
        }
    }

    /**
     * Otorga los permisos a un usuario para que acceda a los recursos
     *
     * @return bool true cuando el token es válido
     * @throws ExcepcionApi si el token está ausente o no es válido
     */
    public static function authenticator()
    {
        $keyAPI = self::authorizationToken();

        if ($keyAPI === null || ! self::validateKeyAPI($keyAPI)) {
            throw new ExcepcionApi(UNAUTHORIZED, ST401, error_KeyAPI);
        }

        return true;
    }

    /**
     * Obtiene el token sin depender exclusivamente de Apache.
     * Acepta Bearer como formato recomendado y conserva el token directo legado.
     *
     * @return string|null
     */
    private static function authorizationToken()
    {
        $authorization = isset($_SERVER['HTTP_AUTHORIZATION'])
            ? $_SERVER['HTTP_AUTHORIZATION']
            : null;

        if ($authorization === null && isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
            $authorization = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
        }

        if ($authorization === null && function_exists('apache_request_headers')) {
            $headers = apache_request_headers();

            if (is_array($headers)) {
                $headers = array_change_key_case($headers, CASE_LOWER);
                $authorization = isset($headers[AUTHORIZATION])
                    ? $headers[AUTHORIZATION]
                    : null;
            }
        }

        if (! is_string($authorization)) {
            return null;
        }

        $authorization = trim($authorization);

        if (stripos($authorization, 'Bearer ') === 0) {
            $authorization = trim(substr($authorization, 7));
        }

        if ($authorization === '' || strlen($authorization) > 255 || preg_match('/[\r\n]/', $authorization)) {
            return null;
        }

        return $authorization;
    }

    /**
     * Verifica en base de datos si las credenciales son correctas
     *
     * @throws ExcepcionApi Lanza una excepcion si encuetra un error
     * @return ContentBody Respesta de la solicitud
     */
    public static function loguin()
    {
        try {
            $userLogin = JSONUtil::decodeJSON();
            $userBD = self::authenticate($userLogin->user, $userLogin->password);
            if ($userBD != NULL) {
                self::prepararContextoClarisa();
                $user = new User();
                $user->user = $userBD['user'];
                $user->roles = $userBD['roles'];
                $user->keyAPI = $userBD['keyAPI'];
                $bodyAnswer = new ContentBody(OK, ST200, $user);
                return $bodyAnswer;
            } else {
                $bodyAnswer = new ContentBody(FORBIDDEN, ST403, noAutheticate);
                return $bodyAnswer;
            }
        } catch (Exception $e) {
            throw new ExcepcionApi(INTERNAL_SERVER_ERROR, ST500, $e->getMessage());
        }
    }

    /**
     * Obtiene o renueva el contexto remoto sin alterar el contrato del login.
     *
     * Una indisponibilidad de Clarisa no invalida la autenticación local. Los
     * módulos de Panther continúan disponibles y una futura facturación deberá
     * volver a solicitar el contexto antes de utilizar el servicio externo.
     *
     * @return void
     */
    private static function prepararContextoClarisa()
    {
        try {
            $servicioCache = new ServicioCacheClarisa();
            $servicioCache->obtenerContexto();
        } catch (ExcepcionClarisa $excepcion) {
            error_log(
                '[Panther][Clarisa] Contexto remoto no disponible. Tipo: '
                . $excepcion->obtenerTipoError()
            );
        } catch (Throwable $excepcion) {
            error_log('[Panther][Clarisa] Contexto remoto no disponible.');
        }
    }

    /**
     * Verifica en base de datos si las credenciales son correctas
     *
     * @param unknown $userA
     *            Usuario a verificar
     * @param unknown $passwordPlain
     *            Contraseña Plana
     * @return mixed|NULL respuesta de la verificación
     */
    public static function authenticate($userA, $passwordPlain)
    {
        $query = SELECT_USER;

        $statement = Connection::getInstance()->getConnection()->prepare($query);
        $statement->bindParam(1, $userA);
        $statement->execute();
        $user = $statement->fetch();

        if ($user === false) {
            return null;
        }

        if (password_verify($passwordPlain, $user["password"])) {
            return $user;
        } else
            return null;
    }

    /**
     * Genera un hash seguro para la contraseña
     *
     * @param unknown $passwordPlain
     * @return string|NULL
     */
    public static function encrytPassword($passwordPlain)
    {
        if (! empty($passwordPlain))
            return password_hash($passwordPlain, PASSWORD_BCRYPT);
        else
            return null;
    }

    /**
     * Asigna de forma aleatoria una clave para la aplicación
     *
     * @return string
     */
    public static function getKeyAPI()
    {
        return bin2hex(random_bytes(16));
    }

    /**
     * Comprueba la existencia de la clave para la api
     *
     * @param
     *            $keyAPI
     * @return bool true si existe o false en caso contrario
     */
    public static function validateKeyAPI($keyAPI)
    {
        $query = VERIFY_KEYAPI;
        $statement = Connection::getInstance()->getConnection()->prepare($query);
        $statement->bindParam(1, $keyAPI);
        $statement->execute();
        return $statement->fetchColumn(0) > 0;
    }


}
