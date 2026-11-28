<?php
declare(strict_types=1);

namespace panther\ctrl\business;

use panther\ctrl\core\commun\Request;
use panther\ctrl\core\segurity\UserAction;
use panther\cxn\Connection;
use panther\querys\business\FacturasQueries;
use panther\util\ContentBody;
use panther\util\ExcepcionAPI;
use panther\util\JSONUtil;
use panther\util\MessageUser;
use panther\util\Status;
use PDO;
use PDOStatement;
use Throwable;

class Facturas extends Request
{
    private const NAME_TABLE = 'facturas';
    private const PREFIJO_DEFAULT = 'ORS';
    private const VALOR_HORA_DEFAULT = 25000.0;
    private const UTILIDAD_DEFAULT = 10.0;
    private const ESTADOS_PAGO = ['PENDIENTE', 'PAGADA', 'ANULADA'];

    public function __construct()
    {
        $this->nameTable = self::NAME_TABLE;
        $this->queryInsert = FacturasQueries::INSERT;
        $this->queryUpdate = FacturasQueries::UPDATE_ESTADO;
    }

    public function get(array $request): ContentBody
    {
        UserAction::authenticator();
        $pdo = Connection::getInstance()->getConnection();

        if (count($request) === 1 && strtolower((string) $request[0]) === 'resumen') {
            $statement = $pdo->prepare(FacturasQueries::SELECT_RESUMEN);
            $statement->execute();
            $resumen = $statement->fetch(PDO::FETCH_ASSOC) ?: [];
            return new ContentBody(Status::OK, Status::ST200, $resumen);
        }

        if (count($request) === 1 && strtolower((string) $request[0]) === 'ordenes-facturables') {
            $statement = $pdo->prepare(FacturasQueries::SELECT_ORDENES_FACTURABLES);
            $statement->execute();
            $ordenes = $statement->fetchAll(PDO::FETCH_ASSOC);
            foreach ($ordenes as &$orden) {
                $orden['repuestos'] = $this->obtenerRepuestosOrden($pdo, (int) $orden['id']);
                $orden['preview'] = $this->calcularLiquidacion(
                    $orden['repuestos'],
                    (float) $orden['horas'],
                    self::VALOR_HORA_DEFAULT,
                    self::UTILIDAD_DEFAULT
                );
            }
            unset($orden);
            return new ContentBody(Status::OK, Status::ST200, $ordenes);
        }

        if (count($request) === 2 && strtolower((string) $request[0]) === 'preview-orden') {
            $ordenId = (int) $request[1];
            if ($ordenId <= 0) {
                throw new ExcepcionAPI(Status::BAD_REQUEST, Status::ST400, 'Identificador de orden inválido.');
            }
            $detalle = $this->cargarOrdenFacturable($pdo, $ordenId, false);
            return new ContentBody(Status::OK, Status::ST200, $detalle);
        }

        if (count($request) === 0) {
            $statement = $pdo->prepare(FacturasQueries::SELECT_ALL);
            $statement->execute();
            $facturas = $statement->fetchAll(PDO::FETCH_ASSOC);
            return new ContentBody(Status::OK, Status::ST200, $facturas);
        }

        if (count($request) === 1 && ctype_digit((string) $request[0])) {
            $factura = $this->obtenerFacturaCompleta($pdo, (int) $request[0]);
            if ($factura === null) {
                throw new ExcepcionAPI(Status::NOT_FOUND, Status::ST404, MessageUser::ERROR_NOT_EXIST);
            }
            return new ContentBody(Status::OK, Status::ST200, $factura);
        }

        $columna = strtolower(trim((string) ($request[0] ?? '')));
        $valor = trim((string) ($request[1] ?? ''));
        if ($columna === '' || $valor === '') {
            throw new ExcepcionAPI(Status::BAD_REQUEST, Status::ST400, 'Parámetros de búsqueda incompletos.');
        }

        if ($columna === 'estado_pago' || $columna === 'estado') {
            $estado = strtoupper($valor);
            if (!in_array($estado, self::ESTADOS_PAGO, true)) {
                throw new ExcepcionAPI(Status::BAD_REQUEST, Status::ST400, 'Estado de pago no válido.');
            }
            $statement = $pdo->prepare(FacturasQueries::SELECT_BY_ESTADO_PAGO);
            $statement->bindValue(1, $estado, PDO::PARAM_STR);
            $statement->execute();
            return new ContentBody(Status::OK, Status::ST200, $statement->fetchAll(PDO::FETCH_ASSOC));
        }

        if ($columna === 'numero_documento' || $columna === 'numero') {
            $statement = $pdo->prepare(FacturasQueries::SELECT_BY_NUMERO);
            $statement->bindValue(1, '%' . $valor . '%', PDO::PARAM_STR);
            $statement->execute();
            return new ContentBody(Status::OK, Status::ST200, $statement->fetchAll(PDO::FETCH_ASSOC));
        }

        throw new ExcepcionAPI(Status::BAD_REQUEST, Status::ST400, 'Criterio de búsqueda no soportado.');
    }

