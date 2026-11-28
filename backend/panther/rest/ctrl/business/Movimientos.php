<?php
class Movimientos
{
    public static function init() {}

    private static function db()
    {
        return Connection::getInstance()->getConnection();
    }

    public static function get($ruta)
    {
        $db = self::db();
        $sub = is_array($ruta) ? $ruta : [];

        if (count($sub) > 1 || (count($sub) === 1 && !preg_match('/^[1-9][0-9]{0,9}$/D', (string)$sub[0]))) {
            throw new ExcepcionAPI(BAD_REQUEST, 400, 'Ruta no válida para movimientos.');
        }

        if (count($sub) === 1) {
            $id = (int)$sub[0];
            $q = $db->prepare(
                "SELECT m.*, r.nombre AS repuesto_nombre, p.razonSocial AS proveedor_nombre
                 FROM movimiento_inventario m
                 JOIN repuesto_taller r ON r.id = m.repuesto_id
                 LEFT JOIN proveedor_taller p ON p.id = m.proveedor_id
                 WHERE m.id = ? LIMIT 1"
            );
            $q->execute([$id]);
            $fila = $q->fetch(PDO::FETCH_ASSOC);
            if (!$fila) {
                throw new ExcepcionAPI(NOT_FOUND, 404, 'Movimiento no encontrado.');
            }
            return new ContentBody(OK, 200, $fila);
        }

        $where = [];
        $params = [];

        if (!empty($_GET['orden_id'])) {
            if (!ctype_digit((string)$_GET['orden_id'])) {
                throw new ExcepcionAPI(BAD_REQUEST, 400, 'orden_id inválido.');
            }
            $where[] = "m.orden_id = ?";
            $params[] = (int)$_GET['orden_id'];
        }

        if (!empty($_GET['tipo'])) {
            $tipo = strtolower(trim((string)$_GET['tipo']));
            if (!in_array($tipo, ['entrada', 'despacho', 'devolucion'], true)) {
                throw new ExcepcionAPI(BAD_REQUEST, 400, 'Tipo de movimiento inválido.');
            }
            $where[] = "m.tipo = ?";
            $params[] = $tipo;
        }

        if (!empty($_GET['repuesto_id'])) {
            if (!ctype_digit((string)$_GET['repuesto_id'])) {
                throw new ExcepcionAPI(BAD_REQUEST, 400, 'repuesto_id inválido.');
            }
            $where[] = "m.repuesto_id = ?";
            $params[] = (int)$_GET['repuesto_id'];
        }

        $sql = "SELECT m.*, r.nombre AS repuesto_nombre, p.razonSocial AS proveedor_nombre
                FROM movimiento_inventario m
                JOIN repuesto_taller r ON r.id = m.repuesto_id
                LEFT JOIN proveedor_taller p ON p.id = m.proveedor_id";
        if ($where) {
            $sql .= " WHERE " . implode(" AND ", $where);
        }
        $sql .= " ORDER BY m.id DESC";

        $q = $db->prepare($sql);
        $q->execute($params);
        return new ContentBody(OK, 200, $q->fetchAll(PDO::FETCH_ASSOC));
    }

