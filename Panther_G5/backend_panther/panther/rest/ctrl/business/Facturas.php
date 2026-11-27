<?php
// Controlador de facturas

class Facturas extends Request
{
    const NAME_TABLE = "facturas";
    const ROL_ADMIN = 1;
    const ROL_CAJERO = 3;

    public static function init()
    {
        parent::$nameTable = self::NAME_TABLE;
        parent::$queryInsert = INSERT_FACTURA;
        parent::$queryUpdate = UPDATE_FACTURA;
    }

    // Metodos REST
    public static function get($request)
    {
        UserAction::authenticator();
        self::exigirRolFacturacion();
        return parent::get($request);
    }

    public static function post($request)
    {
        UserAction::authenticator();
        self::exigirRolFacturacion();

        $accion = isset($request[0]) ? strtolower(trim((string) $request[0])) : '';
        if ($accion === 'emitir') {
            return self::emitirFacturaExistente($request);
        }
        if ($accion === 'consultar') {
            return self::consultarEstadoExistente($request);
        }

        $object = JSONUtil::decodeJSON();
        if ($object === null) {
            throw new ExcepcionApi(BAD_REQUEST, ST400, error_noParameter);
        }

        $emitir = !empty($object->emitir_clarisa);
        $clave = self::extraerYLimpiarClave($object);

        self::validarRelacionOrden($object);

        $id = self::insertarFactura($object);
        $fila = self::obtenerFacturaPorId($id);

        $resultado = array(
            'id' => (int) $id,
            'factura' => $fila,
            'persistencia' => array(
                'ok' => true,
                'mensaje' => 'Factura guardada en Panther con estado PENDIENTE_ENVIO.'
            ),
            'clarisa' => null
        );

        if ($emitir) {
            $resultado['clarisa'] = self::ejecutarEmisionClarisa($id, $clave);
            $resultado['factura'] = self::obtenerFacturaPorId($id);
        }

        $code = $emitir ? ST200 : ST201;
        $state = $emitir ? OK : CREATE;
        return new ContentBody($state, $code, $resultado);
    }

    public static function put($request)
    {
        UserAction::authenticator();
        self::exigirRolFacturacion();

        if (empty($request[0])) {
            throw new ExcepcionApi(BAD_REQUEST, ST400, error_noParameter);
        }

        $id = (int) $request[0];
        $object = JSONUtil::decodeJSON();
        if ($object === null) {
            throw new ExcepcionApi(BAD_REQUEST, ST400, error_noParameter);
        }

        $emitir = !empty($object->emitir_clarisa);
        $clave = self::extraerYLimpiarClave($object);

        self::validarRelacionOrden($object);

        $filas = self::actualizarFactura($object, $id);
        if ($filas <= 0 && !self::obtenerFacturaPorId($id)) {
            throw new ExcepcionApi(NO_CONTENT, ST204, error_notExist);
        }

        $resultado = array(
            'id' => $id,
            'factura' => self::obtenerFacturaPorId($id),
            'persistencia' => array(
                'ok' => true,
                'mensaje' => 'Factura actualizada en Panther.'
            ),
            'clarisa' => null
        );

        if ($emitir) {
            $resultado['clarisa'] = self::ejecutarEmisionClarisa($id, $clave);
            $resultado['factura'] = self::obtenerFacturaPorId($id);
        }

        return new ContentBody(OK, ST200, $resultado);
    }

    public static function insertParameter($object, $statement)
    {
        self::bindFacturaParams($object, $statement, false);
    }

    public static function updateParameter($object, $statement, $id)
    {
        self::bindFacturaParams($object, $statement, true, $id);
    }

