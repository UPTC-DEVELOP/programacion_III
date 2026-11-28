<?php
declare(strict_types=1);

namespace panther\ctrl\business;

use panther\ctrl\core\commun\Request;
use panther\ctrl\core\segurity\UserAction;
use panther\cxn\Connection;
use panther\querys\business\OrdenesQueries;
use panther\util\ContentBody;
use panther\util\ExcepcionAPI;
use panther\util\JSONUtil;
use panther\util\MessageUser;
use panther\util\Status;
use PDO;
use PDOStatement;
use Throwable;

/**
 * ============================================================
 * Clase: Ordenes
 * ------------------------------------------------------------
 * Gestiona el CRUD maestro-detalle de Órdenes de Servicio
 * (`ordenes` y `orden_repuestos`) con transacciones PDO para
 * mantener consistente el stock de `inventario`.
 * ============================================================
 */
class Ordenes extends Request
{
    private const NAME_TABLE = 'ordenes';

    protected const COLUMNAS = 'id, codigo_orden, vehiculo_id, placa, cliente_id, empleado_id, horas, estado, observaciones, fecha_ingreso, fecha_salida';

    private const ESTADOS_VALIDOS = ['ABIERTA', 'EN_PROCESO', 'FINALIZADA', 'CANCELADA'];

    public function __construct()
    {
        $this->nameTable = self::NAME_TABLE;
        $this->queryInsert = OrdenesQueries::INSERT;
        $this->queryUpdate = OrdenesQueries::UPDATE;
    }

    public function get(array $request): ContentBody
    {
        UserAction::authenticator();
        $pdo = Connection::getInstance()->getConnection();

        // Subruta de solo lectura para poblar selectores del formulario sin tocar otros módulos
        if (count($request) === 1 && strtolower((string) $request[0]) === 'catalogos') {
            return new ContentBody(Status::OK, Status::ST200, $this->obtenerCatalogos($pdo));
        }

        if (count($request) === 0) {
            $statement = $pdo->prepare(OrdenesQueries::SELECT_ALL);
            $statement->execute();
            $ordenes = $statement->fetchAll(PDO::FETCH_ASSOC);

            return new ContentBody(Status::OK, Status::ST200, $this->adjuntarDetalles($pdo, $ordenes));
        }

        // Soporte REST directo: GET /ordenes/{id}
        if (count($request) === 1 && ctype_digit((string) $request[0])) {
            $orden = $this->buscarPorId($pdo, (int) $request[0]);
            if ($orden === null) {
                throw new ExcepcionAPI(Status::NOT_FOUND, Status::ST404, MessageUser::ERROR_NOT_EXIST);
            }

            return new ContentBody(Status::OK, Status::ST200, $this->enriquecerOrden($pdo, $orden));
        }

        // Soporte Panther columna/valor: GET /ordenes/{columna}/{valor}
        $column = strtolower(trim((string) ($request[0] ?? '')));
        $value = trim((string) ($request[1] ?? ''));

        if ($column === '' || $value === '') {
            throw new ExcepcionAPI(Status::BAD_REQUEST, Status::ST400, "Parámetros de búsqueda incompletos.");
        }

        if ($column === 'id') {
            if (!ctype_digit($value)) {
                throw new ExcepcionAPI(Status::BAD_REQUEST, Status::ST400, "El identificador debe ser numérico.");
            }
            $statement = $pdo->prepare(OrdenesQueries::SELECT_BY_ID);
            $statement->bindValue(1, (int) $value, PDO::PARAM_INT);
        } elseif ($column === 'estado') {
            $estado = strtoupper($value);
            if (!in_array($estado, self::ESTADOS_VALIDOS, true)) {
                throw new ExcepcionAPI(Status::BAD_REQUEST, Status::ST400, "Estado de orden no válido.");
            }
            $query = OrdenesQueries::SELECT_BASE . " AND o.estado = ? ORDER BY o.id DESC;";
            $statement = $pdo->prepare($query);
            $statement->bindValue(1, $estado, PDO::PARAM_STR);
        } elseif ($column === 'placa') {
            $query = OrdenesQueries::SELECT_BASE . " AND o.placa LIKE ? ORDER BY o.id DESC;";
            $statement = $pdo->prepare($query);
            $statement->bindValue(1, '%' . strtoupper($value) . '%', PDO::PARAM_STR);
        } elseif ($column === 'codigo_orden') {
            $query = OrdenesQueries::SELECT_BASE . " AND o.codigo_orden LIKE ? ORDER BY o.id DESC;";
            $statement = $pdo->prepare($query);
            $statement->bindValue(1, '%' . strtoupper($value) . '%', PDO::PARAM_STR);
        } else {
            throw new ExcepcionAPI(Status::BAD_REQUEST, Status::ST400, "Filtro de búsqueda no permitido.");
        }

        $statement->execute();
        $ordenes = $statement->fetchAll(PDO::FETCH_ASSOC);

        return new ContentBody(Status::OK, Status::ST200, $this->adjuntarDetalles($pdo, $ordenes));
    }

