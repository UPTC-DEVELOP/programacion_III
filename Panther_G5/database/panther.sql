--
-- Base de datos: `panther`
-- Script único del taller (seguridad + clientes/vehículos/empleados + órdenes + facturas)
--
-- Importar este archivo en phpMyAdmin / MariaDB sobre la BD `panther`.
--
-- Login REST:
--   Authorization: 750e8b43e5ed564462c90ef0d382db26
--   { "user": "admin", "password": "12345" }
--

-- --------------------------------------------------------
-- 1) Seguridad (j4rol / j4user)
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `j4rol` (
  `id` int(11) NOT NULL,
  `name` varchar(30) NOT NULL,
  `description` varchar(200) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

INSERT INTO `j4rol` (`id`, `name`, `description`) VALUES
(1, 'admin', 'Admin'),
(2, 'user', 'User generic'),
(3, 'recepcionista', 'Recepcionista'),
(4, 'mecanico', 'Mecánico'),
(5, 'almacenista', 'Almacenista'),
(6, 'supervisor', 'Supervisor de taller'),
(7, 'cajero', 'Cajero / facturación'),
(8, 'asesor', 'Asesor de servicio'),
(9, 'tecnico', 'Técnico especialista'),
(10, 'auditor', 'Auditor interno')
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `description` = VALUES(`description`);

CREATE TABLE IF NOT EXISTS `j4user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user` varchar(254) NOT NULL,
  `password` varchar(128) NOT NULL,
  `keyAPI` varchar(60) NOT NULL,
  `roles` int(30) NOT NULL,
  `dateDelete` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `j4user` (`user`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=latin1 AUTO_INCREMENT=17;

-- password de todos: 12345 (mismo hash bcrypt del admin)
INSERT INTO `j4user` (`id`, `user`, `password`, `keyAPI`, `roles`, `dateDelete`) VALUES
(1, 'admin', '$2y$10$rCdykaN0YQL/H4VJW0RKae69B2QekbrO3Iuj8OxFy/V1syHOmpfmO', '750e8b43e5ed564462c90ef0d382db26', 1, NULL),
(2, 'usuario', '$2y$10$rCdykaN0YQL/H4VJW0RKae69B2QekbrO3Iuj8OxFy/V1syHOmpfmO', 'a1b2c3d4e5f6789012345678abcdef01', 2, NULL),
(3, 'recepcion', '$2y$10$rCdykaN0YQL/H4VJW0RKae69B2QekbrO3Iuj8OxFy/V1syHOmpfmO', 'b2c3d4e5f6789012345678abcdef0123', 3, NULL),
(4, 'mecanico1', '$2y$10$rCdykaN0YQL/H4VJW0RKae69B2QekbrO3Iuj8OxFy/V1syHOmpfmO', 'c3d4e5f6789012345678abcdef012345', 4, NULL),
(5, 'almacen', '$2y$10$rCdykaN0YQL/H4VJW0RKae69B2QekbrO3Iuj8OxFy/V1syHOmpfmO', 'd4e5f6789012345678abcdef01234567', 5, NULL),
(6, 'supervisor1', '$2y$10$rCdykaN0YQL/H4VJW0RKae69B2QekbrO3Iuj8OxFy/V1syHOmpfmO', 'e5f6789012345678abcdef0123456789', 6, NULL),
(7, 'caja', '$2y$10$rCdykaN0YQL/H4VJW0RKae69B2QekbrO3Iuj8OxFy/V1syHOmpfmO', 'f6789012345678abcdef0123456789ab', 7, NULL),
(8, 'asesor1', '$2y$10$rCdykaN0YQL/H4VJW0RKae69B2QekbrO3Iuj8OxFy/V1syHOmpfmO', '789012345678abcdef0123456789abcd', 8, NULL),
(9, 'tecnico1', '$2y$10$rCdykaN0YQL/H4VJW0RKae69B2QekbrO3Iuj8OxFy/V1syHOmpfmO', '9012345678abcdef0123456789abcdef', 9, NULL),
(10, 'auditor1', '$2y$10$rCdykaN0YQL/H4VJW0RKae69B2QekbrO3Iuj8OxFy/V1syHOmpfmO', '0123456789abcdef0123456789abcdef', 10, NULL)
ON DUPLICATE KEY UPDATE
  `password` = VALUES(`password`),
  `keyAPI` = VALUES(`keyAPI`),
  `roles` = VALUES(`roles`);

-- --------------------------------------------------------
-- 2) Clientes, vehículos, empleados (Kevin → REST persons/vehiculos/empleados)
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `person` (
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

INSERT INTO person(name, lastName, phone, documento, correo, direccion, tipo)
VALUES
('Nicolás', 'Pinzón', '3419478', '10000001', 'nicolas@email.com', 'Tunja', 'Particular'),
('Carlos', 'Rodríguez', '3201234567', '79123456', 'carlos.rodriguez@email.com', 'Cra 7 # 45-10', 'Particular'),
('María', 'López', '3159876543', '52987654', 'maria.lopez@email.com', 'Cl 80 # 12-30', 'Particular'),
('Andrés', 'Martínez', '3105556677', '80111222', 'andres.martinez@email.com', 'Av. El Dorado # 68-45', 'Particular'),
('Laura', 'García', '3002223344', '52999111', 'laura.garcia@email.com', 'Cl 100 # 19-20', 'Particular'),
('Pedro', 'Sánchez', '3118889900', '79222333', 'pedro.sanchez@email.com', 'Cra 15 # 93-07', 'Empresa'),
('Sofía', 'Hernández', '3124445566', '52333444', 'sofia.hernandez@email.com', 'Cl 53 # 25-10', 'Particular'),
('Diego', 'Ramírez', '3136667788', '79444555', 'diego.ramirez@email.com', 'Cra 50 # 80-12', 'Particular'),
('Valentina', 'Torres', '3147778899', '52555666', 'valentina.torres@email.com', 'Cl 26 # 4-40', 'Empresa'),
('Julián', 'Castro', '3151112233', '79666777', 'julian.castro@email.com', 'Av. Boyacá # 64-51', 'Particular')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  lastName = VALUES(lastName),
  phone = VALUES(phone);

INSERT INTO vehiculo(placa, marca, modelo, anio, color, propietario)
VALUES
('ABC123', 'Toyota', 'Corolla', '2019', 'Gris', 'Carlos Rodríguez'),
('XYZ789', 'Mazda', '3', '2021', 'Rojo', 'María López'),
('DEF456', 'Chevrolet', 'Spark', '2018', 'Blanco', 'Andrés Martínez'),
('GHI012', 'Renault', 'Logan', '2020', 'Negro', 'Laura García'),
('JKL345', 'Kia', 'Rio', '2022', 'Azul', 'Pedro Sánchez'),
('MNO678', 'Hyundai', 'Accent', '2017', 'Plateado', 'Sofía Hernández'),
('PQR901', 'Nissan', 'Versa', '2023', 'Gris', 'Diego Ramírez'),
('STU234', 'Volkswagen', 'Gol', '2016', 'Rojo', 'Valentina Torres'),
('VWX567', 'Ford', 'Fiesta', '2015', 'Blanco', 'Julián Castro'),
('YZA890', 'Suzuki', 'Swift', '2024', 'Verde', 'Nicolás Pinzón')
ON DUPLICATE KEY UPDATE
  marca = VALUES(marca),
  modelo = VALUES(modelo);

INSERT INTO empleado(nombres, apellidos, documento, rol, telefono, correo)
VALUES
('Juan', 'Pérez', '79123456', '4', '3001112233', 'juan.perez@autotech.com'),
('Carlos', 'Gómez', '11223344', '4', '3004445566', 'carlos.gomez@autotech.com'),
('Ana', 'Ruiz', '99887766', '3', '3007778899', 'ana.ruiz@autotech.com'),
('Luis', 'Morales', '10020030', '4', '3012223344', 'luis.morales@autotech.com'),
('Paula', 'Vargas', '10030040', '5', '3023334455', 'paula.vargas@autotech.com'),
('Miguel', 'Ortiz', '10040050', '6', '3034445566', 'miguel.ortiz@autotech.com'),
('Carmen', 'Díaz', '10050060', '7', '3045556677', 'carmen.diaz@autotech.com'),
('Felipe', 'Rojas', '10060070', '8', '3056667788', 'felipe.rojas@autotech.com'),
('Elena', 'Navarro', '10070080', '9', '3067778899', 'elena.navarro@autotech.com'),
('Ricardo', 'Mendoza', '10080090', '4', '3078889900', 'ricardo.mendoza@autotech.com')
ON DUPLICATE KEY UPDATE
  nombres = VALUES(nombres),
  apellidos = VALUES(apellidos),
  rol = VALUES(rol);

-- --------------------------------------------------------
-- 3) Órdenes de servicio (Camilo → REST ordenes)
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
-- 4) Facturas (Camilo → REST facturas; flujo Panther → Clarisa/DIAN)
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

