<?php
declare(strict_types=1);

namespace panther\ctrl\business;

use panther\ctrl\core\commun\Request;
use panther\ctrl\core\segurity\UserAction;
use panther\cxn\Connection;
use panther\querys\business\InventarioQueries;
use panther\util\ContentBody;
use panther\util\ExcepcionAPI;
use panther\util\JSONUtil;
use panther\util\MessageUser;
use panther\util\Status;
use PDO;
use PDOStatement;

/**
 * ============================================================
 * Clase: Inventario
 * ------------------------------------------------------------
 * Gestiona las operaciones CRUD del módulo Inventario sobre
 * la tabla `inventario` enlazada con el catálogo `repuestos`.
 * ============================================================
 */
class Inventario extends Request
{
    private const NAME_TABLE = 'inventario';

    protected const COLUMNAS = 'id, repuesto_id, referencia, stock, stock_minimo, ubicacion';

    private const ESTADOS_VALIDOS = ['DISPONIBLE', 'BAJO_STOCK', 'AGOTADO'];

    public function __construct()
    {
        $this->nameTable = self::NAME_TABLE;
        $this->queryInsert = InventarioQueries::INSERT;
        $this->queryUpdate = InventarioQueries::UPDATE;
    }

    public function get(array $request): ContentBody
    {
        UserAction::authenticator();
        $pdo = Connection::getInstance()->getConnection();

        if (count($request) === 0) {
            $statement = $pdo->prepare(InventarioQueries::SELECT_ALL);
            $statement->execute();
            $result = $statement->fetchAll(PDO::FETCH_ASSOC);

            return new ContentBody(Status::OK, Status::ST200, $result);
        }

        // Soporte REST directo: GET /inventario/{id}
        if (count($request) === 1 && ctype_digit((string) $request[0])) {
            $item = $this->buscarPorId((int) $request[0]);
            if ($item === null) {
                throw new ExcepcionAPI(Status::NOT_FOUND, Status::ST404, MessageUser::ERROR_NOT_EXIST);
            }

            return new ContentBody(Status::OK, Status::ST200, $item);
        }

        // Soporte Panther columna/valor: GET /inventario/{columna}/{valor}
        $column = strtolower(trim((string) ($request[0] ?? '')));
        $value = trim((string) ($request[1] ?? ''));

        if ($column === '' || $value === '') {
            throw new ExcepcionAPI(Status::BAD_REQUEST, Status::ST400, "Parámetros de búsqueda incompletos.");
        }

        if ($column === 'id') {
            if (!ctype_digit($value)) {
                throw new ExcepcionAPI(Status::BAD_REQUEST, Status::ST400, "El identificador debe ser numérico.");
            }
            $statement = $pdo->prepare(InventarioQueries::SELECT_BY_ID);
            $statement->bindValue(1, (int) $value, PDO::PARAM_INT);
        } elseif ($column === 'referencia') {
            $query = InventarioQueries::SELECT_BASE . " AND r.referencia LIKE ? ORDER BY i.id DESC;";
            $statement = $pdo->prepare($query);
            $statement->bindValue(1, '%' . strtoupper($value) . '%', PDO::PARAM_STR);
        } elseif ($column === 'estado') {
            $estado = strtoupper($value);
            if (!in_array($estado, self::ESTADOS_VALIDOS, true)) {
                throw new ExcepcionAPI(Status::BAD_REQUEST, Status::ST400, "Estado de inventario no válido.");
            }
            $condicion = match ($estado) {
                'AGOTADO'    => " AND i.stock = 0",
                'BAJO_STOCK' => " AND i.stock > 0 AND i.stock <= i.stock_minimo",
                default      => " AND i.stock > i.stock_minimo",
            };
            $statement = $pdo->prepare(InventarioQueries::SELECT_BASE . $condicion . " ORDER BY i.id DESC;");
        } else {
            throw new ExcepcionAPI(Status::BAD_REQUEST, Status::ST400, "Filtro de búsqueda no permitido.");
        }

        $statement->execute();
        $result = $statement->fetchAll(PDO::FETCH_ASSOC);

        return new ContentBody(Status::OK, Status::ST200, $result);
    }

