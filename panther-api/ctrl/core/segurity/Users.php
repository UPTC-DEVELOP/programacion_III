<?php

/**
 * <b>Descripcion:</b> Clase que <br/>Gestiona los usuarios de la aplicación
 * <b>Caso de Uso:</b> PANTHER-Seguridad <br/>
 *
 * @author Josué Nicolás Pinzón Villamil <a href = "mailto:jpinzon@j4sysol.com">jpinzon@j4sysol.com</a>
 */
class Users extends Request
{

    /**
     * Datos de la tabla "usuario"
     *
     * @var string
     */
    const NAME_TABLE = "j4user";

    /**
     *
     * {@inheritdoc}
     * @see Request::init()
     */
    public static function init()
    {
        parent::$nameTable = self::NAME_TABLE;
        parent::$queryInsert = INTSERT_USER;
        parent::$queryUpdate = UPDATE_USER;
    }

    public static function put($request)
    {
        if (isset($request[0]) && $request[0] === 'change-password') {
            return self::changePassword();
        }

        return parent::put($request);
    }

    private static function changePassword(): ContentBody
    {
        UserAction::authenticator();
        $headers = function_exists('apache_request_headers') ? apache_request_headers() : array();
        if (empty($headers) && function_exists('getallheaders')) {
            $headers = getallheaders();
        }
        $token = '';
        foreach ($headers as $name => $value) {
            if (strcasecmp((string) $name, 'Authorization') === 0) {
                $token = trim((string) $value);
                break;
            }
        }
        if ($token === '' && !empty($_SERVER['HTTP_AUTHORIZATION'])) {
            $token = trim((string) $_SERVER['HTTP_AUTHORIZATION']);
        }

        $body = json_decode(file_get_contents('php://input'));
        if (!is_object($body) || !isset($body->current_password, $body->new_password)
            || !is_string($body->current_password) || !is_string($body->new_password)) {
            throw new ExcepcionApi(BAD_REQUEST, ST400, "Debe indicar current_password y new_password.");
        }
        if (strlen($body->new_password) < 8) {
            throw new ExcepcionApi(BAD_REQUEST, ST400, "La nueva contraseña debe tener al menos 8 caracteres.");
        }

        $pdo = Connection::getInstance()->getConnection();
        $statement = $pdo->prepare(
            "SELECT id, password, token_clarisa FROM j4user WHERE keyAPI = ? AND dateDelete IS NULL LIMIT 1"
        );
        $statement->execute(array($token));
        $usuario = $statement->fetch(PDO::FETCH_ASSOC);
        if (!$usuario) {
            throw new ExcepcionApi(UNAUTHORIZED, ST401, "La sesión no es válida.");
        }
        if (!empty($usuario['token_clarisa'])) {
            throw new ExcepcionApi(
                FORBIDDEN,
                ST403,
                "La contraseña de esta cuenta se administra en Clarisacloud."
            );
        }
        if (!password_verify($body->current_password, $usuario['password'])) {
            throw new ExcepcionApi(FORBIDDEN, ST403, "La contraseña actual es incorrecta.");
        }

        $update = $pdo->prepare("UPDATE j4user SET password = ? WHERE id = ?");
        $update->execute(array(
            UserAction::encrytPassword($body->new_password),
            (int) $usuario['id']
        ));

        return new ContentBody(OK, ST200, "Contraseña actualizada correctamente.");
    }

    /**
     *
     * {@inheritdoc}
     * @see Request::insertParameter()
     */
    public static function insertParameter($object, $statement)
    {
        $encryptPassword = UserAction::encrytPassword($object->password);
        $keyApi = UserAction::getKeyAPI();
        
        $statement->bindParam(1, $object->user);
        $statement->bindParam(2, $encryptPassword);
        $statement->bindParam(3, $keyApi);
        $statement->bindParam(4, $object->roles);
    }

    /**
     *
     * {@inheritdoc}
     * @see Request::updateParameter()
     */
    public static function updateParameter($object, $statement, $id)
    {
        $encryptPassword = UserAction::encrytPassword($object->password);
        $keyApi = UserAction::getKeyAPI();
        $statement->bindParam(1, $encryptPassword);
        $statement->bindParam(2, $keyApi);
        $statement->bindParam(3, $object->roles);
        $statement->bindParam(4, $id);
    }
}
?>