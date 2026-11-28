<?php
declare(strict_types=1);
namespace panther\querys\business;
/**
 * ============================================================
 * Archivo: PersonQueries.php
 * ============================================================
 * Descripción:
 * Contiene las consultas SQL utilizadas por el módulo Business
 * (entidad Person) del framework Panther.
 *
 * Caso de Uso:
 * PANTHER – Business
 *
 * @author
 *     Josué Nicolás Pinzón Villamil
 * @updated
 *     Actualizado por Proyecto Actualización Panther 2025
 * ============================================================
 */

class PersonQueries
{
    /**
     * Inserta un nuevo registro en la tabla `person`.
     * Parámetros: name, lastName, phone
     */
    public const INSERT =
        "INSERT INTO person (name, lastName, phone) VALUES (?, ?, ?);";

    /**
     * Actualiza un registro existente en la tabla `person`.
     * Parámetros: name, lastName, phone, id
     */
    public const UPDATE =
        "UPDATE person SET name = ?, lastName = ?, phone = ? WHERE id = ?;";
}
