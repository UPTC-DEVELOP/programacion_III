-- ============================================================================
-- PANTHER + TALLERMAX  -  Script COMPLETO para una instalación nueva (MySQL/MariaDB)
-- Importar en phpMyAdmin sobre una base de datos VACIA (ej: la que crea InfinityFree / AlwaysData).
-- Equivale a panther.sql + cambios_fase1..3 + cambios_fase4 (TallerMax).
-- ============================================================================
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ---------- Seguridad del framework ----------
CREATE TABLE IF NOT EXISTS `j4rol` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(30) NOT NULL,
  `description` varchar(200) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `j4rol` (`id`, `name`, `description`) VALUES
(1, 'admin', 'Admin'),
(2, 'user', 'User generic');

CREATE TABLE IF NOT EXISTS `j4user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user` varchar(254) NOT NULL,
  `password` varchar(128) NOT NULL,
  `keyAPI` varchar(60) NOT NULL,
  `roles` int(30) NOT NULL,
  `dateDelete` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `j4user` (`user`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Usuario de ejemplo del framework:  admin / 12345   (CAMBIE ESTA CLAVE EN PRODUCCION)
-- Los usuarios que entran por Clarisa se crean solos como "clarisa:<usuario>" (rol 2).
INSERT INTO `j4user` (`id`, `user`, `password`, `keyAPI`, `roles`, `dateDelete`) VALUES
(1, 'admin', '$2y$10$rCdykaN0YQL/H4VJW0RKae69B2QekbrO3Iuj8OxFy/V1syHOmpfmO', '750e8b43e5ed564462c90ef0d382db26', 1, NULL);

-- ---------- Ejemplo del framework (fases 1-3) ----------
CREATE TABLE IF NOT EXISTS `documenttype` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `longName` varchar(100) NOT NULL,
  `shortName` varchar(10) NOT NULL,
  `dateDelete` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `documenttype` (`longName`, `shortName`) VALUES
('Cédula de ciudadanía', 'CC'),
('NIT', 'NIT'),
('Cédula de extranjería', 'CE'),
('Tarjeta de identidad', 'TI'),
('Pasaporte', 'PP');

CREATE TABLE IF NOT EXISTS `person` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(30) NOT NULL,
  `lastName` varchar(30) NOT NULL,
  `phone` varchar(15) NOT NULL,
  `dateDelete` timestamp NULL DEFAULT NULL,
  `documentTypeId` int(11) NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_person_documenttype` FOREIGN KEY (`documentTypeId`) REFERENCES `documenttype` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- TallerMax (fase 4) ----------
CREATE TABLE IF NOT EXISTS `customer` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `documentTypeId` int(11) NULL DEFAULT NULL,
  `document` varchar(20) NOT NULL,
  `name` varchar(100) NOT NULL,
  `phone` varchar(15) NOT NULL,
  `email` varchar(100) NOT NULL,
  `address` varchar(150) NOT NULL,
  `dateDelete` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_customer_document` (`document`),
  CONSTRAINT `fk_customer_documenttype` FOREIGN KEY (`documentTypeId`) REFERENCES `documenttype` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `vehicle` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `plate` varchar(6) NOT NULL,
  `model` smallint(6) NOT NULL,
  `color` varchar(30) NOT NULL,
  `customerId` int(11) NOT NULL,
  `entryDate` date NOT NULL,
  `entryTime` time NOT NULL,
  `dateDelete` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_vehicle_plate` (`plate`),
  CONSTRAINT `fk_vehicle_customer` FOREIGN KEY (`customerId`) REFERENCES `customer` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `employee` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `document` varchar(10) NOT NULL,
  `firstName` varchar(60) NOT NULL,
  `lastName` varchar(60) NOT NULL,
  `position` varchar(40) NOT NULL,
  `dateDelete` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_employee_document` (`document`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Historial de facturas emitidas contra Clarisa
CREATE TABLE IF NOT EXISTS `invoice` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `customerId` int(11) NULL DEFAULT NULL,
  `customerName` varchar(150) NOT NULL,
  `customerDocument` varchar(20) NOT NULL,
  `issueDate` date NOT NULL,
  `total` decimal(15,2) NOT NULL,
  `status` varchar(10) NOT NULL,            -- EMITIDA | ERROR | PENDIENTE
  `clarisaNumber` varchar(60) NULL DEFAULT NULL,
  `items` mediumtext NULL,                  -- JSON con las líneas de la factura
  `requestJson` mediumtext NULL,            -- lo que se envió a Clarisa
  `responseJson` mediumtext NULL,           -- lo que respondió Clarisa
  `createdBy` varchar(254) NULL DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `dateDelete` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_invoice_customer` FOREIGN KEY (`customerId`) REFERENCES `customer` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;
