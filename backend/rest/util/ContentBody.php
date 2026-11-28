<?php
declare(strict_types=1);
namespace panther\util;
use JsonSerializable;
/**
 * ============================================================
 * Archivo: ContentBody.php
 * ============================================================
 * Descripción:
 * Clase encargada de representar el cuerpo de una respuesta
 * estándar en formato REST dentro del framework Panther.
 *
 * Caso de Uso:
 * PANTHER – Seguridad / Business
 *
 * @author
 *     Josué Nicolás Pinzón Villamil
 * @updated
 *     Actualizado por Proyecto Actualización Panther 2025
 * ============================================================
 */

class ContentBody implements \JsonSerializable
{
    /* ============================================================
     * CONSTANTES DE CLAVE ESTÁNDAR
     * ============================================================ */
    public const STATE = 'state';
    public const CODE  = 'code';
    public const DATA  = 'data';
    public const MESSAGE = 'message';

    /* ============================================================
     * PROPIEDADES PRIVADAS
     * ============================================================ */
    private string $state;
    private int|string $code;
    private mixed $data;

    /* ============================================================
     * CONSTRUCTOR
     * ============================================================ */
    /**
     * Crea una nueva instancia de respuesta estándar.
     *
     * @param string $state  Estado textual (por ejemplo: OK, ERROR)
     * @param int|string $code  Código HTTP o código lógico del sistema
     * @param mixed $data  Contenido o datos devueltos por la API
     */
    public function __construct(string $state, int|string $code, mixed $data)
    {
        $this->state = $state;
        $this->code  = $code;
        $this->data  = $data;
    }

    /* ============================================================
     * MÉTODOS GETTERS
     * ============================================================ */
    public function getState(): string
    {
        return $this->state;
    }

    public function getCode(): int|string
    {
        return $this->code;
    }

    public function getData(): mixed
    {
        return $this->data;
    }

    /* ============================================================
     * MÉTODOS SETTERS
     * ============================================================ */
    public function setState(string $state): void
    {
        $this->state = $state;
    }

    public function setCode(int|string $code): void
    {
        $this->code = $code;
    }

    public function setData(mixed $data): void
    {
        $this->data = $data;
    }

    /* ============================================================
     * SERIALIZACIÓN JSON
     * ============================================================ */
    /**
     * Define cómo debe serializarse este objeto a formato JSON.
     *
     * @return array<string, mixed>
     */
    public function jsonSerialize(): array
    {
        return [
            self::STATE   => $this->state,
            self::CODE    => $this->code,
            self::DATA    => $this->data,
        ];
    }
}
