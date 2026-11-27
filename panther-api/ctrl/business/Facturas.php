<?php

class Facturas
{
    const URL_CLARISA_FACTURA = "https://pru.clarisacloud.com:8443/facturas/rest/api/v1/factura";

    public static function init()
    {
    }

    public static function get($request)
    {
        UserAction::authenticator();
        $pdo = Connection::getInstance()->getConnection();
        $statement = null;
        if (isset($request[0]) && $request[0] !== "") {
            if (!ctype_digit((string) $request[0]) || (int) $request[0] < 1) {
                throw new ExcepcionAPI(BAD_REQUEST, ST400, "Debe indicar un ID numérico válido.");
            }
            $statement = $pdo->prepare(SELECT_FACTURA_BY_ID);
            $statement->execute([(int) $request[0]]);
        } else {
            $statement = $pdo->query(SELECT_FACTURAS);
        }

        $facturas = $statement->fetchAll(PDO::FETCH_ASSOC);
        if (!$facturas) {
            return new ContentBody(OK, ST200, []);
        }

        $ids = array_column($facturas, "id");
        $placeholders = implode(",", array_fill(0, count($ids), "?"));
        $statement = $pdo->prepare(sprintf(SELECT_FACTURA_DETALLES, $placeholders));
        $statement->execute($ids);

        $itemsPorFactura = [];
        foreach ($statement->fetchAll(PDO::FETCH_ASSOC) as $item) {
            $itemsPorFactura[(int) $item["factura_id"]][] = $item;
        }
        foreach ($facturas as &$factura) {
            $factura["items"] = $itemsPorFactura[(int) $factura["id"]] ?? [];
        }
        unset($factura);

        return new ContentBody(OK, ST200, $facturas);
    }

    public static function post($request)
    {
        UserAction::authenticator();
        $keyAPI = self::obtenerTokenAutorizacion();

        if ($request) {
            if (
                !isset($request[0], $request[1]) ||
                !ctype_digit((string) $request[0]) ||
                (int) $request[0] < 1 ||
                $request[1] !== "enviar"
            ) {
                throw new ExcepcionAPI(BAD_REQUEST, ST400, "La ruta de envío de factura no es válida.");
            }
            return new ContentBody(
                OK,
                ST200,
                self::enviarFacturaGuardada((int) $request[0], $keyAPI, false)
            );
        }

        $data = JSONUtil::decodeJSON();
        if (!is_object($data)) {
            throw new ExcepcionAPI(BAD_REQUEST, ST400, "El cuerpo debe ser un objeto JSON válido.");
        }
        $accion = isset($data->accion) ? (string) $data->accion : "guardar";
        if (!in_array($accion, ["guardar", "enviar"], true)) {
            throw new ExcepcionAPI(BAD_REQUEST, ST400, "La acción debe ser guardar o enviar.");
        }

        $pdo = Connection::getInstance()->getConnection();
        $configuracion = $pdo->query(SELECT_IVA_FACTURA)->fetch(PDO::FETCH_ASSOC);
        $iva = $configuracion ? (float) $configuracion["iva"] : 19.0;
        self::prepararServiciosFactura($data, $pdo);
        $factura = Factura::desdeSolicitud($data, $iva);
        self::validarClienteYNumero($factura, $pdo);
        $facturaId = self::guardar($factura, $pdo);

        $resultado = [
            "id" => $facturaId,
            "numero_documento_comercial" => $factura->toArray()["numero_documento_comercial"],
            "estado_envio" => "BORRADOR"
        ];
        if ($accion === "enviar") {
            $resultado["envio"] = self::enviarFacturaGuardada($facturaId, $keyAPI, true);
            $resultado["estado_envio"] = $resultado["envio"]["success"] ? "ENVIADA" : "ERROR";
        }

        return new ContentBody(OK, ST201, $resultado);
    }

    private static function validarClienteYNumero(Factura $factura, PDO $pdo): void
    {
        $datos = $factura->toArray();
        $statement = $pdo->prepare(SELECT_CLIENTE_FACTURA);
        $statement->execute([$datos["cliente_id"]]);
        if (!$statement->fetch(PDO::FETCH_ASSOC)) {
            throw new ExcepcionAPI(BAD_REQUEST, ST400, "El cliente seleccionado no existe o está inactivo.");
        }

        $statement = $pdo->prepare(SELECT_FACTURA_NUMERO);
        $statement->execute([$datos["numero_documento_comercial"]]);
        if ($statement->fetchColumn()) {
            throw new ExcepcionAPI(BAD_REQUEST, ST400, "Ese número de factura ya está registrado.");
        }
    }