    public function post(array $request): ContentBody
    {
        UserAction::authenticator();
        $object = JSONUtil::decodeJSON();
        $ordenId = (int) ($object->orden_id ?? 0);
        if ($ordenId <= 0) {
            throw new ExcepcionAPI(Status::BAD_REQUEST, Status::ST400, 'Debe seleccionar una orden de servicio.');
        }

        $valorHora = $this->normalizarNumero($object->valor_hora ?? self::VALOR_HORA_DEFAULT, 'El valor hora debe ser mayor a 0.');
        $porcentajeUtilidad = $this->normalizarNumero(
            $object->porcentaje_utilidad ?? self::UTILIDAD_DEFAULT,
            'El porcentaje de utilidad debe ser mayor o igual a 0.',
            true
        );
        $formaPago = strtoupper(trim((string) ($object->forma_pago ?? 'CONTADO')));
        $medioPago = strtoupper(trim((string) ($object->medio_pago ?? 'EFECTIVO')));
        $estadoPago = strtoupper(trim((string) ($object->estado_pago ?? 'PENDIENTE')));
        $observacion = trim((string) ($object->observacion ?? ''));
        $prefijo = strtoupper(trim((string) ($object->prefijo ?? self::PREFIJO_DEFAULT)));

        if ($prefijo === '' || strlen($prefijo) > 10) {
            throw new ExcepcionAPI(Status::BAD_REQUEST, Status::ST400, 'Prefijo de factura inválido.');
        }
        if (!in_array($estadoPago, ['PENDIENTE', 'PAGADA'], true)) {
            throw new ExcepcionAPI(Status::BAD_REQUEST, Status::ST400, 'Estado de pago inicial no válido.');
        }

        $pdo = Connection::getInstance()->getConnection();
        try {
            $pdo->beginTransaction();

            $existente = $this->facturaActivaPorOrden($pdo, $ordenId);
            if ($existente !== null) {
                throw new ExcepcionAPI(
                    Status::BAD_REQUEST,
                    Status::ST400,
                    'La orden ya tiene la factura ' . $existente['numero_documento'] . ' vigente.'
                );
            }

            $orden = $this->cargarOrdenBloqueada($pdo, $ordenId);
            $repuestos = $this->obtenerRepuestosOrden($pdo, $ordenId);
            $liquidacion = $this->calcularLiquidacion(
                $repuestos,
                (float) $orden['horas'],
                $valorHora,
                $porcentajeUtilidad
            );

            $consecutivo = $this->siguienteConsecutivo($pdo, $prefijo);
            $numeroDocumento = sprintf('%s-%06d', $prefijo, $consecutivo);
            $ahora = date('Y-m-d H:i:s');
            $vencimiento = date('Y-m-d', strtotime('+15 days'));

            $statement = $pdo->prepare(FacturasQueries::INSERT);
            $statement->bindValue(1, $prefijo, PDO::PARAM_STR);
            $statement->bindValue(2, $consecutivo, PDO::PARAM_INT);
            $statement->bindValue(3, $numeroDocumento, PDO::PARAM_STR);
            $statement->bindValue(4, $ordenId, PDO::PARAM_INT);
            if ($orden['cliente_id'] !== null && $orden['cliente_id'] !== '') {
                $statement->bindValue(5, (int) $orden['cliente_id'], PDO::PARAM_INT);
            } else {
                $statement->bindValue(5, null, PDO::PARAM_NULL);
            }
            $statement->bindValue(6, $ahora, PDO::PARAM_STR);
            $statement->bindValue(7, $vencimiento, PDO::PARAM_STR);
            $statement->bindValue(8, $formaPago, PDO::PARAM_STR);
            $statement->bindValue(9, $medioPago, PDO::PARAM_STR);
            $statement->bindValue(10, number_format($liquidacion['valor_hora'], 2, '.', ''), PDO::PARAM_STR);
            $statement->bindValue(11, number_format($liquidacion['porcentaje_utilidad'], 2, '.', ''), PDO::PARAM_STR);
            $statement->bindValue(12, number_format($liquidacion['subtotal_repuestos'], 2, '.', ''), PDO::PARAM_STR);
            $statement->bindValue(13, number_format($liquidacion['mano_obra'], 2, '.', ''), PDO::PARAM_STR);
            $statement->bindValue(14, number_format($liquidacion['utilidad'], 2, '.', ''), PDO::PARAM_STR);
            $statement->bindValue(15, $estadoPago, PDO::PARAM_STR);
            $statement->bindValue(16, number_format($liquidacion['base_gravable'], 2, '.', ''), PDO::PARAM_STR);
            $statement->bindValue(17, number_format($liquidacion['iva'], 2, '.', ''), PDO::PARAM_STR);
            $statement->bindValue(18, number_format($liquidacion['total'], 2, '.', ''), PDO::PARAM_STR);
            $statement->bindValue(19, $estadoPago, PDO::PARAM_STR);
            if ($observacion !== '') {
                $statement->bindValue(20, $observacion, PDO::PARAM_STR);
            } else {
                $statement->bindValue(20, null, PDO::PARAM_NULL);
            }
            $statement->execute();

            $facturaId = (int) $pdo->lastInsertId();

            $updOrden = $pdo->prepare(FacturasQueries::FINALIZAR_ORDEN);
            $updOrden->bindValue(1, $ahora, PDO::PARAM_STR);
            $updOrden->bindValue(2, $ordenId, PDO::PARAM_INT);
            $updOrden->execute();

            $pdo->commit();

            $factura = $this->obtenerFacturaCompleta($pdo, $facturaId);
            return new ContentBody(Status::CREATE, Status::ST201, $factura);
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
            throw new ExcepcionAPI(Status::BAD_REQUEST, Status::ST400, 'Falta el identificador de la factura.');
        }

        $pdo = Connection::getInstance()->getConnection();
        $factura = $this->obtenerFacturaCompleta($pdo, (int) $id);
        if ($factura === null) {
            throw new ExcepcionAPI(Status::NOT_FOUND, Status::ST404, MessageUser::ERROR_NOT_EXIST);
        }

        $object = JSONUtil::decodeJSON();
        $estadoPago = strtoupper(trim((string) ($object->estado_pago ?? $factura['estado_pago'])));
        if (!in_array($estadoPago, self::ESTADOS_PAGO, true)) {
            throw new ExcepcionAPI(Status::BAD_REQUEST, Status::ST400, 'Estado de pago no válido.');
        }

        $medioPago = strtoupper(trim((string) ($object->medio_pago ?? $factura['medio_pago'] ?? 'EFECTIVO')));
        $formaPago = strtoupper(trim((string) ($object->forma_pago ?? $factura['forma_pago'] ?? 'CONTADO')));
        $observacion = array_key_exists('observacion', (array) $object)
            ? trim((string) $object->observacion)
            : (string) ($factura['observacion'] ?? '');

        $statement = $pdo->prepare(FacturasQueries::UPDATE_ESTADO);
        $statement->bindValue(1, $estadoPago, PDO::PARAM_STR);
        $statement->bindValue(2, $medioPago, PDO::PARAM_STR);
        $statement->bindValue(3, $formaPago, PDO::PARAM_STR);
        if ($observacion !== '') {
            $statement->bindValue(4, $observacion, PDO::PARAM_STR);
        } else {
            $statement->bindValue(4, null, PDO::PARAM_NULL);
        }
        $statement->bindValue(5, $estadoPago, PDO::PARAM_STR);
        $statement->bindValue(6, (int) $id, PDO::PARAM_INT);
        $statement->execute();

        $actualizada = $this->obtenerFacturaCompleta($pdo, (int) $id);
        return new ContentBody(Status::OK, Status::ST200, $actualizada);
    }

