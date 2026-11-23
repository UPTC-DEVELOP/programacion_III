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
     * Metodo que enlaza un usuario ya autenticado en Clarisa (modo "directo" del frontend)
     */
    const CLARISA_LINK = "clarisa-enlace";

    /**
     * {@inheritdoc}
     * @see IRequest::init()
     */
    public static function init()
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
        $action = isset($request[0]) ? $request[0] : '';
        if ($action == self::LOGIN) {
            return self::loguin();
        } elseif ($action == self::CLARISA_LINK) {
            return self::clarisaLink();
        } else {
            throw new ExcepcionApi(NOT_FOUND, ST404, error_notExist);
        }
    }

    /**
     * Otorga los permisos a un usuario para que acceda a los recursos
     *
     * @return null o el id del usuario autorizado
     * @throws Exception
     */
    public static function authenticator()
    {
        $keyAPI = self::readAuthorizationHeader();
        if ($keyAPI !== null && $keyAPI !== '') {
            if (UserAction::validateKeyAPI($keyAPI)) {
                return new ContentBody(OK, ST200, sucessful);
            }
            throw new ExcepcionApi(UNAUTHORIZED, ST401, error_KeyAPI);
        }
        throw new ExcepcionApi(BAD_REQUEST, ST400, error_KeyAPI);
    }

    /**
     * Lee la cabecera "authorization" sin importar mayusculas/minusculas ni el servidor
     * (Apache modulo, FastCGI/PHP-FPM como en InfinityFree, servidor embebido de PHP).
     *
     * @return string|null
     */
    public static function readAuthorizationHeader()
    {
        $heads = array();
        if (function_exists('apache_request_headers')) {
            $heads = apache_request_headers();
        } elseif (function_exists('getallheaders')) {
            $heads = getallheaders();
        }
        foreach ($heads as $name => $value) {
            if (strtolower($name) === AUTHORIZATION) {
                return trim($value);
            }
        }
        if (!empty($_SERVER['HTTP_AUTHORIZATION'])) {
            return trim($_SERVER['HTTP_AUTHORIZATION']);
        }
        if (!empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
            return trim($_SERVER['REDIRECT_HTTP_AUTHORIZATION']);
        }
        return null;
    }

    /**
     * Crea (o reutiliza) el usuario Panther asociado a un usuario de Clarisa y devuelve su keyAPI.
     * El usuario se guarda como "clarisa:<usuario>" con rol 2 y una clave aleatoria, por lo que
     * no puede iniciar sesion por useraction/login: solo entra a traves de Clarisa.
     *
     * @return User
     */
    public static function issueKeyForClarisaUser($usuario)
    {
        $name = 'clarisa:' . mb_strtolower(trim($usuario));
        $pdo = Connection::getInstance()->getConnection();
        $st = $pdo->prepare("SELECT user, roles, keyAPI FROM j4user WHERE user = ? AND dateDelete IS NULL");
        $st->execute(array($name));
        $row = $st->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            $key = self::getKeyAPI();
            $ins = $pdo->prepare(INTSERT_USER);
            $ins->execute(array($name, self::encrytPassword(bin2hex(random_bytes(16))), $key, 2));
            $row = array('user' => $name, 'roles' => 2, 'keyAPI' => $key);
        }
        $user = new User();
        $user->user = $row['user'];
        $user->roles = $row['roles'];
        $user->keyAPI = $row['keyAPI'];
        return $user;
    }

    /**
     * Modo "directo": el navegador ya inicio sesion contra Clarisa y pide su llave Panther.
     * Como el servidor no puede comprobar ese token, solo funciona si CLARISA_ENLACE_DIRECTO=1.
     */
    public static function clarisaLink()
    {
        if (!CLARISA_ENLACE_DIRECTO) {
            throw new ExcepcionApi(FORBIDDEN, ST403, "El enlace directo con Clarisa está desactivado. Use el modo proxy (clarisa/login).");
        }
        $body = JSONUtil::decodeJSON();
        $usuario = is_object($body) && isset($body->usuario) ? trim($body->usuario) : '';
        $token = is_object($body) && isset($body->token) ? (string) $body->token : '';
        if ($usuario === '' || mb_strlen($usuario) > 200 || strlen($token) < 10) {
            throw new ExcepcionApi(BAD_REQUEST, ST400, error_noParameter);
        }
        return new ContentBody(OK, ST200, self::issueKeyForClarisaUser($usuario));
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
            if (!is_object($userLogin) || !isset($userLogin->user) || !isset($userLogin->password)) {
                throw new ExcepcionApi(BAD_REQUEST, ST400, error_noParameter);
            }
            $userBD = self::authenticate($userLogin->user, $userLogin->password);
            if ($userBD != NULL) {
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
        } catch (ExcepcionApi $e) {
            throw $e;
        } catch (Exception $e) {
            throw new ExcepcionApi(INTERNAL_SERVER_ERROR, ST500, $e->getMessage());
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
        
        if ($user && password_verify((string) $passwordPlain, $user["password"])) {
            return $user;
        } else
            return null;
    }

    /**
     * Protege la contraseña con un algoritmo de encriptado
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
        return md5(microtime() . rand());
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