    private static function prepararServiciosFactura(object $data, PDO $pdo): void
    {
        if (!isset($data->items) || !is_array($data->items)) {
            return;
        }

        $clienteId = isset($data->cliente_id) && is_numeric($data->cliente_id)
            ? (int) $data->cliente_id
            : 0;
        $serviciosIncluidos = [];
        $consultaServicio = $pdo->prepare(SELECT_SERVICIO_FACTURABLE);
        $consultaRepuestos = $pdo->prepare(SELECT_REPUESTOS_SERVICIO);

        foreach ($data->items as $item) {
            if (!is_object($item) || !isset($item->servicio_id) || $item->servicio_id === "") {
                continue;
            }
            if (
                !is_numeric($item->servicio_id) ||
                (int) $item->servicio_id < 1 ||
                (float) $item->servicio_id !== (float) (int) $item->servicio_id
            ) {
                throw new ExcepcionAPI(BAD_REQUEST, ST400, "El servicio asociado no es válido.");
            }

            $servicioId = (int) $item->servicio_id;
            if (isset($serviciosIncluidos[$servicioId])) {
                throw new ExcepcionAPI(BAD_REQUEST, ST400, "No se puede incluir el mismo servicio más de una vez.");
            }

            $consultaServicio->execute([$servicioId]);
            $datosServicio = $consultaServicio->fetch(PDO::FETCH_ASSOC);
            if (!$datosServicio) {
                throw new ExcepcionAPI(
                    BAD_REQUEST,
                    ST400,
                    "Solo se pueden facturar servicios finalizados y disponibles."
                );
            }
            if ((int) $datosServicio["cliente_id"] !== $clienteId) {
                throw new ExcepcionAPI(
                    BAD_REQUEST,
                    ST400,
                    "El servicio debe pertenecer al mismo cliente de la factura."
                );
            }

            $consultaRepuestos->execute([$servicioId]);
            $servicio = new Servicio($datosServicio);
            $servicio->setRepuestos($consultaRepuestos->fetchAll(PDO::FETCH_ASSOC));
            $valorServicio = $servicio->calcularTotalServicio();
            if ($valorServicio <= 0) {
                throw new ExcepcionAPI(BAD_REQUEST, ST400, "El servicio debe tener un valor mayor que cero.");
            }

            $item->servicio_id = $servicioId;
            $item->nombre = substr(trim((string) $datosServicio["descripcion"]), 0, 120);
            $item->precio_unitario = $valorServicio;
            $item->precio_referencia = 0;
            $item->cantidad = 1;
            $item->codigo = "OS-" . $servicioId;
            $item->unidad = "unidad";
            $serviciosIncluidos[$servicioId] = true;
        }
    }

