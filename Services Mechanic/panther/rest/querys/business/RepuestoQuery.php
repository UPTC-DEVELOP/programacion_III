<?php

/**
 * Consultas preparadas del recurso Repuestos (`spareparts`).
 */
define(
    'SPARE_PART_SELECT_FIELDS',
    "LPAD(CAST(id_repuesto AS CHAR), 4, '0') AS idRepuesto, referencia, descripcion, marca, precio"
);
define(
    'SELECT_SPARE_PARTS',
    'SELECT ' . SPARE_PART_SELECT_FIELDS . ' FROM repuestos ORDER BY id_repuesto ASC'
);
define(
    'SEARCH_SPARE_PARTS',
    'SELECT ' . SPARE_PART_SELECT_FIELDS
    . ' FROM repuestos'
    . ' WHERE LOCATE(?, referencia) > 0 OR LOCATE(?, descripcion) > 0 OR LOCATE(?, marca) > 0'
    . ' ORDER BY id_repuesto ASC'
);
define(
    'SELECT_SPARE_PART_BY_ID',
    'SELECT ' . SPARE_PART_SELECT_FIELDS . ' FROM repuestos WHERE id_repuesto = ?'
);
define(
    'LOCK_SPARE_PART_BY_ID',
    'SELECT ' . SPARE_PART_SELECT_FIELDS . ' FROM repuestos WHERE id_repuesto = ? FOR UPDATE'
);
define('COUNT_SPARE_PART_BY_REFERENCE', 'SELECT COUNT(*) FROM repuestos WHERE referencia = ?');
define(
    'COUNT_OTHER_SPARE_PART_BY_REFERENCE',
    'SELECT COUNT(*) FROM repuestos WHERE referencia = ? AND id_repuesto <> ?'
);
define(
    'INSERT_SPARE_PART',
    'INSERT INTO repuestos (referencia, descripcion, marca, precio) VALUES (?, ?, ?, ?)'
);
define(
    'UPDATE_SPARE_PART',
    'UPDATE repuestos SET referencia = ?, descripcion = ?, marca = ?, precio = ? WHERE id_repuesto = ?'
);
