<?php
declare(strict_types=1);

namespace panther\querys\business;

/**
 * ============================================================
 * Archivo: OrdenesQueries.php
 * ============================================================
 * Descripción:
 * Contiene las consultas SQL preparadas para el módulo de
 * Órdenes de Servicio (`ordenes` y `orden_repuestos`) y las
 * consultas de solo lectura de catálogos requeridos por la vista.
 * ============================================================
 */
class OrdenesQueries
{
    public const SELECT_BASE =
        "SELECT
            o.id,
            o.codigo_orden,
            o.vehiculo_id,
            o.placa,
            v.marca AS vehiculo_marca,
            v.modelo AS vehiculo_modelo,
            v.color AS vehiculo_color,
            v.tipo AS vehiculo_tipo,
            o.cliente_id,
            c.cedula AS cliente_cedula,
            c.nombre AS cliente_nombre,
            c.telefono AS cliente_telefono,
            o.empleado_id,
            e.nombre AS empleado_nombre,
            e.cargo AS empleado_cargo,
            o.horas,
            o.estado,
            o.observaciones,
            o.fecha_ingreso,
            o.fecha_salida
         FROM ordenes o
         LEFT JOIN vehiculos v ON v.id = o.vehiculo_id AND v.dateDelete IS NULL
         LEFT JOIN clientes c ON c.id = o.cliente_id AND c.dateDelete IS NULL
         LEFT JOIN empleados e ON e.id = o.empleado_id AND e.dateDelete IS NULL
         WHERE o.dateDelete IS NULL";

    public const SELECT_ALL =
        self::SELECT_BASE . " ORDER BY o.id DESC;";

    public const SELECT_BY_ID =
        self::SELECT_BASE . " AND o.id = ?;";

    public const SELECT_FOR_UPDATE =
        "SELECT id, codigo_orden, vehiculo_id, placa, cliente_id, empleado_id, horas, estado, observaciones, fecha_ingreso, fecha_salida
         FROM ordenes
         WHERE id = ? AND dateDelete IS NULL
         FOR UPDATE;";

    public const SELECT_REPUESTOS_DE_ORDEN =
        "SELECT
            or_det.id,
            or_det.orden_id,
            or_det.repuesto_id,
            r.referencia,
            r.descripcion,
            r.marca,
            or_det.cantidad,
            or_det.precio_unitario,
            ROUND(or_det.cantidad * or_det.precio_unitario, 2) AS subtotal
         FROM orden_repuestos or_det
         INNER JOIN repuestos r ON r.id = or_det.repuesto_id
         WHERE or_det.orden_id = ? AND or_det.dateDelete IS NULL
         ORDER BY or_det.id ASC;";

    public const SELECT_REPUESTOS_ACTIVOS_SIMPLE =
        "SELECT repuesto_id, cantidad
         FROM orden_repuestos
         WHERE orden_id = ? AND dateDelete IS NULL;";

    public const INSERT =
        "INSERT INTO ordenes
            (codigo_orden, vehiculo_id, placa, cliente_id, empleado_id, horas, estado, observaciones, fecha_ingreso, fecha_salida)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);";

    public const UPDATE =
        "UPDATE ordenes
         SET vehiculo_id = ?, placa = ?, cliente_id = ?, empleado_id = ?, horas = ?, estado = ?, observaciones = ?, fecha_ingreso = ?, fecha_salida = ?
         WHERE id = ? AND dateDelete IS NULL;";

    public const SOFT_DELETE =
        "UPDATE ordenes
         SET dateDelete = ?
         WHERE id = ? AND dateDelete IS NULL;";

    public const INSERT_DETALLE =
        "INSERT INTO orden_repuestos (orden_id, repuesto_id, cantidad, precio_unitario)
         VALUES (?, ?, ?, ?);";

    public const SOFT_DELETE_DETALLES =
        "UPDATE orden_repuestos
         SET dateDelete = ?
         WHERE orden_id = ? AND dateDelete IS NULL;";

    public const SELECT_INVENTARIO_FOR_UPDATE =
        "SELECT i.id, i.repuesto_id, r.referencia, r.descripcion, r.marca, r.precio, i.stock
         FROM inventario i
         INNER JOIN repuestos r ON r.id = i.repuesto_id AND r.dateDelete IS NULL
         WHERE i.repuesto_id = ? AND i.dateDelete IS NULL
         FOR UPDATE;";

    public const DESCONTAR_STOCK =
        "UPDATE inventario
         SET stock = stock - ?
         WHERE id = ? AND dateDelete IS NULL;";

    public const REINTEGRAR_STOCK =
        "UPDATE inventario
         SET stock = stock + ?
         WHERE repuesto_id = ? AND dateDelete IS NULL;";

    public const COUNT_CODIGO_ORDEN =
        "SELECT COUNT(*) FROM ordenes WHERE codigo_orden = ?;";

    public const SELECT_MAX_ID =
        "SELECT COALESCE(MAX(id), 0) FROM ordenes;";

    // Consultas de solo lectura para catálogos de la pantalla de Órdenes
    public const CATALOGO_CLIENTES =
        "SELECT id, cedula, nombre, telefono, correo
         FROM clientes
         WHERE dateDelete IS NULL
         ORDER BY nombre ASC;";

    public const CATALOGO_VEHICULOS =
        "SELECT id, placa, marca, modelo, color, tipo, cliente_id
         FROM vehiculos
         WHERE dateDelete IS NULL
         ORDER BY placa ASC;";

    public const CATALOGO_EMPLEADOS =
        "SELECT id, cedula, nombre, cargo, telefono
         FROM empleados
         WHERE dateDelete IS NULL
         ORDER BY nombre ASC;";

    public const CATALOGO_INVENTARIO =
        "SELECT
            i.id AS inventario_id,
            i.repuesto_id,
            r.referencia,
            r.descripcion,
            r.marca,
            r.precio,
            i.stock,
            i.stock_minimo,
            i.ubicacion
         FROM inventario i
         INNER JOIN repuestos r ON r.id = i.repuesto_id AND r.dateDelete IS NULL
         WHERE i.dateDelete IS NULL
         ORDER BY r.referencia ASC;";

    public const VERIFICAR_CLIENTE =
        "SELECT id FROM clientes WHERE id = ? AND dateDelete IS NULL;";

    public const VERIFICAR_VEHICULO =
        "SELECT id, placa, cliente_id FROM vehiculos WHERE id = ? AND dateDelete IS NULL;";

    public const VERIFICAR_EMPLEADO =
        "SELECT id FROM empleados WHERE id = ? AND dateDelete IS NULL;";
}
