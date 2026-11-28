<?php
declare(strict_types=1);
namespace panther\model\business;
/**
 * ============================================================
 * Clase Person
 * ============================================================
 * Descripción:
 * Representa una persona dentro del sistema.
 * Gestiona los datos básicos de una persona (nombre, apellido y teléfono).
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
class Person
{
    /**
     * Identificador único de la persona.
     * @var int|null
     */
    private ?int $id = null;

    /**
     * Nombre de la persona.
     * @var string|null
     */
    private ?string $name = null;

    /**
     * Apellido de la persona.
     * @var string|null
     */
    private ?string $lastName = null;

    /**
     * Teléfono de contacto.
     * @var string|null
     */
    private ?string $phone = null;

    /* ============================================================
     *   MÉTODOS GETTERS
     * ============================================================ */

    /**
     * Obtiene el ID de la persona.
     * @return int|null
     */
    public function getId(): ?int
    {
        return $this->id;
    }

    /**
     * Obtiene el nombre de la persona.
     * @return string|null
     */
    public function getName(): ?string
    {
        return $this->name;
    }

    /**
     * Obtiene el apellido de la persona.
     * @return string|null
     */
    public function getLastName(): ?string
    {
        return $this->lastName;
    }

    /**
     * Obtiene el teléfono de la persona.
     * @return string|null
     */
    public function getPhone(): ?string
    {
        return $this->phone;
    }

    /* ============================================================
     *   MÉTODOS SETTERS
     * ============================================================ */

    /**
     * Asigna el identificador de la persona.
     * @param int $id
     * @return void
     */
    public function setId(int $id): void
    {
        $this->id = $id;
    }

    /**
     * Asigna el nombre de la persona.
     * @param string $name
     * @return void
     */
    public function setName(string $name): void
    {
        $this->name = $name;
    }

    /**
     * Asigna el apellido de la persona.
     * @param string $lastName
     * @return void
     */
    public function setLastName(string $lastName): void
    {
        $this->lastName = $lastName;
    }

    /**
     * Asigna el teléfono de la persona.
     * @param string $phone
     * @return void
     */
    public function setPhone(string $phone): void
    {
        $this->phone = $phone;
    }
}