-- Datos de prueba: 10 órdenes
INSERT INTO `ordenes` (
  `id`,
  `numero_orden`,
  `cliente_documento`, `cliente_nombre`, `cliente_telefono`, `cliente_direccion`, `cliente_email`,
  `vehiculo_placa`, `vehiculo_modelo`, `vehiculo_color`, `fecha_ingreso`,
  `empleado_documento`, `empleado_nombre`, `horas_empleadas`, `valor_hora`, `utilidad_estimada`,
  `repuestos_json`, `subtotal`, `iva`, `total`, `estado`
) VALUES
(1, 'ORD-001', '79123456', 'Carlos Rodríguez', '3201234567', 'Cra 7 # 45-10', 'carlos.rodriguez@email.com', 'ABC123', 'Toyota Corolla', 'Gris', '2026-03-12 08:30:00', '79123456', 'Juan Pérez', 4.00, 35000.00, 28000.00, '[{"referencia":"FR-220","descripcion":"Pastillas de freno","marca":"Bosch","precio":85000,"cantidad":1},{"referencia":"AC-110","descripcion":"Filtro de aceite","marca":"Mann","precio":32000,"cantidad":1}]', 257000.00, 48830.00, 305830.00, 'ABIERTA'),
(2, 'ORD-002', '52987654', 'María López', '3159876543', 'Cl 80 # 12-30', 'maria.lopez@email.com', 'XYZ789', 'Mazda 3', 'Rojo', '2026-03-18 14:00:00', '11223344', 'Carlos Gómez', 2.50, 35000.00, 17500.00, '[{"referencia":"LL-015","descripcion":"Bujías","marca":"NGK","precio":48000,"cantidad":1}]', 135500.00, 25745.00, 161245.00, 'ABIERTA'),
(3, 'ORD-003', '80111222', 'Andrés Martínez', '3105556677', 'Av. El Dorado # 68-45', 'andres.martinez@email.com', 'DEF456', 'Chevrolet Spark', 'Blanco', '2026-03-20 09:15:00', '10020030', 'Luis Morales', 3.00, 35000.00, 21000.00, '[{"referencia":"AC-110","descripcion":"Filtro de aceite","marca":"Mann","precio":32000,"cantidad":1}]', 137000.00, 26030.00, 163030.00, 'EN_PROCESO'),
(4, 'ORD-004', '52999111', 'Laura García', '3002223344', 'Cl 100 # 19-20', 'laura.garcia@email.com', 'GHI012', 'Renault Logan', 'Negro', '2026-03-21 10:00:00', '79123456', 'Juan Pérez', 5.00, 35000.00, 35000.00, '[{"referencia":"FR-220","descripcion":"Pastillas de freno","marca":"Bosch","precio":85000,"cantidad":2}]', 345000.00, 65550.00, 410550.00, 'ABIERTA'),
(5, 'ORD-005', '79222333', 'Pedro Sánchez', '3118889900', 'Cra 15 # 93-07', 'pedro.sanchez@email.com', 'JKL345', 'Kia Rio', 'Azul', '2026-03-22 11:30:00', '11223344', 'Carlos Gómez', 1.50, 35000.00, 10500.00, '[{"referencia":"LL-015","descripcion":"Bujías","marca":"NGK","precio":48000,"cantidad":2}]', 148500.00, 28215.00, 176715.00, 'CERRADA'),
(6, 'ORD-006', '52333444', 'Sofía Hernández', '3124445566', 'Cl 53 # 25-10', 'sofia.hernandez@email.com', 'MNO678', 'Hyundai Accent', 'Plateado', '2026-03-23 08:00:00', '10020030', 'Luis Morales', 6.00, 35000.00, 42000.00, '[{"referencia":"AM-300","descripcion":"Amortiguador delantero","marca":"Monroe","precio":180000,"cantidad":1}]', 432000.00, 82080.00, 514080.00, 'EN_PROCESO'),
(7, 'ORD-007', '79444555', 'Diego Ramírez', '3136667788', 'Cra 50 # 80-12', 'diego.ramirez@email.com', 'PQR901', 'Nissan Versa', 'Gris', '2026-03-24 13:45:00', '10080090', 'Ricardo Mendoza', 2.00, 35000.00, 14000.00, '[{"referencia":"BT-050","descripcion":"Batería 12V","marca":"Mac","precio":320000,"cantidad":1}]', 390000.00, 74100.00, 464100.00, 'ABIERTA'),
(8, 'ORD-008', '52555666', 'Valentina Torres', '3147778899', 'Cl 26 # 4-40', 'valentina.torres@email.com', 'STU234', 'Volkswagen Gol', 'Rojo', '2026-03-25 15:20:00', '79123456', 'Juan Pérez', 3.50, 35000.00, 24500.00, '[{"referencia":"CL-080","descripcion":"Kit de clutch","marca":"Luk","precio":450000,"cantidad":1}]', 572500.00, 108775.00, 681275.00, 'FACTURADA'),
(9, 'ORD-009', '79666777', 'Julián Castro', '3151112233', 'Av. Boyacá # 64-51', 'julian.castro@email.com', 'VWX567', 'Ford Fiesta', 'Blanco', '2026-03-26 07:50:00', '11223344', 'Carlos Gómez', 4.50, 35000.00, 31500.00, '[{"referencia":"RD-120","descripcion":"Radiador","marca":"Valeo","precio":280000,"cantidad":1}]', 437500.00, 83125.00, 520625.00, 'ABIERTA'),
(10, 'ORD-010', '10000001', 'Nicolás Pinzón', '3419478', 'Tunja', 'nicolas@email.com', 'YZA890', 'Suzuki Swift', 'Verde', '2026-03-27 16:10:00', '10080090', 'Ricardo Mendoza', 2.00, 35000.00, 14000.00, '[{"referencia":"AC-110","descripcion":"Filtro de aceite","marca":"Mann","precio":32000,"cantidad":1},{"referencia":"LL-015","descripcion":"Bujías","marca":"NGK","precio":48000,"cantidad":1}]', 150000.00, 28500.00, 178500.00, 'ABIERTA')
ON DUPLICATE KEY UPDATE
  `estado` = VALUES(`estado`),
  `total` = VALUES(`total`);

