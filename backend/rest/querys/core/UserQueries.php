<?php
declare(strict_types=1);
namespace panther\querys\core;
/**
 * ============================================================
 * Archivo: SecurityQueries.php
 * ============================================================
 * Descripción:
 * Contiene las consultas SQL utilizadas por los módulos
 * de seguridad del framework Panther Usuarios
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
 *  CONSULTAS DE USUARIOS (UserQueries)
 * ============================================================ */
class UserQueries
{
    /**
     * Inserta un nuevo usuario en la tabla `j4user`.
     * Parámetros: user, password, keyAPI, roles
     */
    public const INSERT =
        "INSERT INTO j4user (user, password, keyAPI, roles) VALUES (?, ?, ?, ?);";

    /**
     * Actualiza un usuario existente.
     * Parámetros: password, keyAPI, roles, id
     */
    public const UPDATE =
        "UPDATE j4user SET password = ?, keyAPI = ?, roles = ? WHERE id = ?;";

    /**
     * Selecciona un usuario por su nombre.
     * Parámetros: user
     */
    public const SELECT =
        "SELECT id, password, user, keyAPI, roles FROM j4user WHERE user LIKE ?;";

    /**
     * Verifica la validez de una clave API.
     * Parámetros: keyAPI
     */
    public const VERIFY_KEYAPI =
        "SELECT COUNT(user) FROM j4user WHERE keyAPI = ?;";
}

