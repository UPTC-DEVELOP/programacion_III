<?php

class servicio
{
    private ?int $id = null;
    private int $clienteId = 0;
    private int $vehiculoId = 0;
    private int $empleadoId = 0;
    private ?int $configuracionId = null;
    private string $estado = 'Pendiente';
    private string $estadoFacturacion = 'No disponible';
    private string $descripcion = '';
    private float $horasEmpleadas = 0.0;
    private float $valorManoObra = 0.0;
    private string $fechaInicio = '';
    private string $fechaEstimadaFin = '';
    private string $prioridad = 'Media';
    private ?string $observaciones = null;
    private ?string $fechaRegistro = null;
    private ?string $dateDelete = null;

    /** @var array<int, array{repuesto_id: int, cantidad: int, precio_unitario: float}> */
    private array $repuestos = [];

    public const ESTADOS = ['Pendiente', 'En proceso', 'Finalizado'];
    public const ESTADOS_FACTURACION = ['No disponible', 'Disponible', 'Facturado'];
    public const PRIORIDADES = ['Baja', 'Media', 'Alta', 'Urgente'];

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
        if (isset($data['cliente_id'])) {
            $this->setClienteId((int) $data['cliente_id']);
        }
        if (isset($data['vehiculo_id'])) {
            $this->setVehiculoId((int) $data['vehiculo_id']);
        }
        if (isset($data['empleado_id'])) {
            $this->setEmpleadoId((int) $data['empleado_id']);
        }
        if (array_key_exists('configuracion_id', $data)) {
            $this->setConfiguracionId(
                ($data['configuracion_id'] !== null && $data['configuracion_id'] !== '')
                    ? (int) $data['configuracion_id']
                    : null
            );
        }
        if (isset($data['estado'])) {
            $this->setEstado((string) $data['estado']);
        }
        if (isset($data['estado_facturacion'])) {
            $this->setEstadoFacturacion((string) $data['estado_facturacion']);
        }
        if (isset($data['descripcion'])) {
            $this->setDescripcion((string) $data['descripcion']);
        }
        if (isset($data['horas_empleadas'])) {
            $this->setHorasEmpleadas((float) $data['horas_empleadas']);
        }
        if (isset($data['valor_mano_obra'])) {
            $this->setValorManoObra((float) $data['valor_mano_obra']);
        }
        if (isset($data['fecha_inicio'])) {
            $this->setFechaInicio((string) $data['fecha_inicio']);
        }
        if (isset($data['fecha_estimada_fin'])) {
            $this->setFechaEstimadaFin((string) $data['fecha_estimada_fin']);
        }
        if (isset($data['prioridad'])) {
            $this->setPrioridad((string) $data['prioridad']);
        }
        if (array_key_exists('observaciones', $data)) {
            $this->setObservaciones($data['observaciones'] !== null ? (string) $data['observaciones'] : null);
        }
        if (array_key_exists('fecha_registro', $data)) {
            $this->setFechaRegistro($data['fecha_registro'] !== null ? (string) $data['fecha_registro'] : null);
        }
        if (array_key_exists('dateDelete', $data)) {
            $this->setDateDelete($data['dateDelete'] !== null ? (string) $data['dateDelete'] : null);
        }
        if (isset($data['repuestos']) && is_array($data['repuestos'])) {
            $this->setRepuestos($data['repuestos']);
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

    public function getClienteId(): int
    {
        return $this->clienteId;
    }

    public function setClienteId(int $clienteId): void
    {
        $this->clienteId = $clienteId;
    }

    public function getVehiculoId(): int
    {
        return $this->vehiculoId;
    }

    public function setVehiculoId(int $vehiculoId): void
    {
        $this->vehiculoId = $vehiculoId;
    }

    public function getEmpleadoId(): int
    {
        return $this->empleadoId;
    }

    public function setEmpleadoId(int $empleadoId): void
    {
        $this->empleadoId = $empleadoId;
    }

    public function getConfiguracionId(): ?int
    {
        return $this->configuracionId;
    }

    public function setConfiguracionId(?int $configuracionId): void
    {
        $this->configuracionId = $configuracionId;
    }

    public function getEstado(): string
    {
        return $this->estado;
    }

    public function setEstado(string $estado): void
    {
        $this->estado = $estado;
        if ($this->estadoFacturacion !== 'Facturado') {
            $this->estadoFacturacion = ($this->estado === 'Finalizado') ? 'Disponible' : 'No disponible';
        }
    }

    public function getEstadoFacturacion(): string
    {
        return $this->estadoFacturacion;
    }

    public function setEstadoFacturacion(string $estadoFacturacion): void
    {
        $this->estadoFacturacion = $estadoFacturacion;
    }

    public function getDescripcion(): string
    {
        return $this->descripcion;
    }

    public function setDescripcion(string $descripcion): void
    {
        $this->descripcion = trim($descripcion);
    }

    public function getHorasEmpleadas(): float
    {
        return $this->horasEmpleadas;
    }

    public function setHorasEmpleadas(float $horasEmpleadas): void
    {
        $this->horasEmpleadas = round($horasEmpleadas, 2);
    }

    public function getValorManoObra(): float
    {
        return $this->valorManoObra;
    }

    public function setValorManoObra(float $valorManoObra): void
    {
        $this->valorManoObra = round($valorManoObra, 2);
    }

    public function getFechaInicio(): string
    {
        return $this->fechaInicio;
    }

    public function setFechaInicio(string $fechaInicio): void
    {
        $this->fechaInicio = trim($fechaInicio);
    }

    public function getFechaEstimadaFin(): string
    {
        return $this->fechaEstimadaFin;
    }

    public function setFechaEstimadaFin(string $fechaEstimadaFin): void
    {
        $this->fechaEstimadaFin = trim($fechaEstimadaFin);
    }

    public function getPrioridad(): string
    {
        return $this->prioridad;
    }

    public function setPrioridad(string $prioridad): void
    {
        $this->prioridad = $prioridad;
    }

    public function getObservaciones(): ?string
    {
        return $this->observaciones;
    }

    public function setObservaciones(?string $observaciones): void
    {
        $this->observaciones = $observaciones !== null ? trim($observaciones) : null;
    }

    public function getFechaRegistro(): ?string
    {
        return $this->fechaRegistro;
    }

    public function setFechaRegistro(?string $fechaRegistro): void
    {
        $this->fechaRegistro = $fechaRegistro;
    }

    public function getDateDelete(): ?string
    {
        return $this->dateDelete;
    }

    public function setDateDelete(?string $dateDelete): void
    {
        $this->dateDelete = $dateDelete;
    }

    /**
     * @return array<int, array{repuesto_id: int, cantidad: int, precio_unitario: float}>
     */
    public function getRepuestos(): array
    {
        return $this->repuestos;
    }

    /**
     * @param array<int, mixed> $repuestos
     */
    public function setRepuestos(array $repuestos): void
    {
        $lista = [];
        foreach ($repuestos as $item) {
            $arr = is_object($item) ? (array) $item : (array) $item;
            $lista[] = [
                'repuesto_id' => isset($arr['repuesto_id']) ? (int) $arr['repuesto_id'] : 0,
                'cantidad' => isset($arr['cantidad']) ? (int) $arr['cantidad'] : 0,
                'precio_unitario' => isset($arr['precio_unitario']) ? round((float) $arr['precio_unitario'], 2) : 0.0,
            ];
        }
        $this->repuestos = $lista;
    }

    // --- Métodos propios del servicio ---

    public function calcularManoObra(): float
    {
        return round(
            max(0.0, $this->valorManoObra) * max(0.0, $this->horasEmpleadas),
            2
        );
    }

    public function calcularSubtotalRepuestos(): float
    {
        $total = 0.0;
        foreach ($this->repuestos as $rep) {
            $total += round($rep['cantidad'] * $rep['precio_unitario'], 2);
        }
        return round($total, 2);
    }

    public function calcularTotalServicio(): float
    {
        return round($this->calcularManoObra() + $this->calcularSubtotalRepuestos(), 2);
    }
}
?>