<?php

/**
 * <b>Descripcion:</b> Clase que <br/>Gestiona la seguridad de un usuario
 * <b>Caso de Uso:</b> PANTHER-Seguridad <br/>
 *
 * @author Josué Nicolás Pinzón Villamil <a href = "mailto:jpinzon@j4sysol.com">jpinzon@j4sysol.com</a>
 */
class UserAction 
{

    const CLARISA_LOGIN = "clarisa-login";
    const CLARISA_LOGIN_URL = "https://pru.clarisacloud.com:8443/seguridad/rest/api/v1/login";

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
        } elseif ($request[0] == self::CLARISA_LOGIN) {
            return self::loginClarisa();
        } else {
            throw new ExcepcionApi(NOT_FOUND, ST404, error_notExist);
        }
    }

    /**
     * Autentica contra Clarisacloud y guarda el token asociado al usuario.
     *
     * @return ContentBody
     * @throws ExcepcionApi
     */
    public static function loginClarisa()
    {
        date_default_timezone_set('America/Bogota');
        $credentials = JSONUtil::decodeJSON();
        if (!is_object($credentials) || !isset($credentials->usuario, $credentials->contrasenia)
            || !is_string($credentials->usuario) || !is_string($credentials->contrasenia)
            || trim($credentials->usuario) === "" || $credentials->contrasenia === "") {
            throw new ExcepcionApi(BAD_REQUEST, ST400, "Debe enviar usuario y contrasenia.");
        }

        $payload = json_encode(array(
            "usuario" => trim($credentials->usuario),
            "contrasenia" => $credentials->contrasenia
        ));
        $context = stream_context_create(array(
            "http" => array(
                "method" => "POST",
                "header" => "Content-Type: application/json\r\nAccept: application/json\r\n",
                "content" => $payload,
                "timeout" => 20,
                "ignore_errors" => true
            ),
            "ssl" => array(
                "verify_peer" => true,
                "verify_peer_name" => true
            )
        ));

        $remoteBody = @file_get_contents(self::CLARISA_LOGIN_URL, false, $context);
        $remoteStatus = self::getHttpStatusCode(
            isset($http_response_header) ? $http_response_header : array()
        );
        if ($remoteBody === false) {
            throw new ExcepcionApi(
                INTERNAL_SERVER_ERROR,
                ST500,
                "No fue posible conectar con Clarisacloud."
            );
        }

        $remoteResponse = json_decode($remoteBody);
        if ($remoteStatus >= 500) {
            throw new ExcepcionApi(
                INTERNAL_SERVER_ERROR,
                ST500,
                "Clarisacloud no pudo procesar la solicitud."
            );
        }
        if ($remoteStatus >= 400 || !is_object($remoteResponse)
            || empty($remoteResponse->success) || !isset($remoteResponse->data)
            || !is_object($remoteResponse->data)
            || !isset($remoteResponse->data->token)
            || !is_string($remoteResponse->data->token)
            || trim($remoteResponse->data->token) === "") {
            $detail = is_object($remoteResponse) && isset($remoteResponse->textResponse)
                && is_string($remoteResponse->textResponse)
                ? $remoteResponse->textResponse
                : "Credenciales inválidas.";
            return new ContentBody(FORBIDDEN, ST403, $detail);
        }

        $token = trim($remoteResponse->data->token);
        $username = isset($remoteResponse->data->usuario->userName)
            && is_string($remoteResponse->data->usuario->userName)
            ? trim($remoteResponse->data->usuario->userName)
            : trim($credentials->usuario);
        if ($username === "") {
            throw new ExcepcionApi(INTERNAL_SERVER_ERROR, ST500, "Clarisacloud no devolvió un usuario válido.");
        }

        $tokenDates = self::getTokenDates($remoteResponse->data, $token);

    try {
            $pdo = Connection::getInstance()->getConnection();
            
            // Usamos la constante para buscar el rol
            $roleQuery = $pdo->prepare(SELECT_ROLE_BY_NAME);
            $roleName = "user";
            $roleQuery->execute(array($roleName));
            $roleId = $roleQuery->fetchColumn();
            
            if ($roleId === false) {
                throw new ExcepcionApi(INTERNAL_SERVER_ERROR, ST500, "No existe el rol genérico 'user'.");
            }

            // Usamos la constante para la inserción o actualización (Upsert)
            $insert = $pdo->prepare(UPSERT_CLARISA_USER);
            
            $generatedPassword = bin2hex(random_bytes(32));
            $keyApi = self::getKeyAPI();
            
            $insert->execute(array(
                $username,
                self::encrytPassword($generatedPassword),
                $keyApi,
                $roleId,
                $token,
                $tokenDates["issued"],
                $tokenDates["expires"]
            ));
            $roleQuery = $pdo->prepare("SELECT roles FROM j4user WHERE user = ? AND dateDelete IS NULL LIMIT 1");
            $roleQuery->execute(array($username));
            $userRole = $roleQuery->fetchColumn();
        } catch (PDOException $e) {
            throw new ExcepcionApi(
                INTERNAL_SERVER_ERROR,
                ST500,
                "No fue posible guardar el token de Clarisacloud."
            );
        }

        $user = (object) array(
            "usuario" => isset($remoteResponse->data->usuario)
                ? $remoteResponse->data->usuario
                : (object) array("userName" => $username),
            "token" => $token,
            "keyAPI" => $keyApi,
            "roles" => (int) $userRole
        );
        return new ContentBody(OK, ST200, $user);
    }

    private static function getHttpStatusCode($headers)
    {
        $status = 0;
        foreach ($headers as $header) {
            if (preg_match('/^HTTP\/\S+\s+(\d{3})/', $header, $matches)) {
                $status = (int) $matches[1];
            }
        }
        return $status;
    }

    private static function getTokenDates($data, $token)
    {
        $issued = self::findTimestamp($data, array(
            "fecha_expedicion_token", "fechaExpedicionToken", "fechaExpedicion",
            "issuedAt", "issued_at", "tokenGeneratedAt"
        ));
        $expires = self::findTimestamp($data, array(
            "fecha_expiracion", "fechaExpiracion", "fechaExpiracionToken",
            "expiresAt", "expires_at", "tokenExpiresAt"
        ));

        $claims = self::decodeJwtClaims($token);
        if ($issued === null && $claims !== null) {
            $issued = self::findTimestamp($claims, array("iat"));
        }
        if ($expires === null && $claims !== null) {
            $expires = self::findTimestamp($claims, array("exp"));
        }
        if ($issued === null || $expires === null || $expires <= $issued) {
            throw new ExcepcionApi(
                INTERNAL_SERVER_ERROR,
                ST500,
                "Clarisacloud no devolvió fechas válidas de expedición y expiración del token."
            );
        }

        return array(
            "issued" =>date("Y-m-d H:i:s", $issued),
            "expires" =>gmdate("Y-m-d H:i:s", $expires)
        );
    }

    private static function findTimestamp($source, $keys)
    {
        foreach ($keys as $key) {
            if (is_object($source) && isset($source->$key)) {
                $value = $source->$key;
            } elseif (is_array($source) && isset($source[$key])) {
                $value = $source[$key];
            } else {
                continue;
            }

            if (is_numeric($value)) {
                $timestamp = (float) $value;
                if ($timestamp > 9999999999) {
                    $timestamp /= 1000;
                }
                return (int) $timestamp;
            }
            if (is_string($value)) {
                $timestamp = strtotime($value);
                if ($timestamp !== false) {
                    return $timestamp;
                }
            }
        }
        return null;
    }

    private static function decodeJwtClaims($token)
    {
        $token = preg_replace('/^Bearer\s+/i', '', $token);
        $parts = explode('.', $token);
        if (count($parts) < 2) {
            return null;
        }

        $payload = strtr($parts[1], '-_', '+/');
        $payload .= str_repeat('=', (4 - strlen($payload) % 4) % 4);
        $decoded = base64_decode($payload, true);
        if ($decoded === false) {
            return null;
        }

        $claims = json_decode($decoded);
        return is_object($claims) ? $claims : null;
    }

    /**
     * Otorga los permisos a un usuario para que acceda a los recursos
     *
     * @return null o el id del usuario autorizado
     * @throws Exception
     */
    public static function authenticator()
    {
        $heads = function_exists('apache_request_headers') ? apache_request_headers() : array();
        if (empty($heads) && function_exists('getallheaders')) {
            $heads = getallheaders();
        }
        $keyAPI = null;
        foreach ($heads ?: array() as $header => $value) {
            if (strcasecmp($header, AUTHORIZATION) === 0) {
                $keyAPI = trim((string) $value);
                break;
            }
        }
        if ($keyAPI !== null && $keyAPI !== "") {
            
            if (UserAction::validateKeyAPI($keyAPI)) {
                $bodyAnswer = new ContentBody(OK, 403, sucessful);
                return $bodyAnswer;
            } else {
                throw new ExcepcionApi(UNAUTHORIZED, ST401, error_KeyAPI);
            }
        } else {
            throw new ExcepcionApi(UNAUTHORIZED, ST401, error_KeyAPI);
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
            if (!is_object($userLogin)
                || !isset($userLogin->user, $userLogin->password)
                || !is_string($userLogin->user)
                || !is_string($userLogin->password)) {
                return new ContentBody(BAD_REQUEST, ST400, "Debe enviar user y password.");
            }
            $userBD = self::authenticate($userLogin->user, $userLogin->password);
            if ($userBD != NULL) {
                $user = new User();
                $user->id = (int) $userBD['id'];
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

        if (!is_array($user) || !isset($user["password"])) {
            return null;
        }
        
        if (password_verify($passwordPlain, $user["password"])) {
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

