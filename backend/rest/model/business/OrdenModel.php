<?php
declare(strict_types=1);

namespace panther\model\business;

/**
 * ============================================================
 * Clase OrdenModel
 * ============================================================
 * Descripción:
 * Representa una orden de servicio del taller mecánico junto
 * con el detalle de repuestos utilizados.
 *
 * Caso de Uso:
 * PANTHER - Business
 * ============================================================
 */
class OrdenModel
{
    private ?int $id = null;
    private ?string $codigoOrden = null;
    private ?int $vehiculoId = null;
    private ?string $placa = null;
    private ?int $clienteId = null;
    private ?int $empleadoId = null;
    private ?float $horas = null;
    private ?string $estado = null;
    private ?string $observaciones = null;
    private ?string $fechaIngreso = null;
    private ?string $fechaSalida = null;
    /** @var array<int, array<string, mixed>> */
    private array $repuestos = [];

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getCodigoOrden(): ?string
    {
        return $this->codigoOrden;
    }

    public function getVehiculoId(): ?int
    {
        return $this->vehiculoId;
    }

    public function getPlaca(): ?string
    {
        return $this->placa;
    }

    public function getClienteId(): ?int
    {
        return $this->clienteId;
    }

    public function getEmpleadoId(): ?int
    {
        return $this->empleadoId;
    }

    public function getHoras(): ?float
    {
        return $this->horas;
    }

    public function getEstado(): ?string
    {
        return $this->estado;
    }

    public function getObservaciones(): ?string
    {
        return $this->observaciones;
    }

    public function getFechaIngreso(): ?string
    {
        return $this->fechaIngreso;
    }

    public function getFechaSalida(): ?string
    {
        return $this->fechaSalida;
    }

    /** @return array<int, array<string, mixed>> */
    public function getRepuestos(): array
    {
        return $this->repuestos;
    }

    public function setId(int $id): void
    {
        $this->id = $id;
    }

    public function setCodigoOrden(string $codigoOrden): void
    {
        $this->codigoOrden = $codigoOrden;
    }

    public function setVehiculoId(?int $vehiculoId): void
    {
        $this->vehiculoId = $vehiculoId;
    }

    public function setPlaca(string $placa): void
    {
        $this->placa = $placa;
    }

    public function setClienteId(?int $clienteId): void
    {
        $this->clienteId = $clienteId;
    }

    public function setEmpleadoId(?int $empleadoId): void
    {
        $this->empleadoId = $empleadoId;
    }

    public function setHoras(float $horas): void
    {
        $this->horas = $horas;
    }

    public function setEstado(string $estado): void
    {
        $this->estado = $estado;
    }

    public function setObservaciones(?string $observaciones): void
    {
        $this->observaciones = $observaciones;
    }

    public function setFechaIngreso(?string $fechaIngreso): void
    {
        $this->fechaIngreso = $fechaIngreso;
    }

    public function setFechaSalida(?string $fechaSalida): void
    {
        $this->fechaSalida = $fechaSalida;
    }

    /** @param array<int, array<string, mixed>> $repuestos */
    public function setRepuestos(array $repuestos): void
    {
        $this->repuestos = $repuestos;
    }
}