-- Datos de prueba: 10 facturas (vinculadas a órdenes 1..10)
INSERT INTO `facturas` (
  `orden_id`, `nit`, `numero_resolucion`, `prefijo`, `consecutivo`, `fecha_vencimiento`,
  `forma_pago`, `medio_pago`, `cliente_tipo_id`, `cliente_naturaleza`,
  `cliente_documento`, `cliente_nombre`, `cliente_email`, `cliente_telefono`, `cliente_direccion`, `cliente_municipio`,
  `vehiculo_placa`, `vehiculo_modelo`, `vehiculo_color`, `vehiculo_ingreso`,
  `mecanico`, `horas`, `valor_hora`, `utilidad`, `items_json`,
  `subtotal`, `descuentos`, `iva`, `total`, `estado_dian`
) VALUES
(1, '901234567', '18760000001', 'SETP', '1', '2026-04-12', '1', '10', '13', '2', '79123456', 'Carlos Rodríguez', 'carlos.rodriguez@email.com', '3201234567', 'Cra 7 # 45-10', '11001', 'ABC123', 'Toyota Corolla', 'Gris', '2026-03-12', 'Juan Pérez', 4.00, 35000.00, 28000.00, '[{"referencia":"FR-220","descripcion":"Pastillas de freno","cantidad":1,"precio":85000}]', 257000.00, 0.00, 48830.00, 305830.00, 'PENDIENTE_ENVIO'),
(2, '901234567', '18760000001', 'SETP', '2', '2026-04-18', '1', '10', '13', '2', '52987654', 'María López', 'maria.lopez@email.com', '3159876543', 'Cl 80 # 12-30', '11001', 'XYZ789', 'Mazda 3', 'Rojo', '2026-03-18', 'Carlos Gómez', 2.50, 35000.00, 17500.00, '[{"referencia":"LL-015","descripcion":"Bujías","cantidad":1,"precio":48000}]', 135500.00, 0.00, 25745.00, 161245.00, 'PENDIENTE_ENVIO'),
(3, '901234567', '18760000001', 'SETP', '3', '2026-04-20', '2', '48', '13', '2', '80111222', 'Andrés Martínez', 'andres.martinez@email.com', '3105556677', 'Av. El Dorado # 68-45', '11001', 'DEF456', 'Chevrolet Spark', 'Blanco', '2026-03-20', 'Luis Morales', 3.00, 35000.00, 21000.00, '[{"referencia":"AC-110","descripcion":"Filtro de aceite","cantidad":1,"precio":32000}]', 137000.00, 0.00, 26030.00, 163030.00, 'ACEPTADO'),
(4, '901234567', '18760000001', 'SETP', '4', '2026-04-21', '1', '10', '13', '2', '52999111', 'Laura García', 'laura.garcia@email.com', '3002223344', 'Cl 100 # 19-20', '11001', 'GHI012', 'Renault Logan', 'Negro', '2026-03-21', 'Juan Pérez', 5.00, 35000.00, 35000.00, '[{"referencia":"FR-220","descripcion":"Pastillas de freno","cantidad":2,"precio":85000}]', 345000.00, 0.00, 65550.00, 410550.00, 'PENDIENTE_ENVIO'),
(5, '901234567', '18760000001', 'SETP', '5', '2026-04-22', '1', '10', '13', '2', '79222333', 'Pedro Sánchez', 'pedro.sanchez@email.com', '3118889900', 'Cra 15 # 93-07', '11001', 'JKL345', 'Kia Rio', 'Azul', '2026-03-22', 'Carlos Gómez', 1.50, 35000.00, 10500.00, '[{"referencia":"LL-015","descripcion":"Bujías","cantidad":2,"precio":48000}]', 148500.00, 5000.00, 28215.00, 171715.00, 'ACEPTADO'),
(6, '901234567', '18760000001', 'SETP', '6', '2026-04-23', '2', '48', '13', '2', '52333444', 'Sofía Hernández', 'sofia.hernandez@email.com', '3124445566', 'Cl 53 # 25-10', '11001', 'MNO678', 'Hyundai Accent', 'Plateado', '2026-03-23', 'Luis Morales', 6.00, 35000.00, 42000.00, '[{"referencia":"AM-300","descripcion":"Amortiguador delantero","cantidad":1,"precio":180000}]', 432000.00, 0.00, 82080.00, 514080.00, 'PENDIENTE_ENVIO'),
(7, '901234567', '18760000001', 'SETP', '7', '2026-04-24', '1', '10', '13', '2', '79444555', 'Diego Ramírez', 'diego.ramirez@email.com', '3136667788', 'Cra 50 # 80-12', '11001', 'PQR901', 'Nissan Versa', 'Gris', '2026-03-24', 'Ricardo Mendoza', 2.00, 35000.00, 14000.00, '[{"referencia":"BT-050","descripcion":"Batería 12V","cantidad":1,"precio":320000}]', 390000.00, 0.00, 74100.00, 464100.00, 'RECHAZADO'),
(8, '901234567', '18760000001', 'SETP', '8', '2026-04-25', '1', '10', '13', '2', '52555666', 'Valentina Torres', 'valentina.torres@email.com', '3147778899', 'Cl 26 # 4-40', '11001', 'STU234', 'Volkswagen Gol', 'Rojo', '2026-03-25', 'Juan Pérez', 3.50, 35000.00, 24500.00, '[{"referencia":"CL-080","descripcion":"Kit de clutch","cantidad":1,"precio":450000}]', 572500.00, 0.00, 108775.00, 681275.00, 'ACEPTADO'),
(9, '901234567', '18760000001', 'SETP', '9', '2026-04-26', '2', '48', '13', '2', '79666777', 'Julián Castro', 'julian.castro@email.com', '3151112233', 'Av. Boyacá # 64-51', '11001', 'VWX567', 'Ford Fiesta', 'Blanco', '2026-03-26', 'Carlos Gómez', 4.50, 35000.00, 31500.00, '[{"referencia":"RD-120","descripcion":"Radiador","cantidad":1,"precio":280000}]', 437500.00, 0.00, 83125.00, 520625.00, 'PENDIENTE_ENVIO'),
(10, '901234567', '18760000001', 'SETP', '10', '2026-04-27', '1', '10', '13', '2', '10000001', 'Nicolás Pinzón', 'nicolas@email.com', '3419478', 'Tunja', '15001', 'YZA890', 'Suzuki Swift', 'Verde', '2026-03-27', 'Ricardo Mendoza', 2.00, 35000.00, 14000.00, '[{"referencia":"AC-110","descripcion":"Filtro de aceite","cantidad":1,"precio":32000},{"referencia":"LL-015","descripcion":"Bujías","cantidad":1,"precio":48000}]', 150000.00, 0.00, 28500.00, 178500.00, 'PENDIENTE_ENVIO');

