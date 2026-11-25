<?php

/**
 * Consultas preparadas para la caché de autenticación de Clarisa.
 */
define(
    'CONSULTA_CACHE_CLARISA_VIGENTE',
    'SELECT token_cifrado, token_iv, token_etiqueta, permisos_json, '
    . 'nombre_usuario_remoto, fecha_obtencion, fecha_expiracion '
    . 'FROM cache_autenticacion_clarisa '
    . 'WHERE identificador_cuenta = ? AND fecha_expiracion > ? LIMIT 1'
);

define(
    'CONSULTA_CACHE_CLARISA_ACTUALIZAR',
    'UPDATE cache_autenticacion_clarisa SET '
    . 'token_cifrado = ?, token_iv = ?, token_etiqueta = ?, permisos_json = ?, '
    . 'nombre_usuario_remoto = ?, fecha_obtencion = ?, fecha_expiracion = ? '
    . 'WHERE identificador_cuenta = ?'
);

define(
    'CONSULTA_CACHE_CLARISA_EXISTE',
    'SELECT COUNT(*) FROM cache_autenticacion_clarisa WHERE identificador_cuenta = ?'
);

define(
    'CONSULTA_CACHE_CLARISA_INSERTAR',
    'INSERT INTO cache_autenticacion_clarisa '
    . '(identificador_cuenta, token_cifrado, token_iv, token_etiqueta, '
    . 'permisos_json, nombre_usuario_remoto, fecha_obtencion, fecha_expiracion) '
    . 'VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
);

define(
    'CONSULTA_CACHE_CLARISA_INVALIDAR',
    'DELETE FROM cache_autenticacion_clarisa WHERE identificador_cuenta = ?'
);

define(
    'CONSULTA_CACHE_CLARISA_ADQUIRIR_BLOQUEO',
    'SELECT GET_LOCK(?, ?)'
);

define(
    'CONSULTA_CACHE_CLARISA_LIBERAR_BLOQUEO',
    'SELECT RELEASE_LOCK(?)'
);
