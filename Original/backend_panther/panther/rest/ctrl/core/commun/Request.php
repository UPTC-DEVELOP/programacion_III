<?php

/**
 * <b>Descripcion:</b> Clase que <br/>Gestiona las solicitudes tipo CRUD de un elemento
 * <b>Caso de Uso:</b> PANTHER-Seguridad <br/>
 *
 * Version ampliada (fase 4): borrado logico real en los GET, ganchos de validacion
 * (validate / beforeDelete), consultas con JOIN (baseSelect), respuestas coherentes
 * (404 cuando no existe, 200 con lista vacia, id del registro creado) y proteccion
 * para que un DELETE sin id no borre toda la tabla.
 *
 * @author Josué Nicolás Pinzón Villamil <a href = "mailto:jpinzon@j4sysol.com">jpinzon@j4sysol.com</a>
 */
abstract class Request
{

    /** Nombre de la tabla del negocio */
    protected static $nameTable = "table";

    /** Comando para insertar en base de datos */
    protected static $queryInsert = "insert";

    /** Comando para actualizar en base de datos */
    protected static $queryUpdate = "update";

    /** Si la tabla tiene la columna dateDelete (borrado logico) */
    protected static $softDelete = true;

    /** Funcion que permite insertar dinamicamente el nombre de la tabla */
    abstract public static function init();

    /** Inserta los parametros en el statement (INSERT) */
    abstract public static function insertParameter($object, $statement);

    /** Inserta los parametros en el statement (UPDATE) */
    abstract public static function updateParameter($object, $statement, $id);

    // ------------------------------------------------------------------
    // Ganchos que las clases hijas pueden sobreescribir
    // ------------------------------------------------------------------

    /**
     * SELECT base. Las clases hijas pueden devolver un JOIN. La tabla principal debe
     * llamarse con el alias que devuelva prefix().
     */
    protected static function baseSelect()
    {
        return "SELECT * FROM " . static::$nameTable;
    }

    /** Prefijo (alias) de la tabla principal dentro de baseSelect, ej: "c." */
    protected static function prefix()
    {
        return "";
    }

    /** Valida el objeto antes de insertar/actualizar. Lanzar ExcepcionAPI si es invalido. */
    protected static function validate($object, $id = null)
    {
    }

    /** Se ejecuta antes de borrar. Lanzar ExcepcionAPI para impedir el borrado. */
    protected static function beforeDelete($id)
    {
    }

    // ------------------------------------------------------------------
    // Utilidades para las clases hijas
    // ------------------------------------------------------------------

    protected static function pdo()
    {
        return Connection::getInstance()->getConnection();
    }

    /** Lee una propiedad del objeto JSON (cadena recortada) o null si no viene */
    protected static function field($object, $name)
    {
        if (!is_object($object) || !isset($object->$name)) {
            return null;
        }
        $value = $object->$name;
        return is_string($value) ? trim($value) : $value;
    }

    /** Lanza un 400 con el mensaje */
    protected static function invalid($message)
    {
        throw new ExcepcionAPI(BAD_REQUEST, ST400, $message);
    }

    /** Lanza un 409 con el mensaje */
    protected static function conflict($message)
    {
        throw new ExcepcionAPI(CONFLICT, ST409, $message);
    }

    /**
     * Indica si existe un registro activo con ese valor en esa columna.
     *
     * @param string $column nombre de columna (solo letras, numeros y guion bajo)
     * @param mixed $exceptId id que se excluye (el del registro que se edita)
     */
    protected static function existsActive($table, $column, $value, $exceptId = null)
    {
        if (!preg_match('/^[A-Za-z_][A-Za-z0-9_]*$/', $table) || !preg_match('/^[A-Za-z_][A-Za-z0-9_]*$/', $column)) {
            throw new ExcepcionAPI(INTERNAL_SERVER_ERROR, ST500, "Nombre de tabla/columna invalido");
        }
        $sql = "SELECT COUNT(*) FROM $table WHERE $column = ? AND dateDelete IS NULL";
        $params = array($value);
        if ($exceptId !== null) {
            $sql .= " AND id <> ?";
            $params[] = $exceptId;
        }
        $st = self::pdo()->prepare($sql);
        $st->execute($params);
        return $st->fetchColumn() > 0;
    }

    // ------------------------------------------------------------------
    // Metodos HTTP
    // ------------------------------------------------------------------

    public static function get($request)
    {
        UserAction::authenticator();
        if (empty($request[0])) {
            return self::getRequest(null);
        }
        return self::getRequest($request);
    }

    public static function post($request)
    {
        UserAction::authenticator();
        $object = \JSONUtil::decodeJSON();
        if (!is_object($object)) {
            static::invalid(error_noParameter);
        }
        $id = self::createRequest($object);
        return new ContentBody(CREATE, ST201, array('message' => sucessful, 'id' => (int) $id));
    }