    public static function post($ruta)
    {
        $sub = is_array($ruta) ? $ruta : [];
        if (!empty($sub) && $sub !== ['']) {
            throw new ExcepcionAPI(NOT_FOUND, 404, 'Ruta desconocida.');
        }

        $body = self::obtenerCuerpo();
        $tipo = strtolower(trim((string)($body['tipo'] ?? '')));
        if (!in_array($tipo, ['entrada', 'despacho', 'devolucion'], true)) {
            throw new ExcepcionAPI(BAD_REQUEST, 400, 'Tipo inválido. Usa: entrada, despacho o devolucion.');
        }

        $cantidadRaw = $body['cantidad'] ?? null;
        if ($cantidadRaw === null || filter_var($cantidadRaw, FILTER_VALIDATE_INT) === false || (int)$cantidadRaw <= 0) {
            throw new ExcepcionAPI(BAD_REQUEST, 400, 'La cantidad debe ser un entero positivo.');
        }
        $cantidad = (int)$cantidadRaw;

        $repuestoIdRaw = $body['repuesto_id'] ?? null;
        $referenciaRaw = trim((string)($body['referencia'] ?? ''));
        if (($repuestoIdRaw === null || $repuestoIdRaw === '') && $referenciaRaw === '') {
            throw new ExcepcionAPI(BAD_REQUEST, 400, 'Indica repuesto_id o referencia.');
        }

        $fecha = self::normalizarFecha($body['fecha'] ?? null);
        $usuario = self::obtenerUsuarioActual();

        $db = self::db();
        $iniciada = false;

        try {
            $db->beginTransaction();
            $iniciada = true;

            // Bloquear fila del repuesto antes de validar y modificar existencias
            if ($repuestoIdRaw !== null && $repuestoIdRaw !== '') {
                if (filter_var($repuestoIdRaw, FILTER_VALIDATE_INT) === false || (int)$repuestoIdRaw <= 0) {
                    throw new ExcepcionAPI(BAD_REQUEST, 400, 'repuesto_id inválido.');
                }
                $qRep = $db->prepare(
                    "SELECT id, referencia, nombre, precio, existencias
                     FROM repuesto_taller WHERE id = ? FOR UPDATE"
                );
                $qRep->execute([(int)$repuestoIdRaw]);
            } else {
                $qRep = $db->prepare(
                    "SELECT id, referencia, nombre, precio, existencias
                     FROM repuesto_taller WHERE referencia = ? FOR UPDATE"
                );
                $qRep->execute([$referenciaRaw]);
            }

            $repuesto = $qRep->fetch(PDO::FETCH_ASSOC);
            if (!$repuesto) {
                throw new ExcepcionAPI(NOT_FOUND, 404, 'El repuesto indicado no existe.');
            }

            if ($referenciaRaw !== '' && strcasecmp($referenciaRaw, (string)$repuesto['referencia']) !== 0) {
                throw new ExcepcionAPI(BAD_REQUEST, 400, 'La referencia no coincide con el repuesto indicado.');
            }

            $repuestoId = (int)$repuesto['id'];
            $referencia = (string)$repuesto['referencia'];
            $existenciasActuales = (int)$repuesto['existencias'];
            $precioCatalogo = round((float)$repuesto['precio'], 2);

            $proveedorId = null;
            $ordenId = null;
            $despachoId = null;
            $precioUnitario = 0.0;
            $nuevasExistencias = $existenciasActuales;

            if ($tipo === 'entrada') {
                $precioCompraRaw = $body['precio_compra'] ?? ($body['precio_unitario'] ?? ($body['precio'] ?? null));
                if ($precioCompraRaw === null || !is_numeric($precioCompraRaw) || (float)$precioCompraRaw <= 0) {
                    throw new ExcepcionAPI(BAD_REQUEST, 400, 'Para entradas debes indicar un precio de compra mayor a 0.');
                }
                $precioUnitario = round((float)$precioCompraRaw, 2);

                if (isset($body['proveedor_id']) && $body['proveedor_id'] !== '' && $body['proveedor_id'] !== null) {
                    if (filter_var($body['proveedor_id'], FILTER_VALIDATE_INT) === false || (int)$body['proveedor_id'] <= 0) {
                        throw new ExcepcionAPI(BAD_REQUEST, 400, 'proveedor_id inválido.');
                    }
                    $proveedorId = (int)$body['proveedor_id'];
                    $qProv = $db->prepare("SELECT id, estado FROM proveedor_taller WHERE id = ? LIMIT 1");
                    $qProv->execute([$proveedorId]);
                    $prov = $qProv->fetch(PDO::FETCH_ASSOC);
                    if (!$prov) {
                        throw new ExcepcionAPI(NOT_FOUND, 404, 'El proveedor indicado no existe.');
                    }
                    if ($prov['estado'] !== 'Activo') {
                        throw new ExcepcionAPI(BAD_REQUEST, 409, 'El proveedor indicado no está activo.');
                    }
                }

                $nuevasExistencias = $existenciasActuales + $cantidad;

            } elseif ($tipo === 'despacho') {
                $ordenId = self::validarOrden($db, $body['orden_id'] ?? null, true);

                if ($existenciasActuales < $cantidad) {
                    throw new ExcepcionAPI(
                        BAD_REQUEST,
                        409,
                        "Saldo insuficiente para despacho. Disponible: {$existenciasActuales}, solicitado: {$cantidad}."
                    );
                }

                $precioAplicadoRaw = $body['precio_unitario'] ?? ($body['precio'] ?? null);
                if ($precioAplicadoRaw !== null && $precioAplicadoRaw !== '') {
                    if (!is_numeric($precioAplicadoRaw) || (float)$precioAplicadoRaw < 0) {
                        throw new ExcepcionAPI(BAD_REQUEST, 400, 'precio_unitario inválido.');
                    }
                    $precioUnitario = round((float)$precioAplicadoRaw, 2);
                } else {
                    $precioUnitario = $precioCatalogo;
                }

                $nuevasExistencias = $existenciasActuales - $cantidad;

            } elseif ($tipo === 'devolucion') {
                $ordenId = self::validarOrden($db, $body['orden_id'] ?? null, false);

                $despachoIdRaw = $body['despacho_id'] ?? null;
                if ($despachoIdRaw === null || $despachoIdRaw === '' || filter_var($despachoIdRaw, FILTER_VALIDATE_INT) === false || (int)$despachoIdRaw <= 0) {
                    throw new ExcepcionAPI(BAD_REQUEST, 400, 'Para registrar una devolución debes indicar despacho_id.');
                }
                $despachoId = (int)$despachoIdRaw;

                $qDesp = $db->prepare(
                    "SELECT id, orden_id, repuesto_id, cantidad, precio_unitario
                     FROM movimiento_inventario
                     WHERE id = ? AND tipo = 'despacho'
                     FOR UPDATE"
                );
                $qDesp->execute([$despachoId]);
                $despacho = $qDesp->fetch(PDO::FETCH_ASSOC);

                if (!$despacho) {
                    throw new ExcepcionAPI(NOT_FOUND, 404, "El despacho #{$despachoId} no existe.");
                }
                if ((int)$despacho['orden_id'] !== $ordenId || (int)$despacho['repuesto_id'] !== $repuestoId) {
                    throw new ExcepcionAPI(
                        BAD_REQUEST,
                        400,
                        'El despacho indicado no corresponde a esa orden y repuesto.'
                    );
                }

                $qDev = $db->prepare(
                    "SELECT COALESCE(SUM(cantidad), 0)
                     FROM movimiento_inventario
                     WHERE tipo = 'devolucion' AND despacho_id = ?
                     FOR UPDATE"
                );
                $qDev->execute([$despachoId]);
                $totalDevuelto = (int)$qDev->fetchColumn();
                $cantidadDespachada = (int)$despacho['cantidad'];
                $saldoDevolvible = $cantidadDespachada - $totalDevuelto;

                if ($cantidad > $saldoDevolvible) {
                    throw new ExcepcionAPI(
                        BAD_REQUEST,
                        409,
                        "La devolución ({$cantidad}) supera lo disponible por devolver en el despacho #{$despachoId} ({$saldoDevolvible})."
                    );
                }

                $precioUnitario = round((float)$despacho['precio_unitario'], 2);
                $nuevasExistencias = $existenciasActuales + $cantidad;
            }

            $upd = $db->prepare("UPDATE repuesto_taller SET existencias = ? WHERE id = ?");
            $upd->execute([$nuevasExistencias, $repuestoId]);

            $ins = $db->prepare(
                "INSERT INTO movimiento_inventario
                    (tipo, repuesto_id, referencia, cantidad, precio_unitario, proveedor_id, orden_id, despacho_id, usuario_cedula, usuario_id, fecha)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
            );
            $ins->execute([
                $tipo,
                $repuestoId,
                $referencia,
                $cantidad,
                $precioUnitario,
                $proveedorId,
                $ordenId,
                $despachoId,
                $usuario['cedula'],
                $usuario['usuario_id'],
                $fecha
            ]);

            $movimientoId = (int)$db->lastInsertId();
            $db->commit();
            $iniciada = false;

            return new ContentBody(OK, 201, [
                'id' => $movimientoId,
                'tipo' => $tipo,
                'repuesto_id' => $repuestoId,
                'referencia' => $referencia,
                'cantidad' => $cantidad,
                'precio_unitario' => number_format($precioUnitario, 2, '.', ''),
                'proveedor_id' => $proveedorId,
                'orden_id' => $ordenId,
                'despacho_id' => $despachoId,
                'usuario_cedula' => $usuario['cedula'],
                'fecha' => $fecha,
                'existencias_anteriores' => $existenciasActuales,
                'existencias_actuales' => $nuevasExistencias
            ]);
        } catch (ExcepcionAPI $e) {
            if ($iniciada && $db->inTransaction()) {
                $db->rollBack();
            }
            throw $e;
        } catch (Throwable $e) {
            if ($iniciada && $db->inTransaction()) {
                $db->rollBack();
            }
            throw new ExcepcionAPI(INTERNAL_SERVER_ERROR, 500, 'No se pudo completar el movimiento de inventario.');
        }
    }

