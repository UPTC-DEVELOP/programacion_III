--
-- Base de datos: `panther`
-- Caso de Estudio: Taller Mecánico (seguridad + órdenes + facturas)
--

-- Ingreso vía restful
-- Authorization: 750e8b43e5ed564462c90ef0d382db26
-- {
--  "user":"admin",
--  "password":"12345"
-- }

-- --------------------------------------------------------
-- Seguridad (j4rol / j4user / person)
-- --------------------------------------------------------

CREATE TABLE `j4rol` (
  `id` int(11) NOT NULL,
  `name` varchar(30) NOT NULL,
  `description` varchar(200) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

INSERT INTO `j4rol` (`id`, `name`, `description`) VALUES
(1, 'admin', 'Admin'),
(2, 'user', 'User generic');

CREATE TABLE `j4user` (
  `id` int(11) NOT NULL,
  `user` varchar(254) NOT NULL,
  `password` varchar(128) NOT NULL,
  `keyAPI` varchar(60) NOT NULL,
  `roles` int(30) NOT NULL,
  `dateDelete` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

INSERT INTO `j4user` (`id`, `user`, `password`, `keyAPI`, `roles`, `dateDelete`) VALUES
(1, 'admin', '$2y$10$rCdykaN0YQL/H4VJW0RKae69B2QekbrO3Iuj8OxFy/V1syHOmpfmO', '750e8b43e5ed564462c90ef0d382db26', 1, NULL);

ALTER TABLE `j4rol`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `j4user`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `j4user` (`user`) USING BTREE;

ALTER TABLE `j4user`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

CREATE TABLE `person` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(30) NOT NULL,
  `lastName` VARCHAR(30) NOT NULL,
  `phone` VARCHAR(15) NOT NULL,
  `documento` VARCHAR(15) NOT NULL,
  `correo` VARCHAR(100) NULL,
  `direccion` VARCHAR(100) NULL,
  `tipo` VARCHAR(20) DEFAULT 'Particular',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_person_documento` (`documento`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO person(name, lastName, phone, documento, correo, direccion, tipo)
VALUES ('Nicolás','Pinzón','3419478','10000001','nicolas@email.com','Tunja','Particular');

CREATE TABLE IF NOT EXISTS `vehiculo` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `placa` VARCHAR(10) NOT NULL,
  `marca` VARCHAR(30) NOT NULL,
  `modelo` VARCHAR(30) NOT NULL,
  `anio` VARCHAR(4) NOT NULL,
  `color` VARCHAR(20) NOT NULL,
  `propietario` VARCHAR(100) NOT NULL,
  UNIQUE KEY `uk_vehiculo_placa` (`placa`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `empleado` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombres` VARCHAR(50) NOT NULL,
  `apellidos` VARCHAR(50) NOT NULL,
  `documento` VARCHAR(15) NOT NULL,
  `rol` VARCHAR(30) NOT NULL,
  `telefono` VARCHAR(15) NOT NULL,
  `correo` VARCHAR(100) NOT NULL,
  UNIQUE KEY `uk_empleado_documento` (`documento`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Órdenes de servicio del taller
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `ordenes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `numero_orden` VARCHAR(20) NOT NULL,
  `cliente_documento` VARCHAR(20) NOT NULL,
  `cliente_nombre` VARCHAR(120) NOT NULL,
  `cliente_telefono` VARCHAR(20) NOT NULL,
  `cliente_direccion` VARCHAR(150) NOT NULL,
  `cliente_email` VARCHAR(120) NULL,
  `vehiculo_placa` VARCHAR(10) NOT NULL,
  `vehiculo_modelo` VARCHAR(80) NOT NULL,
  `vehiculo_color` VARCHAR(40) NOT NULL,
  `fecha_ingreso` DATETIME NOT NULL,
  `empleado_documento` VARCHAR(20) NOT NULL,
  `empleado_nombre` VARCHAR(120) NOT NULL,
  `horas_empleadas` DECIMAL(6,2) NOT NULL,
  `valor_hora` DECIMAL(12,2) NOT NULL DEFAULT 35000,
  `utilidad_estimada` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `repuestos_json` LONGTEXT NOT NULL,
  `subtotal` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `iva` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `total` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `estado` VARCHAR(30) NOT NULL DEFAULT 'ABIERTA',
  `fecha_creacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_ordenes_numero` (`numero_orden`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Facturas (flujo: 1° guardar en Panther → 2° Clarisa/DIAN)
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `facturas` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `orden_id` INT NULL,
  `nit` VARCHAR(30) NOT NULL,
  `numero_resolucion` VARCHAR(30) NOT NULL,
  `prefijo` VARCHAR(10) DEFAULT 'SETP',
  `consecutivo` VARCHAR(20) NOT NULL,
  `fecha_vencimiento` DATE NOT NULL,
  `forma_pago` VARCHAR(5) NOT NULL,
  `medio_pago` VARCHAR(5) NOT NULL,
  `cliente_tipo_id` VARCHAR(10) NOT NULL,
  `cliente_naturaleza` VARCHAR(20) NOT NULL,
  `cliente_documento` VARCHAR(30) NOT NULL,
  `cliente_nombre` VARCHAR(255) NOT NULL,
  `cliente_email` VARCHAR(150) NOT NULL,
  `cliente_telefono` VARCHAR(30) NOT NULL,
  `cliente_direccion` VARCHAR(150) NOT NULL,
  `cliente_municipio` VARCHAR(10) NOT NULL,
  `resp_fiscales` VARCHAR(10) DEFAULT 'NOA',
  `resp_tributarias` VARCHAR(10) DEFAULT 'NOA',
  `vehiculo_placa` VARCHAR(10) NOT NULL,
  `vehiculo_modelo` VARCHAR(80) NOT NULL,
  `vehiculo_color` VARCHAR(40) NOT NULL,
  `vehiculo_ingreso` VARCHAR(30) NOT NULL,
  `mecanico` VARCHAR(120) NOT NULL,
  `horas` DECIMAL(6,2) NOT NULL,
  `valor_hora` DECIMAL(12,2) NOT NULL,
  `utilidad` DECIMAL(12,2) NOT NULL,
  `items_json` LONGTEXT NOT NULL,
  `subtotal` DECIMAL(15,2) NOT NULL,
  `descuentos` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `iva` DECIMAL(15,2) NOT NULL,
  `total` DECIMAL(15,2) NOT NULL,
  `cufe` VARCHAR(255) NULL DEFAULT '',
  `estado_dian` VARCHAR(50) NOT NULL DEFAULT 'PENDIENTE_ENVIO',
  `payload_clarisa` LONGTEXT NULL,
  `respuesta_clarisa` LONGTEXT NULL,
  `fecha_creacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_facturas_orden` (`orden_id`),
  CONSTRAINT `fk_facturas_orden`
    FOREIGN KEY (`orden_id`) REFERENCES `ordenes`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Datos de prueba: 2 órdenes (validar GET /ordenes)
-- --------------------------------------------------------

INSERT INTO `ordenes` (
  `numero_orden`,
  `cliente_documento`, `cliente_nombre`, `cliente_telefono`, `cliente_direccion`, `cliente_email`,
  `vehiculo_placa`, `vehiculo_modelo`, `vehiculo_color`, `fecha_ingreso`,
  `empleado_documento`, `empleado_nombre`, `horas_empleadas`, `valor_hora`, `utilidad_estimada`,
  `repuestos_json`, `subtotal`, `iva`, `total`, `estado`
) VALUES
(
  'ORD-001',
  '79123456', 'Carlos Rodríguez', '3201234567', 'Cra 7 # 45-10', 'carlos.rodriguez@email.com',
  'ABC123', 'Toyota Corolla', 'Gris', '2026-03-12 08:30:00',
  '79123456', 'Juan Pérez', 4.00, 35000.00, 28000.00,
  '[{"referencia":"FR-220","descripcion":"Pastillas de freno","marca":"Bosch","precio":85000,"cantidad":1},{"referencia":"AC-110","descripcion":"Filtro de aceite","marca":"Mann","precio":32000,"cantidad":1}]',
  257000.00, 48830.00, 305830.00, 'ABIERTA'
),
(
  'ORD-002',
  '52987654', 'María López', '3159876543', 'Cl 80 # 12-30', 'maria.lopez@email.com',
  'XYZ789', 'Mazda 3', 'Rojo', '2026-03-18 14:00:00',
  '11223344', 'Carlos Gómez', 2.50, 35000.00, 17500.00,
  '[{"referencia":"LL-015","descripcion":"Bujías","marca":"NGK","precio":48000,"cantidad":1}]',
  135500.00, 25745.00, 161245.00, 'ABIERTA'
);
