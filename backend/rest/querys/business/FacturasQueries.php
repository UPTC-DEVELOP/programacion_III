<?php
declare(strict_types=1);

namespace panther\querys\business;

class FacturasQueries
{
    public const IVA_TASA = 0.19;

    public const SELECT_BASE =
        "SELECT
            f.id,
            f.prefijo,
            f.consecutivo,
            f.numero_documento,
            f.orden_id,
            f.cliente_id,
            f.fecha_emision,
            f.fecha_vencimiento,
            f.forma_pago,
            f.medio_pago,
            f.valor_hora,
            f.porcentaje_utilidad,
            f.subtotal_repuestos,
            f.mano_obra,
            f.utilidad,
            f.estado_pago,
            f.subtotal,
            f.impuestos,
            f.total,
            f.estado_dian,
            f.cufe,
            f.observacion,
            o.codigo_orden,
            o.placa,
            o.horas,
            o.estado AS orden_estado,
            o.fecha_ingreso,
            o.empleado_id,
            c.cedula AS cliente_cedula,
            c.nombre AS cliente_nombre,
            c.telefono AS cliente_telefono,
            c.correo AS cliente_correo,
            c.direccion AS cliente_direccion,
            v.marca AS vehiculo_marca,
            v.modelo AS vehiculo_modelo,
            v.color AS vehiculo_color,
            v.tipo AS vehiculo_tipo,
            e.nombre AS empleado_nombre,
            e.cedula AS empleado_cedula,
            e.cargo AS empleado_cargo
         FROM facturas f
         LEFT JOIN ordenes o ON o.id = f.orden_id
         LEFT JOIN clientes c ON c.id = f.cliente_id AND c.dateDelete IS NULL
         LEFT JOIN vehiculos v ON v.id = o.vehiculo_id AND v.dateDelete IS NULL
         LEFT JOIN empleados e ON e.id = o.empleado_id AND e.dateDelete IS NULL
         WHERE f.dateDelete IS NULL";

    public const SELECT_ALL =
        self::SELECT_BASE . " ORDER BY f.id DESC;";

    public const SELECT_BY_ID =
        self::SELECT_BASE . " AND f.id = ?;";

    public const SELECT_BY_NUMERO =
        self::SELECT_BASE . " AND f.numero_documento LIKE ? ORDER BY f.id DESC;";

    public const SELECT_BY_ESTADO_PAGO =
        self::SELECT_BASE . " AND f.estado_pago = ? ORDER BY f.id DESC;";

    public const SELECT_FACTURA_ACTIVA_POR_ORDEN =
        "SELECT id, numero_documento, estado_pago
         FROM facturas
         WHERE orden_id = ?
           AND dateDelete IS NULL
           AND UPPER(estado_pago) <> 'ANULADA'
         LIMIT 1;";

    public const SELECT_MAX_CONSECUTIVO =
        "SELECT COALESCE(MAX(consecutivo), 0) AS max_consecutivo
         FROM facturas
         WHERE prefijo = ?;";

    public const SELECT_REPUESTOS_ORDEN =
        "SELECT
            or_det.id,
            or_det.repuesto_id,
            r.referencia,
            r.descripcion,
            r.marca,
            or_det.cantidad,
            or_det.precio_unitario,
            ROUND(or_det.cantidad * or_det.precio_unitario, 2) AS subtotal
         FROM orden_repuestos or_det
         INNER JOIN repuestos r ON r.id = or_det.repuesto_id
         WHERE or_det.orden_id = ?
           AND or_det.dateDelete IS NULL
         ORDER BY or_det.id ASC;";

    public const SELECT_ORDEN_PARA_FACTURA =
        "SELECT
            o.id,
            o.codigo_orden,
            o.vehiculo_id,
            o.placa,
            o.cliente_id,
            o.empleado_id,
            o.horas,
            o.estado,
            o.observaciones,
            o.fecha_ingreso,
            o.fecha_salida,
            c.cedula AS cliente_cedula,
            c.nombre AS cliente_nombre,
            c.telefono AS cliente_telefono,
            c.correo AS cliente_correo,
            c.direccion AS cliente_direccion,
            v.marca AS vehiculo_marca,
            v.modelo AS vehiculo_modelo,
            v.color AS vehiculo_color,
            v.tipo AS vehiculo_tipo,
            e.nombre AS empleado_nombre,
            e.cedula AS empleado_cedula,
            e.cargo AS empleado_cargo
         FROM ordenes o
         LEFT JOIN clientes c ON c.id = o.cliente_id AND c.dateDelete IS NULL
         LEFT JOIN vehiculos v ON v.id = o.vehiculo_id AND v.dateDelete IS NULL
         LEFT JOIN empleados e ON e.id = o.empleado_id AND e.dateDelete IS NULL
         WHERE o.id = ?
           AND o.dateDelete IS NULL
         LIMIT 1
         FOR UPDATE;";