    private static function validarOrden(PDO $db, $ordenIdRaw, $exigirActiva)
    {
        if ($ordenIdRaw === null || $ordenIdRaw === '' || filter_var($ordenIdRaw, FILTER_VALIDATE_INT) === false || (int)$ordenIdRaw <= 0) {
            throw new ExcepcionAPI(BAD_REQUEST, 400, 'Indica un orden_id válido.');
        }
        $ordenId = (int)$ordenIdRaw;

        $qOrden = $db->prepare("SELECT id, estado FROM ordenes WHERE id = ? FOR UPDATE");
        $qOrden->execute([$ordenId]);
        $orden = $qOrden->fetch(PDO::FETCH_ASSOC);

        if (!$orden) {
            throw new ExcepcionAPI(NOT_FOUND, 404, "La orden #{$ordenId} no existe.");
        }

        if ($exigirActiva && in_array($orden['estado'], ['finalizada', 'cancelada'], true)) {
            throw new ExcepcionAPI(
                BAD_REQUEST,
                409,
                "La orden #{$ordenId} no está activa (estado actual: {$orden['estado']})."
            );
        }

        return $ordenId;
    }

    private static function obtenerUsuarioActual()
    {
        $db = self::db();
        $headers = function_exists('apache_request_headers')
            ? array_change_key_case(apache_request_headers(), CASE_LOWER)
            : [];
        $token = $headers['authorization'] ?? ($_SERVER['HTTP_AUTHORIZATION'] ?? '');

        if ($token === '') {
            throw new ExcepcionAPI(UNAUTHORIZED, 401, 'Token de sesión requerido.');
        }

        $q = $db->prepare(
            "SELECT u.id AS usuario_id, c.cedula
             FROM j4user u
             LEFT JOIN cuenta_empleado c ON c.usuario_id = u.id
             WHERE u.keyAPI = ? AND u.sesionHasta > UTC_TIMESTAMP() AND u.dateDelete IS NULL
             LIMIT 1"
        );
        $q->execute([hash('sha224', $token)]);
        $fila = $q->fetch(PDO::FETCH_ASSOC);

        if (!$fila) {
            throw new ExcepcionAPI(UNAUTHORIZED, 401, 'Sesión no válida o expirada.');
        }

        $cedula = $fila['cedula'] ?? null;
        if ($cedula === null && !empty(AccesoTaller::$perfilActual['cedula'])) {
            $cedula = AccesoTaller::$perfilActual['cedula'];
        }

        return [
            'usuario_id' => (int)$fila['usuario_id'],
            'cedula' => $cedula
        ];
    }

    private static function normalizarFecha($fechaRaw)
    {
        if ($fechaRaw === null || trim((string)$fechaRaw) === '') {
            return date('Y-m-d H:i:s');
        }
        $ts = strtotime((string)$fechaRaw);
        if ($ts === false) {
            throw new ExcepcionAPI(BAD_REQUEST, 400, 'Formato de fecha inválido.');
        }
        return date('Y-m-d H:i:s', $ts);
    }

    private static function obtenerCuerpo()
    {
        $decoded = JSONUtil::decodeJSON();
        if (is_object($decoded)) {
            return (array)$decoded;
        }
        if (is_array($decoded)) {
            return $decoded;
        }
        $raw = file_get_contents('php://input');
        if ($raw !== false && trim($raw) !== '') {
            $arr = json_decode($raw, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($arr)) {
                return $arr;
            }
            throw new ExcepcionAPI(BAD_REQUEST, 400, 'Cuerpo JSON inválido.');
        }
        return !empty($_POST) ? $_POST : [];
    }
}