    public static function put($request)
    {
        UserAction::authenticator();
        if (empty($request[0])) {
            static::invalid(error_url);
        }
        $object = \JSONUtil::decodeJSON();
        if (!is_object($object)) {
            static::invalid(error_noParameter);
        }
        self::updateRequest($object, $request[0]);
        return new ContentBody(OK, ST200, sucessful);
    }

    public static function delete($request)
    {
        UserAction::authenticator();
        if (empty($request[0])) {
            // Antes un DELETE sin id marcaba como borrada TODA la tabla.
            static::invalid("Debe indicar el id del registro a eliminar");
        }
        self::deleteRequest($request);
        return new ContentBody(OK, ST200, sucessful);
    }

    // ------------------------------------------------------------------
    // Implementacion
    // ------------------------------------------------------------------

    private static function whereActive()
    {
        return static::$softDelete ? " WHERE " . static::prefix() . "dateDelete IS NULL" : " WHERE 1=1";
    }

    private static function getRequest($id)
    {
        try {
            $query = static::baseSelect() . self::whereActive();
            if (empty($id)) {
                $statement = self::pdo()->prepare($query . " ORDER BY " . static::prefix() . "id DESC");
            } else {
                $statement = self::pdo()->prepare($query . " AND " . static::prefix() . "id = ?");
                $statement->bindValue(1, (int) $id[0], PDO::PARAM_INT);
            }
            $statement->execute();
            $tempo = $statement->fetchAll(PDO::FETCH_ASSOC);

            if (empty($id)) {
                // Una tabla vacia NO es un error: lista vacia
                return new ContentBody(OK, ST200, $tempo);
            }
            if (count($tempo) === 0) {
                throw new ExcepcionAPI(NOT_FOUND, ST404, error_notExist);
            }
            return new ContentBody(OK, ST200, $tempo);
        } catch (ExcepcionAPI $e) {
            throw $e;
        } catch (Exception $e) {
            throw new ExcepcionAPI(INTERNAL_SERVER_ERROR, ST500, $e->getMessage());
        }
    }

    private static function createRequest($object)
    {
        try {
            static::validate($object, null);
            $pdo = self::pdo();
            $statement = $pdo->prepare(static::$queryInsert);
            static::insertParameter($object, $statement);
            $statement->execute();
            return $pdo->lastInsertId();
        } catch (ExcepcionAPI $e) {
            throw $e;
        } catch (Exception $e) {
            throw new ExcepcionAPI(INTERNAL_SERVER_ERROR, ST500, $e->getMessage());
        }
    }

    private static function updateRequest($object, $id)
    {
        try {
            $id = (int) $id;
            // El registro debe existir y estar activo
            $check = self::pdo()->prepare("SELECT COUNT(*) FROM " . static::$nameTable . " WHERE id = ?"
                . (static::$softDelete ? " AND dateDelete IS NULL" : ""));
            $check->execute(array($id));
            if ($check->fetchColumn() == 0) {
                throw new ExcepcionAPI(NOT_FOUND, ST404, error_notExist);
            }
            static::validate($object, $id);
            $statement = self::pdo()->prepare(static::$queryUpdate);
            static::updateParameter($object, $statement, $id);
            $statement->execute();
            // rowCount puede ser 0 si no cambio ningun dato: no es un error
            return $statement->rowCount();
        } catch (ExcepcionAPI $e) {
            throw $e;
        } catch (Exception $e) {
            throw new ExcepcionAPI(INTERNAL_SERVER_ERROR, ST500, $e->getMessage());
        }
    }

    private static function deleteRequest($id)
    {
        try {
            $id = (int) $id[0];
            $check = self::pdo()->prepare("SELECT COUNT(*) FROM " . static::$nameTable . " WHERE id = ?"
                . (static::$softDelete ? " AND dateDelete IS NULL" : ""));
            $check->execute(array($id));
            if ($check->fetchColumn() == 0) {
                throw new ExcepcionAPI(NOT_FOUND, ST404, error_notExist);
            }
            static::beforeDelete($id);
            if (static::$softDelete) {
                $statement = self::pdo()->prepare("UPDATE " . static::$nameTable . " SET dateDelete = ? WHERE id = ?");
                $statement->bindValue(1, date('Y-m-d H:i:s'), PDO::PARAM_STR);
                $statement->bindValue(2, $id, PDO::PARAM_INT);
            } else {
                $statement = self::pdo()->prepare("DELETE FROM " . static::$nameTable . " WHERE id = ?");
                $statement->bindValue(1, $id, PDO::PARAM_INT);
            }
            $statement->execute();
            return $statement->rowCount();
        } catch (ExcepcionAPI $e) {
            throw $e;
        } catch (Exception $e) {
            throw new ExcepcionAPI(INTERNAL_SERVER_ERROR, ST500, $e->getMessage());
        }
    }
}
