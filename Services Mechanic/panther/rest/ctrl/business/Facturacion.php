<?php

require_once __DIR__ . '/../../integration/clarisa/ServicioCacheClarisa.php';
require_once __DIR__ . '/../../integration/clarisa/ClienteHttpClarisa.php';

/**
 * Recibe facturas desde Panther y coordina su envío seguro a Clarisa.
 *
 * El controlador conserva el token remoto únicamente en el servidor, valida
 * nuevamente el contrato y registra el estado del intento antes de enviarlo.
 */
class Facturacion
{
    const PERMISO_FACTURACION_CLARISA = 'GESTIONAR_FACTURACION_ELECTRONICA';

    const ESTADO_PENDIENTE = 'PENDIENTE';
    const ESTADO_ACEPTADA = 'ACEPTADA';
    const ESTADO_RECHAZADA = 'RECHAZADA';
    const ESTADO_INCIERTA = 'INCIERTA';

    const DECIMALES_RESULTADO = 6;
    const MAXIMO_ITEMS = 100;
    const MAXIMO_IMPUESTOS_POR_ITEM = 20;
    const MAXIMO_MEDIOS_PAGO = 20;
    const MAXIMO_DIGITOS_ENTEROS = 12;
    const MAXIMO_DECIMALES_ENTRADA = 12;
    const MAXIMO_DIGITOS_RESULTADO_ESCALADO = 18;

    private $configuracion;
    private $servicioCache;
    private $clienteHttp;
    private $pdo;
    private $autenticador;
    private $decodificador;

    /**
     * Permite inyectar dependencias simuladas sin alterar la ejecución real.
     *
     * @param ConfiguracionClarisa|null $configuracion
     * @param ServicioCacheClarisa|null $servicioCache
     * @param ClienteHttpClarisa|null $clienteHttp
     * @param PDO|null $pdo
     * @param callable|null $autenticador
     * @param callable|null $decodificador
     */
    public function __construct(
        $configuracion = null,
        $servicioCache = null,
        $clienteHttp = null,
        $pdo = null,
        $autenticador = null,
        $decodificador = null
    ) {
        $this->configuracion = $configuracion;
        $this->servicioCache = $servicioCache;
        $this->clienteHttp = $clienteHttp;
        $this->pdo = $pdo;
        $this->autenticador = $autenticador;
        $this->decodificador = $decodificador;
    }

    /**
     * Panther invoca este método antes de atender el recurso.
     */
    public function init()
    {
    }

    /**
     * Emite una factura utilizando la sesión local y el contexto remoto.
     *
     * @param array $request Segmentos restantes de la URL.
     * @return ContentBody
     */
    public function post($request)
    {
        $this->autenticarPanther();
        $this->validarRutaSinSegmentos($request);
        $factura = $this->validarFactura($this->decodificarSolicitud());
        $contexto = $this->obtenerContextoAutorizado();
        $identificadorCuenta = $this->obtenerConfiguracion()
            ->obtenerIdentificadorCuentaCache();
        $claves = $this->crearClavesIdempotencia(
            $identificadorCuenta,
            $factura
        );

        $this->registrarIntento(
            $claves['claveIdempotencia'],
            $identificadorCuenta,
            $claves['huellaContenido']
        );

        return $this->enviarConRenovacion(
            $factura,
            $contexto,
            $claves['claveIdempotencia'],
            $claves['huellaContenido']
        );
    }

    private function autenticarPanther()
    {
        if ($this->autenticador === null) {
            UserAction::authenticator();
            return;
        }

        call_user_func($this->autenticador);
    }

    private function decodificarSolicitud()
    {
        return $this->decodificador === null
            ? JSONUtil::decodeJSON()
            : call_user_func($this->decodificador);
    }

    private function obtenerConfiguracion()
    {
        if ($this->configuracion === null) {
            $this->configuracion = new ConfiguracionClarisa();
        }

        return $this->configuracion;
    }

    private function obtenerServicioCache()
    {
        if ($this->servicioCache === null) {
            $this->servicioCache = new ServicioCacheClarisa(
                $this->obtenerConfiguracion()
            );
        }

        return $this->servicioCache;
    }

    private function obtenerClienteHttp()
    {
        if ($this->clienteHttp === null) {
            $this->clienteHttp = new ClienteHttpClarisa(
                $this->obtenerConfiguracion()
            );
        }

        return $this->clienteHttp;
    }

    private function obtenerPdo()
    {
        if ($this->pdo === null) {
            $this->pdo = Connection::getInstance()->getConnection();
        }

        return $this->pdo;
    }

    private function validarRutaSinSegmentos($request)
    {
        if (!is_array($request)) {
            throw new ExcepcionAPI(BAD_REQUEST, ST400, 'La ruta de facturación no es válida.');
        }

        foreach ($request as $segmento) {
            if ($segmento !== '') {
                throw new ExcepcionAPI(
                    BAD_REQUEST,
                    ST400,
                    'La URL contiene segmentos no permitidos para facturación.'
                );
            }
        }
    }

