<?php
declare(strict_types=1);
namespace panther\ctrl\core\commun;
use PDO;
use PDOStatement;
use Throwable;

use panther\ctrl\core\commun\IRequest;
use panther\cxn\Connection;
use panther\cxn\LoginMysql;
use panther\util\ExcepcionAPI;
use panther\util\Status;
use panther\util\ContentBody;
use panther\util\JSONUtil;
use panther\util\MessageUser;
use panther\ctrl\core\segurity\UserAction;


/**
 * ============================================================
 * Clase: Request (Abstracta)
 * ------------------------------------------------------------
 * Descripción:
 *  - Gestiona las solicitudes CRUD (Create, Read, Update, Delete)
 *    de las entidades del negocio dentro del framework Panther.
 *  - Define una estructura genérica para que las clases hijas
 *    implementen operaciones personalizadas de inserción o
 *    actualización mediante métodos abstractos.
 *
 * Caso de Uso:
 *  - PANTHER - Seguridad
 * ------------------------------------------------------------
 * @author
 *     Josué Nicolás Pinzón Villamil
 * @updated
 *     Actualizado por Proyecto Actualización Panther 2025
 * ============================================================
 */
abstract class Request
{
    /* ============================================================
       PROPIEDADES ESTÁTICAS
       ------------------------------------------------------------
       Definen configuraciones básicas y queries genéricas.
       ============================================================ */

    /** @var string Nombre de la tabla asociada al módulo */
    protected string $nameTable = "table";

    /** @var string Sentencia SQL para insertar registros */
    protected string $queryInsert = "INSERT INTO table (...) VALUES (...)";

    /** @var string Sentencia SQL para actualizar registros */
    protected string $queryUpdate = "UPDATE table SET ... WHERE id=?";
    // Columnas por defecto usadas por todas las clases hijas
    protected const COLUMNAS = '*'; // Definir columnas selccionadas

    /* ============================================================
       MÉTODOS ABSTRACTOS
       ------------------------------------------------------------
       Obligan a las clases hijas a definir su comportamiento
       específico según la tabla o negocio.
       ============================================================ */

    /**
     * Inserta parámetros en un statement preparado (INSERT)
     * @param mixed $object Datos a insertar
     * @param PDOStatement $statement Sentencia preparada
     */
    abstract public function insertParameter(object $object, PDOStatement $statement): void;

    /**
     * Inserta parámetros en un statement preparado (UPDATE)
     * @param mixed $object Datos a actualizar
     * @param PDOStatement $statement Sentencia preparada
     * @param int|string $id Identificador del registro
     */
    abstract public function updateParameter(object $object, PDOStatement $statement, int|string $id): void;


    /* ============================================================
       MÉTODOS CRUD PRINCIPALES (PÚBLICOS ESTÁTICOS)
       ------------------------------------------------------------
       Gestionan las operaciones REST: GET, POST, PUT, DELETE.
       ============================================================ */

    /**
     * Procesa una solicitud GET
     * @param array $request Parámetros de la URL
     * @return ContentBody Respuesta con los datos obtenidos
     * @throws ExcepcionApi Si ocurre un error en la consulta
     */
    public function get(array $request): ContentBody
    {
        UserAction::authenticator();
        return $this->getRequest($request ?? null);
    }

    /**
     * Procesa una solicitud POST
     * @param array $request Parámetros de la URL
     * @return ContentBody Respuesta confirmando la creación
     * @throws ExcepcionApi Si ocurre un error en la inserción
     */
    public function post(array $request): ContentBody
    {
        
        UserAction::authenticator();
        $object = JSONUtil::decodeJSON();
        $this->createRequest($object);
        return new ContentBody(Status::CREATE, Status::ST201, MessageUser::SUCCESSFUL);
    }

    /**
     * Procesa una solicitud PUT
     * @param array $request Parámetros de la URL
     * @return ContentBody Respuesta de actualización
     * @throws ExcepcionApi Si no existe el registro
     */
    public function put(array $request): ContentBody
    {
        // Validar que venga el ID
        $id = $request[0] ?? null;
        if ($id === null) {
            throw new ExcepcionAPI(
                Status::BAD_REQUEST,
                Status::ST400,
                "Falta el identificador del registro a actualizar."
            );
        }
        UserAction::authenticator();
        $object = JSONUtil::decodeJSON();
        $rows = $this->updateRequest($object, $id);
       
        if ($rows > 0) {
            return new ContentBody(Status::OK, Status::ST200, MessageUser::SUCCESSFUL);
        }

        throw new ExcepcionApi(Status :: NO_CONTENT, Status :: ST204, MessageUser::ERROR_NOT_EXIST);
    }

    /**
     * Procesa una solicitud DELETE (borrado suave)
     * @param array $request Parámetros de la URL
     * @return ContentBody Confirmación de eliminación
     * @throws ExcepcionApi Si ocurre un error en la conexión
     */
    public function delete(array $request): ContentBody
    {
        UserAction::authenticator();
        $this->deleteRequest($request);
        return new ContentBody(Status::OK, Status::ST200, MessageUser::SUCCESSFUL);
    }


