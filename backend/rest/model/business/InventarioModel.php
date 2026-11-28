<?php
declare(strict_types=1);

namespace panther\model\business;

/**
 * ============================================================
 * Clase InventarioModel
 * ============================================================
 * Descripción:
 * Representa un registro de inventario asociado a un repuesto
 * del catálogo del taller mecánico.
 *
 * Caso de Uso:
 * PANTHER - Business
 * ============================================================
 */
class InventarioModel
{
    private ?int $id = null;
    private ?int $repuestoId = null;
    private ?string $referencia = null;
    private ?int $stock = null;
    private ?int $stockMinimo = null;
    private ?string $ubicacion = null;
    private ?string $estado = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getRepuestoId(): ?int
    {
        return $this->repuestoId;
    }

    public function getReferencia(): ?string
    {
        return $this->referencia;
    }

    public function getStock(): ?int
    {
        return $this->stock;
    }

    public function getStockMinimo(): ?int
    {
        return $this->stockMinimo;
    }

    public function getUbicacion(): ?string
    {
        return $this->ubicacion;
    }

    public function getEstado(): ?string
    {
        return $this->estado;
    }

    public function setId(int $id): void
    {
        $this->id = $id;
    }

    public function setRepuestoId(int $repuestoId): void
    {
        $this->repuestoId = $repuestoId;
    }

    public function setReferencia(string $referencia): void
    {
        $this->referencia = $referencia;
    }

    public function setStock(int $stock): void
    {
        $this->stock = $stock;
    }

    public function setStockMinimo(int $stockMinimo): void
    {
        $this->stockMinimo = $stockMinimo;
    }

    public function setUbicacion(?string $ubicacion): void
    {
        $this->ubicacion = $ubicacion;
    }

    public function setEstado(string $estado): void
    {
        $this->estado = $estado;
    }
}