    public static function delete($request)
    {
        UserAction::authenticator();
        self::exigirRolFacturacion();
        try {
            if (empty($request[0])) {
                throw new ExcepcionApi(BAD_REQUEST, ST400, error_noParameter);
            }
            $query = 'DELETE FROM ' . self::NAME_TABLE . ' WHERE id=?';
            $statement = Connection::getInstance()->getConnection()->prepare($query);
            $statement->bindParam(1, $request[0], PDO::PARAM_INT);
            $statement->execute();
            if ($statement->rowCount() > 0) {
                return new ContentBody(OK, ST200, sucessful);
            }
            throw new ExcepcionApi(NO_CONTENT, ST204, error_notExist);
        } catch (ExcepcionApi $e) {
            throw $e;
        } catch (Exception $e) {
            throw new ExcepcionApi(INTERNAL_SERVER_ERROR, ST500, $e->getMessage());
        }
    }

    // Emision Clarisa
    private static function emitirFacturaExistente($request)
    {
        if (empty($request[1])) {
            throw new ExcepcionApi(BAD_REQUEST, ST400, 'Indique el id de la factura a emitir (POST facturas/emitir/{id}).');
        }

        $id = (int) $request[1];
        $object = JSONUtil::decodeJSON();
        if ($object === null) {
            $object = new stdClass();
        }
        $clave = self::extraerYLimpiarClave($object);

        if (!self::obtenerFacturaPorId($id)) {
            throw new ExcepcionApi(NO_CONTENT, ST204, error_notExist);
        }

        $clarisa = self::ejecutarEmisionClarisa($id, $clave);
        $resultado = array(
            'id' => $id,
            'factura' => self::obtenerFacturaPorId($id),
            'persistencia' => array(
                'ok' => true,
                'mensaje' => 'Factura ya persistida en Panther.'
            ),
            'clarisa' => $clarisa
        );

        return new ContentBody(OK, ST200, $resultado);
    }

    private static function consultarEstadoExistente($request)
    {
        if (empty($request[1])) {
            throw new ExcepcionApi(BAD_REQUEST, ST400, 'Indique el id de la factura a consultar (POST facturas/consultar/{id}).');
        }

        $id = (int) $request[1];
        $object = JSONUtil::decodeJSON();
        if ($object === null) {
            $object = new stdClass();
        }
        $clave = self::extraerYLimpiarClave($object);

        $fila = self::obtenerFacturaPorId($id);
        if (!$fila) {
            throw new ExcepcionApi(NO_CONTENT, ST204, error_notExist);
        }

        if ($clave === '') {
            throw new ExcepcionApi(BAD_REQUEST, ST400, 'Debe ingresar la clave de la API Clarisa.');
        }

        $login = ClarisaService::loginSandbox($clave);
        if (!$login['ok']) {
            $detalle = array(
                'ok' => false,
                'paso' => 'login',
                'http_status' => $login['status'],
                'mensaje' => $login['error'],
                'respuesta' => $login['data']
            );
            return new ContentBody(OK, ST200, array(
                'id' => $id,
                'factura' => $fila,
                'clarisa' => $detalle
            ));
        }

        $numero = (string) ($fila['prefijo'] . $fila['consecutivo']);
        $consulta = ClarisaService::consultarEstadoSandbox($login['token'], $fila['nit'], $numero);

        $estado = ClarisaService::resolverEstadoDian($consulta['status'], $consulta['data']);
        if ($estado === 'RECHAZADA' && ClarisaService::estaVerificando($consulta['data'])) {
            $estado = 'VERIFICANDO';
        }
        $cufe = ClarisaService::extraerCufe($consulta['data']);
        if ($cufe === '' && !empty($fila['cufe'])) {
            $cufe = $fila['cufe'];
        }

        self::actualizarTrazabilidadClarisa($id, $cufe, $estado, $consulta['data']);

        $detalle = array(
            'ok' => (bool) $consulta['ok'],
            'paso' => 'consulta_dian',
            'http_status' => $consulta['status'],
            'estado_dian' => $estado,
            'cufe' => $cufe,
            'mensaje' => $consulta['ok']
                ? ('Estado DIAN: ' . $estado)
                : ($consulta['error'] ?: 'Consulta Clarisa fallida.'),
            'respuesta' => $consulta['data']
        );

        return new ContentBody(OK, ST200, array(
            'id' => $id,
            'factura' => self::obtenerFacturaPorId($id),
            'clarisa' => $detalle
        ));
    }

