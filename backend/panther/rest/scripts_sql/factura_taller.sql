CREATE TABLE IF NOT EXISTS factura_taller (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nit VARCHAR(20) NOT NULL,
    prefijo VARCHAR(15) NOT NULL,
    consecutivo VARCHAR(9) NOT NULL,
    documento MEDIUMTEXT NOT NULL,
    estado VARCHAR(24) NOT NULL DEFAULT 'guardada',
    detalle VARCHAR(500) NOT NULL DEFAULT '',
    creado TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY numero_factura (nit, prefijo, consecutivo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
