-- ============================================================================
-- Olimac Riders Store - Taller Mecánico (Framework Panther)
-- Archivo: database/schema_taller.sql
-- Compatibilidad: MariaDB 10.4+ y MySQL 8.0+
-- Motor y Collation: ENGINE=InnoDB | utf8mb4 / utf8mb4_unicode_ci
-- Nota: Sin sintaxis exclusiva de MySQL 8.0 (sin utf8mb4_0900_ai_ci)
--       para garantizar portabilidad total a InfinityFree / AlwaysData.
-- ============================================================================

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET FOREIGN_KEY_CHECKS = 0;

CREATE DATABASE IF NOT EXISTS `taller_mecanico`
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE `taller_mecanico`;

-- ============================================================================
-- 1. MÓDULO CORE / SEGURIDAD PANTHER (j4rol, j4user, person, datosprueba)
-- ============================================================================

CREATE TABLE IF NOT EXISTS `j4rol` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `description` VARCHAR(255) NULL DEFAULT NULL,
    `dateDelete` DATETIME NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_j4rol_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `j4user` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `user` VARCHAR(100) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `keyAPI` VARCHAR(64) NOT NULL,
    `roles` VARCHAR(100) NOT NULL,
    `dateDelete` DATETIME NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_j4user_user` (`user`),
    KEY `idx_j4user_keyapi` (`keyAPI`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `person` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `lastName` VARCHAR(100) NOT NULL,
    `phone` VARCHAR(25) NULL DEFAULT NULL,
    `dateDelete` DATETIME NULL DEFAULT NULL,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `datosprueba` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,
    `correo` VARCHAR(120) NULL DEFAULT NULL,
    `telefono` VARCHAR(25) NULL DEFAULT NULL,
    `edad` INT NULL DEFAULT NULL,
    `dateDelete` DATETIME NULL DEFAULT NULL,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 2. MÓDULO DE NEGOCIO - TALLER MECÁNICO
-- ============================================================================

CREATE TABLE IF NOT EXISTS `clientes` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `cedula` VARCHAR(20) NOT NULL,
    `nombre` VARCHAR(120) NOT NULL,
    `correo` VARCHAR(120) NOT NULL,
    `telefono` VARCHAR(20) NOT NULL,
    `direccion` VARCHAR(180) NULL DEFAULT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `dateDelete` DATETIME NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_clientes_cedula` (`cedula`),
    KEY `idx_clientes_nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `vehiculos` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `placa` VARCHAR(15) NOT NULL,
    `marca` VARCHAR(60) NOT NULL,
    `modelo` VARCHAR(60) NOT NULL,
    `color` VARCHAR(40) NOT NULL,
    `tipo` VARCHAR(40) NOT NULL,
    `cliente_id` INT NULL DEFAULT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `dateDelete` DATETIME NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_vehiculos_placa` (`placa`),
    KEY `idx_vehiculos_cliente` (`cliente_id`),
    CONSTRAINT `fk_vehiculos_cliente`
        FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`)
        ON UPDATE CASCADE
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `empleados` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `cedula` VARCHAR(20) NOT NULL,
    `nombre` VARCHAR(120) NOT NULL,
    `telefono` VARCHAR(20) NOT NULL,
    `correo` VARCHAR(120) NOT NULL,
    `cargo` VARCHAR(60) NOT NULL,
    `salario` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `dateDelete` DATETIME NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_empleados_cedula` (`cedula`),
    KEY `idx_empleados_cargo` (`cargo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `proveedores` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `nit` VARCHAR(25) NOT NULL,
    `nombre` VARCHAR(120) NOT NULL,
    `telefono` VARCHAR(20) NOT NULL,
    `correo` VARCHAR(120) NOT NULL,
    `direccion` VARCHAR(180) NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `dateDelete` DATETIME NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_proveedores_nit` (`nit`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Base tomada de backend/database/repuestos.sql + enlace opcional a proveedores
CREATE TABLE IF NOT EXISTS `repuestos` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `referencia` VARCHAR(20) NOT NULL,
    `descripcion` VARCHAR(150) NOT NULL,
    `marca` VARCHAR(50) NOT NULL,
    `precio` DECIMAL(12,2) NOT NULL,
    `proveedor_id` INT NULL DEFAULT NULL,
    `dateDelete` DATETIME NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `idx_repuestos_referencia` (`referencia`),
    KEY `idx_repuestos_proveedor` (`proveedor_id`),
    CONSTRAINT `fk_repuestos_proveedor`
        FOREIGN KEY (`proveedor_id`) REFERENCES `proveedores` (`id`)
        ON UPDATE CASCADE
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `inventario` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `repuesto_id` INT NOT NULL,
    `referencia` VARCHAR(20) NOT NULL,
    `stock` INT NOT NULL DEFAULT 0,
    `stock_minimo` INT NOT NULL DEFAULT 5,
    `ubicacion` VARCHAR(60) NULL DEFAULT NULL,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `dateDelete` DATETIME NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_inventario_repuesto` (`repuesto_id`),
    UNIQUE KEY `uq_inventario_referencia` (`referencia`),
    CONSTRAINT `fk_inventario_repuesto`
        FOREIGN KEY (`repuesto_id`) REFERENCES `repuestos` (`id`)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ordenes` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `codigo_orden` VARCHAR(20) NOT NULL,
    `vehiculo_id` INT NULL DEFAULT NULL,
    `placa` VARCHAR(15) NOT NULL,
    `cliente_id` INT NULL DEFAULT NULL,
    `empleado_id` INT NULL DEFAULT NULL,
    `horas` DECIMAL(6,2) NOT NULL DEFAULT 1.00,
    `estado` VARCHAR(30) NOT NULL DEFAULT 'Pendiente',
    `observaciones` TEXT NULL,
    `fecha_ingreso` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `fecha_salida` DATETIME NULL DEFAULT NULL,
    `dateDelete` DATETIME NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_ordenes_codigo` (`codigo_orden`),
    KEY `idx_ordenes_vehiculo` (`vehiculo_id`),
    KEY `idx_ordenes_cliente` (`cliente_id`),
    KEY `idx_ordenes_empleado` (`empleado_id`),
    KEY `idx_ordenes_estado` (`estado`),
    CONSTRAINT `fk_ordenes_vehiculo`
        FOREIGN KEY (`vehiculo_id`) REFERENCES `vehiculos` (`id`)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    CONSTRAINT `fk_ordenes_cliente`
        FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    CONSTRAINT `fk_ordenes_empleado`
        FOREIGN KEY (`empleado_id`) REFERENCES `empleados` (`id`)
        ON UPDATE CASCADE
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `orden_repuestos` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `orden_id` INT NOT NULL,
    `repuesto_id` INT NOT NULL,
    `cantidad` INT NOT NULL DEFAULT 1,
    `precio_unitario` DECIMAL(12,2) NOT NULL,
    `dateDelete` DATETIME NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `idx_orden_repuestos_orden` (`orden_id`),
    KEY `idx_orden_repuestos_repuesto` (`repuesto_id`),
    CONSTRAINT `fk_orden_repuestos_orden`
        FOREIGN KEY (`orden_id`) REFERENCES `ordenes` (`id`)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT `fk_orden_repuestos_repuesto`
        FOREIGN KEY (`repuesto_id`) REFERENCES `repuestos` (`id`)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `facturas` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `prefijo` VARCHAR(10) NOT NULL DEFAULT 'SETP',
    `consecutivo` INT NOT NULL,
    `numero_documento` VARCHAR(30) NOT NULL,
    `orden_id` INT NULL DEFAULT NULL,
    `cliente_id` INT NULL DEFAULT NULL,
    `fecha_emision` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `fecha_vencimiento` DATE NOT NULL,
    `forma_pago` VARCHAR(30) NOT NULL DEFAULT 'CONTADO',
    `medio_pago` VARCHAR(30) NOT NULL DEFAULT 'EFECTIVO',
    `subtotal` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    `impuestos` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    `total` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    `estado_dian` VARCHAR(40) NOT NULL DEFAULT 'PENDIENTE',
    `cufe` VARCHAR(128) NULL DEFAULT NULL,
    `observacion` TEXT NULL,
    `dateDelete` DATETIME NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_facturas_numero` (`numero_documento`),
    KEY `idx_facturas_orden` (`orden_id`),
    KEY `idx_facturas_cliente` (`cliente_id`),
    CONSTRAINT `fk_facturas_orden`
        FOREIGN KEY (`orden_id`) REFERENCES `ordenes` (`id`)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    CONSTRAINT `fk_facturas_cliente`
        FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`)
        ON UPDATE CASCADE
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
