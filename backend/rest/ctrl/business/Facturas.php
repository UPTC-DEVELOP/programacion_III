<?php
declare(strict_types=1);

namespace panther\ctrl\business;

use panther\ctrl\core\commun\Request;
use panther\ctrl\core\segurity\UserAction;
use panther\cxn\Connection;
use panther\querys\business\FacturasQueries;
use panther\util\ClarisaConfig;
use panther\util\ClarisaService;
use panther\util\ClarisaTokenStore;
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
    private const PREFIJO_DEFAULT = 'SETP';
    private const VALOR_HORA_DEFAULT = 25000.0;
    private const UTILIDAD_DEFAULT = 10.0;
    private const ESTADOS_PAGO = ['PENDIENTE', 'PAGADA', 'ANULADA'];

    private const MEDIOS_PAGO_CLARISA = [
        'EFECTIVO' => '10',
        'TRANSFERENCIA' => '45',
        'TARJETA' => '48',
        'TARJETA_CREDITO' => '30',
        'TARJETA_DEBITO' => '49',
        'NEQUI' => '10',
        'CHEQUE' => '20',
        '10' => '10',
        '30' => '30',
        '42' => '42',
        '45' => '45',
        '48' => '48',
        '49' => '49',
        'ZZZ' => 'ZZZ',
    ];

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

        if (count($request) === 1 && strtolower((string) $request[0]) === 'clarisa-estado') {
            return $this->estadoClarisaSesion();
        }

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

        $accion = strtolower(trim((string) ($request[0] ?? '')));
        if ($accion === 'emitir-clarisa') {
            return $this->emitirClarisa();
        }
        if ($accion === 'clarisa-auth') {
            return $this->reautenticarClarisaDesdeFacturas();
        }

        $object = JSONUtil::decodeJSON();
        $factura = $this->guardarFacturaLocal($object);
        return new ContentBody(Status::CREATE, Status::ST201, $factura);
    }

    private function estadoClarisaSesion(): ContentBody
    {
        $keyAPI = UserAction::obtenerKeyAPIDeCabecera();
        $token = $keyAPI !== null ? ClarisaTokenStore::get($keyAPI) : null;
        $credenciales = ClarisaConfig::credencialesConfiguradas();

        if ($token !== null) {
            return new ContentBody(Status::OK, Status::ST200, [
                'clarisaAuth' => [
                    'ok' => true,
                    'mensaje' => 'Conectado a Clarisa.',
                ],
                'credencialesConfiguradas' => $credenciales,
                'sandboxHost' => ClarisaConfig::SANDBOX_HOST . ':' . ClarisaConfig::SANDBOX_PORT,
            ]);
        }

        $mensaje = !$credenciales
            ? 'Faltan las credenciales de Clarisa en ClarisaConfig.php.'
            : 'Sin sesión activa en Clarisa. Puedes reintentar o volver a entrar como ADMIN.';

        return new ContentBody(Status::OK, Status::ST200, [
            'clarisaAuth' => [
                'ok' => false,
                'mensaje' => $mensaje,
            ],
            'credencialesConfiguradas' => $credenciales,
            'sandboxHost' => ClarisaConfig::SANDBOX_HOST . ':' . ClarisaConfig::SANDBOX_PORT,
        ]);
    }

    private function reautenticarClarisaDesdeFacturas(): ContentBody
    {
        $keyAPI = UserAction::obtenerKeyAPIDeCabecera();
        if ($keyAPI === null) {
            throw new ExcepcionAPI(Status::UNAUTHORIZED, Status::ST401, 'Sesión Panther no válida.');
        }
        $resultado = UserAction::intentarAuthClarisa($keyAPI);
        return new ContentBody(Status::OK, Status::ST200, $resultado);
    }

    private function emitirClarisa(): ContentBody
    {
        $object = JSONUtil::decodeJSON();
        $pdo = Connection::getInstance()->getConnection();

        $facturaId = (int) ($object->factura_id ?? 0);
        $factura = null;

        if ($facturaId > 0) {
            $factura = $this->obtenerFacturaCompleta($pdo, $facturaId);
            if ($factura === null) {
                throw new ExcepcionAPI(Status::NOT_FOUND, Status::ST404, 'La factura local no existe.');
            }
            if (strtoupper((string) ($factura['estado_pago'] ?? '')) === 'ANULADA') {
                throw new ExcepcionAPI(Status::BAD_REQUEST, Status::ST400, 'No se puede emitir una factura anulada.');
            }
            if (!empty($factura['cufe'])) {
                throw new ExcepcionAPI(
                    Status::BAD_REQUEST,
                    Status::ST400,
                    'Esta factura ya tiene CUFE/identificador Clarisa: ' . $factura['cufe']
                );
            }
        } else {
            $factura = $this->guardarFacturaLocal($object);
            $facturaId = (int) ($factura['id'] ?? 0);
        }

        $metaCliente = $this->extraerMetaClienteClarisa($object, $factura);
        $payloadClarisa = $this->armarPayloadClarisa($factura, $metaCliente);

        $keyAPI = UserAction::obtenerKeyAPIDeCabecera() ?? '';
        $token = ClarisaTokenStore::get($keyAPI);
        $tokenCliente = trim((string) ($object->clarisa_token ?? ''));
        if ($token === null || $token === '') {
            $token = $tokenCliente !== '' ? $tokenCliente : null;
        }
        if ($token === null || $token === '') {
            if (ClarisaConfig::credencialesConfiguradas()) {
                try {
                    $auth = (new ClarisaService())->autenticar();
                    $token = $auth['token'];
                    if ($keyAPI !== '') {
                        ClarisaTokenStore::save($keyAPI, $token);
                    }
                } catch (Throwable $e) {
                    throw new ExcepcionAPI(
                        Status::UNAUTHORIZED,
                        Status::ST401,
                        'No hay sesión Clarisa y el reintento falló: ' . $e->getMessage()
                    );
                }
            } else {
                throw new ExcepcionAPI(
                    Status::UNAUTHORIZED,
                    Status::ST401,
                    'No hay sesión Clarisa. Configura las credenciales o entra como ADMIN.'
                );
            }
        }

        $servicio = new ClarisaService();
        $respuesta = $servicio->enviarFacturaNacional($payloadClarisa, $token);

        $cufe = $this->extraerCufe($respuesta['body']);
        $estadoDian = $this->extraerEstadoDian($respuesta['body'], $respuesta['success']);

        $upd = $pdo->prepare(FacturasQueries::UPDATE_EMISION_CLARISA);
        $upd->bindValue(1, $estadoDian, PDO::PARAM_STR);
        if ($cufe !== null && $cufe !== '') {
            $upd->bindValue(2, $cufe, PDO::PARAM_STR);
        } else {
            $upd->bindValue(2, null, PDO::PARAM_NULL);
        }
        $upd->bindValue(3, $facturaId, PDO::PARAM_INT);
        $upd->execute();

        $facturaActualizada = $this->obtenerFacturaCompleta($pdo, $facturaId);

        return new ContentBody(Status::OK, Status::ST200, [
            'factura' => $facturaActualizada,
            'clarisa' => [
                'ok' => $respuesta['success'],
                'httpCode' => $respuesta['httpCode'],
                'mensaje' => $respuesta['message'],
                'cufe' => $cufe,
                'estado' => $estadoDian,
                'respuesta' => $respuesta['body'],
            ],
            'payloadEnviado' => $payloadClarisa,
        ]);
    }

    /** @return array<string, mixed> */
    private function guardarFacturaLocal(object $object): array
    {
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
        $prefijoDefault = ClarisaConfig::PREFIJO_DCTO !== ''
            ? ClarisaConfig::PREFIJO_DCTO
            : self::PREFIJO_DEFAULT;
        $prefijo = strtoupper(trim((string) ($object->prefijo ?? $prefijoDefault)));

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
            $dias = max(1, (int) ClarisaConfig::DIAS_VENCIMIENTO);
            $vencimiento = date('Y-m-d', strtotime('+' . $dias . ' days'));

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
            $statement->bindValue(19, 'LOCAL', PDO::PARAM_STR);
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
            if ($factura === null) {
                throw new ExcepcionAPI(Status::INTERNAL_SERVER_ERROR, Status::ST500, 'Factura guardada pero no se pudo releer.');
            }
            return $factura;
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

    /**
     * @param array<string, mixed> $factura
     * @return array<string, mixed>
     */
    private function extraerMetaClienteClarisa(object $object, array $factura): array
    {
        $tipoId = strtoupper(trim((string) ($object->tipo_identificacion ?? $object->tipoIdentificacion ?? 'CC')));
        $naturaleza = strtoupper(trim((string) ($object->naturaleza ?? 'NATURAL')));
        $respFiscales = strtoupper(trim((string) ($object->resp_fiscales ?? $object->respFiscales ?? 'NOA')));
        $respTributarias = strtoupper(trim((string) ($object->resp_tributarias ?? $object->respTributarias ?? 'IVA')));
        $email = trim((string) ($object->email_cliente ?? $object->email ?? ($factura['cliente_correo'] ?? '')));
        $ciudad = trim((string) ($object->ciudad ?? $object->ciudad_dane ?? ''));
        $numId = preg_replace(
            '/\D+/',
            '',
            (string) ($object->num_identificacion ?? $object->numIdentificacion ?? ($factura['cliente_cedula'] ?? ''))
        );

        $tiposOk = ['CC', 'NI', 'TI', 'PA', 'TE', 'CE', 'RC', 'NO', 'NU', 'PE', 'DE', 'PT'];
        if (!in_array($tipoId, $tiposOk, true)) {
            $tipoId = 'CC';
        }
        if (!in_array($naturaleza, ['NATURAL', 'JURIDICA'], true)) {
            $naturaleza = 'NATURAL';
        }
        if ($respFiscales === '') {
            $respFiscales = 'NOA';
        }
        if ($respTributarias === '') {
            $respTributarias = 'IVA';
        }

        return [
            'tipoIdentificacion' => $tipoId,
            'naturaleza' => $naturaleza,
            'respFiscales' => $respFiscales,
            'respTributarias' => $respTributarias,
            'email' => $email,
            'ciudad' => $ciudad,
            'numIdentificacion' => $numId,
            'nombreRazonSocial' => trim((string) ($object->nombre_razon_social ?? $factura['cliente_nombre'] ?? 'Cliente')),
            'direccion' => trim((string) ($object->direccion_cliente ?? $factura['cliente_direccion'] ?? '')),
            'telefono' => preg_replace('/\D+/', '', (string) ($object->telefono_cliente ?? $factura['cliente_telefono'] ?? '')),
            'formaPagoCodigo' => $this->mapearFormaPagoClarisa($object->forma_pago_codigo ?? $object->forma_pago ?? $factura['forma_pago'] ?? '1'),
            'medioPagoCodigo' => $this->mapearMedioPagoClarisa($object->medio_pago_codigo ?? $object->medio_pago ?? $factura['medio_pago'] ?? '10'),
        ];
    }

    /**
     * @param array<string, mixed> $factura
     * @param array<string, mixed> $meta
     * @return array<string, mixed>
     */
    private function armarPayloadClarisa(array $factura, array $meta): array
    {
        $nit = preg_replace('/\D+/', '', ClarisaConfig::EMISOR_NIT) ?: '';
        if ($nit === '') {
            throw new ExcepcionAPI(
                Status::BAD_REQUEST,
                Status::ST400,
                'Falta el NIT del emisor en ClarisaConfig.php.'
            );
        }

        $numId = (string) ($meta['numIdentificacion'] ?? '');
        if ($numId === '' || strlen($numId) < 3) {
            throw new ExcepcionAPI(
                Status::BAD_REQUEST,
                Status::ST400,
                'El cliente necesita un número de identificación válido.'
            );
        }

        $nombre = (string) ($meta['nombreRazonSocial'] ?? '');
        if (strlen($nombre) < 5) {
            throw new ExcepcionAPI(
                Status::BAD_REQUEST,
                Status::ST400,
                'El nombre del cliente debe tener al menos 5 caracteres.'
            );
        }

        $fechaVencimiento = substr((string) ($factura['fecha_vencimiento'] ?? ''), 0, 10);
        if ($fechaVencimiento === '') {
            $fechaVencimiento = date('Y-m-d', strtotime('+' . ClarisaConfig::DIAS_VENCIMIENTO . ' days'));
        }

        $items = $this->armarItemsClarisa($factura);
        if ($items === []) {
            throw new ExcepcionAPI(
                Status::BAD_REQUEST,
                Status::ST400,
                'La factura no tiene líneas de detalle para enviar a Clarisa.'
            );
        }

        $cliente = [
            'nombreRazonSocial' => $nombre,
            'tipoIdentificacion' => $meta['tipoIdentificacion'],
            'numIdentificacion' => $numId,
            'naturaleza' => $meta['naturaleza'],
            'respFiscales' => $meta['respFiscales'],
            'respTributarias' => $meta['respTributarias'],
        ];
        if ($meta['direccion'] !== '') {
            $cliente['direccion'] = $meta['direccion'];
        }
        if ($meta['ciudad'] !== '') {
            $cliente['ciudad'] = $meta['ciudad'];
        }
        if ($meta['telefono'] !== '') {
            $cliente['telefono'] = $meta['telefono'];
        }
        if ($meta['email'] !== '') {
            $cliente['email'] = $meta['email'];
        }

        $payload = [
            'NIT' => $nit,
            'numeroResolucion' => ClarisaConfig::NUMERO_RESOLUCION,
            'prefijoDcto' => (string) ($factura['prefijo'] ?? ClarisaConfig::PREFIJO_DCTO),
            'consecutivoDcto' => (int) ($factura['consecutivo'] ?? 0),
            'fechaVencimiento' => $fechaVencimiento,
            'mediosPago' => [(string) $meta['medioPagoCodigo']],
            'formaPago' => (string) $meta['formaPagoCodigo'],
            'cliente' => $cliente,
            'total' => round((float) ($factura['total'] ?? 0), 2),
            'items' => $items,
        ];

        $obs = trim((string) ($factura['observacion'] ?? ''));
        if ($obs !== '') {
            $payload['observacion'] = mb_substr($obs, 0, 1000);
        }

        return $payload;
    }

    /**
     * @param array<string, mixed> $factura
     * @return list<array<string, mixed>>
     */
    private function armarItemsClarisa(array $factura): array
    {
        $items = [];
        $repuestos = $factura['repuestos'] ?? [];
        foreach ($repuestos as $idx => $r) {
            $cant = (float) ($r['cantidad'] ?? 0);
            $precio = (float) ($r['precio_unitario'] ?? 0);
            if ($cant <= 0) {
                continue;
            }
            $codigo = trim((string) ($r['referencia'] ?? ''));
            if ($codigo === '') {
                $codigo = 'REP' . str_pad((string) ($idx + 1), 3, '0', STR_PAD_LEFT);
            }
            $nombre = trim((string) ($r['descripcion'] ?? 'Repuesto'));
            if (strlen($nombre) < 4) {
                $nombre = 'Repuesto ' . $codigo;
            }
            $items[] = [
                'nombreItemVenta' => mb_substr($nombre, 0, 1000),
                'precioBaseUnitario' => round($precio, 2),
                'cantidad' => $cant,
                'codigo' => mb_substr($codigo, 0, 15),
                'unidad' => '94',
                'observacion' => mb_substr($nombre, 0, 1000),
                'impuestos' => [[
                    'tipo' => 'IVA',
                    'claseImpuesto' => 'PO',
                    'tarifaTributo' => 19,
                ]],
            ];
        }

        $manoObra = (float) ($factura['mano_obra'] ?? 0);
        if ($manoObra > 0) {
            $horas = (float) ($factura['horas'] ?? 0);
            $items[] = [
                'nombreItemVenta' => 'Mano de obra taller',
                'precioBaseUnitario' => round($manoObra, 2),
                'cantidad' => 1,
                'codigo' => 'MO001',
                'unidad' => '94',
                'observacion' => $horas > 0
                    ? ('Servicio de mano de obra (' . $horas . ' h)')
                    : 'Servicio de mano de obra',
                'impuestos' => [[
                    'tipo' => 'IVA',
                    'claseImpuesto' => 'PO',
                    'tarifaTributo' => 19,
                ]],
            ];
        }

        $utilidad = (float) ($factura['utilidad'] ?? 0);
        if ($utilidad > 0) {
            $items[] = [
                'nombreItemVenta' => 'Utilidad del servicio',
                'precioBaseUnitario' => round($utilidad, 2),
                'cantidad' => 1,
                'codigo' => 'UT001',
                'unidad' => '94',
                'observacion' => 'Utilidad aplicada al servicio',
                'impuestos' => [[
                    'tipo' => 'IVA',
                    'claseImpuesto' => 'PO',
                    'tarifaTributo' => 19,
                ]],
            ];
        }

        return $items;
    }

    private function mapearFormaPagoClarisa(mixed $valor): string
    {
        $v = strtoupper(trim((string) $valor));
        if ($v === '2' || $v === 'CREDITO' || $v === 'CRÉDITO') {
            return '2';
        }
        return '1';
    }

    private function mapearMedioPagoClarisa(mixed $valor): string
    {
        $v = strtoupper(trim((string) $valor));
        if (isset(self::MEDIOS_PAGO_CLARISA[$v])) {
            return self::MEDIOS_PAGO_CLARISA[$v];
        }
        if (preg_match('/^\d{1,3}$/', $v) || $v === 'ZZZ') {
            return $v;
        }
        return '10';
    }

    /**
     * @param array<string, mixed> $body
     */
    private function extraerCufe(array $body): ?string
    {
        $data = $body['data'] ?? null;
        if (!is_array($data)) {
            $data = $body;
        }
        foreach (['cufe', 'CUFE', 'uuid', 'cufeDocumento', 'UUID'] as $k) {
            if (!empty($data[$k]) && is_string($data[$k])) {
                return trim($data[$k]);
            }
        }
        if (isset($data['documento']) && is_array($data['documento'])) {
            foreach (['cufe', 'CUFE', 'uuid'] as $k) {
                if (!empty($data['documento'][$k]) && is_string($data['documento'][$k])) {
                    return trim($data['documento'][$k]);
                }
            }
        }
        return null;
    }

    /**
     * @param array<string, mixed> $body
     */
    private function extraerEstadoDian(array $body, bool $success): string
    {
        $data = is_array($body['data'] ?? null) ? $body['data'] : $body;
        foreach (['estadoDIAN', 'estadoDian', 'estadoClarisa', 'estado'] as $k) {
            if (!empty($data[$k]) && is_string($data[$k])) {
                return mb_substr(trim($data[$k]), 0, 40);
            }
        }
        if ($success) {
            return 'ENVIADA_CLARISA';
        }
        return 'RECHAZADA_CLARISA';
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
