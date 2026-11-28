<?php
declare(strict_types=1);

namespace panther\model\core\segurity;

/**
 * ============================================================
 * Clase Rol
 * ============================================================
 * Descripción:
 * Representa un rol dentro del sistema Panther. 
 * Cada rol define un conjunto de permisos o privilegios 
 * asociados a los usuarios del sistema.
 *
 * Caso de Uso:
 * PANTHER - Seguridad
 *
 * @author
 *     Josué Nicolás Pinzón Villamil
 * @updated
 *     Actualizado por Proyecto Actualización Panther 2025
 * ============================================================
 */
class Rol
{
    /* ============================================================
     *   ATRIBUTOS
     * ============================================================ */

    /**
     * Identificador único del rol.
     * @var int|null
     */
    private ?int $id = null;

    /**
     * Nombre del rol (ejemplo: Administrador, Editor, Usuario).
     * @var string|null
     */
    private ?string $name = null;

    /**
     * Descripción del rol.
     * @var string|null
     */
    private ?string $description = null;

    /* ============================================================
     *   MÉTODOS GETTERS
     * ============================================================ */

    /**
     * Obtiene el identificador del rol.
     * @return int|null
     */
    public function getId(): ?int
    {
        return $this->id;
    }

    /**
     * Obtiene el nombre del rol.
     * @return string|null
     */
    public function getName(): ?string
    {
        return $this->name;
    }

    /**
     * Obtiene la descripción del rol.
     * @return string|null
     */
    public function getDescription(): ?string
    {
        return $this->description;
    }

    /* ============================================================
     *   MÉTODOS SETTERS
     * ============================================================ */

    /**
     * Asigna el identificador del rol.
     * @param int $id
     * @return void
     */
    public function setId(int $id): void
    {
        $this->id = $id;
    }

    /**
     * Asigna el nombre del rol.
     * @param string $name
     * @return void
     */
    public function setName(string $name): void
    {
        $this->name = $name;
    }

    /**
     * Asigna la descripción del rol.
     * @param string $description
     * @return void
     */
    public function setDescription(string $description): void
    {
        $this->description = $description;
    }
}