-- --------------------------------------------------------
-- 5) Proveedores y repuestos (Estefanía → REST proveedores/repuestos)
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `proveedor` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nit` VARCHAR(20) NOT NULL,
  `razon_social` VARCHAR(120) NOT NULL,
  `contacto` VARCHAR(100) NOT NULL,
  `telefono` VARCHAR(20) NOT NULL,
  `correo` VARCHAR(100) NOT NULL,
  `direccion` VARCHAR(150) NOT NULL,
  UNIQUE KEY `uk_proveedor_nit` (`nit`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `repuesto` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `referencia` VARCHAR(40) NOT NULL,
  `nombre` VARCHAR(120) NOT NULL,
  `marca` VARCHAR(60) NOT NULL,
  `precio_unitario` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `stock` INT NOT NULL DEFAULT 0,
  `id_proveedor` INT NULL,
  UNIQUE KEY `uk_repuesto_referencia` (`referencia`),
  KEY `idx_repuesto_proveedor` (`id_proveedor`),
  CONSTRAINT `fk_repuesto_proveedor`
    FOREIGN KEY (`id_proveedor`) REFERENCES `proveedor`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO proveedor(id, nit, razon_social, contacto, telefono, correo, direccion)
VALUES
(1, '900123456-1', 'Repuestos Andinos SAS', 'Luis Torres', '6015551212', 'ventas@repuestosandinos.com', 'Av. Caracas # 45-10'),
(2, '800987654-2', 'AutoPartes Boyacá', 'Diana Gómez', '6087443322', 'contacto@autopartesboyaca.com', 'Cra 10 # 12-34, Tunja'),
(3, '900111222-3', 'Frenos del Centro', 'Mario Peña', '6017001122', 'ventas@frenoscentro.com', 'Cl 13 # 22-15'),
(4, '900333444-4', 'Lubricantes del Norte', 'Sandra Melo', '6018002233', 'info@lubrinorte.com', 'Autopista Norte # 120-40'),
(5, '900555666-5', 'Distribuidora MotorMax', 'Jorge Silva', '6019003344', 'pedidos@motormax.com', 'Cra 68 # 25-80'),
(6, '900777888-6', 'Repuestos Express', 'Camila Ríos', '6021004455', 'hola@repuestosexpress.com', 'Cl 72 # 10-20'),
(7, '900999000-7', 'Importadora Autotech', 'Héctor Vargas', '6022005566', 'import@autotechparts.com', 'Zona Franca Bogotá'),
(8, '901111222-8', 'Filtros y Más SAS', 'Natalia Cruz', '6023006677', 'ventas@filtrosymas.com', 'Cra 30 # 5-60'),
(9, '901333444-9', 'Baterías Colombia', 'Oscar León', '6024007788', 'contacto@bateriascol.com', 'Cl 170 # 45-12'),
(10, '901555666-0', 'Suspensión Total', 'Patricia Niño', '6025008899', 'info@suspensiontotal.com', 'Av. 68 # 40-25')
ON DUPLICATE KEY UPDATE
  razon_social = VALUES(razon_social),
  contacto = VALUES(contacto);

INSERT INTO repuesto(referencia, nombre, marca, precio_unitario, stock, id_proveedor)
VALUES
('FR-220', 'Pastillas de freno', 'Bosch', 85000.00, 25, 1),
('AC-110', 'Filtro de aceite', 'Mann', 32000.00, 40, 1),
('LL-015', 'Bujías', 'NGK', 48000.00, 60, 2),
('AM-300', 'Amortiguador delantero', 'Monroe', 180000.00, 12, 10),
('BT-050', 'Batería 12V', 'Mac', 320000.00, 8, 9),
('CL-080', 'Kit de clutch', 'Luk', 450000.00, 5, 5),
('RD-120', 'Radiador', 'Valeo', 280000.00, 7, 7),
('FT-200', 'Filtro de aire', 'Mann', 45000.00, 35, 8),
('OL-010', 'Aceite 5W-30 4L', 'Mobil', 95000.00, 50, 4),
('DS-090', 'Disco de freno', 'Brembo', 210000.00, 15, 3)
ON DUPLICATE KEY UPDATE
  nombre = VALUES(nombre),
  precio_unitario = VALUES(precio_unitario),
  stock = VALUES(stock);
