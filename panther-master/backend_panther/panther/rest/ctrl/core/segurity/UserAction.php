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
        if ($request[0] == self::LOGIN) {
            return self::loguin();
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
        // Los navegadores pueden enviar "Authorization" o "authorization":
        // se normalizan las cabeceras a minúsculas para no depender de eso
        $heads = function_exists('apache_request_headers')
            ? array_change_key_case(apache_request_headers(), CASE_LOWER)
            : array();
        // Respaldo para hostings que no tienen apache_request_headers()
        // o que solo entregan la cabecera como variable de entorno (.htaccess)
        if (empty($heads[AUTHORIZATION])) {
            foreach (array('HTTP_AUTHORIZATION', 'REDIRECT_HTTP_AUTHORIZATION') as $var) {
                if (! empty($_SERVER[$var])) {
                    $heads[AUTHORIZATION] = $_SERVER[$var];
                    break;
                }
            }
        }
        if (! empty($heads[AUTHORIZATION])) {
            $keyAPI = $heads[AUTHORIZATION];
            
            if (UserAction::validateKeyAPI($keyAPI)) {
                $bodyAnswer = new ContentBody(OK, 403, sucessful);
                return $bodyAnswer;
            } else {
                throw new ExcepcionApi(UNAUTHORIZED, ST401, error_KeyAPI);
            }
        } else {
            throw new ExcepcionApi(BAD_REQUEST, ST400, error_KeyAPI);
        }
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

        // Usuario inexistente: fetch() devuelve false
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

