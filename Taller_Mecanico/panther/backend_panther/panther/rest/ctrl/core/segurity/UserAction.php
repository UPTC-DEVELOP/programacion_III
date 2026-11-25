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
     * @throws ExcepcionApi Lanza una excepcion si no encuentra el metodo
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
    // Obtener las cabeceras de la petición
    $heads = function_exists('getallheaders')
        ? getallheaders()
        : [];

    $keyAPI = null;

    // Buscar el token en las cabeceras
    foreach ($heads as $key => $value) {

        if (
            strcasecmp($key, 'Authorization') === 0 ||
            strcasecmp($key, 'Token') === 0 ||
            strcasecmp($key, 'Authorization-Token') === 0
        ) {
            $keyAPI = $value;
            break;
        }
    }

    // Buscar el token directamente en las variables del servidor
    if (empty($keyAPI)) {

        $keyAPI = $_SERVER['HTTP_AUTHORIZATION']
            ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
            ?? $_SERVER['HTTP_TOKEN']
            ?? null;
    }

    // Verificar que se haya recibido el token
    if (empty($keyAPI)) {

        throw new ExcepcionApi(
            BAD_REQUEST,
            ST400,
            error_KeyAPI
        );
    }

    // Eliminar Bearer si viene incluido en la cabecera
    $keyAPI = trim($keyAPI);

    if (stripos($keyAPI, 'Bearer ') === 0) {
        $keyAPI = trim(substr($keyAPI, 7));
    }

    // Verificar que el token no esté vacío
    if (empty($keyAPI)) {

        throw new ExcepcionApi(
            BAD_REQUEST,
            ST400,
            error_KeyAPI
        );
    }

    // Validar el token recibido
    if (UserAction::validateKeyAPI($keyAPI)) {

        // Token válido
        $bodyAnswer = new ContentBody(
            OK,
            ST200,
            'successful'
        );

        return $bodyAnswer;

    } else {

        // Token inválido
        throw new ExcepcionApi(
            UNAUTHORIZED,
            ST401,
            error_KeyAPI
        );
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
        
        if ($user && password_verify($passwordPlain, $user["password"])) {
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
     * @param $keyAPI
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