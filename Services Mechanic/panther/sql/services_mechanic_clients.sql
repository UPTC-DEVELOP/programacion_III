-- Services Mechanic - Modulo Clientes (instalacion modular)
-- Para una instalacion completa de Panther y Clientes use primero:
-- services_mechanic_install.sql
-- Este archivo se conserva para instalar solo Clientes sobre una base
-- services_mechanic que ya tenga las tablas de autenticacion.
-- No modifica la base panther.

CREATE DATABASE IF NOT EXISTS `services_mechanic`
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE `services_mechanic`;

CREATE TABLE IF NOT EXISTS `clientes` (
    `id_cliente` SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `cedula` VARCHAR(10) NOT NULL,
    `nombres` VARCHAR(40) NOT NULL,
    `apellidos` VARCHAR(40) NOT NULL,
    `telefono` CHAR(10) NOT NULL,
    `direccion` VARCHAR(80) NOT NULL,
    `fecha_creacion` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `fecha_actualizacion` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id_cliente`),
    UNIQUE KEY `uq_clientes_cedula` (`cedula`),
    CONSTRAINT `chk_clientes_cedula`
        CHECK (`cedula` REGEXP '^[0-9]{1,10}$'),
    CONSTRAINT `chk_clientes_nombres`
        CHECK (CHAR_LENGTH(TRIM(`nombres`)) BETWEEN 1 AND 40),
    CONSTRAINT `chk_clientes_apellidos`
        CHECK (CHAR_LENGTH(TRIM(`apellidos`)) BETWEEN 1 AND 40),
    CONSTRAINT `chk_clientes_telefono`
        CHECK (`telefono` REGEXP '^[0-9]{10}$'),
    CONSTRAINT `chk_clientes_direccion`
        CHECK (CHAR_LENGTH(TRIM(`direccion`)) BETWEEN 1 AND 80)
) ENGINE=InnoDB
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci
  COMMENT='Clientes de Services Mechanic';

-- MySQL no permite referenciar una columna AUTO_INCREMENT en un CHECK.
-- Este trigger hace cumplir el limite superior sin depender del navegador.
DELIMITER $$

DROP TRIGGER IF EXISTS `trg_clientes_limite_id`$$

CREATE TRIGGER `trg_clientes_limite_id`
AFTER INSERT ON `clientes`
FOR EACH ROW
BEGIN
    IF NEW.`id_cliente` > 9999 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Se agoto el rango de identificadores de clientes (0001-9999)';
    END IF;
END$$

DELIMITER ;

-- Panther obtiene el identificador publico con:
-- LPAD(CAST(id_cliente AS CHAR), 4, '0') AS idCliente
--
-- Las futuras tablas de vehiculos, servicios y facturas deben guardar
-- id_cliente con el mismo tipo y declarar sus claves foraneas asi:
-- FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente)
--     ON UPDATE RESTRICT ON DELETE RESTRICT
-- No se crean ahora porque esas tablas aun no forman parte de esta etapa.