    public function post(array $request): ContentBody
    {
        UserAction::authenticator();
        $object = JSONUtil::decodeJSON();
        $pdo = Connection::getInstance()->getConnection();

        $this->validarOrden($pdo, $object, null);

        try {
            $pdo->beginTransaction();

            $object->codigo_orden = $this->resolverCodigoOrden($pdo, $object->codigo_orden);
            $detallesPreparados = $this->procesarStockYPrecios(
                $pdo,
                $object->repuestos,
                $object->estado !== 'CANCELADA'
            );

            $statement = $pdo->prepare($this->queryInsert);
            $this->insertParameter($object, $statement);
            $statement->execute();
            $ordenId = (int) $pdo->lastInsertId();

            $this->insertarDetalles($pdo, $ordenId, $detallesPreparados);

            $pdo->commit();

            $creada = $this->buscarPorId($pdo, $ordenId);
            return new ContentBody(
                Status::CREATE,
                Status::ST201,
                $creada !== null ? $this->enriquecerOrden($pdo, $creada) : MessageUser::SUCCESSFUL
            );
        } catch (ExcepcionAPI $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $e;
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw new ExcepcionAPI(Status::INTERNAL_SERVER_ERROR, Status::ST500, $e->getMessage());
        }
    }

    public function put(array $request): ContentBody
    {
        UserAction::authenticator();
        $id = $request[0] ?? null;

        if ($id === null || $id === '' || !ctype_digit((string) $id)) {
            throw new ExcepcionAPI(Status::BAD_REQUEST, Status::ST400, "Falta el identificador de la orden a actualizar.");
        }

        $ordenId = (int) $id;
        $object = JSONUtil::decodeJSON();
        $pdo = Connection::getInstance()->getConnection();

        try {
            $pdo->beginTransaction();

            $stmtActual = $pdo->prepare(OrdenesQueries::SELECT_FOR_UPDATE);
            $stmtActual->bindValue(1, $ordenId, PDO::PARAM_INT);
            $stmtActual->execute();
            $ordenAnterior = $stmtActual->fetch(PDO::FETCH_ASSOC);

            if ($ordenAnterior === false) {
                $pdo->rollBack();
                throw new ExcepcionAPI(Status::NOT_FOUND, Status::ST404, MessageUser::ERROR_NOT_EXIST);
            }

            $this->validarOrden($pdo, $object, $ordenAnterior);

            // 1. Reintegrar stock de la orden anterior si no estaba cancelada
            if ($ordenAnterior['estado'] !== 'CANCELADA') {
                $this->reintegrarStockDeOrden($pdo, $ordenId);
            }

            // 2. Validar y descontar el nuevo stock si el nuevo estado no es CANCELADA
            $detallesPreparados = $this->procesarStockYPrecios(
                $pdo,
                $object->repuestos,
                $object->estado !== 'CANCELADA'
            );

            // 3. Actualizar cabecera de la orden
            $stmtUpdate = $pdo->prepare($this->queryUpdate);
            $this->updateParameter($object, $stmtUpdate, $ordenId);
            $stmtUpdate->execute();

            // 4. Reemplazar detalle activo de repuestos (borrado lógico + inserción limpia)
            $stmtSoftDelDet = $pdo->prepare(OrdenesQueries::SOFT_DELETE_DETALLES);
            $stmtSoftDelDet->bindValue(1, date('Y-m-d H:i:s'), PDO::PARAM_STR);
            $stmtSoftDelDet->bindValue(2, $ordenId, PDO::PARAM_INT);
            $stmtSoftDelDet->execute();

            $this->insertarDetalles($pdo, $ordenId, $detallesPreparados);

            $pdo->commit();

            $actualizada = $this->buscarPorId($pdo, $ordenId);
            return new ContentBody(
                Status::OK,
                Status::ST200,
                $actualizada !== null ? $this->enriquecerOrden($pdo, $actualizada) : MessageUser::SUCCESSFUL
            );
        } catch (ExcepcionAPI $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $e;
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw new ExcepcionAPI(Status::INTERNAL_SERVER_ERROR, Status::ST500, $e->getMessage());
        }
    }