    private function obtenerContextoAutorizado()
    {
        try {
            $contexto = $this->obtenerServicioCache()->obtenerContexto();
        } catch (ExcepcionClarisa $excepcion) {
            error_log(
                '[Panther][Facturacion] Contexto Clarisa no disponible. Tipo: '
                . $excepcion->obtenerTipoError()
            );

            throw new ExcepcionAPI(
                SERVICE_UNAVAILABLE,
                ST503,
                'La facturación externa no se encuentra disponible temporalmente.'
            );
        } catch (Throwable $excepcion) {
            error_log('[Panther][Facturacion] Contexto Clarisa no disponible.');

            throw new ExcepcionAPI(
                SERVICE_UNAVAILABLE,
                ST503,
                'La facturación externa no se encuentra disponible temporalmente.'
            );
        }

        if (!is_array($contexto)
            || !isset($contexto['tokenAutorizacion'])
            || !is_string($contexto['tokenAutorizacion'])
            || strpos($contexto['tokenAutorizacion'], 'Bearer ') !== 0
            || preg_match('/[\r\n]/', $contexto['tokenAutorizacion'])
            || !isset($contexto['permisos'])
            || !is_array($contexto['permisos'])) {
            throw new ExcepcionAPI(
                SERVICE_UNAVAILABLE,
                ST503,
                'El contexto de facturación externa no es válido.'
            );
        }

        if (!in_array(
            self::PERMISO_FACTURACION_CLARISA,
            $contexto['permisos'],
            true
        )) {
            throw new ExcepcionAPI(
                FORBIDDEN,
                ST403,
                'La cuenta integrada no tiene autorización para facturación electrónica.'
            );
        }

        return $contexto;
    }

    private function enviarConRenovacion(
        $factura,
        $contexto,
        $claveIdempotencia,
        $huellaContenido
    ) {
        try {
            $respuesta = $this->enviarFactura($factura, $contexto);
        } catch (ExcepcionClarisa $excepcion) {
            if ($excepcion->obtenerTipoError() === ExcepcionClarisa::TIPO_HTTP
                && $excepcion->obtenerCodigoHttp() === ST401) {
                return $this->renovarYReintentarTrasNoAutorizado(
                    $factura,
                    $claveIdempotencia,
                    $huellaContenido
                );
            }

            return $this->procesarFalloEnvio(
                $excepcion,
                $claveIdempotencia,
                $huellaContenido
            );
        }

        return $this->procesarRespuestaClarisa(
            $respuesta,
            $claveIdempotencia,
            $huellaContenido
        );
    }

    private function renovarYReintentarTrasNoAutorizado(
        $factura,
        $claveIdempotencia,
        $huellaContenido
    ) {
        try {
            $this->obtenerServicioCache()->invalidarContexto();
            $contexto = $this->obtenerContextoAutorizado();
        } catch (ExcepcionAPI $excepcion) {
            $this->actualizarEstadoIntento(
                $claveIdempotencia,
                $huellaContenido,
                self::ESTADO_RECHAZADA,
                ST401
            );
            throw $excepcion;
        } catch (ExcepcionClarisa $excepcion) {
            $this->actualizarEstadoIntento(
                $claveIdempotencia,
                $huellaContenido,
                self::ESTADO_RECHAZADA,
                ST401
            );
            throw new ExcepcionAPI(
                SERVICE_UNAVAILABLE,
                ST503,
                'No fue posible renovar la autorización de Clarisa.'
            );
        }

        try {
            $respuesta = $this->enviarFactura($factura, $contexto);
        } catch (ExcepcionClarisa $excepcion) {
            return $this->procesarFalloEnvio(
                $excepcion,
                $claveIdempotencia,
                $huellaContenido
            );
        }

        return $this->procesarRespuestaClarisa(
            $respuesta,
            $claveIdempotencia,
            $huellaContenido
        );
    }

    private function enviarFactura($factura, $contexto)
    {
        return $this->obtenerClienteHttp()->enviarPostJson(
            $this->obtenerConfiguracion()->obtenerUrlFacturacion(),
            $factura,
            array('Authorization' => $contexto['tokenAutorizacion'])
        );
    }

    private function procesarRespuestaClarisa(
        $respuesta,
        $claveIdempotencia,
        $huellaContenido
    ) {
        if (!is_array($respuesta)
            || !isset($respuesta['codigoHttp'])
            || !is_int($respuesta['codigoHttp'])
            || !isset($respuesta['datos'])
            || !is_array($respuesta['datos'])
            || (array_key_exists('success', $respuesta['datos'])
                && !is_bool($respuesta['datos']['success']))) {
            $this->actualizarEstadoIntento(
                $claveIdempotencia,
                $huellaContenido,
                self::ESTADO_INCIERTA,
                isset($respuesta['codigoHttp']) && is_int($respuesta['codigoHttp'])
                    ? $respuesta['codigoHttp']
                    : null
            );

            throw new ExcepcionAPI(
                BAD_GATEWAY,
                ST502,
                'Clarisa respondió sin confirmar el resultado de la factura. No se reenviará automáticamente.'
            );
        }

        $codigoHttp = $respuesta['codigoHttp'];
        $datosRespuesta = $respuesta['datos'];
        $estados = $this->obtenerEstadosClarisa($datosRespuesta);

        if ($this->esEstadoRechazado($estados)) {
            return $this->registrarRespuestaRechazada(
                $datosRespuesta,
                $codigoHttp,
                $claveIdempotencia,
                $huellaContenido
            );
        }

        if ($this->esEstadoEnVerificacion($estados)) {
            $this->actualizarEstadoIntento(
                $claveIdempotencia,
                $huellaContenido,
                self::ESTADO_INCIERTA,
                $codigoHttp
            );

            return new ContentBody(
                OK,
                ST200,
                $this->crearDatosRespuestaFacturacion(
                    self::ESTADO_INCIERTA,
                    'Clarisa registró la factura y la mantiene en proceso de validación. No se reenviará automáticamente.',
                    $codigoHttp,
                    $datosRespuesta
                )
            );
        }

        if ($this->esEstadoAceptado($estados)
            || (isset($datosRespuesta['success'])
                && $datosRespuesta['success'] === true)) {
            $this->actualizarEstadoIntento(
                $claveIdempotencia,
                $huellaContenido,
                self::ESTADO_ACEPTADA,
                $codigoHttp
            );

            return new ContentBody(
                OK,
                ST200,
                $this->crearDatosRespuestaFacturacion(
                    self::ESTADO_ACEPTADA,
                    'Clarisa confirmó el registro de la factura.',
                    $codigoHttp,
                    $datosRespuesta
                )
            );
        }

        if (ExcepcionClarisa::extraerMotivoSeguro($datosRespuesta) !== null) {
            return $this->registrarRespuestaRechazada(
                $datosRespuesta,
                $codigoHttp,
                $claveIdempotencia,
                $huellaContenido
            );
        }

        $this->actualizarEstadoIntento(
            $claveIdempotencia,
            $huellaContenido,
            self::ESTADO_INCIERTA,
            $codigoHttp
        );

        throw new ExcepcionAPI(
            BAD_GATEWAY,
            ST502,
            'Clarisa respondió sin confirmar el resultado de la factura. No se reenviará automáticamente.'
        );
    }

