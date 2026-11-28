<?php
declare(strict_types=1);

namespace panther\querys\business;

/**
 * ============================================================
 * Archivo: InventarioQueries.php
 * ============================================================
 * Descripción:
 * Contiene las consultas SQL preparadas para el módulo de
 * Inventario (tabla `inventario` enlazada con `repuestos`).
 * ============================================================
 */
class InventarioQueries
{
    public const SELECT_BASE =
        "SELECT
            i.id,
            i.repuesto_id,
            r.referencia,
            r.descripcion,
            r.marca,
            r.precio,
            i.stock,
            i.stock_minimo,
            i.ubicacion,
            i.updated_at,
            ROUND(i.stock * r.precio, 2) AS valor_total,
            CASE
                WHEN i.stock = 0 THEN 'AGOTADO'
                WHEN i.stock <= i.stock_minimo THEN 'BAJO_STOCK'
                ELSE 'DISPONIBLE'
            END AS estado
         FROM inventario i
         INNER JOIN repuestos r
             ON r.id = i.repuesto_id AND r.dateDelete IS NULL
         WHERE i.dateDelete IS NULL";

    public const SELECT_ALL =
        self::SELECT_BASE . " ORDER BY i.id DESC;";

    public const SELECT_BY_ID =
        self::SELECT_BASE . " AND i.id = ?;";

    public const SELECT_BY_REPUESTO_ID_ALL =
        "SELECT id, repuesto_id, referencia, stock, stock_minimo, ubicacion, dateDelete
         FROM inventario
         WHERE repuesto_id = ?;";

    public const SELECT_BY_REFERENCIA_ALL =
        "SELECT id, repuesto_id, referencia, stock, stock_minimo, ubicacion, dateDelete
         FROM inventario
         WHERE referencia = ?;";

    public const SELECT_REPUESTO_BY_ID =
        "SELECT id, referencia, descripcion, marca, precio
         FROM repuestos
         WHERE id = ? AND dateDelete IS NULL;";

    public const SELECT_REPUESTO_BY_REFERENCIA =
        "SELECT id, referencia, descripcion, marca, precio
         FROM repuestos
         WHERE referencia = ? AND dateDelete IS NULL;";

    public const INSERT =
        "INSERT INTO inventario (repuesto_id, referencia, stock, stock_minimo, ubicacion)
         VALUES (?, ?, ?, ?, ?);";

    public const UPDATE =
        "UPDATE inventario
         SET repuesto_id = ?, referencia = ?, stock = ?, stock_minimo = ?, ubicacion = ?
         WHERE id = ? AND dateDelete IS NULL;";

    public const REACTIVATE =
        "UPDATE inventario
         SET referencia = ?, stock = ?, stock_minimo = ?, ubicacion = ?, dateDelete = NULL
         WHERE id = ?;";

    public const SOFT_DELETE =
        "UPDATE inventario
         SET dateDelete = ?
         WHERE id = ? AND dateDelete IS NULL;";
}