    public function delete(array $request): ContentBody
    {
        UserAction::authenticator();
        $id = $request[0] ?? '';

        if ($id === '' || !ctype_digit((string) $id)) {
            throw new ExcepcionAPI(Status::BAD_REQUEST, Status::ST400, "Falta el identificador de la orden de servicio.");
        }

        $ordenId = (int) $id;
        $pdo = Connection::getInstance()->getConnection();

        try {
            $pdo->beginTransaction();

            $stmtActual = $pdo->prepare(OrdenesQueries::SELECT_FOR_UPDATE);
            $stmtActual->bindValue(1, $ordenId, PDO::PARAM_INT);
            $stmtActual->execute();
            $orden = $stmtActual->fetch(PDO::FETCH_ASSOC);

            if ($orden === false) {
                $pdo->rollBack();
                throw new ExcepcionAPI(Status::NOT_FOUND, Status::ST404, MessageUser::ERROR_NOT_EXIST);
            }

            if ($orden['estado'] !== 'CANCELADA') {
                $this->reintegrarStockDeOrden($pdo, $ordenId);
            }

            $ahora = date('Y-m-d H:i:s');

            $stmtDelDet = $pdo->prepare(OrdenesQueries::SOFT_DELETE_DETALLES);
            $stmtDelDet->bindValue(1, $ahora, PDO::PARAM_STR);
            $stmtDelDet->bindValue(2, $ordenId, PDO::PARAM_INT);
            $stmtDelDet->execute();

            $stmtDelOrd = $pdo->prepare(OrdenesQueries::SOFT_DELETE);
            $stmtDelOrd->bindValue(1, $ahora, PDO::PARAM_STR);
            $stmtDelOrd->bindValue(2, $ordenId, PDO::PARAM_INT);
            $stmtDelOrd->execute();

            $pdo->commit();

            return new ContentBody(Status::OK, Status::ST200, MessageUser::SUCCESSFUL);
        } catch (ExcepcionAPI $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $e;
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw new ExcepcionAPI(Status::INTERNAL_SERVER_ERROR, Status::ST500, $e->getMessage());
        }
    }

    public function insertParameter(object $object, PDOStatement $statement): void
    {
        $statement->bindValue(1, $object->codigo_orden, PDO::PARAM_STR);
        $statement->bindValue(2, $object->vehiculo_id, $object->vehiculo_id === null ? PDO::PARAM_NULL : PDO::PARAM_INT);
        $statement->bindValue(3, $object->placa, PDO::PARAM_STR);
        $statement->bindValue(4, $object->cliente_id, $object->cliente_id === null ? PDO::PARAM_NULL : PDO::PARAM_INT);
        $statement->bindValue(5, $object->empleado_id, $object->empleado_id === null ? PDO::PARAM_NULL : PDO::PARAM_INT);
        $statement->bindValue(6, $object->horas, PDO::PARAM_STR);
        $statement->bindValue(7, $object->estado, PDO::PARAM_STR);
        $statement->bindValue(8, $object->observaciones, $object->observaciones === null ? PDO::PARAM_NULL : PDO::PARAM_STR);
        $statement->bindValue(9, $object->fecha_ingreso, PDO::PARAM_STR);
        $statement->bindValue(10, $object->fecha_salida, $object->fecha_salida === null ? PDO::PARAM_NULL : PDO::PARAM_STR);
    }

