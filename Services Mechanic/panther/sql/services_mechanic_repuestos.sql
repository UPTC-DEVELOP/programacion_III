-- Services Mechanic - Modulo Repuestos (instalacion incremental)
-- Ejecutar sobre la base services_mechanic ya existente.
-- No elimina ni reconstruye tablas existentes y no inserta datos.

USE `services_mechanic`;

CREATE TABLE IF NOT EXISTS `repuestos` (
    `id_repuesto` SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `referencia` VARCHAR(20) NOT NULL,
    `descripcion` VARCHAR(100) NOT NULL,
    `marca` VARCHAR(40) NOT NULL,
    `precio` DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (`id_repuesto`),
    UNIQUE KEY `uq_repuestos_referencia` (`referencia`),
    CONSTRAINT `chk_repuestos_referencia`
        CHECK (CHAR_LENGTH(TRIM(`referencia`)) BETWEEN 1 AND 20),
    CONSTRAINT `chk_repuestos_descripcion`
        CHECK (CHAR_LENGTH(TRIM(`descripcion`)) BETWEEN 1 AND 100),
    CONSTRAINT `chk_repuestos_marca`
        CHECK (CHAR_LENGTH(TRIM(`marca`)) BETWEEN 1 AND 40),
    CONSTRAINT `chk_repuestos_precio`
        CHECK (`precio` > 0 AND `precio` <= 99999999.99)
) ENGINE=InnoDB
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci
  COMMENT='Repuestos de Services Mechanic';

-- El trigger conserva el identificador publico dentro del rango 0001-9999.
DELIMITER $$

DROP TRIGGER IF EXISTS `trg_repuestos_limite_id`$$

CREATE TRIGGER `trg_repuestos_limite_id`
AFTER INSERT ON `repuestos`
FOR EACH ROW
BEGIN
    IF NEW.`id_repuesto` > 9999 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Se agoto el rango de identificadores de repuestos (0001-9999)';
    END IF;
END$$

DELIMITER ;

-- DELETE permanece deshabilitado en Panther hasta que el esquema de Servicios
-- defina una clave foranea o tabla puente verificable hacia id_repuesto.