    public function post(array $request): ContentBody
    {
        UserAction::authenticator();
        $object = JSONUtil::decodeJSON();
        $this->validarInventario($object, null);

        $pdo = Connection::getInstance()->getConnection();
        $existente = $this->buscarPorRepuestoTodos((int) $object->repuesto_id);

        if ($existente !== null) {
            if ($existente['dateDelete'] === null) {
                throw new ExcepcionAPI(
                    Status::BAD_REQUEST,
                    Status::ST400,
                    "Este repuesto ya está registrado en inventario. Edítalo desde la tabla."
                );
            }

            // Reactivar registro previamente eliminado de forma lógica respetando UNIQUE KEY
            $statement = $pdo->prepare(InventarioQueries::REACTIVATE);
            $statement->bindValue(1, $object->referencia, PDO::PARAM_STR);
            $statement->bindValue(2, $object->stock, PDO::PARAM_INT);
            $statement->bindValue(3, $object->stock_minimo, PDO::PARAM_INT);
            $statement->bindValue(4, $object->ubicacion, $object->ubicacion === null ? PDO::PARAM_NULL : PDO::PARAM_STR);
            $statement->bindValue(5, (int) $existente['id'], PDO::PARAM_INT);
            $statement->execute();

            return new ContentBody(Status::CREATE, Status::ST201, MessageUser::SUCCESSFUL);
        }

        // Verificar colisión de referencia en tabla inventario
        $porRef = $this->buscarPorReferenciaTodos($object->referencia);
        if ($porRef !== null && $porRef['dateDelete'] === null) {
            throw new ExcepcionAPI(Status::BAD_REQUEST, Status::ST400, "Esa referencia ya existe en el inventario.");
        }

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

        $actual = $this->buscarPorId((int) $id);
        if ($actual === null) {
            throw new ExcepcionAPI(Status::NOT_FOUND, Status::ST404, MessageUser::ERROR_NOT_EXIST);
        }

        $object = JSONUtil::decodeJSON();
        $this->validarInventario($object, $actual);

        $existente = $this->buscarPorRepuestoTodos((int) $object->repuesto_id);
        if ($existente !== null && (int) $existente['id'] !== (int) $id) {
            throw new ExcepcionAPI(Status::BAD_REQUEST, Status::ST400, "Ese repuesto ya tiene otro registro en inventario.");
        }

        $pdo = Connection::getInstance()->getConnection();
        $statement = $pdo->prepare($this->queryUpdate);
        $this->updateParameter($object, $statement, (int) $id);
        $statement->execute();

        return new ContentBody(Status::OK, Status::ST200, MessageUser::SUCCESSFUL);
    }

    public function delete(array $request): ContentBody
    {
        UserAction::authenticator();
        $id = $request[0] ?? '';

        if ($id === '' || !ctype_digit((string) $id)) {
            throw new ExcepcionAPI(Status::BAD_REQUEST, Status::ST400, "Falta el identificador del registro de inventario.");
        }

        if ($this->buscarPorId((int) $id) === null) {
            throw new ExcepcionAPI(Status::NOT_FOUND, Status::ST404, MessageUser::ERROR_NOT_EXIST);
        }

        $pdo = Connection::getInstance()->getConnection();
        $statement = $pdo->prepare(InventarioQueries::SOFT_DELETE);
        $statement->bindValue(1, date('Y-m-d H:i:s'), PDO::PARAM_STR);
        $statement->bindValue(2, (int) $id, PDO::PARAM_INT);
        $statement->execute();

        return new ContentBody(Status::OK, Status::ST200, MessageUser::SUCCESSFUL);
    }

    public function insertParameter(object $object, PDOStatement $statement): void
    {
        $statement->bindValue(1, (int) $object->repuesto_id, PDO::PARAM_INT);
        $statement->bindValue(2, (string) $object->referencia, PDO::PARAM_STR);
        $statement->bindValue(3, (int) $object->stock, PDO::PARAM_INT);
        $statement->bindValue(4, (int) $object->stock_minimo, PDO::PARAM_INT);
        $statement->bindValue(5, $object->ubicacion, $object->ubicacion === null ? PDO::PARAM_NULL : PDO::PARAM_STR);
    }

    public function updateParameter(object $object, PDOStatement $statement, int|string $id): void
    {
        $statement->bindValue(1, (int) $object->repuesto_id, PDO::PARAM_INT);
        $statement->bindValue(2, (string) $object->referencia, PDO::PARAM_STR);
        $statement->bindValue(3, (int) $object->stock, PDO::PARAM_INT);
        $statement->bindValue(4, (int) $object->stock_minimo, PDO::PARAM_INT);
        $statement->bindValue(5, $object->ubicacion, $object->ubicacion === null ? PDO::PARAM_NULL : PDO::PARAM_STR);
        $statement->bindValue(6, (int) $id, PDO::PARAM_INT);
    }