    public function updateParameter(object $object, PDOStatement $statement, int|string $id): void
    {
        $statement->bindValue(1, $object->vehiculo_id, $object->vehiculo_id === null ? PDO::PARAM_NULL : PDO::PARAM_INT);
        $statement->bindValue(2, $object->placa, PDO::PARAM_STR);
        $statement->bindValue(3, $object->cliente_id, $object->cliente_id === null ? PDO::PARAM_NULL : PDO::PARAM_INT);
        $statement->bindValue(4, $object->empleado_id, $object->empleado_id === null ? PDO::PARAM_NULL : PDO::PARAM_INT);
        $statement->bindValue(5, $object->horas, PDO::PARAM_STR);
        $statement->bindValue(6, $object->estado, PDO::PARAM_STR);
        $statement->bindValue(7, $object->observaciones, $object->observaciones === null ? PDO::PARAM_NULL : PDO::PARAM_STR);
        $statement->bindValue(8, $object->fecha_ingreso, PDO::PARAM_STR);
        $statement->bindValue(9, $object->fecha_salida, $object->fecha_salida === null ? PDO::PARAM_NULL : PDO::PARAM_STR);
        $statement->bindValue(10, (int) $id, PDO::PARAM_INT);
    }

    private function validarOrden(PDO $pdo, object $object, ?array $ordenAnterior): void
    {
        $vehiculoId = $this->parsearIdOpcional($object->vehiculo_id ?? null);
        $clienteId = $this->parsearIdOpcional($object->cliente_id ?? null);
        $empleadoId = $this->parsearIdOpcional($object->empleado_id ?? null);
        $placa = strtoupper(trim((string) ($object->placa ?? '')));

        if ($vehiculoId !== null) {
            $stmtVeh = $pdo->prepare(OrdenesQueries::VERIFICAR_VEHICULO);
            $stmtVeh->bindValue(1, $vehiculoId, PDO::PARAM_INT);
            $stmtVeh->execute();
            $vehiculo = $stmtVeh->fetch(PDO::FETCH_ASSOC);

            if ($vehiculo === false) {
                throw new ExcepcionAPI(Status::BAD_REQUEST, Status::ST400, "El vehículo seleccionado no existe.");
            }
            if ($placa === '') {
                $placa = strtoupper((string) $vehiculo['placa']);
            }
            if ($clienteId === null && $vehiculo['cliente_id'] !== null) {
                $clienteId = (int) $vehiculo['cliente_id'];
            }
        }

        if ($clienteId !== null) {
            $stmtCli = $pdo->prepare(OrdenesQueries::VERIFICAR_CLIENTE);
            $stmtCli->bindValue(1, $clienteId, PDO::PARAM_INT);
            $stmtCli->execute();
            if ($stmtCli->fetch(PDO::FETCH_ASSOC) === false) {
                throw new ExcepcionAPI(Status::BAD_REQUEST, Status::ST400, "El cliente seleccionado no existe.");
            }
        }

        if ($empleadoId !== null) {
            $stmtEmp = $pdo->prepare(OrdenesQueries::VERIFICAR_EMPLEADO);
            $stmtEmp->bindValue(1, $empleadoId, PDO::PARAM_INT);
            $stmtEmp->execute();
            if ($stmtEmp->fetch(PDO::FETCH_ASSOC) === false) {
                throw new ExcepcionAPI(Status::BAD_REQUEST, Status::ST400, "El mecánico seleccionado no existe.");
            }
        }

        if (!preg_match('/^[A-Z0-9-]{5,15}$/', $placa)) {
            throw new ExcepcionAPI(Status::BAD_REQUEST, Status::ST400, "La placa del vehículo es obligatoria (5 a 15 caracteres alfanuméricos).");
        }

        $horasRaw = $object->horas ?? null;
        if (is_string($horasRaw)) {
            $horasRaw = str_replace(',', '.', trim($horasRaw));
        }
        if (!is_numeric($horasRaw) || (float) $horasRaw <= 0 || (float) $horasRaw > 9999.99) {
            throw new ExcepcionAPI(Status::BAD_REQUEST, Status::ST400, "Las horas empleadas deben ser un número mayor a 0.");
        }

        $estado = strtoupper(trim((string) ($object->estado ?? 'ABIERTA')));
        if (!in_array($estado, self::ESTADOS_VALIDOS, true)) {
            throw new ExcepcionAPI(
                Status::BAD_REQUEST,
                Status::ST400,
                "Estado inválido. Valores permitidos: ABIERTA, EN_PROCESO, FINALIZADA o CANCELADA."
            );
        }

        $observacionesRaw = trim((string) ($object->observaciones ?? ''));
        $fechaIngreso = $this->normalizarFechaHora(
            $object->fecha_ingreso ?? null,
            $ordenAnterior['fecha_ingreso'] ?? date('Y-m-d H:i:s')
        );

        $fechaSalida = null;
        if ($estado === 'FINALIZADA') {
            $fechaSalida = $this->normalizarFechaHora(
                $object->fecha_salida ?? null,
                $ordenAnterior['fecha_salida'] ?? date('Y-m-d H:i:s')
            );
        } elseif (!empty($object->fecha_salida)) {
            $fechaSalida = $this->normalizarFechaHora($object->fecha_salida, null);
        }

        // Normalizar y agrupar líneas de repuestos por repuesto_id
        $repuestosRaw = $object->repuestos ?? [];
        if (!is_array($repuestosRaw)) {
            throw new ExcepcionAPI(Status::BAD_REQUEST, Status::ST400, "El listado de repuestos debe ser un arreglo.");
        }

        $agrupados = [];
        foreach ($repuestosRaw as $linea) {
            if (!is_object($linea) && !is_array($linea)) {
                throw new ExcepcionAPI(Status::BAD_REQUEST, Status::ST400, "Formato inválido en el detalle de repuestos.");
            }
            $item = (array) $linea;
            $repId = $item['repuesto_id'] ?? null;
            $cant = $item['cantidad'] ?? null;

            if ($repId === null || !ctype_digit((string) $repId) || (int) $repId <= 0) {
                throw new ExcepcionAPI(Status::BAD_REQUEST, Status::ST400, "Cada repuesto de la orden debe tener un repuesto válido.");
            }
            if ($cant === null || filter_var($cant, FILTER_VALIDATE_INT) === false || (int) $cant <= 0) {
                throw new ExcepcionAPI(Status::BAD_REQUEST, Status::ST400, "La cantidad de cada repuesto debe ser un número entero mayor a 0.");
            }

            $repIdInt = (int) $repId;
            $cantInt = (int) $cant;
            $precioEnviado = $item['precio_unitario'] ?? null;

            if (!isset($agrupados[$repIdInt])) {
                $agrupados[$repIdInt] = [
                    'repuesto_id'     => $repIdInt,
                    'cantidad'        => $cantInt,
                    'precio_unitario' => is_numeric($precioEnviado) && (float) $precioEnviado > 0
                        ? (float) $precioEnviado
                        : null,
                ];
            } else {
                $agrupados[$repIdInt]['cantidad'] += $cantInt;
            }
        }

        $object->codigo_orden = strtoupper(trim((string) ($object->codigo_orden ?? '')));
        $object->vehiculo_id = $vehiculoId;
        $object->placa = $placa;
        $object->cliente_id = $clienteId;
        $object->empleado_id = $empleadoId;
        $object->horas = number_format((float) $horasRaw, 2, '.', '');
        $object->estado = $estado;
        $object->observaciones = $observacionesRaw === '' ? null : $observacionesRaw;
        $object->fecha_ingreso = $fechaIngreso;
        $object->fecha_salida = $fechaSalida;
        $object->repuestos = array_values($agrupados);
    }

