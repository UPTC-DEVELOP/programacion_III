
<?php

class Configuracion
{
    private ?int $id = null;
    private float $iva = 19.00;
    private float $valorManoObra = 0.00;
    private float $porcentajeUtilidad = 0.00;
    private ?string $fechaActualizacion = null;
    private ?string $dateDelete = null;

    public const IVA_PERMITIDOS = [15.00, 19.00];

    public function __construct(array $data = [])
    {
        if (!empty($data)) {
            $this->hydrate($data);
        }
    }

    public function hydrate(array $data): void
    {
        if (isset($data['id'])) {
            $this->setId((int) $data['id']);
        }
        if (isset($data['iva'])) {
            $this->setIva((float) $data['iva']);
        }
        if (isset($data['valor_mano_obra'])) {
            $this->setValorManoObra((float) $data['valor_mano_obra']);
        }
        if (isset($data['porcentaje_utilidad'])) {
            $this->setPorcentajeUtilidad((float) $data['porcentaje_utilidad']);
        }
        if (array_key_exists('fecha_actualizacion', $data)) {
            $this->setFechaActualizacion($data['fecha_actualizacion']);
        }
        if (array_key_exists('dateDelete', $data)) {
            $this->setDateDelete($data['dateDelete']);
        }
    }

    // --- Getters y Setters ---

    public function getId(): ?int
    {
        return $this->id;
    }

    public function setId(?int $id): void
    {
        $this->id = $id;
    }

    public function getIva(): float
    {
        return $this->iva;
    }

    public function setIva(float $iva): void
    {
        $this->iva = round($iva, 2);
    }

    public function getValorManoObra(): float
    {
        return $this->valorManoObra;
    }

    public function setValorManoObra(float $valorManoObra): void
    {
        $this->valorManoObra = round(max(0.0, $valorManoObra), 2);
    }

    public function getPorcentajeUtilidad(): float
    {
        return $this->porcentajeUtilidad;
    }

    public function setPorcentajeUtilidad(float $porcentajeUtilidad): void
    {
        $this->porcentajeUtilidad = round(max(0.0, $porcentajeUtilidad), 2);
    }

    public function getFechaActualizacion(): ?string
    {
        return $this->fechaActualizacion;
    }

    public function setFechaActualizacion(?string $fechaActualizacion): void
    {
        $this->fechaActualizacion = $fechaActualizacion;
    }

    public function getDateDelete(): ?string
    {
        return $this->dateDelete;
    }

    public function setDateDelete(?string $dateDelete): void
    {
        $this->dateDelete = $dateDelete;
    }

    // --- Métodos de validación y cálculo ---

    public static function esIvaValido(float $iva): bool
    {
        foreach (self::IVA_PERMITIDOS as $permitido) {
            if (abs(round($iva, 2) - $permitido) < 0.001) {
                return true;
            }
        }
        return false;
    }

    public static function validarConfiguracion(float $iva, float $valorManoObra, float $porcentajeUtilidad): bool
    {
        return self::esIvaValido($iva)
            && $valorManoObra >= 0.0
            && $porcentajeUtilidad >= 0.0;
    }

    public static function calcularConUtilidad(float $valorBase, float $porcentajeUtilidad): float
    {
        $base = max(0.0, $valorBase);
        $utilidad = max(0.0, $porcentajeUtilidad);
        return round($base * (1 + ($utilidad / 100)), 2);
    }

    public static function calcularValorIva(float $subtotal, float $iva): float
    {
        return round(max(0.0, $subtotal) * (max(0.0, $iva) / 100), 2);
    }

    public static function calcularTotalFactura(float $subtotal, float $iva): float
    {
        $sub = round(max(0.0, $subtotal), 2);
        $impuesto = self::calcularValorIva($sub, $iva);
        return round($sub + $impuesto, 2);
    }

    public static function calcularServicioConManoObra(float $valorManoObra, float $horas = 1.0, float $costoRepuestos = 0.0): float
    {
        $manoObraTotal = round(max(0.0, $valorManoObra) * max(0.0, $horas), 2);
        return round($manoObraTotal + max(0.0, $costoRepuestos), 2);
    }
}

?>