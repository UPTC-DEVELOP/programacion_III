<?php
declare(strict_types=1);
namespace panther\querys\business;
/**
 * ============================================================
 * Archivo: ProductQueries.php
 * ============================================================
 * Descripción:
 * Contiene las consultas SQL utilizadas por el módulo Business
 * (entidad Product) del framework Panther.
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

class PruebaQueries
{
    /**
     * Inserta un nuevo registro en la tabla `product`.
     * Parámetros: name, description, price
     */
    public const INSERT =
        "INSERT INTO datosprueba (nombre, correo, telefono, edad) VALUES (?, ?, ?, ?);";

    /**
     * Actualiza un registro existente en la tabla `product`.
     * Parámetros: name, description, price, id
     */
    public const UPDATE =
        "UPDATE datosprueba SET nombre = ?, correo = ?, telefono = ?, edad = ? WHERE id = ?;";
}
