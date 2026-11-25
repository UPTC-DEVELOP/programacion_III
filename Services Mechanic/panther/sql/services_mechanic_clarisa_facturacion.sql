
USE `services_mechanic`;

CREATE TABLE IF NOT EXISTS `control_envios_facturas_clarisa` (
    `clave_idempotencia` CHAR(64)
        CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    `identificador_cuenta` CHAR(64)
        CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    `huella_contenido` CHAR(64)
        CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    `estado` VARCHAR(10)
        CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    `codigo_http_clarisa` SMALLINT UNSIGNED NULL,
    `fecha_creacion` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `fecha_actualizacion` TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`clave_idempotencia`),
    KEY `idx_control_factura_cuenta` (`identificador_cuenta`),
    KEY `idx_control_factura_estado` (`estado`),
    CONSTRAINT `chk_control_factura_claves`
        CHECK (
            `clave_idempotencia` REGEXP '^[a-f0-9]{64}$'
            AND `identificador_cuenta` REGEXP '^[a-f0-9]{64}$'
            AND `huella_contenido` REGEXP '^[a-f0-9]{64}$'
        ),
    CONSTRAINT `chk_control_factura_estado`
        CHECK (`estado` IN ('PENDIENTE', 'ACEPTADA', 'RECHAZADA', 'INCIERTA')),
    CONSTRAINT `chk_control_factura_http`
        CHECK (
            `codigo_http_clarisa` IS NULL
            OR `codigo_http_clarisa` BETWEEN 100 AND 599
        )
) ENGINE=InnoDB
  DEFAULT CHARACTER SET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Idempotencia de envíos de facturas a Clarisa';

