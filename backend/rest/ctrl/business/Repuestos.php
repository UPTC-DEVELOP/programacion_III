<?php
declare(strict_types=1);

namespace panther\ctrl\business;

use panther\ctrl\core\commun\Request;
use panther\ctrl\core\segurity\UserAction;
use panther\cxn\Connection;
use panther\querys\business\RepuestosQueries;
use panther\util\ContentBody;
use panther\util\ExcepcionAPI;
use panther\util\JSONUtil;
use panther\util\MessageUser;
use panther\util\Status;
use PDO;
use PDOStatement;

/**
 * <b>Descripción:</b> Clase que <br/>
 * Gestiona las operaciones CRUD de la entidad "Repuesto" en la base de datos.
 * Implementa los métodos definidos en la clase abstracta Request,
 * especificando las consultas y parámetros propios de la tabla "repuestos".
 *
 * <b>Caso de Uso:</b> PANTHER - Business <br/>
 * <b>Versión:</b> Actualización Panther 2025 - Compatible con PHP 8.4 <br/>
 *
 * @author
 *     Josué Nicolás Pinzón Villamil
 * @updated
 *     Actualizado por Proyecto Actualización Panther 2025
 */
class Repuestos extends Request
{
    private const NAME_TABLE = 'repuestos';

    protected const COLUMNAS = 'id, referencia, descripcion, marca, precio';

    private const COLUMNAS_BUSQUEDA = ['id', 'referencia', 'descripcion', 'marca'];

    public function __construct()
    {
        $this->nameTable = self::NAME_TABLE;
        $this->queryInsert = RepuestosQueries::INSERT;
        $this->queryUpdate = RepuestosQueries::UPDATE;
    }

    public function get(array $request): ContentBody
    {
        UserAction::authenticator();
        $pdo = Connection::getInstance()->getConnection();

        if (count($request) === 0) {
            $query = "SELECT " . self::COLUMNAS . " FROM " . $this->nameTable . " WHERE dateDelete IS NULL ORDER BY id DESC";
            $statement = $pdo->prepare($query);
        } else {
            $column = $request[0] ?? '';
            $value = $request[1] ?? '';

            if (!in_array($column, self::COLUMNAS_BUSQUEDA, true) || $value === '') {
                throw new ExcepcionAPI(Status::BAD_REQUEST, Status::ST400, "Parámetros de búsqueda incompletos");
            }

            $operator = $column === 'id' ? '=' : 'LIKE';
            $bindValue = $operator === '=' ? $value : '%' . $value . '%';
            $query = "SELECT " . self::COLUMNAS . " FROM " . $this->nameTable
                . " WHERE $column $operator ? AND dateDelete IS NULL ORDER BY id DESC";
            $statement = $pdo->prepare($query);
            $statement->bindValue(1, $bindValue);
        }

        $statement->execute();
        $result = $statement->fetchAll(PDO::FETCH_ASSOC);

        return new ContentBody(Status::OK, Status::ST200, $result);
    }

    public function post(array $request): ContentBody
    {
        UserAction::authenticator();
        $object = JSONUtil::decodeJSON();
        $this->validarRepuesto($object);
        $this->asegurarReferenciaLibre($object->referencia, null);

        $pdo = Connection::getInstance()->getConnection();
        $statement = $pdo->prepare($this->queryInsert);
        $this->insertParameter($object, $statement);
        $statement->execute();

        return new ContentBody(Status::CREATE, Status::ST201, MessageUser::SUCCESSFUL);
    }

    public function put(array $request): ContentBody
    {
        UserAction::authenticator();
        $id = $request[0] ?? null;

        if ($id === null || $id === '' || !ctype_digit((string) $id)) {
            throw new ExcepcionAPI(Status::BAD_REQUEST, Status::ST400, "Falta el identificador del registro a actualizar.");
        }

        if ($this->buscarPorId((int) $id) === null) {
            throw new ExcepcionAPI(Status::NOT_FOUND, Status::ST404, MessageUser::ERROR_NOT_EXIST);
        }

        $object = JSONUtil::decodeJSON();
        $this->validarRepuesto($object);
        $this->asegurarReferenciaLibre($object->referencia, (int) $id);

        $pdo = Connection::getInstance()->getConnection();
        $statement = $pdo->prepare($this->queryUpdate);
        $this->updateParameter($object, $statement, $id);
        $statement->execute();

        return new ContentBody(Status::OK, Status::ST200, MessageUser::SUCCESSFUL);
    }

