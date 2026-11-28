<?php
declare(strict_types=1);
namespace panther\ctrl\core\segurity;
use PDO;
use Exception;

/**
 * <b>Descripción:</b> Clase que <br/>
 * Gestiona la seguridad y autenticación de los usuarios en el framework Panther.
 * Implementa las operaciones definidas por la interfaz IRequest, aunque la mayoría
 * de métodos CRUD no aplican para este contexto (solo se utiliza el método POST para login).
 *
 * <b>Caso de Uso:</b> PANTHER-Seguridad <br/>
 * <b>Versión:</b> Actualización Panther 2025 - Compatible con PHP 8.4 <br/>
 *
 * Esta clase tiene como finalidad validar credenciales, generar claves de sesión (keyAPI)
 * y verificar la autorización de las peticiones entrantes mediante tokens.
 *
 * @author
 *     Josué Nicolás Pinzón Villamil
 * @updated
 *     Actualizado por Proyecto Actualización Panther 2025
 */
use panther\cxn\Connection;
use panther\util\ClarisaConfig;
use panther\util\ClarisaService;
use panther\util\ClarisaTokenStore;
use panther\util\ExcepcionAPI;
use panther\util\ContentBody;
use panther\util\JSONUtil;
use panther\util\Status;
use panther\model\core\segurity\User;
use panther\ctrl\core\commun\IRequest;
use panther\querys\core\UserQueries;
use Throwable;

class UserAction implements IRequest
{
    /**
     * ------------------------------------------------------------
     * CONSTANTES DE LA CLASE
     * ------------------------------------------------------------
     * LOGIN: Define el nombre del método asociado a la autenticación
     * de usuario en el flujo de peticiones REST (POST /userAction/login).
     */
    private const LOGIN = 'login';
    private const CLARISA_AUTH = 'clarisa-auth';

    /**
     * ------------------------------------------------------------
     * MÉTODO: get
     * ------------------------------------------------------------
     * Método definido por IRequest.
     * En esta clase no aplica, ya que UserAction solo gestiona login
     * y autenticación, no lectura directa de información vía GET.
     *
     * @param array $request Parámetros de la solicitud GET.
     * @return ContentBody Respuesta estándar indicando que el método no está disponible.
     */
    public function get(array $request): mixed
    {
        return new ContentBody(Status::NO_CONTENT, Status::ST204, 'Método GET no implementado para UserAction.');
    }

    /**
     * ------------------------------------------------------------
     * MÉTODO: delete
     * ------------------------------------------------------------
     * No aplica en este contexto, ya que la eliminación de usuarios
     * o tokens se gestiona en otros controladores del sistema.
     *
     * @return ContentBody Respuesta estándar sin contenido.
     */
    public function delete(array $request): mixed
    {
        return new ContentBody(Status::NO_CONTENT, Status::ST204, 'Método DELETE no implementado para UserAction.');
    }

    /**
     * ------------------------------------------------------------
     * MÉTODO: put
     * ------------------------------------------------------------
     * Método definido por IRequest. En este caso, no se utiliza
     * porque UserAction no actualiza información de usuario, solo
     * autentica credenciales.
     *
     * @param array $request Datos de la solicitud PUT.
     * @return ContentBody Respuesta estándar sin contenido.
     */
    public function put(array $request): mixed
    {
        return new ContentBody(Status::NO_CONTENT, Status::ST204, 'Método PUT no implementado para UserAction.');
    }

    /**
     * ------------------------------------------------------------
     * MÉTODO: post
     * ------------------------------------------------------------
     * Punto de entrada principal para las peticiones tipo POST.
     * Si el primer parámetro de la solicitud corresponde a "login",
     * se invoca el método interno que realiza la autenticación.
     *
     * @param array $request Contiene la ruta o acción solicitada.
     * @return ContentBody Objeto con la respuesta de la solicitud.
     * @throws ExcepcionApi Si el método solicitado no existe o es inválido.
     */
    public function post(array $request): ContentBody
    {
        if (!isset($request[0])) {
            throw new ExcepcionApi(Status::BAD_REQUEST, Status::ST400, 'Solicitud inválida.');
        }

        if ($request[0] === self::LOGIN) {
            return $this->login();
        }

        if ($request[0] === self::CLARISA_AUTH) {
            return $this->reautenticarClarisa();
        }

        throw new ExcepcionApi(Status::NOT_FOUND, Status::ST404, 'Método no encontrado en UserAction.');
    }

