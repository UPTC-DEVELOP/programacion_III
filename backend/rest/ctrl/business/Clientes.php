<?php
declare(strict_types=1);

namespace panther\ctrl\business;

use panther\ctrl\core\commun\Request;
use panther\ctrl\core\segurity\UserAction;
use panther\cxn\Connection;
use panther\querys\business\ClientesQueries;
use panther\util\ContentBody;
use panther\util\ExcepcionAPI;
use panther\util\JSONUtil;
use panther\util\MessageUser;
use panther\util\Status;
use PDO;
use PDOStatement;

class Clientes extends Request
{
    private const NAME_TABLE = 'clientes';

    protected const COLUMNAS = 'id, cedula, nombre, correo, telefono, direccion';

    private const COLUMNAS_BUSQUEDA = ['id', 'cedula', 'nombre', 'correo', 'telefono'];

    public function __construct()
    {
        $this->nameTable = self::NAME_TABLE;
        $this->queryInsert = ClientesQueries::INSERT;
        $this->queryUpdate = ClientesQueries::UPDATE;
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
                throw new ExcepcionAPI(Status::BAD_REQUEST, Status::ST400, "Parámetros de búsqueda incompletos.");
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
        $this->validarCliente($object);
        $this->asegurarCedulaLibre($object->cedula, null);

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
            throw new ExcepcionAPI(Status::BAD_REQUEST, Status::ST400, "Falta el identificador del cliente a actualizar.");
        }

        if ($this->buscarPorId((int) $id) === null) {
            throw new ExcepcionAPI(Status::NOT_FOUND, Status::ST404, MessageUser::ERROR_NOT_EXIST);
        }

        $object = JSONUtil::decodeJSON();
        $this->validarCliente($object);
        $this->asegurarCedulaLibre($object->cedula, (int) $id);

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
            throw new ExcepcionAPI(Status::BAD_REQUEST, Status::ST400, "Falta el identificador del cliente.");
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

    public function validarCliente(object $object): void
    {
        $cedula = trim((string) ($object->cedula ?? ''));
        $nombre = trim((string) ($object->nombre ?? ''));
        $correo = strtolower(trim((string) ($object->correo ?? '')));
        $telefono = trim((string) ($object->telefono ?? ''));
        $direccion = trim((string) ($object->direccion ?? ''));

        if (!preg_match('/^[0-9]{5,20}$/', $cedula)) {
            throw new ExcepcionAPI(Status::BAD_REQUEST, Status::ST400, "La cédula debe contener entre 5 y 20 dígitos.");
        }

        if ($nombre === '' || mb_strlen($nombre) > 120) {
            throw new ExcepcionAPI(Status::BAD_REQUEST, Status::ST400, "El nombre es obligatorio (máximo 120 caracteres).");
        }

        if ($correo === '' || mb_strlen($correo) > 120 || !filter_var($correo, FILTER_VALIDATE_EMAIL)) {
            throw new ExcepcionAPI(Status::BAD_REQUEST, Status::ST400, "Ingrese un correo electrónico válido (máximo 120 caracteres).");
        }

        if (!preg_match('/^[0-9+\-\s]{7,20}$/', $telefono)) {
            throw new ExcepcionAPI(Status::BAD_REQUEST, Status::ST400, "El teléfono debe tener entre 7 y 20 caracteres numéricos.");
        }

        if (mb_strlen($direccion) > 180) {
            throw new ExcepcionAPI(Status::BAD_REQUEST, Status::ST400, "La dirección no puede superar los 180 caracteres.");
        }

        $object->cedula = $cedula;
        $object->nombre = $nombre;
        $object->correo = $correo;
        $object->telefono = $telefono;
        $object->direccion = $direccion === '' ? null : $direccion;
    }

    public function insertParameter(object $object, PDOStatement $statement): void
    {
        $statement->bindParam(1, $object->cedula, PDO::PARAM_STR);
        $statement->bindParam(2, $object->nombre, PDO::PARAM_STR);
        $statement->bindParam(3, $object->correo, PDO::PARAM_STR);
        $statement->bindParam(4, $object->telefono, PDO::PARAM_STR);
        $statement->bindValue(5, $object->direccion, $object->direccion === null ? PDO::PARAM_NULL : PDO::PARAM_STR);
    }

    public function updateParameter(object $object, PDOStatement $statement, int|string $id): void
    {
        $statement->bindParam(1, $object->cedula, PDO::PARAM_STR);
        $statement->bindParam(2, $object->nombre, PDO::PARAM_STR);
        $statement->bindParam(3, $object->correo, PDO::PARAM_STR);
        $statement->bindParam(4, $object->telefono, PDO::PARAM_STR);
        $statement->bindValue(5, $object->direccion, $object->direccion === null ? PDO::PARAM_NULL : PDO::PARAM_STR);
        $statement->bindParam(6, $id, PDO::PARAM_INT);
    }

    private function asegurarCedulaLibre(string $cedula, ?int $idActual): void
    {
        $existente = $this->buscarPorCedula($cedula);

        if ($existente !== null && (int) $existente['id'] !== $idActual) {
            throw new ExcepcionAPI(Status::BAD_REQUEST, Status::ST400, "Esa cédula ya se encuentra registrada.");
        }
    }

    private function buscarPorId(int $id): ?array
    {
        $pdo = Connection::getInstance()->getConnection();
        $statement = $pdo->prepare(ClientesQueries::SELECT_BY_ID);
        $statement->bindValue(1, $id, PDO::PARAM_INT);
        $statement->execute();
        $fila = $statement->fetch(PDO::FETCH_ASSOC);

        return $fila === false ? null : $fila;
    }

    private function buscarPorCedula(string $cedula): ?array
    {
        $pdo = Connection::getInstance()->getConnection();
        $statement = $pdo->prepare(ClientesQueries::SELECT_BY_CEDULA);
        $statement->bindValue(1, $cedula, PDO::PARAM_STR);
        $statement->execute();
        $fila = $statement->fetch(PDO::FETCH_ASSOC);

        return $fila === false ? null : $fila;
    }
}