    private function obtenerEstadosClarisa($datosRespuesta)
    {
        $data = isset($datosRespuesta['data'])
            && is_array($datosRespuesta['data'])
            ? $datosRespuesta['data']
            : array();

        return array(
            'estadoClarisa' => $this->normalizarEstadoExterno(
                isset($data['estadoClarisa']) ? $data['estadoClarisa'] : null
            ),
            'estadoDIAN' => $this->normalizarEstadoExterno(
                isset($data['estadoDIAN']) ? $data['estadoDIAN'] : null
            )
        );
    }

    private function normalizarEstadoExterno($estado)
    {
        if (!is_string($estado)) {
            return null;
        }

        $estado = strtoupper(trim($estado));

        return preg_match('/^[A-Z_]{2,40}$/', $estado) ? $estado : null;
    }

    private function esEstadoRechazado($estados)
    {
        return $estados['estadoClarisa'] === self::ESTADO_RECHAZADA
            || $estados['estadoDIAN'] === self::ESTADO_RECHAZADA;
    }

    private function esEstadoEnVerificacion($estados)
    {
        return $estados['estadoClarisa'] === 'VERIFICANDO'
            || ($estados['estadoClarisa'] === null
                && $estados['estadoDIAN'] === self::ESTADO_PENDIENTE);
    }

    private function esEstadoAceptado($estados)
    {
        return in_array(
            $estados['estadoClarisa'],
            array(self::ESTADO_ACEPTADA, 'REPORTADA_DIAN'),
            true
        ) || in_array(
            $estados['estadoDIAN'],
            array(self::ESTADO_ACEPTADA, 'APROBADA'),
            true
        );
    }

    private function registrarRespuestaRechazada(
        $datosRespuesta,
        $codigoHttp,
        $claveIdempotencia,
        $huellaContenido
    ) {
        $this->actualizarEstadoIntento(
            $claveIdempotencia,
            $huellaContenido,
            self::ESTADO_RECHAZADA,
            $codigoHttp
        );

        $mensaje = $this->crearMensajeRechazoClarisa(
            $datosRespuesta,
            'Clarisa rechazó la factura y no confirmó su emisión.'
        );

        return new ContentBody(
            UNPROCESSABLE_ENTITY,
            ST422,
            $this->crearDatosRespuestaFacturacion(
                self::ESTADO_RECHAZADA,
                $mensaje,
                $codigoHttp,
                $datosRespuesta
            )
        );
    }

    private function crearDatosRespuestaFacturacion(
        $estado,
        $mensaje,
        $codigoHttp,
        $datosRespuesta
    ) {
        $estados = $this->obtenerEstadosClarisa($datosRespuesta);
        $datos = array(
            'estado' => $estado,
            'estadoClarisa' => $estados['estadoClarisa'],
            'estadoDIAN' => $estados['estadoDIAN'],
            'mensaje' => $mensaje,
            'codigoHttpClarisa' => $codigoHttp
        );
        $confirmacion = ExcepcionClarisa::sanitizarConfirmacion(
            $datosRespuesta
        );

        if ($confirmacion !== null) {
            $datos['respuestaClarisa'] = $confirmacion;
        }

        return $datos;
    }

