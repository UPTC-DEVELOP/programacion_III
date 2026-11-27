<?php

class Factura
{
    private ?int $id = null;
    private int $clienteId = 0;
    private string $nitEmisor = "";
    private string $numeroResolucion = "";
    private string $numeroDocumentoComercial = "";
    private string $tipoFactura = "";
    private string $fecha = "";
    private string $fechaVencimiento = "";
    private string $medioPago = "";
    private string $naturalezaCliente = "";
    private string $observacion = "";
    private string $tipoDescuentoGeneral = "valor";
    private float $descuentoGeneralValor = 0.0;
    private float $subtotal = 0.0;
    private float $descuentoLineas = 0.0;
    private float $descuentoGeneral = 0.0;
    private float $impuestos = 0.0;
    private float $total = 0.0;

    /** @var array<int, array<string, mixed>> */
    private array $items = [];

    private function __construct()
    {
    }

    public static function desdeSolicitud($data, float $ivaConfigurado): self
    {
        if (!is_object($data)) {
            throw new ExcepcionAPI(BAD_REQUEST, ST400, "El cuerpo debe ser un objeto JSON válido.");
        }
        if (!Configuracion::esIvaValido($ivaConfigurado)) {
            throw new ExcepcionAPI(INTERNAL_SERVER_ERROR, ST500, "La configuración actual de IVA no es válida.");
        }

        $factura = new self();
        $factura->clienteId = self::enteroPositivo(
            $data->cliente_id ?? null,
            "Selecciona un cliente válido."
        );
        $factura->nitEmisor = self::texto($data->nit_emisor ?? null, 20, "El NIT del emisor es obligatorio.");
        if (!preg_match('/^\d+$/', $factura->nitEmisor)) {
            throw new ExcepcionAPI(BAD_REQUEST, ST400, "El NIT del emisor debe contener solo números.");
        }
        $factura->numeroResolucion = self::texto(
            $data->numero_resolucion ?? null,
            30,
            "El número de resolución es obligatorio."
        );
        $factura->numeroDocumentoComercial = self::texto(
            $data->numero_documento_comercial ?? null,
            40,
            "El número de documento comercial es obligatorio."
        );

        $factura->tipoFactura = (string) ($data->tipo_factura ?? "");
        if (!in_array($factura->tipoFactura, ["venta-nacional", "aiu", "exportacion"], true)) {
            throw new ExcepcionAPI(BAD_REQUEST, ST400, "El tipo de factura seleccionado no es válido.");
        }
        $factura->medioPago = (string) ($data->medio_pago ?? "");
        if (!in_array($factura->medioPago, ["efectivo", "tarjeta-credito", "tarjeta-debito"], true)) {
            throw new ExcepcionAPI(BAD_REQUEST, ST400, "El medio de pago seleccionado no es válido.");
        }
        $factura->naturalezaCliente = (string) ($data->naturaleza_cliente ?? "");
        if (!in_array($factura->naturalezaCliente, ["NATURALES", "JURIDICAS"], true)) {
            throw new ExcepcionAPI(BAD_REQUEST, ST400, "La naturaleza del cliente no es válida.");
        }

        $factura->fecha = self::fecha($data->fecha ?? null, "La fecha de emisión no es válida.");
        $factura->fechaVencimiento = self::fecha(
            $data->fecha_vencimiento ?? null,
            "La fecha de vencimiento no es válida."
        );
        if ($factura->fechaVencimiento < $factura->fecha) {
            throw new ExcepcionAPI(BAD_REQUEST, ST400, "El vencimiento no puede ser anterior a la fecha de emisión.");
        }

        $factura->tipoDescuentoGeneral = (string) ($data->tipo_descuento_general ?? "valor");
        if (!in_array($factura->tipoDescuentoGeneral, ["valor", "porcentaje"], true)) {
            throw new ExcepcionAPI(BAD_REQUEST, ST400, "El tipo de descuento general no es válido.");
        }
        $factura->descuentoGeneralValor = self::numeroNoNegativo(
            $data->descuento_general_valor ?? 0,
            "El descuento general debe ser un valor numérico válido."
        );
        if ($factura->tipoDescuentoGeneral === "porcentaje" && $factura->descuentoGeneralValor > 100) {
            throw new ExcepcionAPI(BAD_REQUEST, ST400, "El descuento porcentual no puede superar el 100%.");
        }
        $factura->observacion = self::textoOpcional($data->observacion ?? "", 500);

        if (!isset($data->items) || !is_array($data->items) || count($data->items) === 0) {
            throw new ExcepcionAPI(BAD_REQUEST, ST400, "Agrega al menos un ítem a la factura.");
        }

        foreach ($data->items as $item) {
            $factura->agregarItem($item, $ivaConfigurado);
        }
        $factura->calcularTotales();

        return $factura;
    }