    /**
     * ------------------------------------------------------------
     * MÉTODO: login
     * ------------------------------------------------------------
     * Valida las credenciales de acceso enviadas por el cliente.
     * Si el usuario y la contraseña son correctos, retorna un objeto
     * con los datos del usuario y su clave de autenticación (keyAPI).
     *
     * @return ContentBody Respuesta con los datos del usuario autenticado.
     * @throws ExcepcionApi Si ocurre un error interno en la conexión o consulta.
     */
    public static function login(): ContentBody
    {
        try {
            // Decodifica el cuerpo JSON de la solicitud
            $userLogin = JSONUtil::decodeJSON();

            // Autentica el usuario consultando la base de datos
            $userBD = self::authenticate($userLogin->user, $userLogin->password);

            if ($userBD !== null) {
                $rol = strtoupper(trim((string) ($userBD['roles'] ?? '')));
                if ($rol === '') {
                    $rol = 'MECANICO';
                }

                $user = new User();
                $user->setId((int) $userBD['id']);
                $user->setUser((string) $userBD['user']);
                $user->setRoles($rol);
                $user->setKeyAPI((string) $userBD['keyAPI']);

                $payload = $user->jsonSerialize();
                $payload['clarisaAuth'] = null;
                $payload['clarisaToken'] = null;

                if ($rol === 'ADMIN') {
                    $payload = array_merge($payload, self::intentarAuthClarisa((string) $userBD['keyAPI']));
                }

                return new ContentBody(Status::OK, Status::ST200, $payload);
            }

            // En caso de credenciales incorrectas
            return new ContentBody(Status::FORBIDDEN, Status::ST403, 'Credenciales incorrectas.');
        } catch (Exception $e) {
            throw new ExcepcionApi(Status::INTERNAL_SERVER_ERROR, Status::ST500, $e->getMessage());
        }
    }

    public function reautenticarClarisa(): ContentBody
    {
        UserAction::authenticator();
        $keyAPI = self::obtenerKeyAPIDeCabecera();
        if ($keyAPI === null) {
            throw new ExcepcionApi(Status::UNAUTHORIZED, Status::ST401, 'Sesión Panther no válida.');
        }

        $resultado = self::intentarAuthClarisa($keyAPI);
        return new ContentBody(Status::OK, Status::ST200, $resultado);
    }

    /** @return array{clarisaAuth: array{ok: bool, mensaje: string}, clarisaToken: ?string} */
    public static function intentarAuthClarisa(string $keyAPI): array
    {
        if (!ClarisaConfig::credencialesConfiguradas()) {
            return [
                'clarisaAuth' => [
                    'ok' => false,
                    'mensaje' => 'Faltan las credenciales de Clarisa en ClarisaConfig.php.',
                ],
                'clarisaToken' => null,
            ];
        }

        try {
            $servicio = new ClarisaService();
            $auth = $servicio->autenticar();
            ClarisaTokenStore::save($keyAPI, $auth['token']);
            return [
                'clarisaAuth' => [
                    'ok' => true,
                    'mensaje' => $auth['message'] !== '' ? $auth['message'] : 'Conectado a Clarisa.',
                ],
                'clarisaToken' => $auth['token'],
            ];
        } catch (Throwable $e) {
            ClarisaTokenStore::forget($keyAPI);
            return [
                'clarisaAuth' => [
                    'ok' => false,
                    'mensaje' => $e->getMessage(),
                ],
                'clarisaToken' => null,
            ];
        }
    }

    public static function obtenerKeyAPIDeCabecera(): ?string
    {
        $headers = function_exists('apache_request_headers')
            ? apache_request_headers()
            : (function_exists('getallheaders') ? getallheaders() : []);

        $normalizedHeaders = array_change_key_case($headers ?: [], CASE_LOWER);
        $authHeader = $normalizedHeaders['authorization']
            ?? $normalizedHeaders['keyapi']
            ?? $_SERVER['HTTP_AUTHORIZATION']
            ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
            ?? $_SERVER['HTTP_KEYAPI']
            ?? null;

        if ($authHeader === null || trim((string) $authHeader) === '') {
            return null;
        }

        $keyAPI = trim((string) $authHeader);
        if (stripos($keyAPI, 'Bearer ') === 0) {
            $keyAPI = trim(substr($keyAPI, 7));
        }

        return $keyAPI !== '' ? $keyAPI : null;
    }