    /**
     * Valida existencia en inventario, descuenta stock si aplica y resuelve precio unitario.
     *
     * @param array<int, array{repuesto_id:int, cantidad:int, precio_unitario:?float}> $lineas
     * @return array<int, array{repuesto_id:int, cantidad:int, precio_unitario:string}>
     */
    private function procesarStockYPrecios(PDO $pdo, array $lineas, bool $descontarStock): array
    {
        $preparados = [];

        foreach ($lineas as $linea) {
            $stmtInv = $pdo->prepare(OrdenesQueries::SELECT_INVENTARIO_FOR_UPDATE);
            $stmtInv->bindValue(1, $linea['repuesto_id'], PDO::PARAM_INT);
            $stmtInv->execute();
            $inv = $stmtInv->fetch(PDO::FETCH_ASSOC);

            if ($inv === false) {
                throw new ExcepcionAPI(
                    Status::BAD_REQUEST,
                    Status::ST400,
                    "Uno de los repuestos seleccionados no tiene registro activo en inventario."
                );
            }

            $stockActual = (int) $inv['stock'];
            $cantidad = (int) $linea['cantidad'];

            if ($descontarStock) {
                if ($stockActual < $cantidad) {
                    throw new ExcepcionAPI(
                        Status::BAD_REQUEST,
                        Status::ST400,
                        sprintf(
                            "Stock insuficiente para %s (%s). Disponible: %d, solicitado: %d.",
                            $inv['referencia'],
                            $inv['descripcion'],
                            $stockActual,
                            $cantidad
                        )
                    );
                }

                $stmtDesc = $pdo->prepare(OrdenesQueries::DESCONTAR_STOCK);
                $stmtDesc->bindValue(1, $cantidad, PDO::PARAM_INT);
                $stmtDesc->bindValue(2, (int) $inv['id'], PDO::PARAM_INT);
                $stmtDesc->execute();
            }

            $precioUnitario = $linea['precio_unitario'] !== null
                ? $linea['precio_unitario']
                : (float) $inv['precio'];

            $preparados[] = [
                'repuesto_id'     => $linea['repuesto_id'],
                'cantidad'        => $cantidad,
                'precio_unitario' => number_format($precioUnitario, 2, '.', ''),
            ];
        }

        return $preparados;
    }

