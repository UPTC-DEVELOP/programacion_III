<?php
declare(strict_types=1);
namespace panther\querys\core;
/**
 * ============================================================
 * Archivo: SecurityQueries.php
 * ============================================================
 * Descripción:
 * Contiene las consultas SQL utilizadas por los módulos
 * de seguridad del framework Panther Roles
 *
 * Caso de Uso:
 * PANTHER – Seguridad
 *
 * @author
 *     Josué Nicolás Pinzón Villamil
 * @updated
 *     Actualizado por Proyecto Actualización Panther 2025
 * ============================================================
 */

/* ============================================================
 *  CONSULTAS DE ROLES (RoleQueries)
 * ============================================================ */
class RoleQueries
{
    /**
     * Inserta un nuevo rol en la tabla `j4rol`.
     * Parámetros: name, description
     */
    public const INSERT =
        "INSERT INTO j4rol (name, description) VALUES (?, ?);";

    /**
     * Actualiza un rol existente.
     * Parámetros: name, description, id
     */
    public const UPDATE =
        "UPDATE j4rol SET name = ?, description = ? WHERE id = ?;";
}