    private static function guardar(Factura $factura, PDO $pdo): int
    {
        $datos = $factura->toArray();
        $pdo->beginTransaction();
        try {
            $statement = $pdo->prepare(INSERT_FACTURA);
            $statement->execute([
                $datos["cliente_id"],
                $datos["nit_emisor"],
                $datos["numero_resolucion"],
                $datos["numero_documento_comercial"],
                $datos["tipo_factura"],
                $datos["fecha"],
                $datos["fecha_vencimiento"],
                $datos["medio_pago"],
                $datos["naturaleza_cliente"],
                $datos["observacion"],
                $datos["tipo_descuento_general"],
                $datos["descuento_general_valor"],
                $datos["subtotal"],
                $datos["descuento_lineas"],
                $datos["descuento_general"],
                $datos["impuestos"],
                $datos["total"]
            ]);
            $facturaId = (int) $pdo->lastInsertId();

            $statement = $pdo->prepare(INSERT_FACTURA_DETALLE);
            foreach ($datos["items"] as $item) {
                $statement->execute([
                    $facturaId,
                    $item["servicio_id"],
                    $item["nombre"],
                    $item["precio_unitario"],
                    $item["precio_referencia"],
                    $item["cantidad"],
                    $item["codigo"],
                    $item["unidad"],
                    $item["impuesto"],
                    $item["tasa_impuesto"],
                    $item["descuento_porcentaje"],
                    $item["descuento_valor"],
                    $item["subtotal"],
                    $item["valor_impuesto"],
                    $item["total"],
                    $item["observacion"]
                ]);
            }
            $actualizarServicio = $pdo->prepare(MARCAR_SERVICIO_FACTURADO);
            foreach ($datos["items"] as $item) {
                if ($item["servicio_id"] === null) {
                    continue;
                }
                $actualizarServicio->execute([$item["servicio_id"]]);
                if ($actualizarServicio->rowCount() !== 1) {
                    throw new ExcepcionAPI(
                        BAD_REQUEST,
                        ST400,
                        "El servicio ya fue facturado o dejó de estar disponible."
                    );
                }
            }
            $pdo->commit();
            return $facturaId;
        } catch (Throwable $error) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $error;
        }
    }

    private static function enviarFacturaGuardada(int $facturaId, string $keyAPI, bool $permitirPendiente): array
    {
        $pdo = Connection::getInstance()->getConnection();
        $statement = $pdo->prepare(SELECT_ESTADO_FACTURA);
        $statement->execute([$facturaId]);
        $estado = $statement->fetchColumn();
        if ($estado === false) {
            throw new ExcepcionAPI(NOT_FOUND, ST404, "No se encontró la factura.");
        }
        $estadosPermitidos = $permitirPendiente
            ? ["BORRADOR", "ERROR", "PENDIENTE"]
            : ["BORRADOR", "ERROR"];
        if (!in_array($estado, $estadosPermitidos, true)) {
            throw new ExcepcionAPI(BAD_REQUEST, ST400, "La factura ya fue enviada o tiene un envío en curso.");
        }

        self::actualizarEstado($pdo, $facturaId, "PENDIENTE", null);
        try {
            $token = self::obtenerTokenClarisa($keyAPI, $pdo);
            $statement = $pdo->prepare(SELECT_FACTURA_BY_ID);
            $statement->execute([$facturaId]);
            $datosFactura = $statement->fetch(PDO::FETCH_ASSOC);
            if (!$datosFactura) {
                throw new RuntimeException("No se encontraron los datos de la factura.");
            }

            $statement = $pdo->prepare(SELECT_FACTURA_DETALLE_BY_ID);
            $statement->execute([$facturaId]);
            $factura = Factura::desdeRegistro($datosFactura, $statement->fetchAll(PDO::FETCH_ASSOC));
            $payload = $factura->construirPayloadClarisa($datosFactura);
            $respuesta = self::solicitarEmisionClarisa($payload, $token);
            self::actualizarEstado($pdo, $facturaId, "ENVIADA", $respuesta["body"]);

            return [
                "success" => true,
                "message" => "Factura enviada correctamente a Clarisacloud.",
                "respuesta" => $respuesta["data"]
            ];
        } catch (RuntimeException $error) {
            $mensaje = mb_substr($error->getMessage(), 0, 4000, "UTF-8");
            self::actualizarEstado($pdo, $facturaId, "ERROR", $mensaje);
            return ["success" => false, "message" => $mensaje];
        }
    }

    private static function actualizarEstado(PDO $pdo, int $facturaId, string $estado, ?string $respuesta): void
    {
        $statement = $pdo->prepare(UPDATE_ESTADO_FACTURA);
        $statement->execute([$estado, $respuesta, $facturaId]);
    }

    private static function obtenerTokenClarisa(string $keyAPI, PDO $pdo): string
    {
        $statement = $pdo->prepare(SELECT_TOKEN_CLARISA);
        $statement->execute([$keyAPI]);
        $usuario = $statement->fetch(PDO::FETCH_ASSOC);
        if (!$usuario || empty($usuario["token_clarisa"])) {
            throw new RuntimeException("Inicia sesión con una cuenta vinculada a Clarisacloud para enviar facturas.");
        }
        if (
            !empty($usuario["fecha_expiracion"]) &&
            (new DateTimeImmutable($usuario["fecha_expiracion"], new DateTimeZone("UTC")))->getTimestamp() <= time()
        ) {
            throw new RuntimeException("La sesión de Clarisacloud expiró. Inicia sesión nuevamente.");
        }
        return trim((string) $usuario["token_clarisa"]);
    }

    private static function solicitarEmisionClarisa(array $payload, string $token): array
    {
        $body = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($body === false) {
            throw new RuntimeException("No fue posible preparar los datos para Clarisacloud.");
        }
        $context = stream_context_create([
            "http" => [
                "method" => "POST",
                "header" => "Authorization: Bearer " . preg_replace('/^Bearer\s+/i', "", $token)
                    . "\r\nContent-Type: application/json\r\nAccept: application/json\r\n",
                "content" => $body,
                "timeout" => 30,
                "ignore_errors" => true
            ],
            "ssl" => [
                "verify_peer" => true,
                "verify_peer_name" => true
            ]
        ]);
        $respuesta = @file_get_contents(self::URL_CLARISA_FACTURA, false, $context);
        if ($respuesta === false) {
            throw new RuntimeException("No fue posible conectar con Clarisacloud.");
        }

        $httpStatus = 0;
        foreach ($http_response_header ?? [] as $header) {
            if (preg_match('/^HTTP\/\S+\s+(\d{3})/', $header, $matches)) {
                $httpStatus = (int) $matches[1];
            }
        }
        $datos = json_decode($respuesta, true);
        if ($httpStatus < 200 || $httpStatus >= 300 || (is_array($datos) && ($datos["success"] ?? null) === false)) {
            $detalle = is_array($datos)
                ? ($datos["textResponse"] ?? $datos["message"] ?? "Clarisacloud rechazó la factura.")
                : "Clarisacloud rechazó la factura.";
            throw new RuntimeException(
                "No se pudo enviar la factura (" . $httpStatus . "): " . (string) $detalle
            );
        }

        return ["body" => $respuesta, "data" => $datos];
    }

    private static function obtenerTokenAutorizacion(): string
    {
        $headers = function_exists("getallheaders") ? getallheaders() : [];
        foreach ($headers as $key => $value) {
            if (strtolower((string) $key) === "authorization") {
                return trim(preg_replace('/^Bearer\s+/i', "", (string) $value));
            }
        }
        return trim(preg_replace('/^Bearer\s+/i', "", (string) ($_SERVER["HTTP_AUTHORIZATION"] ?? "")));
    }
}
?>