    private function reintegrarStockDeOrden(PDO $pdo, int $ordenId): void
    {
        $stmtDet = $pdo->prepare(OrdenesQueries::SELECT_REPUESTOS_ACTIVOS_SIMPLE);
        $stmtDet->bindValue(1, $ordenId, PDO::PARAM_INT);
        $stmtDet->execute();
        $lineasAnteriores = $stmtDet->fetchAll(PDO::FETCH_ASSOC);

        foreach ($lineasAnteriores as $linea) {
            $stmtReint = $pdo->prepare(OrdenesQueries::REINTEGRAR_STOCK);
            $stmtReint->bindValue(1, (int) $linea['cantidad'], PDO::PARAM_INT);
            $stmtReint->bindValue(2, (int) $linea['repuesto_id'], PDO::PARAM_INT);
            $stmtReint->execute();
        }
    }

    /**
     * @param array<int, array{repuesto_id:int, cantidad:int, precio_unitario:string}> $detalles
     */
    private function insertarDetalles(PDO $pdo, int $ordenId, array $detalles): void
    {
        if (count($detalles) === 0) {
            return;
        }

        $stmt = $pdo->prepare(OrdenesQueries::INSERT_DETALLE);
        foreach ($detalles as $det) {
            $stmt->bindValue(1, $ordenId, PDO::PARAM_INT);
            $stmt->bindValue(2, $det['repuesto_id'], PDO::PARAM_INT);
            $stmt->bindValue(3, $det['cantidad'], PDO::PARAM_INT);
            $stmt->bindValue(4, $det['precio_unitario'], PDO::PARAM_STR);
            $stmt->execute();
        }
    }