    public const SELECT_ORDENES_FACTURABLES =
        "SELECT
            o.id,
            o.codigo_orden,
            o.placa,
            o.horas,
            o.estado,
            o.fecha_ingreso,
            o.cliente_id,
            c.cedula AS cliente_cedula,
            c.nombre AS cliente_nombre,
            c.telefono AS cliente_telefono,
            e.nombre AS empleado_nombre,
            v.marca AS vehiculo_marca,
            v.modelo AS vehiculo_modelo
         FROM ordenes o
         LEFT JOIN clientes c ON c.id = o.cliente_id AND c.dateDelete IS NULL
         LEFT JOIN empleados e ON e.id = o.empleado_id AND e.dateDelete IS NULL
         LEFT JOIN vehiculos v ON v.id = o.vehiculo_id AND v.dateDelete IS NULL
         WHERE o.dateDelete IS NULL
           AND UPPER(o.estado) <> 'CANCELADA'
           AND NOT EXISTS (
                SELECT 1
                FROM facturas f
                WHERE f.orden_id = o.id
                  AND f.dateDelete IS NULL
                  AND UPPER(f.estado_pago) <> 'ANULADA'
           )
         ORDER BY o.id DESC;";

    public const SELECT_RESUMEN =
        "SELECT
            COUNT(*) AS total_facturas,
            COALESCE(SUM(CASE WHEN UPPER(estado_pago) = 'PAGADA' THEN 1 ELSE 0 END), 0) AS facturas_pagadas,
            COALESCE(SUM(CASE WHEN UPPER(estado_pago) = 'PENDIENTE' THEN 1 ELSE 0 END), 0) AS facturas_pendientes,
            COALESCE(SUM(CASE WHEN UPPER(estado_pago) = 'ANULADA' THEN 1 ELSE 0 END), 0) AS facturas_anuladas,
            COALESCE(SUM(CASE WHEN UPPER(estado_pago) <> 'ANULADA' THEN total ELSE 0 END), 0) AS total_facturado,
            COALESCE(SUM(CASE WHEN UPPER(estado_pago) = 'PAGADA' THEN total ELSE 0 END), 0) AS total_pagado,
            COALESCE(SUM(CASE WHEN UPPER(estado_pago) <> 'ANULADA' THEN impuestos ELSE 0 END), 0) AS iva_recaudado
         FROM facturas
         WHERE dateDelete IS NULL;";

    public const INSERT =
        "INSERT INTO facturas (
            prefijo,
            consecutivo,
            numero_documento,
            orden_id,
            cliente_id,
            fecha_emision,
            fecha_vencimiento,
            forma_pago,
            medio_pago,
            valor_hora,
            porcentaje_utilidad,
            subtotal_repuestos,
            mano_obra,
            utilidad,
            estado_pago,
            subtotal,
            impuestos,
            total,
            estado_dian,
            observacion
         ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
         );";

    public const UPDATE_ESTADO =
        "UPDATE facturas
         SET estado_pago = ?,
             medio_pago = ?,
             forma_pago = ?,
             observacion = ?,
             estado_dian = ?
         WHERE id = ?
           AND dateDelete IS NULL;";

    public const UPDATE_EMISION_CLARISA =
        "UPDATE facturas
         SET estado_dian = ?,
             cufe = ?
         WHERE id = ?
           AND dateDelete IS NULL;";

    public const SOFT_DELETE =
        "UPDATE facturas
         SET dateDelete = ?,
             estado_pago = 'ANULADA',
             estado_dian = 'ANULADA'
         WHERE id = ?
           AND dateDelete IS NULL;";

    public const FINALIZAR_ORDEN =
        "UPDATE ordenes
         SET estado = 'FINALIZADA',
             fecha_salida = COALESCE(fecha_salida, ?)
         WHERE id = ?
           AND dateDelete IS NULL;";
}
