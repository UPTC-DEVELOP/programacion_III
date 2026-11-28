<?php
declare(strict_types=1);

namespace panther\model\business;

class FacturaModel
{
    private ?int $id = null;
    private ?string $prefijo = null;
    private ?int $consecutivo = null;
    private ?string $numeroDocumento = null;
    private ?int $ordenId = null;
    private ?int $clienteId = null;
    private ?string $fechaEmision = null;
    private ?string $fechaVencimiento = null;
    private ?string $formaPago = null;
    private ?string $medioPago = null;
    private ?float $valorHora = null;
    private ?float $porcentajeUtilidad = null;
    private ?float $subtotalRepuestos = null;
    private ?float $manoObra = null;
    private ?float $utilidad = null;
    private ?string $estadoPago = null;
    private ?float $subtotal = null;
    private ?float $impuestos = null;
    private ?float $total = null;
    private ?string $observacion = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function setId(int $id): void
    {
        $this->id = $id;
    }

    public function getPrefijo(): ?string
    {
        return $this->prefijo;
    }

    public function setPrefijo(string $prefijo): void
    {
        $this->prefijo = $prefijo;
    }

    public function getConsecutivo(): ?int
    {
        return $this->consecutivo;
    }

    public function setConsecutivo(int $consecutivo): void
    {
        $this->consecutivo = $consecutivo;
    }

    public function getNumeroDocumento(): ?string
    {
        return $this->numeroDocumento;
    }

    public function setNumeroDocumento(string $numeroDocumento): void
    {
        $this->numeroDocumento = $numeroDocumento;
    }

    public function getOrdenId(): ?int
    {
        return $this->ordenId;
    }

    public function setOrdenId(int $ordenId): void
    {
        $this->ordenId = $ordenId;
    }

    public function getClienteId(): ?int
    {
        return $this->clienteId;
    }

    public function setClienteId(?int $clienteId): void
    {
        $this->clienteId = $clienteId;
    }

    public function getFechaEmision(): ?string
    {
        return $this->fechaEmision;
    }

    public function setFechaEmision(string $fechaEmision): void
    {
        $this->fechaEmision = $fechaEmision;
    }

    public function getFechaVencimiento(): ?string
    {
        return $this->fechaVencimiento;
    }

    public function setFechaVencimiento(string $fechaVencimiento): void
    {
        $this->fechaVencimiento = $fechaVencimiento;
    }

    public function getFormaPago(): ?string
    {
        return $this->formaPago;
    }

    public function setFormaPago(string $formaPago): void
    {
        $this->formaPago = $formaPago;
    }

    public function getMedioPago(): ?string
    {
        return $this->medioPago;
    }

    public function setMedioPago(string $medioPago): void
    {
        $this->medioPago = $medioPago;
    }

    public function getValorHora(): ?float
    {
        return $this->valorHora;
    }

    public function setValorHora(float $valorHora): void
    {
        $this->valorHora = $valorHora;
    }

    public function getPorcentajeUtilidad(): ?float
    {
        return $this->porcentajeUtilidad;
    }

    public function setPorcentajeUtilidad(float $porcentajeUtilidad): void
    {
        $this->porcentajeUtilidad = $porcentajeUtilidad;
    }

    public function getSubtotalRepuestos(): ?float
    {
        return $this->subtotalRepuestos;
    }

    public function setSubtotalRepuestos(float $subtotalRepuestos): void
    {
        $this->subtotalRepuestos = $subtotalRepuestos;
    }

    public function getManoObra(): ?float
    {
        return $this->manoObra;
    }

    public function setManoObra(float $manoObra): void
    {
        $this->manoObra = $manoObra;
    }

    public function getUtilidad(): ?float
    {
        return $this->utilidad;
    }

    public function setUtilidad(float $utilidad): void
    {
        $this->utilidad = $utilidad;
    }

    public function getEstadoPago(): ?string
    {
        return $this->estadoPago;
    }

    public function setEstadoPago(string $estadoPago): void
    {
        $this->estadoPago = $estadoPago;
    }

    public function getSubtotal(): ?float
    {
        return $this->subtotal;
    }

    public function setSubtotal(float $subtotal): void
    {
        $this->subtotal = $subtotal;
    }

    public function getImpuestos(): ?float
    {
        return $this->impuestos;
    }

    public function setImpuestos(float $impuestos): void
    {
        $this->impuestos = $impuestos;
    }

    public function getTotal(): ?float
    {
        return $this->total;
    }

    public function setTotal(float $total): void
    {
        $this->total = $total;
    }

    public function getObservacion(): ?string
    {
        return $this->observacion;
    }

    public function setObservacion(?string $observacion): void
    {
        $this->observacion = $observacion;
    }
}