    private function resolverCodigoOrden(PDO $pdo, string $codigoSolicitado): string
    {
        if ($codigoSolicitado !== '') {
            if (mb_strlen($codigoSolicitado) > 20) {
                throw new ExcepcionAPI(Status::BAD_REQUEST, Status::ST400, "El código de orden no puede superar 20 caracteres.");
            }
            $stmtCheck = $pdo->prepare(OrdenesQueries::COUNT_CODIGO_ORDEN);
            $stmtCheck->bindValue(1, $codigoSolicitado, PDO::PARAM_STR);
            $stmtCheck->execute();
            if ((int) $stmtCheck->fetchColumn() > 0) {
                throw new ExcepcionAPI(Status::BAD_REQUEST, Status::ST400, "Ese código de orden ya existe.");
            }
            return $codigoSolicitado;
        }

        $siguiente = ((int) $pdo->query(OrdenesQueries::SELECT_MAX_ID)->fetchColumn()) + 1;
        $stmtCheck = $pdo->prepare(OrdenesQueries::COUNT_CODIGO_ORDEN);

        do {
            $codigo = sprintf('OS-%04d', $siguiente);
            $stmtCheck->bindValue(1, $codigo, PDO::PARAM_STR);
            $stmtCheck->execute();
            $existe = (int) $stmtCheck->fetchColumn() > 0;
            $siguiente++;
        } while ($existe);

        return $codigo;
    }

    private function obtenerCatalogos(PDO $pdo): array
    {
        return [
            'clientes'   => $pdo->query(OrdenesQueries::CATALOGO_CLIENTES)->fetchAll(PDO::FETCH_ASSOC),
            'vehiculos'  => $pdo->query(OrdenesQueries::CATALOGO_VEHICULOS)->fetchAll(PDO::FETCH_ASSOC),
            'empleados'  => $pdo->query(OrdenesQueries::CATALOGO_EMPLEADOS)->fetchAll(PDO::FETCH_ASSOC),
            'inventario' => $pdo->query(OrdenesQueries::CATALOGO_INVENTARIO)->fetchAll(PDO::FETCH_ASSOC),
        ];
    }

    private function buscarPorId(PDO $pdo, int $id): ?array
    {
        $statement = $pdo->prepare(OrdenesQueries::SELECT_BY_ID);
        $statement->bindValue(1, $id, PDO::PARAM_INT);
        $statement->execute();
        $fila = $statement->fetch(PDO::FETCH_ASSOC);

        return $fila === false ? null : $fila;
    }

    /**
     * @param array<int, array<string, mixed>> $ordenes
     * @return array<int, array<string, mixed>>
     */
    private function adjuntarDetalles(PDO $pdo, array $ordenes): array
    {
        $salida = [];
        foreach ($ordenes as $orden) {
            $salida[] = $this->enriquecerOrden($pdo, $orden);
        }
        return $salida;
    }

    /**
     * @param array<string, mixed> $orden
     * @return array<string, mixed>
     */
    private function enriquecerOrden(PDO $pdo, array $orden): array
    {
        $stmt = $pdo->prepare(OrdenesQueries::SELECT_REPUESTOS_DE_ORDEN);
        $stmt->bindValue(1, (int) $orden['id'], PDO::PARAM_INT);
        $stmt->execute();
        $repuestos = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $subtotalRepuestos = 0.0;
        $totalUnidades = 0;
        foreach ($repuestos as $item) {
            $subtotalRepuestos += (float) $item['subtotal'];
            $totalUnidades += (int) $item['cantidad'];
        }

        $orden['repuestos'] = $repuestos;
        $orden['total_unidades'] = $totalUnidades;
        $orden['subtotal_repuestos'] = round($subtotalRepuestos, 2);

        return $orden;
    }

    private function parsearIdOpcional(mixed $valor): ?int
    {
        if ($valor === null || $valor === '') {
            return null;
        }
        if (!ctype_digit((string) $valor) || (int) $valor <= 0) {
            throw new ExcepcionAPI(Status::BAD_REQUEST, Status::ST400, "Identificador de relación inválido.");
        }
        return (int) $valor;
    }

    private function normalizarFechaHora(mixed $valor, ?string $porDefecto): ?string
    {
        if ($valor === null || trim((string) $valor) === '') {
            return $porDefecto;
        }
        $texto = str_replace('T', ' ', trim((string) $valor));
        if (preg_match('/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/', $texto)) {
            $texto .= ':00';
        }
        $timestamp = strtotime($texto);
        if ($timestamp === false) {
            throw new ExcepcionAPI(Status::BAD_REQUEST, Status::ST400, "Formato de fecha y hora no válido.");
        }
        return date('Y-m-d H:i:s', $timestamp);
    }
}