    private function procesarFalloEnvio(
        $excepcion,
        $claveIdempotencia,
        $huellaContenido
    ) {
        $tipo = $excepcion->obtenerTipoError();
        $codigoHttp = $excepcion->obtenerCodigoHttp();
        $rechazoDefinitivo = $tipo === ExcepcionClarisa::TIPO_HTTP
            && is_int($codigoHttp)
            && $codigoHttp >= 400
            && $codigoHttp < 500
            && $codigoHttp !== ClienteHttpClarisa::CODIGO_HTTP_TIEMPO_ESPERA;

        $this->actualizarEstadoIntento(
            $claveIdempotencia,
            $huellaContenido,
            $rechazoDefinitivo
                ? self::ESTADO_RECHAZADA
                : self::ESTADO_INCIERTA,
            $codigoHttp
        );

        error_log(
            '[Panther][Facturacion] Envío Clarisa fallido. Tipo: ' . $tipo
            . ($codigoHttp === null ? '' : '. HTTP: ' . $codigoHttp)
        );

        if ($rechazoDefinitivo) {
            $datosRespuesta = $excepcion->obtenerDatosRespuesta();
            $mensaje = $this->crearMensajeRechazoClarisa(
                $datosRespuesta,
                'Clarisa rechazó la solicitud de facturación.'
            );

            return new ContentBody(
                UNPROCESSABLE_ENTITY,
                ST422,
                $this->crearDatosRespuestaFacturacion(
                    self::ESTADO_RECHAZADA,
                    $mensaje,
                    $codigoHttp,
                    $datosRespuesta
                )
            );
        }

        if ($tipo === ExcepcionClarisa::TIPO_TIEMPO_ESPERA
            || $codigoHttp === ClienteHttpClarisa::CODIGO_HTTP_TIEMPO_ESPERA) {
            throw new ExcepcionAPI(
                GATEWAY_TIMEOUT,
                ST504,
                'Clarisa no respondió a tiempo. El resultado quedó incierto y la factura no se reenviará automáticamente.'
            );
        }

        if ($tipo === ExcepcionClarisa::TIPO_RESPUESTA) {
            throw new ExcepcionAPI(
                BAD_GATEWAY,
                ST502,
                'Clarisa devolvió una respuesta inválida. El resultado quedó incierto.'
            );
        }

        throw new ExcepcionAPI(
            SERVICE_UNAVAILABLE,
            ST503,
            'No fue posible completar la comunicación con Clarisa. El resultado quedó incierto.'
        );
    }

    private function crearMensajeRechazoClarisa($datosRespuesta, $alternativo)
    {
        $motivo = ExcepcionClarisa::extraerMotivoSeguro($datosRespuesta);

        return $motivo === null
            ? $alternativo
            : 'Clarisa rechazó la factura: ' . $motivo;
    }

    private function crearClavesIdempotencia($identificadorCuenta, $factura)
    {
        $contenido = json_encode(
            $factura,
            JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
        );

        if ($contenido === false) {
            throw new ExcepcionAPI(
                BAD_REQUEST,
                ST400,
                'No fue posible preparar la factura para su envío.'
            );
        }

        $identidadDocumento = implode("\0", array(
            $identificadorCuenta,
            $factura['nit'],
            $factura['numeroResolucion'],
            $factura['prefijoDcto'],
            $factura['consecutivoDcto']
        ));

        return array(
            'claveIdempotencia' => hash('sha256', $identidadDocumento),
            'huellaContenido' => hash('sha256', $contenido)
        );
    }

    private function registrarIntento(
        $claveIdempotencia,
        $identificadorCuenta,
        $huellaContenido
    ) {
        try {
            $sentencia = $this->obtenerPdo()->prepare(INSERTAR_CONTROL_ENVIO_FACTURA);
            $sentencia->bindValue(1, $claveIdempotencia, PDO::PARAM_STR);
            $sentencia->bindValue(2, $identificadorCuenta, PDO::PARAM_STR);
            $sentencia->bindValue(3, $huellaContenido, PDO::PARAM_STR);
            $sentencia->bindValue(4, self::ESTADO_PENDIENTE, PDO::PARAM_STR);
            $sentencia->execute();
            return;
        } catch (PDOException $excepcion) {
            if (!$this->esClaveDuplicada($excepcion)) {
                $this->lanzarErrorBaseDatos($excepcion);
            }
        }

        $registro = $this->consultarIntento($claveIdempotencia);

        if ($registro === null) {
            throw new ExcepcionAPI(
                INTERNAL_SERVER_ERROR,
                ST500,
                'No fue posible verificar el control de envío de la factura.'
            );
        }

        if ($registro['estado'] === self::ESTADO_RECHAZADA) {
            try {
                $sentencia = $this->obtenerPdo()->prepare(
                    REABRIR_CONTROL_ENVIO_FACTURA_RECHAZADA
                );
                $sentencia->bindValue(1, $huellaContenido, PDO::PARAM_STR);
                $sentencia->bindValue(2, self::ESTADO_PENDIENTE, PDO::PARAM_STR);
                $sentencia->bindValue(3, $claveIdempotencia, PDO::PARAM_STR);
                $sentencia->bindValue(4, self::ESTADO_RECHAZADA, PDO::PARAM_STR);
                $sentencia->execute();

                if ($sentencia->rowCount() === 1) {
                    return;
                }
            } catch (PDOException $excepcion) {
                $this->lanzarErrorBaseDatos($excepcion);
            }
        }

        $mensajes = array(
            self::ESTADO_ACEPTADA => 'Esta factura ya fue aceptada por Clarisa y no se volverá a enviar.',
            self::ESTADO_INCIERTA => 'Existe un envío anterior con resultado incierto. Debe verificarse antes de reintentar.',
            self::ESTADO_PENDIENTE => 'Esta factura ya se encuentra en proceso de envío.'
        );

        throw new ExcepcionAPI(
            CONFLICT,
            ST409,
            isset($mensajes[$registro['estado']])
                ? $mensajes[$registro['estado']]
                : 'La factura ya tiene un control de envío activo.'
        );
    }

