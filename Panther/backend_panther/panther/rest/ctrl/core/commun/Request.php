<?php

/**
 * <b>Descripcion:</b> Clase que <br/>Gestiona las solicitudes tipo CRUD de un elemento
 * <b>Caso de Uso:</b> PANTHER-Seguridad <br/>
 *
 * @author Josué Nicolás Pinzón Villamil <a href = "mailto:jpinzon@j4sysol.com">jpinzon@j4sysol.com</a>
 */
abstract class Request
{

    /**
     * Nombre de la tabla del negocio
     *
     * @var string
     */
    protected static $nameTable = "table";

    /**
     * Comando para insertar en base de datos
     *
     * @var string
     */
    protected static $queryInsert = "insert";

    /**
     * Comando para insertar en base de datos
     *
     * @var string
     */
    protected static $queryUpdate = "update";

    /**
     * Función que permite insertar dinamicamente el nombre de la tabla
     */
    abstract static function init();

    /**
     * Inserta los parametros en el statement y realiza
     * validaciones previas antes de insertar
     *
     * @param unknown $object
     *            Objeto insertar o actualizar
     * @param unknown $statement
     *            Sentencia para ejecutar en base de datos
     */
    abstract static function insertParameter($object, $statement);

    /**
     * Inserta los parametros en el statement y realiza
     * validaciones previas antes de insertar
     *
     * @param unknown $object
     *            Objeto insertar o actualizar
     * @param unknown $statement
     *            Sentencia para ejecutar en base de datos
     */
    abstract static function updateParameter($object, $statement, $id);

    /**
     * Método que invoca a las funciones tipo get
     *
     * @param unknown $request
     * @return ContentBody
     */
    public static function get($request)
    {
        UserAction::authenticator();
        if (empty($request[0])) {
            return self::getRequest(null);
        } else {
            return self::getRequest($request);
        }
    }

    /**
     * Método que invoca a las funciones tipo get
     *
     * @param unknown $request
     * @return ContentBody
     */
    public static function post($request)
    {
        UserAction::authenticator();
        $object = \JSONUtil::decodeJSON();
        self::createRequest($object);
        $bodyAnswer = new ContentBody(CREATE, ST201, sucessful);
        
        return $bodyAnswer;
    }

    /**
     * Método que invoca a las funciones tipo put
     *
     * @param unknown $request
     * @throws ExcepcionApi
     * @return ContentBody
     */
    public static function put($request)
    {
        UserAction::authenticator();
        $object = \JSONUtil::decodeJSON();
        $tempo = self::updateRequest($object, $request[0]);
        
        if ($tempo > 0) {
            return $bodyAnswer = new ContentBody(OK, ST200, sucessful);
        } else {
            throw new ExcepcionApi(NO_CONTENT, ST204, error_notExist);
        }
    }

    public static function delete($request)
    {
        UserAction::authenticator();
        self::deleteRequest($request);
        return $bodyAnswer = new ContentBody(OK, ST200, sucessful);
    }

    /**
     * Ejecuta las peticiones tipo get, obteniendo
     *
     * @param unknown $id
     * @throws ExcepcionApi
     * @return ContentBody
     */
    private static function getRequest($id)
    {
        try {
            if (empty($id)) {
                $query = "SELECT * FROM " . self::$nameTable;
                // Preparar sentencia
                $statement = Connection::getInstance()->getConnection()->prepare($query);
            } else {
                $query = "SELECT * FROM " . self::$nameTable . " WHERE id=?";
                // Preparar statement
                $statement = Connection::getInstance()->getConnection()->prepare($query);
                // Ligar id
                $statement->bindParam(1, $id[0], PDO::PARAM_INT);
            }
            
            // Ejecutar sentencia preparada
            $statement->execute();
            $tempo = $statement->fetchAll(PDO::FETCH_ASSOC);
            
            if (count($tempo) > 0) {
                $bodyAnswer = new ContentBody(OK, ST200, $tempo);
                return $bodyAnswer;
            } else {
                throw new ExcepcionApi(NO_CONTENT, ST204, no_result);
            }
        } catch (Exception $e) {
            throw new ExcepcionApi(INTERNAL_SERVER_ERROR, ST500, $e->getMessage());
        }
    }

    /**
     *
     * @param unknown $object
     * @throws ExcepcionApi
     * @return string
     */
    private static function createRequest($object)
    {
        try {
            $pdo = Connection::getInstance()->getConnection();
            // statement INSERT
            $query = self::$queryInsert;
            // Preparar la statement
            $statement = $pdo->prepare($query);
            static::insertParameter($object, $statement);
            $statement->execute();
            // Retornar en el útimo id insertado
            return $pdo->lastInsertId();
        } catch (Exception $e) {
            throw new ExcepcionApi(INTERNAL_SERVER_ERROR, ST500, $e->getMessage());
        }
    }

    /**
     * Actualiza un recurso según su id
     *
     * @param float $id
     * @param unknown $object
     * @throws ExcepcionApi Lanza una excepcion si hay un error en la actualización
     * @return number Número de columna actualizada.
     */
    private static function updateRequest($object, $id)
    {
        try {
            // Creando consulta UPDATE
            $query = self::$queryUpdate;
            // Preparar la sentencia
            $statement = Connection::getInstance()->getConnection()->prepare($query);
            static::updateParameter($object, $statement, $id);
            // Ejecutar la sentencia
            $statement->execute();
            
            return $statement->rowCount();
        } catch (Exception $e) {
            throw new ExcepcionApi(INTERNAL_SERVER_ERROR, ST500, $e->getMessage());
        }
    }

    /**
     * Método para eliminar un elemento de forma suave
     *
     * @param unknown $id
     *            del elemento
     * @throws ExcepcionApi Lanza un error si hay problemas en la conexion
     * @return number Numero de filas Afeactadas
     */
    private static function deleteRequest($id)
    {
        try {
            
            if (empty($id[0])) {
                $query = "UPDATE " . self::$nameTable . " SET dateDelete = ? ";
                // Preparar sentencia
                $statement = Connection::getInstance()->getConnection()->prepare($query);
                $dateDelete = date('Y-m-d H:i:s');
                $statement->bindParam(1, $dateDelete, PDO::PARAM_STR);
            } else {
                $query = "UPDATE " . self::$nameTable . " SET dateDelete = ? WHERE id=?";
                // Preparar statement
                $statement = Connection::getInstance()->getConnection()->prepare($query);
                $dateDelete = date('Y-m-d H:i:s');
                $statement->bindParam(1, $dateDelete, PDO::PARAM_STR);
                $statement->bindParam(2, $id[0], PDO::PARAM_INT);
            }
            
            $statement->execute();
            
            return $statement->rowCount();
        } catch (Exception $e) {
            throw new ExcepcionApi(INTERNAL_SERVER_ERROR, ST500, $e->getMessage());
        }
    }
}