    /* ============================================================
       MÉTODOS PRIVADOS DE SOPORTE (CRUD)
       ------------------------------------------------------------
       Ejecutan la lógica interna de base de datos usando PDO.
       ============================================================ */

    /**
     * Ejecuta una solicitud GET
     * @param int|string|null $id Identificador del recurso (opcional)
     * @return ContentBody Respuesta con los datos obtenidos
     * @throws ExcepcionApi Si no se encuentran resultados o ocurre un error
     */
   private function getRequest(array $request): ContentBody
{
    $columnas = static::COLUMNAS;

    try {
        $pdo = Connection::getInstance()->getConnection();

        // 🔹 CASO SIN FILTRO → LISTAR TODO
        if (count($request) === 0) {

            $query = "SELECT $columnas FROM " . $this->nameTable . " 
                      WHERE dateDelete IS NULL ORDER BY id DESC";
            $statement = $pdo->prepare($query);
        }

        // 🔹 CASO CON FILTRO → COLUMNA / VALOR
        else {

            $column = $request[0] ?? null;
            $value  = $request[1] ?? null;

            if (!$column || !$value) {
                throw new ExcepcionApi(
                    Status::BAD_REQUEST,
                    Status::ST400,
                    "Parámetros de búsqueda incompletos"
                );
            }

            // 🧠 OPERADOR AUTOMÁTICO
            $operator = ($column === 'id') ? '=' : 'LIKE';
            $bindValue = ($operator === '=') ? $value : "%$value%";

            $query = "SELECT $columnas FROM " . $this->nameTable . " 
                      WHERE $column $operator ? 
                      AND dateDelete IS NULL ORDER BY id DESC";

            $statement = $pdo->prepare($query);
            $statement->bindValue(1, $bindValue);
        }

        $statement->execute();
        $result = $statement->fetchAll(PDO::FETCH_ASSOC);

        if (!empty($result)) {
            return new ContentBody(Status::OK, Status::ST200, $result);
        }

        throw new ExcepcionApi(
            Status::NO_CONTENT,
            Status::ST204,
            MessageUser::NO_RESULT
        );

    } catch (Throwable $e) {
        throw new ExcepcionApi(
            Status::INTERNAL_SERVER_ERROR,
            Status::ST500,
            $e->getMessage()
        );
    }
}


    /**
     * Crea un nuevo registro en la base de datos
     * @param object $object Datos a insertar
     * @return int|string ID del nuevo registro
     * @throws ExcepcionApi Si ocurre un error durante la inserción
     */
    private function createRequest(object $object): int|string
    {
        try {
            $pdo = Connection::getInstance()->getConnection();
            $statement = $pdo->prepare($this->queryInsert);
            $this->insertParameter($object, $statement);
            $statement->execute();
            return $pdo->lastInsertId();
        } catch (Throwable $e) {
            throw new ExcepcionApi(Status::INTERNAL_SERVER_ERROR, Status::ST500, $e->getMessage());
        }
    }

    /**
     * Actualiza un registro existente
     * @param object $object Datos actualizados
     * @param int|string $id Identificador del registro
     * @return int Número de filas afectadas
     * @throws ExcepcionApi Si ocurre un error en la actualización
     */
    private function updateRequest(object $object, int|string $id): int
    {
        try {
            $pdo = Connection::getInstance()->getConnection();
            $statement = $pdo->prepare($this->queryUpdate);
            $this->updateParameter($object, $statement, $id);
            $statement->execute();
            return $statement->rowCount();
        } catch (Throwable $e) {
            throw new ExcepcionApi(Status::INTERNAL_SERVER_ERROR, Status::ST500, $e->getMessage());
        }
    }

    /**
     * Elimina (de forma suave) un registro
     * @param array $id Parámetro de identificación
     * @return int Número de filas afectadas
     * @throws ExcepcionApi Si ocurre un error en la ejecución
     */
    private function deleteRequest(array $id): int
    {
        try {
            $pdo = Connection::getInstance()->getConnection();
            $dateDelete = date('Y-m-d H:i:s');

            if (empty($id[0])) {
                $query = "UPDATE " . $this->nameTable . " SET dateDelete = ?";
                $statement = $pdo->prepare($query);
                $statement->bindValue(1, $dateDelete, PDO::PARAM_STR);
            } else {
                $query = "UPDATE " . $this->nameTable . " SET dateDelete = ? WHERE id = ?";
                $statement = $pdo->prepare($query);
                $statement->bindValue(1, $dateDelete, PDO::PARAM_STR);
                $statement->bindValue(2, (int)$id[0], PDO::PARAM_INT);
            }

            $statement->execute();
            return $statement->rowCount();
        } catch (Throwable $e) {
            throw new ExcepcionApi(Status::INTERNAL_SERVER_ERROR, Status::ST500, $e->getMessage());
        }
    }
}
?>
