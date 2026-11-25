<?php

/**
 * Consultas preparadas para controlar la idempotencia de facturación.
 */
define(
    'INSERTAR_CONTROL_ENVIO_FACTURA',
    'INSERT INTO control_envios_facturas_clarisa '
    . '(clave_idempotencia, identificador_cuenta, huella_contenido, estado) '
    . 'VALUES (?, ?, ?, ?)'
);

define(
    'CONSULTAR_CONTROL_ENVIO_FACTURA',
    'SELECT huella_contenido, estado, codigo_http_clarisa '
    . 'FROM control_envios_facturas_clarisa '
    . 'WHERE clave_idempotencia = ? LIMIT 1'
);

define(
    'REABRIR_CONTROL_ENVIO_FACTURA_RECHAZADA',
    'UPDATE control_envios_facturas_clarisa SET '
    . 'huella_contenido = ?, estado = ?, codigo_http_clarisa = NULL '
    . 'WHERE clave_idempotencia = ? AND estado = ?'
);

define(
    'ACTUALIZAR_ESTADO_ENVIO_FACTURA',
    'UPDATE control_envios_facturas_clarisa SET '
    . 'estado = ?, codigo_http_clarisa = ? '
    . 'WHERE clave_idempotencia = ? AND huella_contenido = ? AND estado = ?'
);