    public static function desdeRegistro(array $data, array $items): self
    {
        $factura = new self();
        $factura->id = isset($data["id"]) ? (int) $data["id"] : null;
        $factura->clienteId = (int) ($data["cliente_id"] ?? 0);
        $factura->nitEmisor = (string) ($data["nit_emisor"] ?? "");
        $factura->numeroResolucion = (string) ($data["numero_resolucion"] ?? "");
        $factura->numeroDocumentoComercial = (string) ($data["numero_documento_comercial"] ?? "");
        $factura->tipoFactura = (string) ($data["tipo_factura"] ?? "");
        $factura->fecha = (string) ($data["fecha"] ?? "");
        $factura->fechaVencimiento = (string) ($data["fecha_vencimiento"] ?? "");
        $factura->medioPago = (string) ($data["medio_pago"] ?? "");
        $factura->naturalezaCliente = (string) ($data["naturaleza_cliente"] ?? "");
        $factura->observacion = (string) ($data["observacion"] ?? "");
        $factura->tipoDescuentoGeneral = (string) ($data["tipo_descuento_general"] ?? "valor");
        $factura->descuentoGeneralValor = (float) ($data["descuento_general_valor"] ?? 0);
        $factura->subtotal = (float) ($data["subtotal"] ?? 0);
        $factura->descuentoLineas = (float) ($data["descuento_lineas"] ?? 0);
        $factura->descuentoGeneral = (float) ($data["descuento_general"] ?? 0);
        $factura->impuestos = (float) ($data["impuestos"] ?? 0);
        $factura->total = (float) ($data["total"] ?? 0);
        $factura->items = $items;

        return $factura;
    }

    private function agregarItem($item, float $ivaConfigurado): void
    {
        if (!is_object($item)) {
            throw new ExcepcionAPI(BAD_REQUEST, ST400, "Cada ítem debe ser un objeto válido.");
        }
        $nombre = self::texto($item->nombre ?? null, 120, "Cada ítem necesita un nombre.");
        $codigo = self::texto($item->codigo ?? null, 40, "Cada ítem necesita un código.");
        $unidad = (string) ($item->unidad ?? "");
        if (!in_array($unidad, ["unidad", "pieza", "cm", "m", "pulgada", "kg"], true)) {
            throw new ExcepcionAPI(BAD_REQUEST, ST400, "La unidad de un ítem no es válida.");
        }
        $tipoImpuesto = (string) ($item->impuesto ?? "");
        if (!in_array($tipoImpuesto, ["iva-19", "iva-5", "excluido", "exento"], true)) {
            throw new ExcepcionAPI(BAD_REQUEST, ST400, "El impuesto de un ítem no es válido.");
        }
        $servicioId = null;
        if (isset($item->servicio_id) && $item->servicio_id !== "") {
            if (
                !is_numeric($item->servicio_id) ||
                (int) $item->servicio_id < 1 ||
                (float) $item->servicio_id !== (float) (int) $item->servicio_id
            ) {
                throw new ExcepcionAPI(BAD_REQUEST, ST400, "El servicio asociado no es válido.");
            }
            $servicioId = (int) $item->servicio_id;
        }

        $precio = self::numeroNoNegativo(
            $item->precio_unitario ?? null,
            "El precio unitario debe ser un valor numérico válido."
        );
        $precioReferencia = self::numeroNoNegativo(
            $item->precio_referencia ?? 0,
            "El precio de referencia debe ser un valor numérico válido."
        );
        if ($precio <= 0) {
            $precio = $precioReferencia;
        }
        if ($precio <= 0) {
            throw new ExcepcionAPI(BAD_REQUEST, ST400, "Cada ítem debe tener un precio mayor que cero.");
        }
        $cantidad = self::numeroNoNegativo(
            $item->cantidad ?? null,
            "La cantidad debe ser un valor numérico válido."
        );
        if ($cantidad <= 0) {
            throw new ExcepcionAPI(BAD_REQUEST, ST400, "La cantidad debe ser mayor que cero.");
        }
        $descuentoPorcentaje = self::numeroNoNegativo(
            $item->descuento_porcentaje ?? 0,
            "El descuento del ítem debe ser numérico."
        );
        if ($descuentoPorcentaje > 100) {
            throw new ExcepcionAPI(BAD_REQUEST, ST400, "El descuento de un ítem no puede superar el 100%.");
        }

        $bruto = round($precio * $cantidad, 2);
        $descuento = round($bruto * $descuentoPorcentaje / 100, 2);
        $subtotal = max(0.0, round($bruto - $descuento, 2));
        $tasaImpuesto = 0.0;
        if ($tipoImpuesto === "iva-19") {
            $tasaImpuesto = $ivaConfigurado;
        } elseif ($tipoImpuesto === "iva-5") {
            $tasaImpuesto = 5.0;
        }
        $valorImpuesto = Configuracion::calcularValorIva($subtotal, $tasaImpuesto);

        $this->items[] = [
            "servicio_id" => $servicioId,
            "nombre" => $nombre,
            "precio_unitario" => round($precio, 2),
            "precio_referencia" => round($precioReferencia, 2),
            "cantidad" => round($cantidad, 2),
            "codigo" => $codigo,
            "unidad" => $unidad,
            "impuesto" => $tipoImpuesto,
            "tasa_impuesto" => $tasaImpuesto,
            "descuento_porcentaje" => round($descuentoPorcentaje, 2),
            "descuento_valor" => $descuento,
            "subtotal" => $subtotal,
            "valor_impuesto" => $valorImpuesto,
            "total" => round($subtotal + $valorImpuesto, 2),
            "observacion" => self::textoOpcional($item->observacion ?? "", 300)
        ];
    }

