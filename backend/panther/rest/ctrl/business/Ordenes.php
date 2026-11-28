<?php

class Ordenes
{
    public static function init() {}

    private static function db()
    {
        return Connection::getInstance()->getConnection();
    }

    private static function rutaInvalida()
    {
        throw new ExcepcionAPI(NOT_FOUND, 404, 'Ruta de órdenes desconocida.');
    }

    private static function normalizarFechaHora($valor)
    {
        if (!is_string($valor) || trim($valor) === '') {
            throw new ExcepcionAPI(BAD_REQUEST, 400, 'Revisa la fecha y hora de la orden.');
        }
        $limpia = str_replace('T', ' ', trim($valor));
        if (preg_match('/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/', $limpia)) {
            $limpia .= ':00';
        }
        if (!preg_match('/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/', $limpia)) {
            throw new ExcepcionAPI(BAD_REQUEST, 400, 'Formato de fecha/hora inválido.');
        }
        return $limpia;
    }

    private static function perfilActual()
    {
        if (class_exists('AccesoTaller') && is_array(AccesoTaller::$perfilActual)) {
            return AccesoTaller::$perfilActual;
        }
        return [
            'rol' => $_SESSION['rol'] ?? null,
            'cedula' => $_SESSION['cedula'] ?? $_SESSION['mecanico_cedula'] ?? null,
            'estado' => 'Activo',
            'cargo' => null
        ];
    }

    private static function esAdminOJefe()
    {
        $rol = strtolower((string)(self::perfilActual()['rol'] ?? ''));
        return in_array($rol, ['admin', 'administrador', 'jefe_taller', 'jefe de taller'], true);
    }

    private static function esMecanico()
    {
        $rol = strtolower((string)(self::perfilActual()['rol'] ?? ''));
        return in_array($rol, ['mecanico', 'mecánico'], true);
    }

    private static function cedulaSesion()
    {
        $cedula = trim((string)(self::perfilActual()['cedula'] ?? ''));
        if ($cedula === '') {
            throw new ExcepcionAPI(UNAUTHORIZED, 401, 'El usuario en sesión no tiene una cédula de empleado asociada.');
        }
        return $cedula;
    }

    public static function get($ruta)
    {
        UserAction::authenticator(false);
        $db = self::db();
        $esMec = self::esMecanico();
        $cedula = $esMec ? self::cedulaSesion() : null;

        if (!$ruta || $ruta === ['']) {
            if ($esMec) {
                $q = $db->prepare('SELECT * FROM ordenes WHERE mecanico_cedula = ? ORDER BY id DESC');
                $q->execute([$cedula]);
                return new ContentBody(OK, 200, $q->fetchAll(PDO::FETCH_ASSOC));
            }
            $sql = 'SELECT * FROM ordenes ORDER BY id DESC';
            return new ContentBody(OK, 200, $db->query($sql)->fetchAll(PDO::FETCH_ASSOC));
        }

        if (count($ruta) === 1 && preg_match('/^[0-9]+$/D', $ruta[0])) {
            $q = $db->prepare('SELECT * FROM ordenes WHERE id = ?');
            $q->execute([(int)$ruta[0]]);
            $orden = $q->fetch(PDO::FETCH_ASSOC);
            if (!$orden) {
                throw new ExcepcionAPI(NOT_FOUND, 404, 'Orden no encontrada.');
            }
            if ($esMec && (string)$orden['mecanico_cedula'] !== $cedula) {
                throw new ExcepcionAPI(FORBIDDEN, 403, 'Esta orden no está asignada a tu usuario.');
            }
            return new ContentBody(OK, 200, $orden);
        }

        self::rutaInvalida();
    }