    public function delete(array $request): ContentBody
    {
        UserAction::authenticator();
        $id = $request[0] ?? '';
        if ($id === '' || !ctype_digit((string) $id)) {
            throw new ExcepcionAPI(Status::BAD_REQUEST, Status::ST400, 'Falta el identificador de la factura.');
        }

        $pdo = Connection::getInstance()->getConnection();
        if ($this->obtenerFacturaCompleta($pdo, (int) $id) === null) {
            throw new ExcepcionAPI(Status::NOT_FOUND, Status::ST404, MessageUser::ERROR_NOT_EXIST);
        }

        $statement = $pdo->prepare(FacturasQueries::SOFT_DELETE);
        $statement->bindValue(1, date('Y-m-d H:i:s'), PDO::PARAM_STR);
        $statement->bindValue(2, (int) $id, PDO::PARAM_INT);
        $statement->execute();

        return new ContentBody(Status::OK, Status::ST200, MessageUser::SUCCESSFUL);
    }

    public function insertParameter(object $object, PDOStatement $statement): void
    {
    }

    public function updateParameter(object $object, PDOStatement $statement, int|string $id): void
    {
    }

    private function obtenerFacturaCompleta(PDO $pdo, int $id): ?array
    {
        $statement = $pdo->prepare(FacturasQueries::SELECT_BY_ID);
        $statement->bindValue(1, $id, PDO::PARAM_INT);
        $statement->execute();
        $factura = $statement->fetch(PDO::FETCH_ASSOC);
        if ($factura === false) {
            return null;
        }

        $factura['repuestos'] = [];
        if (!empty($factura['orden_id'])) {
            $factura['repuestos'] = $this->obtenerRepuestosOrden($pdo, (int) $factura['orden_id']);
        }

        $factura['liquidacion'] = [
            'subtotal_repuestos' => (float) $factura['subtotal_repuestos'],
            'mano_obra' => (float) $factura['mano_obra'],
            'utilidad' => (float) $factura['utilidad'],
            'base_gravable' => (float) $factura['subtotal'],
            'iva' => (float) $factura['impuestos'],
            'iva_tasa' => FacturasQueries::IVA_TASA,
            'total' => (float) $factura['total'],
            'valor_hora' => (float) $factura['valor_hora'],
            'porcentaje_utilidad' => (float) $factura['porcentaje_utilidad'],
            'horas' => (float) ($factura['horas'] ?? 0)
        ];

        $factura['taller'] = [
            'nombre' => 'Olimac Riders Store',
            'nit' => '900000000-1',
            'direccion' => 'Tunja, Boyacá',
            'telefono' => '3024555555',
            'correo' => 'tallermecanico@gmail.com'
        ];

        return $factura;
    }

