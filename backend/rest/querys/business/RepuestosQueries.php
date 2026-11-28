<?php
declare(strict_types=1);
namespace panther\querys\business;
/**
 * ============================================================
 * Archivo: RepuestosQueries.php
 * ============================================================
 * Descripción:
 * Contiene las consultas SQL utilizadas por el módulo Business
 * (entidad Repuesto) del framework Panther.
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

class RepuestosQueries
{
    /**
     * Inserta un nuevo registro en la tabla `repuestos`.
     * Parámetros: referencia, descripcion, marca, precio
     */
    public const INSERT =
        "INSERT INTO repuestos (referencia, descripcion, marca, precio) VALUES (?, ?, ?, ?);";

    /**
     * Actualiza un registro existente en la tabla `repuestos`.
     * Parámetros: referencia, descripcion, marca, precio, id
     */
    public const UPDATE =
        "UPDATE repuestos SET referencia = ?, descripcion = ?, marca = ?, precio = ? WHERE id = ? AND dateDelete IS NULL;";

    /**
     * Busca un repuesto activo por su identificador.
     * Parámetros: id
     */
    public const SELECT_BY_ID =
        "SELECT id, referencia, descripcion, marca, precio FROM repuestos WHERE id = ? AND dateDelete IS NULL;";

    /**
     * Busca un repuesto activo por su referencia.
     * Parámetros: referencia
     */
    public const SELECT_BY_REFERENCIA =
        "SELECT id, referencia, descripcion, marca, precio FROM repuestos WHERE referencia = ? AND dateDelete IS NULL;";
}