    public static function post($ruta)
    {
        UserAction::authenticator(false);
        if ($ruta && $ruta !== ['']) {
            self::rutaInvalida();
        }

        $obj = JSONUtil::decodeJSON();
        $db = self::db();

        $vehiculoIdRaw = $obj->vehiculo_id ?? null;
        $placaRaw = $obj->placa ?? null;
        $clienteRaw = $obj->cliente ?? ($obj->cliente_id ?? null);
        $fechaHoraRaw = $obj->fecha_hora ?? ($obj->{'fecha/hora'} ?? null);
        $diagnostico = is_string($obj->diagnostico ?? null) ? trim($obj->diagnostico) : '';

        $tieneVehiculoId = ($vehiculoIdRaw !== null && $vehiculoIdRaw !== '' && filter_var($vehiculoIdRaw, FILTER_VALIDATE_INT) && (int)$vehiculoIdRaw > 0);
        $placa = is_string($placaRaw) ? strtoupper(preg_replace('/\s+/', '', trim($placaRaw))) : '';

        if ((!$tieneVehiculoId && $placa === '') || !filter_var($clienteRaw, FILTER_VALIDATE_INT) || (int)$clienteRaw <= 0 || $diagnostico === '') {
            throw new ExcepcionAPI(BAD_REQUEST, 400, 'Revisa placa o vehiculo_id, cliente, fecha/hora y diagnóstico.');
        }

        $fechaHora = self::normalizarFechaHora($fechaHoraRaw);
        $clienteId = (int)$clienteRaw;

        if ($tieneVehiculoId) {
            $q = $db->prepare('SELECT id, cliente_id FROM vehiculo_taller WHERE id = ? LIMIT 1');
            $q->execute([(int)$vehiculoIdRaw]);
        } else {
            $q = $db->prepare('SELECT id, cliente_id FROM vehiculo_taller WHERE placa = ? LIMIT 1');
            $q->execute([$placa]);
        }
        $vehiculo = $q->fetch(PDO::FETCH_ASSOC);

        if (!$vehiculo) {
            throw new ExcepcionAPI(NOT_FOUND, 404, 'El vehículo indicado no existe.');
        }

        if ((int)$vehiculo['cliente_id'] !== $clienteId) {
            throw new ExcepcionAPI(BAD_REQUEST, 409, 'El cliente no corresponde al propietario del vehículo.');
        }

        try {
            $ins = $db->prepare('
                INSERT INTO ordenes (vehiculo_id, cliente_id, fecha_hora, diagnostico, estado)
                VALUES (:vehiculo_id, :cliente_id, :fecha_hora, :diagnostico, "pendiente")
            ');
            $ins->execute([
                ':vehiculo_id' => (int)$vehiculo['id'],
                ':cliente_id'  => $clienteId,
                ':fecha_hora'  => $fechaHora,
                ':diagnostico' => $diagnostico
            ]);
            $ordenId = (int)$db->lastInsertId();
        } catch (PDOException $e) {
            throw new ExcepcionAPI(INTERNAL_SERVER_ERROR, 500, 'No se pudo registrar la orden.');
        }

        header('Cache-Control: no-store');
        return new ContentBody(OK, 201, ['orden_id' => $ordenId, 'estado' => 'pendiente']);
    }

    public static function put($ruta)
    {
        UserAction::authenticator(false);
        if (count($ruta) !== 2 || !preg_match('/^[0-9]+$/D', $ruta[0])) {
            self::rutaInvalida();
        }

        $ordenId = (int)$ruta[0];
        $subruta = $ruta[1];
        $obj = JSONUtil::decodeJSON();
        $db = self::db();

        if ($subruta === 'asignacion') {
            $mecanicoCedula = trim((string)($obj->mecanico_cedula ?? ($obj->mecanico_id ?? '')));
            if (!preg_match('/^[0-9]{7,10}$/D', $mecanicoCedula)) {
                throw new ExcepcionAPI(BAD_REQUEST, 400, 'Revisa el ID/cédula del mecánico.');
            }

            $db->beginTransaction();
            try {
                // Bloquear la fila del mecánico antes de comprobar sus órdenes
                $qMec = $db->prepare('SELECT cedula, estado FROM empleado_taller WHERE cedula = ? FOR UPDATE');
                $qMec->execute([$mecanicoCedula]);
                $mec = $qMec->fetch(PDO::FETCH_ASSOC);

                if (!$mec) {
                    throw new ExcepcionAPI(NOT_FOUND, 404, 'Mecánico no encontrado.');
                }
                if (strcasecmp((string)$mec['estado'], 'Activo') !== 0) {
                    throw new ExcepcionAPI(BAD_REQUEST, 409, 'El mecánico no está activo.');
                }

                $qActivas = $db->prepare('
                    SELECT COUNT(*) FROM ordenes
                    WHERE mecanico_cedula = ? AND estado IN ("asignada", "en_proceso")
                ');
                $qActivas->execute([$mecanicoCedula]);
                if ((int)$qActivas->fetchColumn() > 0) {
                    throw new ExcepcionAPI(BAD_REQUEST, 409, 'El mecánico ya tiene una orden activa.');
                }

                $qOrd = $db->prepare('SELECT id, estado FROM ordenes WHERE id = ? FOR UPDATE');
                $qOrd->execute([$ordenId]);
                $orden = $qOrd->fetch(PDO::FETCH_ASSOC);

                if (!$orden) {
                    throw new ExcepcionAPI(NOT_FOUND, 404, 'Orden no encontrada.');
                }
                if (in_array($orden['estado'], ['finalizada', 'cancelada'], true)) {
                    throw new ExcepcionAPI(BAD_REQUEST, 409, 'La orden ya está cerrada.');
                }

                $db->prepare('UPDATE ordenes SET mecanico_cedula = ?, estado = "asignada" WHERE id = ?')
                   ->execute([$mecanicoCedula, $ordenId]);

                $db->commit();
            } catch (Throwable $error) {
                if ($db->inTransaction()) $db->rollBack();
                if ($error instanceof ExcepcionAPI) throw $error;
                throw new ExcepcionAPI(INTERNAL_SERVER_ERROR, 500, 'No se pudo asignar el mecánico.');
            }

            return new ContentBody(OK, 200, ['orden_id' => $ordenId, 'mecanico_cedula' => $mecanicoCedula, 'estado' => 'asignada']);
        }

        if ($subruta === 'estado') {
            $nuevoEstado = trim((string)($obj->estado ?? ''));
            $transiciones = [
                'pendiente'  => ['asignada', 'cancelada'],
                'asignada'   => ['en_proceso', 'cancelada'],
                'en_proceso' => ['finalizada', 'cancelada'],
                'finalizada' => [],
                'cancelada'  => []
            ];

            if (!array_key_exists($nuevoEstado, $transiciones)) {
                throw new ExcepcionAPI(BAD_REQUEST, 400, 'Estado destino inválido.');
            }

            $db->beginTransaction();
            try {
                $qOrd = $db->prepare('SELECT id, mecanico_cedula, estado FROM ordenes WHERE id = ? FOR UPDATE');
                $qOrd->execute([$ordenId]);
                $orden = $qOrd->fetch(PDO::FETCH_ASSOC);

                if (!$orden) {
                    throw new ExcepcionAPI(NOT_FOUND, 404, 'Orden no encontrada.');
                }

                $estadoActual = $orden['estado'];
                if (!in_array($nuevoEstado, $transiciones[$estadoActual], true)) {
                    throw new ExcepcionAPI(BAD_REQUEST, 409, "Transición no válida de {$estadoActual} a {$nuevoEstado}.");
                }

                $esAdmin = self::esAdminOJefe();
                $cedulaActual = self::cedulaSesion();
                $esMecanicoAsignado = ($orden['mecanico_cedula'] !== null && (string)$orden['mecanico_cedula'] === $cedulaActual);

                if (!$esAdmin && !$esMecanicoAsignado) {
                    throw new ExcepcionAPI(FORBIDDEN, 403, 'Usuario no autorizado para cambiar el estado de esta orden.');
                }

                $db->prepare('UPDATE ordenes SET estado = ? WHERE id = ?')
                   ->execute([$nuevoEstado, $ordenId]);

                $db->commit();
            } catch (Throwable $error) {
                if ($db->inTransaction()) $db->rollBack();
                if ($error instanceof ExcepcionAPI) throw $error;
                throw new ExcepcionAPI(INTERNAL_SERVER_ERROR, 500, 'No se pudo actualizar el estado de la orden.');
            }

            return new ContentBody(OK, 200, ['orden_id' => $ordenId, 'estado' => $nuevoEstado]);
        }

        if ($subruta === 'horas') {
            $horas = filter_var($obj->horas ?? null, FILTER_VALIDATE_FLOAT);
            if ($horas === false || (float)$horas <= 0) {
                throw new ExcepcionAPI(BAD_REQUEST, 400, 'Ingresa una cantidad de horas mayor a cero.');
            }

            $db->beginTransaction();
            try {
                $cedulaActual = self::cedulaSesion();

                $qOrd = $db->prepare('SELECT id, mecanico_cedula, estado, horas_trabajadas FROM ordenes WHERE id = ? FOR UPDATE');
                $qOrd->execute([$ordenId]);
                $orden = $qOrd->fetch(PDO::FETCH_ASSOC);

                if (!$orden) {
                    throw new ExcepcionAPI(NOT_FOUND, 404, 'Orden no encontrada.');
                }
                if ((string)$orden['mecanico_cedula'] !== $cedulaActual) {
                    throw new ExcepcionAPI(FORBIDDEN, 403, 'La orden no está asignada al mecánico de la sesión.');
                }
                if (in_array($orden['estado'], ['finalizada', 'cancelada'], true)) {
                    throw new ExcepcionAPI(BAD_REQUEST, 409, 'No se pueden registrar horas en una orden cerrada.');
                }

                $nota = is_string($obj->nota ?? null) && trim($obj->nota) !== '' ? trim($obj->nota) : null;
                $db->prepare('INSERT INTO orden_horas (orden_id, mecanico_cedula, horas, nota) VALUES (?, ?, ?, ?)')
                   ->execute([$ordenId, $cedulaActual, (float)$horas, $nota]);

                $db->prepare('UPDATE ordenes SET horas_trabajadas = horas_trabajadas + ? WHERE id = ?')
                   ->execute([(float)$horas, $ordenId]);

                $db->commit();
            } catch (Throwable $error) {
                if ($db->inTransaction()) $db->rollBack();
                if ($error instanceof ExcepcionAPI) throw $error;
                throw new ExcepcionAPI(INTERNAL_SERVER_ERROR, 500, 'No se pudieron registrar las horas.');
            }

            return new ContentBody(OK, 200, ['orden_id' => $ordenId, 'horas_agregadas' => (float)$horas]);
        }

        self::rutaInvalida();
    }
}