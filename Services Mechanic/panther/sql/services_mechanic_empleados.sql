-- Services Mechanic - Modulo Empleados (instalacion modular)

CREATE DATABASE IF NOT EXISTS `services_mechanic`
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE `services_mechanic`;

CREATE TABLE IF NOT EXISTS `empleados` (
    `id_empleado` SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `cedula` VARCHAR(10) NOT NULL,
    `nombres` VARCHAR(40) NOT NULL,
    `apellidos` VARCHAR(40) NOT NULL,
    `telefono` CHAR(10) NOT NULL,
    `cargo` VARCHAR(40) NOT NULL,
    `fecha_creacion` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `fecha_actualizacion` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (`id_empleado`),
    UNIQUE KEY `uq_empleados_cedula` (`cedula`),

    CONSTRAINT `chk_empleados_cedula`
        CHECK (`cedula` REGEXP '^[0-9]{1,10}$'),

    CONSTRAINT `chk_empleados_nombres`
        CHECK (CHAR_LENGTH(TRIM(`nombres`)) BETWEEN 1 AND 40),

    CONSTRAINT `chk_empleados_apellidos`
        CHECK (CHAR_LENGTH(TRIM(`apellidos`)) BETWEEN 1 AND 40),

    CONSTRAINT `chk_empleados_telefono`
        CHECK (`telefono` REGEXP '^[0-9]{10}$'),

    CONSTRAINT `chk_empleados_cargo`
        CHECK (CHAR_LENGTH(TRIM(`cargo`)) BETWEEN 1 AND 40)

) ENGINE=InnoDB
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci
  COMMENT='Empleados de Services Mechanic';

DELIMITER $$

DROP TRIGGER IF EXISTS `trg_empleados_limite_id`$$

CREATE TRIGGER `trg_empleados_limite_id`
AFTER INSERT ON `empleados`
FOR EACH ROW
BEGIN
    IF NEW.`id_empleado` > 9999 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Se agoto el rango de identificadores de empleados (0001-9999)';
    END IF;
END$$

DELIMITER ;

-- Panther obtiene el identificador publico con:
-- LPAD(CAST(id_empleado AS CHAR), 4, '0') AS idEmpleado