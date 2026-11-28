<?php
declare(strict_types=1);
namespace panther\model\core\segurity;
use JsonSerializable;
/**
 * ============================================================
 * Clase User
 * ============================================================
 * Descripción:
 * Representa a un usuario dentro del sistema Panther, incluyendo
 * su información de autenticación, rol asociado y token de acceso.
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
class User implements \JsonSerializable
{
    /* ============================================================
     *   ATRIBUTOS
     * ============================================================ */

    /**
     * Identificador único del usuario.
     * @var int|null
     */
    private ?int $id = null;

    /**
     * Nombre de usuario o alias de acceso.
     * @var string|null
     */
    private ?string $user = null;

    /**
     * Contraseña cifrada del usuario.
     * @var string|null
     */
    private ?string $password = null;

    /**
     * Roles o permisos asociados al usuario.
     * @var mixed|null Puede ser instancia de Rol o cadena con el nombre del rol.
     */
    private mixed $roles = null;

    /**
     * Token único de autenticación (API Key).
     * @var string|null
     */
    private ?string $keyAPI = null;

    /* ============================================================
     *   CONSTRUCTOR OPCIONAL
     * ============================================================ */

    /**
     * Constructor de la clase User.
     * 
     * @param int|null    $id        Identificador del usuario
     * @param string|null $user      Nombre de usuario
     * @param string|null $password  Contraseña cifrada
     * @param string|null $keyAPI    Token de acceso
     * @param mixed|null  $roles     Rol o roles asignados
     */
    public function __construct(
        ?int $id = null,
        ?string $user = null,
        ?string $password = null,
        ?string $keyAPI = null,
        mixed $roles = null
    ) {
        $this->id = $id;
        $this->user = $user;
        $this->password = $password;
        $this->keyAPI = $keyAPI;
        $this->roles = $roles;
    }

    /* ============================================================
     *   MÉTODOS GETTERS
     * ============================================================ */

    /** @return int|null */
    public function getId(): ?int
    {
        return $this->id;
    }

    /** @return string|null */
    public function getUser(): ?string
    {
        return $this->user;
    }

    /** @return string|null */
    public function getPassword(): ?string
    {
        return $this->password;
    }

    /** @return mixed|null */
    public function getRoles(): mixed
    {
        return $this->roles;
    }

    /** @return string|null */
    public function getKeyAPI(): ?string
    {
        return $this->keyAPI;
    }

    /* ============================================================
     *   MÉTODOS SETTERS
     * ============================================================ */

    /** @param int $id */
    public function setId(int $id): void
    {
        $this->id = $id;
    }

    /** @param string $user */
    public function setUser(string $user): void
    {
        $this->user = $user;
    }

    /** @param string $password */
    public function setPassword(string $password): void
    {
        $this->password = $password;
    }

    /** @param mixed $roles */
    public function setRoles(mixed $roles): void
    {
        $this->roles = $roles;
    }

    /** @param string $keyAPI */
    public function setKeyAPI(string $keyAPI): void
    {
        $this->keyAPI = $keyAPI;
    }


    public function jsonSerialize(): array
    {
        $rol = $this->roles ?? null;
        return [
            'id' => $this->id ?? null,
            'user' => $this->user ?? null,
            'roles' => $rol,
            'rol' => $rol,
            'keyAPI' => $this->keyAPI ?? null
        ];
    }
}
