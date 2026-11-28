<?php
declare(strict_types=1);
namespace panther\model\business;
/**
 * ============================================================
 * Clase Repuesto
 * ============================================================
 * Descripción:
 * Representa un repuesto del catálogo del taller.
 * Gestiona la referencia, la descripción, la marca y el precio.
 *
 * Caso de Uso:
 * PANTHER - Business
 *
 * @author
 *     Josué Nicolás Pinzón Villamil
 * @updated
 *     Actualizado por Proyecto Actualización Panther 2025
 * ============================================================
 */
class Repuesto
{
    /**
     * Identificador único del repuesto.
     * @var int|null
     */
    private ?int $id = null;

    /**
     * Código único del repuesto.
     * @var string|null
     */
    private ?string $referencia = null;

    /**
     * Nombre o detalle del repuesto.
     * @var string|null
     */
    private ?string $descripcion = null;

    /**
     * Fabricante del repuesto.
     * @var string|null
     */
    private ?string $marca = null;

    /**
     * Precio unitario.
     * @var float|null
     */
    private ?float $precio = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getReferencia(): ?string
    {
        return $this->referencia;
    }

    public function getDescripcion(): ?string
    {
        return $this->descripcion;
    }

    public function getMarca(): ?string
    {
        return $this->marca;
    }

    public function getPrecio(): ?float
    {
        return $this->precio;
    }

    public function setId(int $id): void
    {
        $this->id = $id;
    }

    public function setReferencia(string $referencia): void
    {
        $this->referencia = $referencia;
    }

    public function setDescripcion(string $descripcion): void
    {
        $this->descripcion = $descripcion;
    }

    public function setMarca(string $marca): void
    {
        $this->marca = $marca;
    }

    public function setPrecio(float $precio): void
    {
        $this->precio = $precio;
    }
}
