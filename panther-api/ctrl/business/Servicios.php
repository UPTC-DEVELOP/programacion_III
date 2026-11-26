<?php

class Servicios extends Request
{
    const NAME_TABLE = "servicio";
    const TABLE_SERVICIO_REPUESTO = "servicio_repuesto";

    public static function init()
    {
        parent::$nameTable = self::NAME_TABLE;
        parent::$queryInsert = INSERT_SERVICIO;
        parent::$queryUpdate = UPDATE_SERVICIO;
    }

    public static function get($request)
    {
        UserAction::authenticator();

        $pdo = Connection::getInstance()->getConnection();
        $query = "SELECT * FROM " . self::NAME_TABLE . " WHERE dateDelete IS NULL";
        $parameters = [];

        if (!empty($request[0])) {
            if (!is_numeric($request[0])) {
                throw new ExcepcionAPI(BAD_REQUEST, ST400, "Debe indicar un ID numérico válido.");
            }
            $query .= " AND id = ?";
            $parameters[] = (int) $request[0];
        }

        $query .= " ORDER BY fecha_registro DESC, id DESC";
        $statement = $pdo->prepare($query);
        $statement->execute($parameters);
        $servicios = $statement->fetchAll(PDO::FETCH_ASSOC);

        if (empty($servicios)) {
            return new ContentBody(NO_CONTENT, ST204, no_result);
        }

        $ids = array_column($servicios, 'id');
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $statementRepuestos = $pdo->prepare(
            "SELECT servicio_id, repuesto_id, cantidad, precio_unitario
             FROM " . self::TABLE_SERVICIO_REPUESTO . "
             WHERE servicio_id IN ($placeholders)
             ORDER BY servicio_id, repuesto_id"
        );
        $statementRepuestos->execute($ids);

        $repuestosPorServicio = [];
        foreach ($statementRepuestos->fetchAll(PDO::FETCH_ASSOC) as $repuesto) {
            $servicioId = (int) $repuesto['servicio_id'];
            $repuestosPorServicio[$servicioId][] = [
                'repuesto_id' => (int) $repuesto['repuesto_id'],
                'cantidad' => (int) $repuesto['cantidad'],
                'precio_unitario' => (float) $repuesto['precio_unitario']
            ];
        }

        foreach ($servicios as &$servicio) {
            $servicioId = (int) $servicio['id'];
            $servicio['repuestos'] = $repuestosPorServicio[$servicioId] ?? [];
            $servicio['repuesto_ids'] = array_column($servicio['repuestos'], 'repuesto_id');
            $servicioModelo = new Servicio($servicio);
            $servicio['subtotal_repuestos'] = $servicioModelo->calcularSubtotalRepuestos();
            $servicio['monto_total'] = $servicioModelo->calcularTotalServicio();
        }
        unset($servicio);

        return new ContentBody(OK, ST200, $servicios);
    }

    public static function post($request)
    {
        UserAction::authenticator();
        self::init();
        $pdo = Connection::getInstance()->getConnection();
        $pdo->beginTransaction();

        try {
            $srv = self::leerServicioSolicitud();

            $stmt = $pdo->prepare(INSERT_SERVICIO);
            self::insertParameter($srv, $stmt);
            $stmt->execute();

            $servicioId = (int) $pdo->lastInsertId();
            self::guardarRepuestos($pdo, $servicioId, $srv);

            $pdo->commit();

            return new ContentBody(OK, ST201, [
                'id' => $servicioId,
                'message' => 'Servicio y repuestos guardados correctamente',
            ]);
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $e;
        }
    }

