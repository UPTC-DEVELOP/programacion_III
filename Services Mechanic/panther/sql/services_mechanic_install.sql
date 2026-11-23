-- Services Mechanic - Instalacion unificada de Panther y Clientes
-- Script preparado para ejecucion posterior desde phpMyAdmin.
-- No contiene usuarios, hashes, claves API ni tokens.
-- No selecciona, elimina ni modifica la base original panther.

CREATE DATABASE IF NOT EXISTS `services_mechanic`
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE `services_mechanic`;

-- Tabla requerida por Roles.php y por la relacion j4user.roles.
CREATE TABLE IF NOT EXISTS `j4rol` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `description` VARCHAR(255) NOT NULL,
    `dateDelete` DATETIME NULL DEFAULT NULL,
    `dateCreate` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_j4rol_name` (`name`),
    CONSTRAINT `chk_j4rol_name`
        CHECK (CHAR_LENGTH(TRIM(`name`)) BETWEEN 1 AND 100),
    CONSTRAINT `chk_j4rol_description`
        CHECK (CHAR_LENGTH(TRIM(`description`)) BETWEEN 1 AND 255)
) ENGINE=InnoDB
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci
  COMMENT='Roles de autenticacion de Panther';

-- Tabla requerida por Users.php y UserAction.php.
CREATE TABLE IF NOT EXISTS `j4user` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user` VARCHAR(100) NOT NULL,
    `password` VARCHAR(255) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    `keyAPI` VARCHAR(255) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    `roles` INT UNSIGNED NOT NULL,
    `dateDelete` DATETIME NULL DEFAULT NULL,
    `dateCreate` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_j4user_user` (`user`),
    UNIQUE KEY `uq_j4user_key_api` (`keyAPI`),
    KEY `idx_j4user_roles` (`roles`),
    CONSTRAINT `fk_j4user_roles`
        FOREIGN KEY (`roles`) REFERENCES `j4rol` (`id`)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT `chk_j4user_user`
        CHECK (CHAR_LENGTH(TRIM(`user`)) BETWEEN 1 AND 100),
    CONSTRAINT `chk_j4user_password`
        CHECK (CHAR_LENGTH(`password`) BETWEEN 60 AND 255),
    CONSTRAINT `chk_j4user_key_api`
        CHECK (CHAR_LENGTH(`keyAPI`) BETWEEN 32 AND 255)
) ENGINE=InnoDB
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci
  COMMENT='Usuarios y tokens de autenticacion de Panther';

-- Tabla de ejemplo original requerida por Persons.php.
CREATE TABLE IF NOT EXISTS `person` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `lastName` VARCHAR(100) NOT NULL,
    `phone` VARCHAR(20) NOT NULL,
    `dateDelete` DATETIME NULL DEFAULT NULL,
    `dateCreate` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT `chk_person_name`
        CHECK (CHAR_LENGTH(TRIM(`name`)) BETWEEN 1 AND 100),
    CONSTRAINT `chk_person_last_name`
        CHECK (CHAR_LENGTH(TRIM(`lastName`)) BETWEEN 1 AND 100),
    CONSTRAINT `chk_person_phone`
        CHECK (CHAR_LENGTH(TRIM(`phone`)) BETWEEN 1 AND 20)
) ENGINE=InnoDB
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci
  COMMENT='Tabla de ejemplo del recurso Persons de Panther';

-- Tabla del modulo Clientes de Services Mechanic.
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

-- El limite del AUTO_INCREMENT no puede expresarse como CHECK en MySQL.
-- El trigger aborta cualquier alta que exceda el identificador publico 9999.
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

-- No se insertan datos iniciales deliberadamente.
-- El rol y el administrador de desarrollo se crean despues de generar
-- localmente un password_hash() y un token aleatorio. Consulte README.md.