    private function cargarOrdenFacturable(PDO $pdo, int $ordenId, bool $bloquear): array
    {
        $orden = $bloquear
            ? $this->cargarOrdenBloqueada($pdo, $ordenId)
            : $this->buscarOrden($pdo, $ordenId);

        $existente = $this->facturaActivaPorOrden($pdo, $ordenId);
        if ($existente !== null) {
            throw new ExcepcionAPI(
                Status::BAD_REQUEST,
                Status::ST400,
                'La orden ya tiene la factura ' . $existente['numero_documento'] . ' vigente.'
            );
        }

        $repuestos = $this->obtenerRepuestosOrden($pdo, $ordenId);
        $orden['repuestos'] = $repuestos;
        $orden['preview'] = $this->calcularLiquidacion(
            $repuestos,
            (float) $orden['horas'],
            self::VALOR_HORA_DEFAULT,
            self::UTILIDAD_DEFAULT
        );
        return $orden;
    }

    private function cargarOrdenBloqueada(PDO $pdo, int $ordenId): array
    {
        $statement = $pdo->prepare(FacturasQueries::SELECT_ORDEN_PARA_FACTURA);
        $statement->bindValue(1, $ordenId, PDO::PARAM_INT);
        $statement->execute();
        $orden = $statement->fetch(PDO::FETCH_ASSOC);
        if ($orden === false) {
            throw new ExcepcionAPI(Status::NOT_FOUND, Status::ST404, 'La orden de servicio no existe.');
        }
        if (strtoupper((string) $orden['estado']) === 'CANCELADA') {
            throw new ExcepcionAPI(Status::BAD_REQUEST, Status::ST400, 'No se puede facturar una orden cancelada.');
        }
        return $orden;
    }