    private function consultarIntento($claveIdempotencia)
    {
        try {
            $sentencia = $this->obtenerPdo()->prepare(CONSULTAR_CONTROL_ENVIO_FACTURA);
            $sentencia->bindValue(1, $claveIdempotencia, PDO::PARAM_STR);
            $sentencia->execute();
            $registro = $sentencia->fetch(PDO::FETCH_ASSOC);
            return $registro === false ? null : $registro;
        } catch (PDOException $excepcion) {
            $this->lanzarErrorBaseDatos($excepcion);
        }
    }

    private function actualizarEstadoIntento(
        $claveIdempotencia,
        $huellaContenido,
        $estado,
        $codigoHttp
    ) {
        try {
            $sentencia = $this->obtenerPdo()->prepare(ACTUALIZAR_ESTADO_ENVIO_FACTURA);
            $sentencia->bindValue(1, $estado, PDO::PARAM_STR);
            if ($codigoHttp === null) {
                $sentencia->bindValue(2, null, PDO::PARAM_NULL);
            } else {
                $sentencia->bindValue(2, $codigoHttp, PDO::PARAM_INT);
            }
            $sentencia->bindValue(3, $claveIdempotencia, PDO::PARAM_STR);
            $sentencia->bindValue(4, $huellaContenido, PDO::PARAM_STR);
            $sentencia->bindValue(5, self::ESTADO_PENDIENTE, PDO::PARAM_STR);
            $sentencia->execute();

            if ($sentencia->rowCount() !== 1) {
                throw new ExcepcionAPI(
                    CONFLICT,
                    ST409,
                    'El estado del envío cambió mientras se procesaba la factura.'
                );
            }
        } catch (PDOException $excepcion) {
            $this->lanzarErrorBaseDatos($excepcion);
        }
    }

    private function esClaveDuplicada($excepcion)
    {
        return (string) $excepcion->getCode() === '23000'
            || (isset($excepcion->errorInfo[0])
                && (string) $excepcion->errorInfo[0] === '23000');
    }

    private function lanzarErrorBaseDatos($excepcion)
    {
        error_log('[Panther][Facturacion] Error en control de idempotencia.');

        throw new ExcepcionAPI(
            INTERNAL_SERVER_ERROR,
            ST500,
            'No fue posible registrar de forma segura el envío de la factura.'
        );
    }

    private function validarFactura($payload)
    {
        if (!is_object($payload)) {
            throw new ExcepcionAPI(BAD_REQUEST, ST400, 'Se requiere un cuerpo JSON válido.');
        }

        $this->validarClavesExactas($payload, array(
            'nit',
            'numeroResolucion',
            'consecutivoDcto',
            'prefijoDcto',
            'fechaVencimiento',
            'formaPago',
            'mediosPago',
            'total',
            'cliente',
            'items'
        ), 'factura');

        $nit = $this->validarTextoPatron($payload->nit, 'nit', '/^[A-Za-z0-9]{3,13}$/D');
        $resolucion = $this->validarTextoPatron(
            $payload->numeroResolucion,
            'numeroResolucion',
            '/^[0-9]{1,14}$/D'
        );
        $consecutivo = $this->validarTextoPatron(
            $payload->consecutivoDcto,
            'consecutivoDcto',
            '/^[0-9]{1,9}$/D'
        );
        $prefijo = $this->validarTextoPatron(
            $payload->prefijoDcto,
            'prefijoDcto',
            '/^[A-Za-z0-9]{0,4}$/D',
            true
        );
        $fechaVencimiento = $this->validarFecha($payload->fechaVencimiento);
        $formaPago = $this->validarOpcion($payload->formaPago, 'formaPago', array('1', '2'));
        $mediosPago = $this->validarMediosPago($payload->mediosPago);
        $cliente = $this->validarCliente($payload->cliente);
        $items = $this->validarItems($payload->items);
        $totalEscalado = '0';

        foreach ($items as $itemValidado) {
            $totalEscalado = $this->sumarEnterosDecimales(
                $totalEscalado,
                $itemValidado['totalEscalado']
            );
            $this->validarTamanoResultado($totalEscalado);
        }

        if (!is_string($payload->total)) {
            $this->errorCampo('total', 'debe enviarse como texto decimal.');
        }

        $totalDeclarado = $this->analizarDecimal($payload->total, 'total', false);
        $totalDeclaradoEscalado = $this->ajustarAEscalaResultado(
            $totalDeclarado['coeficiente'],
            $totalDeclarado['escala']
        );

        if ($totalDeclaradoEscalado !== $totalEscalado) {
            $this->errorCampo(
                'total',
                'no coincide con los precios, cantidades e impuestos calculados.'
            );
        }

        $itemsContrato = array();
        foreach ($items as $itemValidado) {
            $itemsContrato[] = $itemValidado['contrato'];
        }

        return array(
            'nit' => $nit,
            'numeroResolucion' => $resolucion,
            'consecutivoDcto' => $consecutivo,
            'prefijoDcto' => $prefijo,
            'fechaVencimiento' => $fechaVencimiento,
            'formaPago' => $formaPago,
            'mediosPago' => $mediosPago,
            'total' => $this->formatearEscalaResultado($totalEscalado),
            'cliente' => $cliente,
            'items' => $itemsContrato
        );
    }