    private function validarInventario(object $object, ?array $actual): void
    {
        $repuestoIdRaw = $object->repuesto_id ?? ($actual['repuesto_id'] ?? null);
        $referenciaRaw = strtoupper(trim((string) ($object->referencia ?? '')));

        $repuesto = null;
        if ($repuestoIdRaw !== null && $repuestoIdRaw !== '' && ctype_digit((string) $repuestoIdRaw)) {
            $repuesto = $this->buscarRepuestoPorId((int) $repuestoIdRaw);
        } elseif ($referenciaRaw !== '') {
            $repuesto = $this->buscarRepuestoPorReferencia($referenciaRaw);
        }

        if ($repuesto === null) {
            throw new ExcepcionAPI(
                Status::BAD_REQUEST,
                Status::ST400,
                "Debe seleccionar un repuesto válido y activo del catálogo."
            );
        }

        $stockRaw = $object->stock ?? null;
        $stockMinRaw = $object->stock_minimo ?? ($object->stockMinimo ?? null);

        if ($stockRaw === null || $stockRaw === '' || filter_var($stockRaw, FILTER_VALIDATE_INT) === false || (int) $stockRaw < 0) {
            throw new ExcepcionAPI(Status::BAD_REQUEST, Status::ST400, "El stock debe ser un número entero mayor o igual a 0.");
        }

        if ($stockMinRaw === null || $stockMinRaw === '' || filter_var($stockMinRaw, FILTER_VALIDATE_INT) === false || (int) $stockMinRaw < 0) {
            throw new ExcepcionAPI(Status::BAD_REQUEST, Status::ST400, "El stock mínimo debe ser un número entero mayor o igual a 0.");
        }

        $ubicacionRaw = trim((string) ($object->ubicacion ?? ''));
        if (mb_strlen($ubicacionRaw) > 60) {
            throw new ExcepcionAPI(Status::BAD_REQUEST, Status::ST400, "La ubicación no puede superar 60 caracteres.");
        }

        $object->repuesto_id = (int) $repuesto['id'];
        $object->referencia = (string) $repuesto['referencia'];
        $object->stock = (int) $stockRaw;
        $object->stock_minimo = (int) $stockMinRaw;
        $object->ubicacion = $ubicacionRaw === '' ? null : $ubicacionRaw;
    }

    private function buscarPorId(int $id): ?array
    {
        $pdo = Connection::getInstance()->getConnection();
        $statement = $pdo->prepare(InventarioQueries::SELECT_BY_ID);
        $statement->bindValue(1, $id, PDO::PARAM_INT);
        $statement->execute();
        $fila = $statement->fetch(PDO::FETCH_ASSOC);

        return $fila === false ? null : $fila;
    }

    private function buscarPorRepuestoTodos(int $repuestoId): ?array
    {
        $pdo = Connection::getInstance()->getConnection();
        $statement = $pdo->prepare(InventarioQueries::SELECT_BY_REPUESTO_ID_ALL);
        $statement->bindValue(1, $repuestoId, PDO::PARAM_INT);
        $statement->execute();
        $fila = $statement->fetch(PDO::FETCH_ASSOC);

        return $fila === false ? null : $fila;
    }

    private function buscarPorReferenciaTodos(string $referencia): ?array
    {
        $pdo = Connection::getInstance()->getConnection();
        $statement = $pdo->prepare(InventarioQueries::SELECT_BY_REFERENCIA_ALL);
        $statement->bindValue(1, $referencia, PDO::PARAM_STR);
        $statement->execute();
        $fila = $statement->fetch(PDO::FETCH_ASSOC);

        return $fila === false ? null : $fila;
    }

    private function buscarRepuestoPorId(int $repuestoId): ?array
    {
        $pdo = Connection::getInstance()->getConnection();
        $statement = $pdo->prepare(InventarioQueries::SELECT_REPUESTO_BY_ID);
        $statement->bindValue(1, $repuestoId, PDO::PARAM_INT);
        $statement->execute();
        $fila = $statement->fetch(PDO::FETCH_ASSOC);

        return $fila === false ? null : $fila;
    }

    private function buscarRepuestoPorReferencia(string $referencia): ?array
    {
        $pdo = Connection::getInstance()->getConnection();
        $statement = $pdo->prepare(InventarioQueries::SELECT_REPUESTO_BY_REFERENCIA);
        $statement->bindValue(1, $referencia, PDO::PARAM_STR);
        $statement->execute();
        $fila = $statement->fetch(PDO::FETCH_ASSOC);

        return $fila === false ? null : $fila;
    }
}