    private function buscarOrden(PDO $pdo, int $ordenId): array
    {
        $query = str_replace(' FOR UPDATE;', ';', FacturasQueries::SELECT_ORDEN_PARA_FACTURA);
        $statement = $pdo->prepare($query);
        $statement->bindValue(1, $ordenId, PDO::PARAM_INT);
        $statement->execute();
        $orden = $statement->fetch(PDO::FETCH_ASSOC);
        if ($orden === false) {
            throw new ExcepcionAPI(Status::NOT_FOUND, Status::ST404, 'La orden de servicio no existe.');
        }
        if (strtoupper((string) $orden['estado']) === 'CANCELADA') {
            throw new ExcepcionAPI(Status::BAD_REQUEST, Status::ST400, 'No se puede facturar una orden cancelada.');
        }
        return $orden;
    }

    private function facturaActivaPorOrden(PDO $pdo, int $ordenId): ?array
    {
        $statement = $pdo->prepare(FacturasQueries::SELECT_FACTURA_ACTIVA_POR_ORDEN);
        $statement->bindValue(1, $ordenId, PDO::PARAM_INT);
        $statement->execute();
        $fila = $statement->fetch(PDO::FETCH_ASSOC);
        return $fila === false ? null : $fila;
    }

    private function obtenerRepuestosOrden(PDO $pdo, int $ordenId): array
    {
        $statement = $pdo->prepare(FacturasQueries::SELECT_REPUESTOS_ORDEN);
        $statement->bindValue(1, $ordenId, PDO::PARAM_INT);
        $statement->execute();
        return $statement->fetchAll(PDO::FETCH_ASSOC);
    }

    private function siguienteConsecutivo(PDO $pdo, string $prefijo): int
    {
        $statement = $pdo->prepare(FacturasQueries::SELECT_MAX_CONSECUTIVO);
        $statement->bindValue(1, $prefijo, PDO::PARAM_STR);
        $statement->execute();
        $max = (int) ($statement->fetchColumn() ?: 0);
        return $max + 1;
    }

    private function calcularLiquidacion(array $repuestos, float $horas, float $valorHora, float $porcentajeUtilidad): array
    {
        $subtotalRepuestos = 0.0;
        foreach ($repuestos as $item) {
            $subtotalRepuestos += ((float) $item['cantidad']) * ((float) $item['precio_unitario']);
        }
        $subtotalRepuestos = round($subtotalRepuestos, 2);
        $manoObra = round(max(0, $horas) * max(0, $valorHora), 2);
        $utilidad = round(($subtotalRepuestos + $manoObra) * (max(0, $porcentajeUtilidad) / 100), 2);
        $base = round($subtotalRepuestos + $manoObra + $utilidad, 2);
        $iva = round($base * FacturasQueries::IVA_TASA, 2);
        $total = round($base + $iva, 2);

        return [
            'subtotal_repuestos' => $subtotalRepuestos,
            'mano_obra' => $manoObra,
            'utilidad' => $utilidad,
            'base_gravable' => $base,
            'iva' => $iva,
            'iva_tasa' => FacturasQueries::IVA_TASA,
            'total' => $total,
            'valor_hora' => round($valorHora, 2),
            'porcentaje_utilidad' => round($porcentajeUtilidad, 2),
            'horas' => round($horas, 2)
        ];
    }

    private function normalizarNumero(mixed $valor, string $mensaje, bool $permiteCero = false): float
    {
        if (is_string($valor)) {
            $valor = str_replace(',', '.', trim($valor));
        }
        if (!is_numeric($valor)) {
            throw new ExcepcionAPI(Status::BAD_REQUEST, Status::ST400, $mensaje);
        }
        $numero = (float) $valor;
        if ($permiteCero) {
            if ($numero < 0) {
                throw new ExcepcionAPI(Status::BAD_REQUEST, Status::ST400, $mensaje);
            }
        } elseif ($numero <= 0) {
            throw new ExcepcionAPI(Status::BAD_REQUEST, Status::ST400, $mensaje);
        }
        return $numero;
    }
}
