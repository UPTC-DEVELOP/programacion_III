<?php
declare(strict_types=1);
namespace panther\util;
use Exception;
/**
 * ============================================================
 * Archivo: ExcepcionAPI.php
 * ============================================================
 * Descripción:
 * Clase base para el manejo centralizado de excepciones
 * dentro del framework Panther. Permite generar respuestas
 * estructuradas con estado, código y mensaje.
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

class ExcepcionAPI extends Exception
{
    /**
     * Estado textual de la solicitud (por ejemplo: "BAD_REQUEST", "NOT_FOUND").
     *
     * @var string
     */
    private string $state;

    /**
     * Constructor de la clase ExcepcionAPI.
     *
     * @param string $state   Estado lógico de la excepción (ej. BAD_REQUEST).
     * @param int|string $code Código de error asociado (puede ser HTTP o interno).
     * @param string $message Mensaje descriptivo del error.
     */
    public function __construct(string $state, int|string $code, string $message)
    {
        parent::__construct($message, (int) $code);
        $this->state = $state;
    }

    /**
     * Obtiene el estado lógico de la excepción.
     *
     * @return string
     */
    public function getState(): string
    {
        return $this->state;
    }

    /**
     * Asigna el estado lógico de la excepción.
     *
     * @param string $state
     * @return void
     */
    public function setState(string $state): void
    {
        $this->state = $state;
    }

    /**
     * Convierte la excepción en un formato estándar para salida JSON.
     *
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'state'   => $this->state,
            'code'    => $this->getCode(),
            'message' => $this->getMessage()
        ];
    }
}