    /**
     * ------------------------------------------------------------
     * MÉTODO: authenticate
     * ------------------------------------------------------------
     * Verifica las credenciales del usuario contra la base de datos.
     * Se utiliza una consulta preparada para evitar inyección SQL.
     *
     * @param string $userA Nombre de usuario.
     * @param string $passwordPlain Contraseña sin encriptar.
     * @return array|null Datos del usuario si existe, o null si no coincide.
     */
    public static function authenticate(string $userA, string $passwordPlain): ?array
    {
        $query = UserQueries::SELECT;
        $pdo = Connection::getInstance()->getConnection();

        $statement = $pdo->prepare($query);
        $statement->bindParam(1, $userA, PDO::PARAM_STR);
        $statement->execute();

        $user = $statement->fetch(PDO::FETCH_ASSOC);

        // Verifica la contraseña mediante password_verify
        if ($user && password_verify($passwordPlain, $user['password'])) {
            return $user;
        }

        return null;
    }

    /**
     * ------------------------------------------------------------
     * MÉTODO: encryptPassword
     * ------------------------------------------------------------
     * Encripta una contraseña de texto plano utilizando el algoritmo BCRYPT.
     *
     * @param string $passwordPlain Contraseña original.
     * @return string|null Contraseña encriptada o null si está vacía.
     */
    public static function encryptPassword(string $passwordPlain): ?string
    {
        return !empty($passwordPlain)
            ? password_hash($passwordPlain, PASSWORD_BCRYPT)
            : null;
    }

    /**
     * ------------------------------------------------------------
     * MÉTODO: getKeyAPI
     * ------------------------------------------------------------
     * Genera una clave única de autenticación para el usuario.
     * Se utiliza una combinación de microtiempo y un número aleatorio.
     *
     * @return string Clave API generada.
     */
    public static function getKeyAPI(): string
    {
        return md5(microtime(true) . random_int(1000, 9999));
    }

    /**
     * ------------------------------------------------------------
     * MÉTODO: validateKeyAPI
     * ------------------------------------------------------------
     * Verifica si una clave API (token) existe y es válida en la base de datos.
     *
     * @param string $keyAPI Clave de autenticación enviada por el cliente.
     * @return bool true si la clave existe, false en caso contrario.
     */
    public static function validateKeyAPI(string $keyAPI): bool
    {
        $query = UserQueries::VERIFY_KEYAPI;
        $pdo = Connection::getInstance()->getConnection();

        $statement = $pdo->prepare($query);
        $statement->bindParam(1, $keyAPI, PDO::PARAM_STR);
        $statement->execute();

        return $statement->fetchColumn() > 0;
    }

    /**
     * ------------------------------------------------------------
     * MÉTODO: authenticator
     * ------------------------------------------------------------
     * Valida que la solicitud HTTP contenga una cabecera Authorization
     * con un token válido. Si la clave no es válida o no existe, lanza
     * una excepción con el código de error correspondiente.
     *
     * @return ContentBody Respuesta de autenticación exitosa.
     * @throws ExcepcionApi Si no se encuentra la cabecera o la clave no es válida.
     */
    public static function authenticator(): ContentBody
    {
        // Obtiene las cabeceras HTTP, compatible con Apache, Nginx y php -S
        $headers = function_exists('apache_request_headers')
            ? apache_request_headers()
            : (function_exists('getallheaders') ? getallheaders() : []);

        $normalizedHeaders = array_change_key_case($headers ?: [], CASE_LOWER);
        $authHeader = $normalizedHeaders['authorization']
            ?? $normalizedHeaders['keyapi']
            ?? $_SERVER['HTTP_AUTHORIZATION']
            ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
            ?? $_SERVER['HTTP_KEYAPI']
            ?? null;

        if ($authHeader === null || trim((string) $authHeader) === '') {
            throw new ExcepcionApi(Status::UNAUTHORIZED, Status::ST401, 'Falta iniciar sesión en Panther (cabecera Authorization o keyAPI requerida).');
        }

        $keyAPI = trim((string) $authHeader);
        if (stripos($keyAPI, 'Bearer ') === 0) {
            $keyAPI = trim(substr($keyAPI, 7));
        }

        // Valida la clave API en la base de datos
        if (self::validateKeyAPI($keyAPI)) {
            return new ContentBody(Status::OK, Status::ST200, 'Autenticación exitosa.');
        }

        throw new ExcepcionApi(Status::UNAUTHORIZED, Status::ST401, 'Token de acceso inválido.');
    }
}