    private function calcularTotales(): void
    {
        foreach ($this->items as $item) {
            $this->subtotal += $item["subtotal"];
            $this->descuentoLineas += $item["descuento_valor"];
            $this->impuestos += $item["valor_impuesto"];
        }

        $this->subtotal = round($this->subtotal, 2);
        $this->descuentoLineas = round($this->descuentoLineas, 2);
        $this->impuestos = round($this->impuestos, 2);
        $descuento = $this->tipoDescuentoGeneral === "porcentaje"
            ? $this->subtotal * min(100, $this->descuentoGeneralValor) / 100
            : $this->descuentoGeneralValor;
        $this->descuentoGeneral = round(min($this->subtotal, $descuento), 2);
        $this->total = round(
            max(0.0, $this->subtotal - $this->descuentoGeneral + $this->impuestos),
            2
        );
    }

    public function toArray(): array
    {
        return [
            "id" => $this->id,
            "cliente_id" => $this->clienteId,
            "nit_emisor" => $this->nitEmisor,
            "numero_resolucion" => $this->numeroResolucion,
            "numero_documento_comercial" => $this->numeroDocumentoComercial,
            "tipo_factura" => $this->tipoFactura,
            "fecha" => $this->fecha,
            "fecha_vencimiento" => $this->fechaVencimiento,
            "medio_pago" => $this->medioPago,
            "naturaleza_cliente" => $this->naturalezaCliente,
            "observacion" => $this->observacion,
            "tipo_descuento_general" => $this->tipoDescuentoGeneral,
            "descuento_general_valor" => $this->descuentoGeneralValor,
            "subtotal" => $this->subtotal,
            "descuento_lineas" => $this->descuentoLineas,
            "descuento_general" => $this->descuentoGeneral,
            "impuestos" => $this->impuestos,
            "total" => $this->total,
            "items" => $this->items
        ];
    }