    private static function ejecutarEmisionClarisa($id, $clave)
    {
        if ($clave === '') {
            throw new ExcepcionApi(BAD_REQUEST, ST400, 'Debe ingresar la clave de la API Clarisa.');
        }

        $fila = self::obtenerFacturaPorId($id);
        if (!$fila) {
            throw new ExcepcionApi(NO_CONTENT, ST204, error_notExist);
        }

        $payload = null;
        if (!empty($fila['payload_clarisa'])) {
            $payload = json_decode($fila['payload_clarisa'], true);
        }
        if (!is_array($payload)) {
            throw new ExcepcionApi(BAD_REQUEST, ST400, 'La factura no tiene payload_clarisa válido. Edítela y guárdela de nuevo.');
        }

        $login = ClarisaService::loginSandbox($clave);
        if (!$login['ok']) {
            self::actualizarTrazabilidadClarisa(
                $id,
                isset($fila['cufe']) ? $fila['cufe'] : '',
                'PENDIENTE_ENVIO',
                array(
                    'paso' => 'login',
                    'error' => $login['error'],
                    'respuesta' => $login['data']
                )
            );
            return array(
                'ok' => false,
                'paso' => 'login',
                'http_status' => $login['status'],
                'usuario_api' => CLARISA_SANDBOX_USER,
                'estado_dian' => 'PENDIENTE_ENVIO',
                'cufe' => isset($fila['cufe']) ? $fila['cufe'] : '',
                'mensaje' => $login['error'],
                'respuesta' => $login['data']
            );
        }

        $envio = ClarisaService::enviarFacturaSandbox($login['token'], $payload);
        $estado = ClarisaService::resolverEstadoDian($envio['status'], $envio['data']);
        if (!$envio['ok'] && $estado === 'APROBADA') {
            $estado = 'RECHAZADA';
        }
        if ($envio['ok'] && ClarisaService::estaVerificando($envio['data'])) {
            $estado = 'VERIFICANDO';
        }

        $cufe = ClarisaService::extraerCufe($envio['data']);
        if ($cufe === '' && !empty($fila['cufe'])) {
            $cufe = $fila['cufe'];
        }

        self::actualizarTrazabilidadClarisa($id, $cufe, $estado, $envio['data']);

        return array(
            'ok' => (bool) $envio['ok'],
            'paso' => 'emision',
            'http_status' => $envio['status'],
            'usuario_api' => CLARISA_SANDBOX_USER,
            'estado_dian' => $estado,
            'cufe' => $cufe,
            'mensaje' => $envio['ok']
                ? ('Emisión Clarisa Sandbox: ' . $estado)
                : ($envio['error'] ?: 'Clarisa rechazó la emisión.'),
            'respuesta' => $envio['data']
        );
    }

    // Roles y validaciones
    private static function exigirRolFacturacion()
    {
        $keyAPI = self::resolverKeyAPIHeader();
        $rol = self::obtenerRolPorKeyAPI($keyAPI);
        if ($rol !== self::ROL_ADMIN && $rol !== self::ROL_CAJERO) {
            throw new ExcepcionApi(
                FORBIDDEN,
                ST403,
                'Solo Administrador o Cajero/Recepcionista pueden operar facturación electrónica.'
            );
        }
        return $rol;
    }

    private static function resolverKeyAPIHeader()
    {
        $heads = apache_request_headers();
        if (isset($heads[AUTHORIZATION]) && $heads[AUTHORIZATION] !== '') {
            return $heads[AUTHORIZATION];
        }
        foreach ($heads as $name => $value) {
            if (strtolower((string) $name) === AUTHORIZATION && $value !== '') {
                return $value;
            }
        }
        throw new ExcepcionApi(BAD_REQUEST, ST400, error_KeyAPI);
    }

