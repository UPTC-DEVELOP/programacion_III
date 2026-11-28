<?php
declare(strict_types=1);
namespace panther\model\business;
/**
 * ============================================================
 * Clase Prueba
 * ============================================================
 * Descripción:
 * Representa los datos de prueba dentro del sistema.
 * Gestiona los datos básicos de prueba (id, nombre, correo, telefono y edad).
 *
 * Caso de Uso:
 * PANTHER - Business
 * @author
 *     Josué Nicolás Pinzón Villamil
 * @updated
 *     Actualizado por Proyecto Actualización Panther 2025
 * ============================================================
 */
class Prueba
{
    /**
     * Identificador único
     * @var int|null
     */
    private ?int $id = null;

    /**
     * Nombre
     * @var string|null
     */
    private ?string $nombre = null;

    /**
     * Correo.
     * @var string|null
     */
    private ?string $correo = null;

    /**
     * Telefono.
     * @var float|null
     */
    private ?float $telefono = null;
    /**
     * @var int|null
     */
    private ?int $edad = null;

    /* ============================================================
     *   MÉTODOS GETTERS
     * ============================================================ */

    public function getId(): ?int
{
    return $this->id;
}

public function getNombre(): ?string
{
    return $this->nombre;
}

public function getCorreo(): ?string
{
    return $this->correo;
}

public function getTelefono(): ?float
{
    return $this->telefono;
}

public function getEdad(): ?int
{
    return $this->edad;
}


    /* ============================================================
     *   MÉTODOS SETTERS
     * ============================================================ */
public function setId(?int $id): self
{
    $this->id = $id;
    return $this;
}

public function setNombre(?string $nombre): self
{
    $this->nombre = $nombre;
    return $this;
}

public function setCorreo(?string $correo): self
{
    $this->correo = $correo;
    return $this;
}

public function setTelefono(?float $telefono): self
{
    $this->telefono = $telefono;
    return $this;
}

public function setEdad(?int $edad): self
{
    $this->edad = $edad;
    return $this;
}
  
}