    public function construirPayloadClarisa(array $cliente): array
    {
        $tiposIdentificacion = [
            "Cédula de ciudadanía" => "CC",
            "Cédula de extranjería" => "CE",
            "Pasaporte" => "PA",
            "NIT" => "NI"
        ];
        $tipoIdentificacion = $tiposIdentificacion[$cliente["tipo_identificacion"] ?? ""] ?? null;
        if ($tipoIdentificacion === null) {
            throw new RuntimeException("El tipo de identificación del cliente no es válido para Clarisacloud.");
        }

        $unidades = [
            "unidad" => "94",
            "pieza" => "94",
            "cm" => "CMT",
            "m" => "MTR",
            "pulgada" => "INH",
            "kg" => "KGM"
        ];
        $items = [];
        foreach ($this->items as $item) {
            $impuesto = "EXCLUIDO";
            if ($item["impuesto"] === "iva-19" || $item["impuesto"] === "iva-5") {
                $tasa = rtrim(rtrim(number_format($item["tasa_impuesto"], 2, ".", ""), "0"), ".");
                $impuesto = "IVA_" . $tasa;
            } elseif ($item["impuesto"] === "exento") {
                $impuesto = "EXENTO";
            }
            if (!isset($unidades[$item["unidad"]])) {
                throw new RuntimeException("La unidad de un ítem no es válida para Clarisacloud.");
            }
            $items[] = [
                "nombreItemVenta" => $item["nombre"],
                "precioVentaUnitario" => round(
                    $item["precio_unitario"] * (1 + $item["tasa_impuesto"] / 100),
                    2
                ),
                "precioReferencia" => $item["precio_referencia"],
                "cantidad" => $item["cantidad"],
                "codigo" => $item["codigo"],
                "descuentoPorcentaje" => $item["descuento_porcentaje"],
                "observacion" => $item["observacion"],
                "unidad" => $unidades[$item["unidad"]],
                "codigoDescuento" => "04",
                "impuesto" => $impuesto
            ];
        }

        $mediosPago = [
            "efectivo" => "10",
            "tarjeta-credito" => "30",
            "tarjeta-debito" => "49"
        ];
        if (!isset($mediosPago[$this->medioPago])) {
            throw new RuntimeException("El medio de pago no es válido para Clarisacloud.");
        }
        $porcentajeDescuentoGeneral = $this->subtotal > 0
            ? round($this->descuentoGeneral / $this->subtotal * 100, 2)
            : 0.0;

        return [
            "nit" => $this->nitEmisor,
            "numeroResolucion" => $this->numeroResolucion,
            "numeroDocumentoComercial" => $this->numeroDocumentoComercial,
            "fechaGeneracion" => $this->fecha . "T00:00:00",
            "fechaVencimiento" => $this->fechaVencimiento . "T00:00:00",
            "mediosPago" => $mediosPago[$this->medioPago],
            "observacion" => $this->observacion,
            "formaPago" => "1",
            "total" => $this->total,
            "cliente" => [
                "nombreRazonSocial" => trim(
                    ($cliente["nombres"] ?? "") . " " . ($cliente["apellidos"] ?? "")
                ),
                "tipoIdentificacion" => $tipoIdentificacion,
                "numIdentificacion" => $cliente["numero_identificacion"] ?? "",
                "naturaleza" => $this->naturalezaCliente
            ],
            "codigoDescuento" => "04",
            "porcentajeDescuentoGeneral" => $porcentajeDescuentoGeneral,
            "items" => $items
        ];
    }

    private static function enteroPositivo($valor, string $mensaje): int
    {
        if (!is_numeric($valor) || (int) $valor < 1 || (string) (int) $valor !== (string) $valor) {
            throw new ExcepcionAPI(BAD_REQUEST, ST400, $mensaje);
        }
        return (int) $valor;
    }

    private static function numeroNoNegativo($valor, string $mensaje): float
    {
        if (!is_numeric($valor) || !is_finite((float) $valor) || (float) $valor < 0) {
            throw new ExcepcionAPI(BAD_REQUEST, ST400, $mensaje);
        }
        return (float) $valor;
    }

    private static function texto($valor, int $limite, string $mensaje): string
    {
        if (!is_string($valor) || trim($valor) === "" || mb_strlen(trim($valor), "UTF-8") > $limite) {
            throw new ExcepcionAPI(BAD_REQUEST, ST400, $mensaje);
        }
        return trim($valor);
    }

    private static function textoOpcional($valor, int $limite): string
    {
        if (!is_string($valor) || mb_strlen(trim($valor), "UTF-8") > $limite) {
            throw new ExcepcionAPI(BAD_REQUEST, ST400, "Uno de los textos de la factura supera su longitud permitida.");
        }
        return trim($valor);
    }

    private static function fecha($valor, string $mensaje): string
    {
        if (!is_string($valor)) {
            throw new ExcepcionAPI(BAD_REQUEST, ST400, $mensaje);
        }
        $fecha = DateTime::createFromFormat("!Y-m-d", $valor);
        if (!$fecha || $fecha->format("Y-m-d") !== $valor) {
            throw new ExcepcionAPI(BAD_REQUEST, ST400, $mensaje);
        }
        return $valor;
    }
}
?>