    private static function obtenerRolPorKeyAPI($keyAPI)
    {
        try {
            $query = 'SELECT roles FROM j4user WHERE keyAPI = ? LIMIT 1';
            $statement = Connection::getInstance()->getConnection()->prepare($query);
            $statement->bindParam(1, $keyAPI);
            $statement->execute();
            $roles = $statement->fetchColumn(0);
            if ($roles === false || $roles === null || $roles === '') {
                throw new ExcepcionApi(UNAUTHORIZED, ST401, error_KeyAPI);
            }
            return (int) $roles;
        } catch (ExcepcionApi $e) {
            throw $e;
        } catch (Exception $e) {
            throw new ExcepcionApi(INTERNAL_SERVER_ERROR, ST500, $e->getMessage());
        }
    }

    private static function extraerYLimpiarClave($object)
    {
        $clave = '';
        if (is_object($object) && isset($object->clarisa_clave)) {
            $clave = trim((string) $object->clarisa_clave);
            unset($object->clarisa_clave);
        }
        if (is_object($object) && isset($object->emitir_clarisa)) {
            unset($object->emitir_clarisa);
        }
        return $clave;
    }

    private static function validarRelacionOrden($object)
    {
        if (!isset($object->orden_id) || $object->orden_id === '' || $object->orden_id === null) {
            return;
        }
        $ordenId = (int) $object->orden_id;
        if ($ordenId <= 0) {
            $object->orden_id = null;
            return;
        }
        try {
            $query = 'SELECT id FROM ordenes WHERE id = ? LIMIT 1';
            $statement = Connection::getInstance()->getConnection()->prepare($query);
            $statement->bindParam(1, $ordenId, PDO::PARAM_INT);
            $statement->execute();
            if (!$statement->fetchColumn(0)) {
                throw new ExcepcionApi(BAD_REQUEST, ST400, 'La orden_id indicada no existe en Panther.');
            }
            $object->orden_id = $ordenId;
        } catch (ExcepcionApi $e) {
            throw $e;
        } catch (Exception $e) {
            throw new ExcepcionApi(INTERNAL_SERVER_ERROR, ST500, $e->getMessage());
        }
    }

    // Persistencia MariaDB
    private static function insertarFactura($object)
    {
        try {
            $pdo = Connection::getInstance()->getConnection();
            $statement = $pdo->prepare(INSERT_FACTURA);
            self::bindFacturaParams($object, $statement, false);
            $statement->execute();
            return $pdo->lastInsertId();
        } catch (Exception $e) {
            throw new ExcepcionApi(INTERNAL_SERVER_ERROR, ST500, $e->getMessage());
        }
    }

    private static function actualizarFactura($object, $id)
    {
        try {
            $statement = Connection::getInstance()->getConnection()->prepare(UPDATE_FACTURA);
            self::bindFacturaParams($object, $statement, true, $id);
            $statement->execute();
            return $statement->rowCount();
        } catch (Exception $e) {
            throw new ExcepcionApi(INTERNAL_SERVER_ERROR, ST500, $e->getMessage());
        }
    }

    private static function obtenerFacturaPorId($id)
    {
        try {
            $query = 'SELECT * FROM ' . self::NAME_TABLE . ' WHERE id = ? LIMIT 1';
            $statement = Connection::getInstance()->getConnection()->prepare($query);
            $statement->bindParam(1, $id, PDO::PARAM_INT);
            $statement->execute();
            $fila = $statement->fetch(PDO::FETCH_ASSOC);
            return $fila ?: null;
        } catch (Exception $e) {
            throw new ExcepcionApi(INTERNAL_SERVER_ERROR, ST500, $e->getMessage());
        }
    }

    private static function actualizarTrazabilidadClarisa($id, $cufe, $estadoDian, $respuesta)
    {
        try {
            $respuestaJson = is_string($respuesta)
                ? $respuesta
                : json_encode($respuesta, JSON_UNESCAPED_UNICODE);
            $query = 'UPDATE ' . self::NAME_TABLE . ' SET cufe = ?, estado_dian = ?, respuesta_clarisa = ? WHERE id = ?';
            $statement = Connection::getInstance()->getConnection()->prepare($query);
            $statement->bindParam(1, $cufe);
            $statement->bindParam(2, $estadoDian);
            $statement->bindParam(3, $respuestaJson);
            $statement->bindParam(4, $id, PDO::PARAM_INT);
            $statement->execute();
        } catch (Exception $e) {
            throw new ExcepcionApi(INTERNAL_SERVER_ERROR, ST500, $e->getMessage());
        }
    }