    private function validarCliente($cliente)
    {
        if (!is_object($cliente)) {
            $this->errorCampo('cliente', 'debe ser un objeto.');
        }

        $this->validarClavesExactas($cliente, array(
            'nombreRazonSocial',
            'tipoIdentificacion',
            'numIdentificacion',
            'naturaleza'
        ), 'cliente');

        return array(
            'nombreRazonSocial' => $this->validarTextoLongitud(
                $cliente->nombreRazonSocial,
                'cliente.nombreRazonSocial',
                5,
                255
            ),
            'tipoIdentificacion' => $this->validarOpcion(
                $cliente->tipoIdentificacion,
                'cliente.tipoIdentificacion',
                array('CC', 'NI', 'TI', 'PA', 'TE', 'CE', 'RC', 'NO', 'NU', 'PE', 'DE', 'PT')
            ),
            'numIdentificacion' => $this->validarTextoPatron(
                $cliente->numIdentificacion,
                'cliente.numIdentificacion',
                '/^[0-9]{3,13}$/D'
            ),
            'naturaleza' => $this->validarOpcion(
                $cliente->naturaleza,
                'cliente.naturaleza',
                array('NATURAL', 'JURIDICA')
            )
        );
    }

    private function validarItems($items)
    {
        if (!is_array($items)
            || count($items) < 1
            || count($items) > self::MAXIMO_ITEMS
            || !$this->esListaSecuencial($items)) {
            $this->errorCampo(
                'items',
                'debe ser una lista no vacía de productos o servicios.'
            );
        }

        $resultado = array();

        foreach ($items as $indice => $item) {
            $campo = 'items[' . $indice . ']';

            if (!is_object($item)) {
                $this->errorCampo($campo, 'debe ser un objeto.');
            }

            $this->validarClavesExactas($item, array(
                'codigo',
                'nombreItem',
                'precioBaseUnitario',
                'cantidad',
                'unidad',
                'impuestos'
            ), $campo);

            $precio = $this->analizarNumeroJson(
                $item->precioBaseUnitario,
                $campo . '.precioBaseUnitario',
                false
            );
            $cantidad = $this->analizarNumeroJson(
                $item->cantidad,
                $campo . '.cantidad',
                true
            );
            $subtotalEscalado = $this->ajustarAEscalaResultado(
                $this->multiplicarEnterosDecimales(
                    $precio['coeficiente'],
                    $cantidad['coeficiente']
                ),
                $precio['escala'] + $cantidad['escala']
            );
            $this->validarTamanoResultado($subtotalEscalado);
            $impuestos = $this->validarImpuestos(
                $item->impuestos,
                $campo,
                $subtotalEscalado
            );
            $totalItem = $subtotalEscalado;
            $impuestosContrato = array();

            foreach ($impuestos as $impuesto) {
                $totalItem = $this->sumarEnterosDecimales(
                    $totalItem,
                    $impuesto['valorEscalado']
                );
                $this->validarTamanoResultado($totalItem);
                $impuestosContrato[] = $impuesto['contrato'];
            }

            $resultado[] = array(
                'contrato' => array(
                    'codigo' => $this->validarTextoLongitud(
                        $item->codigo,
                        $campo . '.codigo',
                        1,
                        15
                    ),
                    'nombreItem' => $this->validarTextoLongitud(
                        $item->nombreItem,
                        $campo . '.nombreItem',
                        4,
                        1000
                    ),
                    'precioBaseUnitario' => $item->precioBaseUnitario,
                    'cantidad' => $item->cantidad,
                    'unidad' => $this->validarTextoPatron(
                        $item->unidad,
                        $campo . '.unidad',
                        '/^[A-Z0-9]{1,3}$/D'
                    ),
                    'impuestos' => $impuestosContrato
                ),
                'totalEscalado' => $totalItem
            );
        }

        return $resultado;
    }

    private function validarImpuestos($impuestos, $campoItem, $subtotalEscalado)
    {
        if (!is_array($impuestos)
            || count($impuestos) < 1
            || count($impuestos) > self::MAXIMO_IMPUESTOS_POR_ITEM
            || !$this->esListaSecuencial($impuestos)) {
            $this->errorCampo(
                $campoItem . '.impuestos',
                'debe ser una lista no vacía de impuestos.'
            );
        }

        $resultado = array();

        foreach ($impuestos as $indice => $impuesto) {
            $campo = $campoItem . '.impuestos[' . $indice . ']';

            if (!is_object($impuesto)) {
                $this->errorCampo($campo, 'debe ser un objeto.');
            }

            $this->validarClavesExactas($impuesto, array(
                'tipo',
                'claseImpuesto',
                'tarifaTributo'
            ), $campo);

            $tipo = $this->validarTextoPatron(
                $impuesto->tipo,
                $campo . '.tipo',
                '/^[A-Z]{2,5}$/D'
            );
            $clase = $this->validarOpcion(
                $impuesto->claseImpuesto,
                $campo . '.claseImpuesto',
                array('PO')
            );
            $tarifa = $this->analizarNumeroJson(
                $impuesto->tarifaTributo,
                $campo . '.tarifaTributo',
                false
            );

            if (($tipo === 'EXE' || $tipo === 'EXC')
                && !$this->esCoeficienteCero($tarifa['coeficiente'])) {
                $this->errorCampo(
                    $campo . '.tarifaTributo',
                    'debe ser cero para impuestos EXE o EXC.'
                );
            }

            $valorEscalado = $this->calcularPorcentajeEscalado(
                $subtotalEscalado,
                $tarifa
            );
            $this->validarTamanoResultado($valorEscalado);

            $resultado[] = array(
                'contrato' => array(
                    'tipo' => $tipo,
                    'claseImpuesto' => $clase,
                    'tarifaTributo' => $impuesto->tarifaTributo
                ),
                'valorEscalado' => $valorEscalado
            );
        }

        return $resultado;
    }