    public static function put($request)
    {
        UserAction::authenticator();

        if (empty($request[0]) || !is_numeric($request[0]) || (int) $request[0] < 1) {
            throw new ExcepcionAPI(BAD_REQUEST, ST400, "Debe indicar un ID numérico válido.");
        }

        $id = (int) $request[0];
        $srv = self::leerServicioSolicitud();
        $pdo = Connection::getInstance()->getConnection();
        $pdo->beginTransaction();

        try {
            $statement = $pdo->prepare(
                "SELECT id FROM " . self::NAME_TABLE . " WHERE id = ? AND dateDelete IS NULL"
            );
            $statement->execute([$id]);
            if (!$statement->fetchColumn()) {
                throw new ExcepcionAPI(NOT_FOUND, ST404, error_notExist);
            }

            $statement = $pdo->prepare(UPDATE_SERVICIO);
            self::updateParameter($srv, $statement, $id);
            $statement->execute();

            $statement = $pdo->prepare(DELETE_SERVICIO_REPUESTOS);
            $statement->execute([$id]);
            self::guardarRepuestos($pdo, $id, $srv);

            $pdo->commit();
            return new ContentBody(OK, ST200, "Servicio actualizado correctamente.");
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $e;
        }
    }

    private static function leerServicioSolicitud(): Servicio
    {
        $data = JSONUtil::decodeJSON();
        if (!is_object($data)) {
            throw new ExcepcionAPI(BAD_REQUEST, ST400, "El cuerpo debe ser un objeto JSON válido.");
        }

        return new Servicio((array) $data);
    }

    private static function guardarRepuestos(PDO $pdo, int $servicioId, Servicio $srv): void
    {
        if (empty($srv->getRepuestos())) {
            return;
        }

        $statement = $pdo->prepare(INSERT_SERVICIO_REPUESTO);
        foreach ($srv->getRepuestos() as $repuesto) {
            $statement->execute([
                $servicioId,
                (int) $repuesto['repuesto_id'],
                (int) $repuesto['cantidad'],
                (float) $repuesto['precio_unitario']
            ]);
        }
    }

    public static function insertParameter($object, $statement)
    {
        $srv = $object instanceof Servicio ? $object : new Servicio((array) $object);

        $clienteId = $srv->getClienteId();
        $vehiculoId = $srv->getVehiculoId();
        $empleadoId = $srv->getEmpleadoId();
        $configuracionId = $srv->getConfiguracionId();
        $estado = $srv->getEstado();
        $estadoFacturacion = $srv->getEstadoFacturacion();
        $descripcion = $srv->getDescripcion();
        $horas = $srv->getHorasEmpleadas();
        $manoObra = $srv->getValorManoObra();
        $fechaInicio = $srv->getFechaInicio();
        $fechaEstFin = $srv->getFechaEstimadaFin();
        $prioridad = $srv->getPrioridad();
        $observaciones = $srv->getObservaciones();

        $statement->bindValue(1, $clienteId, PDO::PARAM_INT);
        $statement->bindValue(2, $vehiculoId, PDO::PARAM_INT);
        $statement->bindValue(3, $empleadoId, PDO::PARAM_INT);
        $statement->bindValue(4, $configuracionId, $configuracionId === null ? PDO::PARAM_NULL : PDO::PARAM_INT);
        $statement->bindValue(5, $estado, PDO::PARAM_STR);
        $statement->bindValue(6, $estadoFacturacion, PDO::PARAM_STR);
        $statement->bindValue(7, $descripcion, PDO::PARAM_STR);
        $statement->bindValue(8, $horas);
        $statement->bindValue(9, $manoObra);
        $statement->bindValue(10, $fechaInicio, PDO::PARAM_STR);
        $statement->bindValue(11, $fechaEstFin, PDO::PARAM_STR);
        $statement->bindValue(12, $prioridad, PDO::PARAM_STR);
        $statement->bindValue(13, $observaciones, $observaciones === null ? PDO::PARAM_NULL : PDO::PARAM_STR);
    }

    public static function updateParameter($object, $statement, $id)
    {
        $srv = $object instanceof Servicio ? $object : new Servicio((array) $object);
        self::insertParameter($srv, $statement);
        $statement->bindValue(14, (int) $id, PDO::PARAM_INT);
    }
}
?>