    private static function bindFacturaParams($object, $statement, $isUpdate, $id = null)
    {
        $itemsFuente = isset($object->items)
            ? $object->items
            : (isset($object->items_json) ? $object->items_json : array());

        $object->items_json = is_string($itemsFuente)
            ? $itemsFuente
            : json_encode($itemsFuente, JSON_UNESCAPED_UNICODE);

        if (isset($object->payload_clarisa) && !is_string($object->payload_clarisa)) {
            $object->payload_clarisa = json_encode($object->payload_clarisa, JSON_UNESCAPED_UNICODE);
        }
        if (isset($object->respuesta_clarisa) && !is_string($object->respuesta_clarisa)) {
            $object->respuesta_clarisa = json_encode($object->respuesta_clarisa, JSON_UNESCAPED_UNICODE);
        }

        if (!isset($object->orden_id) || $object->orden_id === '') {
            $object->orden_id = null;
        }
        if (!isset($object->prefijo) || $object->prefijo === '') {
            $object->prefijo = 'SETP';
        }
        if (!isset($object->resp_fiscales) || $object->resp_fiscales === '') {
            $object->resp_fiscales = 'NOA';
        }
        if (!isset($object->resp_tributarias) || $object->resp_tributarias === '') {
            $object->resp_tributarias = 'NOA';
        }
        if (!isset($object->descuentos) || $object->descuentos === '') {
            $object->descuentos = 0;
        }
        if (!isset($object->cufe)) {
            $object->cufe = '';
        }
        if (!isset($object->estado_dian) || $object->estado_dian === '') {
            $object->estado_dian = 'PENDIENTE_ENVIO';
        }
        if (!isset($object->payload_clarisa)) {
            $object->payload_clarisa = null;
        }
        if (!isset($object->respuesta_clarisa)) {
            $object->respuesta_clarisa = null;
        }

        $statement->bindParam(1, $object->orden_id);
        $statement->bindParam(2, $object->nit);
        $statement->bindParam(3, $object->numero_resolucion);
        $statement->bindParam(4, $object->prefijo);
        $statement->bindParam(5, $object->consecutivo);
        $statement->bindParam(6, $object->fecha_vencimiento);
        $statement->bindParam(7, $object->forma_pago);
        $statement->bindParam(8, $object->medio_pago);
        $statement->bindParam(9, $object->cliente_tipo_id);
        $statement->bindParam(10, $object->cliente_naturaleza);
        $statement->bindParam(11, $object->cliente_documento);
        $statement->bindParam(12, $object->cliente_nombre);
        $statement->bindParam(13, $object->cliente_email);
        $statement->bindParam(14, $object->cliente_telefono);
        $statement->bindParam(15, $object->cliente_direccion);
        $statement->bindParam(16, $object->cliente_municipio);
        $statement->bindParam(17, $object->resp_fiscales);
        $statement->bindParam(18, $object->resp_tributarias);
        $statement->bindParam(19, $object->vehiculo_placa);
        $statement->bindParam(20, $object->vehiculo_modelo);
        $statement->bindParam(21, $object->vehiculo_color);
        $statement->bindParam(22, $object->vehiculo_ingreso);
        $statement->bindParam(23, $object->mecanico);
        $statement->bindParam(24, $object->horas);
        $statement->bindParam(25, $object->valor_hora);
        $statement->bindParam(26, $object->utilidad);
        $statement->bindParam(27, $object->items_json);
        $statement->bindParam(28, $object->subtotal);
        $statement->bindParam(29, $object->descuentos);
        $statement->bindParam(30, $object->iva);
        $statement->bindParam(31, $object->total);
        $statement->bindParam(32, $object->cufe);
        $statement->bindParam(33, $object->estado_dian);
        $statement->bindParam(34, $object->payload_clarisa);
        $statement->bindParam(35, $object->respuesta_clarisa);

        if ($isUpdate) {
            $statement->bindParam(36, $id);
        }
    }
}
?>
