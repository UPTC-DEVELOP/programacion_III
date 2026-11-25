-- Services Mechanic - Caché de autenticación de Clarisa
-- Migración independiente. No modifica tablas existentes ni guarda credenciales.
-- Ejecutar únicamente después de seleccionar y respaldar la base autorizada.

USE `services_mechanic`;

CREATE TABLE IF NOT EXISTS `cache_autenticacion_clarisa` (
    `identificador_cuenta` CHAR(64)
        CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    `token_cifrado` VARBINARY(8192) NOT NULL,
    `token_iv` BINARY(12) NOT NULL,
    `token_etiqueta` BINARY(16) NOT NULL,
    `permisos_json` TEXT
        CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
    `nombre_usuario_remoto` VARCHAR(255) NOT NULL,
    `fecha_obtencion` DATETIME NOT NULL,
    `fecha_expiracion` DATETIME NOT NULL,
    `fecha_actualizacion` TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`identificador_cuenta`),
    KEY `idx_cache_clarisa_expiracion` (`fecha_expiracion`),
    CONSTRAINT `chk_cache_clarisa_identificador`
        CHECK (`identificador_cuenta` REGEXP '^[a-f0-9]{64}$'),
    CONSTRAINT `chk_cache_clarisa_token`
        CHECK (OCTET_LENGTH(`token_cifrado`) BETWEEN 1 AND 8192),
    CONSTRAINT `chk_cache_clarisa_iv`
        CHECK (OCTET_LENGTH(`token_iv`) = 12),
    CONSTRAINT `chk_cache_clarisa_etiqueta`
        CHECK (OCTET_LENGTH(`token_etiqueta`) = 16),
    CONSTRAINT `chk_cache_clarisa_permisos`
        CHECK (JSON_VALID(`permisos_json`)),
    CONSTRAINT `chk_cache_clarisa_usuario`
        CHECK (CHAR_LENGTH(TRIM(`nombre_usuario_remoto`)) BETWEEN 1 AND 255),
    CONSTRAINT `chk_cache_clarisa_fechas`
        CHECK (`fecha_expiracion` > `fecha_obtencion`)
) ENGINE=InnoDB
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci
  COMMENT='Contextos cifrados de autenticación de Clarisa';