    private function validarMediosPago($mediosPago)
    {
        if (!is_array($mediosPago)
            || count($mediosPago) < 1
            || count($mediosPago) > self::MAXIMO_MEDIOS_PAGO
            || !$this->esListaSecuencial($mediosPago)) {
            $this->errorCampo('mediosPago', 'debe ser una lista no vacía.');
        }

        $resultado = array();

        foreach ($mediosPago as $indice => $medioPago) {
            $resultado[] = $this->validarTextoPatron(
                $medioPago,
                'mediosPago[' . $indice . ']',
                '/^(?:[0-9]{1,2}|ZZZ)$/D'
            );
        }

        if (count(array_unique($resultado)) !== count($resultado)) {
            $this->errorCampo('mediosPago', 'no permite códigos duplicados.');
        }

        return $resultado;
    }

    private function validarClavesExactas($objeto, $clavesEsperadas, $campo)
    {
        $clavesRecibidas = array_keys(get_object_vars($objeto));
        sort($clavesRecibidas);
        sort($clavesEsperadas);

        if ($clavesRecibidas !== $clavesEsperadas) {
            $this->errorCampo($campo, 'contiene campos ausentes o no permitidos.');
        }
    }

    private function validarTextoPatron(
        $valor,
        $campo,
        $patron,
        $permiteVacio = false
    ) {
        if (!is_string($valor)) {
            $this->errorCampo($campo, 'debe enviarse como texto.');
        }

        $valor = trim($valor);

        if ((!$permiteVacio && $valor === '')
            || preg_match($patron, $valor) !== 1
            || preg_match('/[\x00-\x1F\x7F]/', $valor)) {
            $this->errorCampo($campo, 'tiene un formato no válido.');
        }

        return $valor;
    }

    private function validarTextoLongitud($valor, $campo, $minimo, $maximo)
    {
        if (!is_string($valor)) {
            $this->errorCampo($campo, 'debe enviarse como texto.');
        }

        $valor = trim($valor);
        $longitud = function_exists('mb_strlen')
            ? mb_strlen($valor, 'UTF-8')
            : strlen($valor);

        if ($longitud < $minimo
            || $longitud > $maximo
            || preg_match('/[\x00-\x1F\x7F]/u', $valor)) {
            $this->errorCampo($campo, 'tiene una longitud o contenido no válido.');
        }

        return $valor;
    }

    private function validarOpcion($valor, $campo, $opciones)
    {
        if (!is_string($valor) || !in_array($valor, $opciones, true)) {
            $this->errorCampo($campo, 'no contiene una opción permitida.');
        }

        return $valor;
    }

    private function validarFecha($valor)
    {
        if (!is_string($valor)) {
            $this->errorCampo('fechaVencimiento', 'debe enviarse como texto AAAA-MM-DD.');
        }

        $fecha = DateTimeImmutable::createFromFormat('!Y-m-d', $valor);
        $errores = DateTimeImmutable::getLastErrors();

        if ($fecha === false
            || ($errores !== false
                && ($errores['warning_count'] > 0 || $errores['error_count'] > 0))
            || $fecha->format('Y-m-d') !== $valor) {
            $this->errorCampo('fechaVencimiento', 'debe tener el formato AAAA-MM-DD y ser una fecha válida.');
        }

        return $valor;
    }

    private function analizarNumeroJson($valor, $campo, $mayorQueCero)
    {
        if (!is_int($valor) && !is_float($valor)) {
            $this->errorCampo($campo, 'debe enviarse como número JSON.');
        }

        if (is_float($valor) && !is_finite($valor)) {
            $this->errorCampo($campo, 'debe ser un número finito.');
        }

        $texto = is_int($valor)
            ? (string) $valor
            : json_encode($valor, JSON_PRESERVE_ZERO_FRACTION);

        if (!is_string($texto) || stripos($texto, 'e') !== false) {
            $this->errorCampo($campo, 'no admite notación científica.');
        }

        return $this->analizarDecimal($texto, $campo, $mayorQueCero);
    }

    private function analizarDecimal($texto, $campo, $mayorQueCero)
    {
        if (!is_string($texto)
            || !preg_match('/^(\d+)(?:\.(\d+))?$/D', $texto, $coincidencias)) {
            $this->errorCampo($campo, 'debe ser un decimal no negativo.');
        }

        $parteEntera = ltrim($coincidencias[1], '0');
        $parteEntera = $parteEntera === '' ? '0' : $parteEntera;
        $parteDecimal = isset($coincidencias[2]) ? $coincidencias[2] : '';

        if (strlen($parteEntera) > self::MAXIMO_DIGITOS_ENTEROS
            || strlen($parteDecimal) > self::MAXIMO_DECIMALES_ENTRADA) {
            $this->errorCampo($campo, 'supera la precisión o magnitud permitida.');
        }

        $coeficiente = ltrim($parteEntera . $parteDecimal, '0');
        $coeficiente = $coeficiente === '' ? '0' : $coeficiente;

        if ($mayorQueCero && $coeficiente === '0') {
            $this->errorCampo($campo, 'debe ser mayor que cero.');
        }

        return array(
            'coeficiente' => $coeficiente,
            'escala' => strlen($parteDecimal)
        );
    }

    private function calcularPorcentajeEscalado($subtotalEscalado, $tarifa)
    {
        $producto = $this->multiplicarEnterosDecimales(
            $subtotalEscalado,
            $tarifa['coeficiente']
        );

        return $this->dividirPotenciaDiezRedondeando(
            $producto,
            $tarifa['escala'] + 2
        );
    }