    public function delete(array $request): ContentBody
    {
        UserAction::authenticator();
        $id = $request[0] ?? '';

        if ($id === '' || !ctype_digit((string) $id)) {
            throw new ExcepcionAPI(Status::BAD_REQUEST, Status::ST400, "Falta el identificador del repuesto.");
        }

        if ($this->buscarPorId((int) $id) === null) {
            throw new ExcepcionAPI(Status::NOT_FOUND, Status::ST404, MessageUser::ERROR_NOT_EXIST);
        }

        $pdo = Connection::getInstance()->getConnection();
        $dateDelete = date('Y-m-d H:i:s');
        $query = "UPDATE " . $this->nameTable . " SET dateDelete = ? WHERE id = ? AND dateDelete IS NULL";
        $statement = $pdo->prepare($query);
        $statement->bindValue(1, $dateDelete, PDO::PARAM_STR);
        $statement->bindValue(2, (int) $id, PDO::PARAM_INT);
        $statement->execute();

        return new ContentBody(Status::OK, Status::ST200, MessageUser::SUCCESSFUL);
    }

    public function validarRepuesto(object $object): void
    {
        $referencia = strtoupper(trim((string) ($object->referencia ?? '')));
        $descripcion = trim((string) ($object->descripcion ?? ''));
        $marca = trim((string) ($object->marca ?? ''));
        $precio = $object->precio ?? null;

        if (is_string($precio)) {
            $precio = str_replace(',', '.', trim($precio));
        }

        if (!preg_match('/^[A-Z0-9-]{3,20}$/', $referencia)) {
            throw new ExcepcionAPI(Status::BAD_REQUEST, Status::ST400, "La referencia debe tener de 3 a 20 caracteres: letras, números o guion.");
        }

        if ($descripcion === '' || mb_strlen($descripcion) > 150) {
            throw new ExcepcionAPI(Status::BAD_REQUEST, Status::ST400, "La descripción es obligatoria (máximo 150 caracteres).");
        }

        if ($marca === '' || mb_strlen($marca) > 50) {
            throw new ExcepcionAPI(Status::BAD_REQUEST, Status::ST400, "La marca es obligatoria (máximo 50 caracteres).");
        }

        if (!is_numeric($precio) || (float) $precio <= 0) {
            throw new ExcepcionAPI(Status::BAD_REQUEST, Status::ST400, "El precio debe ser un número mayor a 0.");
        }

        $object->referencia = $referencia;
        $object->descripcion = $descripcion;
        $object->marca = $marca;
        $object->precio = number_format((float) $precio, 2, '.', '');
    }

    public function insertParameter(object $object, PDOStatement $statement): void
    {
        $statement->bindParam(1, $object->referencia, PDO::PARAM_STR);
        $statement->bindParam(2, $object->descripcion, PDO::PARAM_STR);
        $statement->bindParam(3, $object->marca, PDO::PARAM_STR);
        $statement->bindParam(4, $object->precio, PDO::PARAM_STR);
    }

    public function updateParameter(object $object, PDOStatement $statement, int|string $id): void
    {
        $statement->bindParam(1, $object->referencia, PDO::PARAM_STR);
        $statement->bindParam(2, $object->descripcion, PDO::PARAM_STR);
        $statement->bindParam(3, $object->marca, PDO::PARAM_STR);
        $statement->bindParam(4, $object->precio, PDO::PARAM_STR);
        $statement->bindParam(5, $id, PDO::PARAM_INT);
    }

    private function asegurarReferenciaLibre(string $referencia, ?int $idActual): void
    {
        $existente = $this->buscarPorReferencia($referencia);

        if ($existente !== null && (int) $existente['id'] !== $idActual) {
            throw new ExcepcionAPI(Status::BAD_REQUEST, Status::ST400, "Esa referencia ya se encuentra registrada.");
        }
    }

    private function buscarPorId(int $id): ?array
    {
        $pdo = Connection::getInstance()->getConnection();
        $statement = $pdo->prepare(RepuestosQueries::SELECT_BY_ID);
        $statement->bindValue(1, $id, PDO::PARAM_INT);
        $statement->execute();
        $fila = $statement->fetch(PDO::FETCH_ASSOC);

        return $fila === false ? null : $fila;
    }

    private function buscarPorReferencia(string $referencia): ?array
    {
        $pdo = Connection::getInstance()->getConnection();
        $statement = $pdo->prepare(RepuestosQueries::SELECT_BY_REFERENCIA);
        $statement->bindValue(1, $referencia, PDO::PARAM_STR);
        $statement->execute();
        $fila = $statement->fetch(PDO::FETCH_ASSOC);

        return $fila === false ? null : $fila;
    }
}