    private function ajustarAEscalaResultado($coeficiente, $escala)
    {
        if ($escala <= self::DECIMALES_RESULTADO) {
            return $this->normalizarEnteroDecimal(
                $coeficiente
                . str_repeat('0', self::DECIMALES_RESULTADO - $escala)
            );
        }

        return $this->dividirPotenciaDiezRedondeando(
            $coeficiente,
            $escala - self::DECIMALES_RESULTADO
        );
    }

    private function dividirPotenciaDiezRedondeando($numero, $potencia)
    {
        $numero = $this->normalizarEnteroDecimal($numero);

        if ($potencia <= 0) {
            return $numero;
        }

        $relleno = max(0, $potencia + 1 - strlen($numero));
        $numero = str_repeat('0', $relleno) . $numero;
        $posicion = strlen($numero) - $potencia;
        $cociente = $posicion > 0 ? substr($numero, 0, $posicion) : '0';
        $residuo = substr($numero, max(0, $posicion));
        $cociente = $this->normalizarEnteroDecimal($cociente);

        if ($residuo !== '' && $residuo[0] >= '5') {
            $cociente = $this->incrementarEnteroDecimal($cociente);
        }

        return $cociente;
    }

    private function multiplicarEnterosDecimales($izquierdo, $derecho)
    {
        $izquierdo = $this->normalizarEnteroDecimal($izquierdo);
        $derecho = $this->normalizarEnteroDecimal($derecho);

        if ($izquierdo === '0' || $derecho === '0') {
            return '0';
        }

        $resultado = array_fill(
            0,
            strlen($izquierdo) + strlen($derecho),
            0
        );

        for ($i = strlen($izquierdo) - 1; $i >= 0; $i--) {
            for ($j = strlen($derecho) - 1; $j >= 0; $j--) {
                $posicion = $i + $j + 1;
                $producto = ((int) $izquierdo[$i] * (int) $derecho[$j])
                    + $resultado[$posicion];
                $resultado[$posicion] = $producto % 10;
                $resultado[$posicion - 1] += intdiv($producto, 10);
            }
        }

        for ($i = count($resultado) - 1; $i > 0; $i--) {
            if ($resultado[$i] > 9) {
                $resultado[$i - 1] += intdiv($resultado[$i], 10);
                $resultado[$i] %= 10;
            }
        }

        return $this->normalizarEnteroDecimal(implode('', $resultado));
    }

    private function sumarEnterosDecimales($izquierdo, $derecho)
    {
        $izquierdo = strrev($this->normalizarEnteroDecimal($izquierdo));
        $derecho = strrev($this->normalizarEnteroDecimal($derecho));
        $longitud = max(strlen($izquierdo), strlen($derecho));
        $acarreo = 0;
        $resultado = '';

        for ($i = 0; $i < $longitud; $i++) {
            $suma = ($i < strlen($izquierdo) ? (int) $izquierdo[$i] : 0)
                + ($i < strlen($derecho) ? (int) $derecho[$i] : 0)
                + $acarreo;
            $resultado .= (string) ($suma % 10);
            $acarreo = intdiv($suma, 10);
        }

        if ($acarreo > 0) {
            $resultado .= (string) $acarreo;
        }

        return $this->normalizarEnteroDecimal(strrev($resultado));
    }

    private function incrementarEnteroDecimal($numero)
    {
        return $this->sumarEnterosDecimales($numero, '1');
    }

    private function normalizarEnteroDecimal($numero)
    {
        $numero = ltrim($numero, '0');
        return $numero === '' ? '0' : $numero;
    }

    private function formatearEscalaResultado($valorEscalado)
    {
        $valorEscalado = str_pad(
            $this->normalizarEnteroDecimal($valorEscalado),
            self::DECIMALES_RESULTADO + 1,
            '0',
            STR_PAD_LEFT
        );
        $parteEntera = substr($valorEscalado, 0, -self::DECIMALES_RESULTADO);
        $parteDecimal = substr($valorEscalado, -self::DECIMALES_RESULTADO);

        while (strlen($parteDecimal) > 2
            && substr($parteDecimal, -1) === '0') {
            $parteDecimal = substr($parteDecimal, 0, -1);
        }

        return $this->normalizarEnteroDecimal($parteEntera)
            . '.' . $parteDecimal;
    }

    private function validarTamanoResultado($valorEscalado)
    {
        if (strlen($this->normalizarEnteroDecimal($valorEscalado))
            > self::MAXIMO_DIGITOS_RESULTADO_ESCALADO) {
            throw new ExcepcionAPI(
                BAD_REQUEST,
                ST400,
                'El valor total de la factura supera la magnitud permitida.'
            );
        }
    }

    private function esCoeficienteCero($coeficiente)
    {
        return $this->normalizarEnteroDecimal($coeficiente) === '0';
    }

    private function esListaSecuencial($valor)
    {
        if (!is_array($valor)) {
            return false;
        }

        $indice = 0;
        foreach ($valor as $clave => $elemento) {
            if ($clave !== $indice) {
                return false;
            }
            $indice++;
        }

        return true;
    }

    private function errorCampo($campo, $detalle)
    {
        throw new ExcepcionAPI(
            BAD_REQUEST,
            ST400,
            'El campo ' . $campo . ' ' . $detalle
        );
    }
}
