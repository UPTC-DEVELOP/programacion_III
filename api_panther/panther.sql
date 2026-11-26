-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1:3306
-- Tiempo de generación: 26-11-2026 a las 02:06:08
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `panther`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `empleado`
--

CREATE TABLE `empleado` (
  `id` int(11) NOT NULL,
  `nombres` varchar(50) NOT NULL,
  `apellidos` varchar(50) NOT NULL,
  `documento` varchar(15) NOT NULL,
  `rol` varchar(30) NOT NULL,
  `telefono` varchar(15) NOT NULL,
  `correo` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `facturas`
--

CREATE TABLE `facturas` (
  `id` int(11) NOT NULL,
  `cufe` varchar(255) NOT NULL,
  `nit` varchar(50) NOT NULL,
  `consecutivo` varchar(20) DEFAULT NULL,
  `total` decimal(15,2) DEFAULT NULL,
  `cliente_nombre` varchar(255) DEFAULT NULL,
  `estado_dian` varchar(50) DEFAULT NULL,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `j4rol`
--

CREATE TABLE `j4rol` (
  `id` int(11) NOT NULL,
  `name` varchar(30) NOT NULL,
  `description` varchar(200) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Volcado de datos para la tabla `j4rol`
--

INSERT INTO `j4rol` (`id`, `name`, `description`) VALUES
(1, 'admin', 'Admin'),
(2, 'user', 'User generic');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `j4user`
--

CREATE TABLE `j4user` (
  `id` int(11) NOT NULL,
  `user` varchar(254) NOT NULL,
  `password` varchar(128) NOT NULL,
  `keyAPI` varchar(60) NOT NULL,
  `roles` int(30) NOT NULL,
  `dateDelete` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Volcado de datos para la tabla `j4user`
--

INSERT INTO `j4user` (`id`, `user`, `password`, `keyAPI`, `roles`, `dateDelete`) VALUES
(1, 'admin', '12456$2y$10$rCdykaN0YQL/H4VJW0RKae69B2QekbrO3Iuj8OxFy/V1syHOmpfmO', '750e8b43e5ed564462c90ef0d382db26', 1, NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `person`
--

CREATE TABLE `person` (
  `id` int(11) NOT NULL,
  `name` varchar(30) NOT NULL,
  `lastName` varchar(30) NOT NULL,
  `phone` int(10) NOT NULL,
  `documento` varchar(15) NOT NULL,
  `correo` varchar(100) DEFAULT NULL,
  `direccion` varchar(100) DEFAULT NULL,
  `tipo` varchar(20) DEFAULT 'Particular'
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Volcado de datos para la tabla `person`
--

INSERT INTO `person` (`id`, `name`, `lastName`, `phone`, `documento`, `correo`, `direccion`, `tipo`) VALUES
(1, 'Nicolás', 'Pinzón', 3419478, '', NULL, NULL, 'Particular');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `proveedor`
--

CREATE TABLE `proveedor` (
  `id` int(11) NOT NULL,
  `nit` varchar(20) NOT NULL,
  `razon_social` varchar(120) NOT NULL,
  `contacto` varchar(100) NOT NULL,
  `telefono` varchar(20) NOT NULL,
  `correo` varchar(100) NOT NULL,
  `direccion` varchar(150) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `proveedor`
--

INSERT INTO `proveedor` (`id`, `nit`, `razon_social`, `contacto`, `telefono`, `correo`, `direccion`) VALUES
(1, '900123456-1', 'Importadora Automotriz Andina S.A.S.', 'Carlos Alberto Méndez', '3104567890', 'ventas@andinaauto.com.co', 'Zona Industrial Montevideo Calle 17 # 68-45, Bogotá'),
(2, '800987654-2', 'Frenos y Embragues del Oriente Ltda.', 'Laura Fernanda Gómez', '3157891234', 'pedidos@frenosoriente.com', 'Av. Libertadores # 14-20 Local 3, Tunja'),
(3, '901234567-8', 'Lubricantes y Filtros de Colombia S.A.', 'Andrés Felipe Torres', '3208914562', 'comercial@lubricol.com.co', 'Autopista Norte Km 19 Parque Industrial, Chía'),
(4, '890345678-9', 'Repuestos Originales Bosch & Denso S.A.S.', 'Diana Marcela Rojas', '3112349876', 'distribucion@boschdenso.co', 'Carrera 30 # 12-55 Barrio Ricaurte, Bogotá'),
(5, '900567890-3', 'Suspensión y Dirección Total S.A.S.', 'Jorge Enrique Castañeda', '3186543210', 'ventas@suspensiontotal.co', 'Calle 63 # 24-18 Barrio 7 de Agosto, Bogotá'),
(6, '860789012-4', 'Eléctricos y Baterías El Rayo S.A.', 'Sandra Milena Vargas', '3149876543', 'cotizaciones@bateriaselrayo.com', 'Av. Suba # 115-30 Bodega 8, Bogotá'),
(7, '901876543-5', 'Distribuidora Coreana y Japonesa Kia-Hyundai', 'Miguel Ángel Suárez', '3163217890', 'repuestos@asiautos.com.co', 'Calle 13 # 42-10 Zona Industrial, Bogotá'),
(8, '800456123-7', 'Llantas y Rines del Altiplano S.A.S.', 'Patricia Elena Duarte', '3125678901', 'mayoristas@llantasaltiplano.co', 'Av. Oriental # 28-90, Duitama'),
(9, '900654321-0', 'Rodamientos y Correas Industriales SKF-Gates', 'Ricardo Javier Pineda', '3178901235', 'pedidos@rodamientosgates.co', 'Carrera 68 # 21-40, Bogotá'),
(10, '830112233-6', 'Inyección Electrónica y Sensores Delphi S.A.S.', 'Natalia Andrea Morales', '3194321098', 'soporte@inyecciondelphi.co', 'Calle 72 # 28-14, Bogotá'),
(11, '901998877-4', 'Radiadores y Refrigeración Térmica S.A.S.', 'Héctor Fabio Ramírez', '3137654321', 'ventas@radiadorestermica.co', 'Carrera 15 # 10-45, Sogamoso'),
(12, '890776655-1', 'Tornillería, Empaques y Sellos Automotrices Ltda.', 'Claudia Liliana Ortiz', '3109988776', 'despachos@empaquesysellos.co', 'Calle 8 # 34-22 Barrio Pensilvania, Bogotá');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `repuesto`
--

CREATE TABLE `repuesto` (
  `id` int(11) NOT NULL,
  `referencia` varchar(30) NOT NULL,
  `nombre` varchar(120) NOT NULL,
  `marca` varchar(60) NOT NULL,
  `precio_unitario` decimal(12,2) NOT NULL,
  `stock` int(11) NOT NULL DEFAULT 0,
  `id_proveedor` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `repuesto`
--

INSERT INTO `repuesto` (`id`, `referencia`, `nombre`, `marca`, `precio_unitario`, `stock`, `id_proveedor`) VALUES
(1, 'FR-101', 'Juego Pastillas de Freno Delanteras Cerámica', 'Brembo', 148000.00, 24, 2),
(2, 'FR-102', 'Juego Pastillas de Freno Traseras Semimetálicas', 'TRW', 112000.00, 30, 2),
(3, 'FR-103', 'Disco de Freno Ventilado Delantero (Unidad)', 'Fremax', 165000.00, 16, 2),
(4, 'FR-104', 'Bomba Auxiliar de Freno Trasera', 'Brembo', 78000.00, 14, 2),
(5, 'FR-105', 'Kit de Embrague Completo (Disco, Prensa y Balinera)', 'Valeo', 485000.00, 9, 2),
(6, 'FR-106', 'Guaya de Freno de Emergencia', 'Frenos Oriente', 54000.00, 20, 2),
(7, 'LB-201', 'Aceite Sintético 5W-30 Galón (4 Litros)', 'Mobil 1', 158000.00, 45, 3),
(8, 'LB-202', 'Aceite Semisintético 10W-40 Galón (4 Litros)', 'Castrol Magnatec', 118000.00, 50, 3),
(9, 'LB-203', 'Filtro de Aceite Blindado Rosca 3/4', 'Mann-Filter', 32000.00, 60, 3),
(10, 'LB-204', 'Filtro de Aire de Motor Panel Rectangular', 'Bosch', 42000.00, 40, 3),
(11, 'LB-205', 'Filtro de Cabina / Aire Acondicionado Carbón Activo', 'Mahle', 48000.00, 35, 3),
(12, 'LB-206', 'Líquido de Frenos DOT 4 Frasco 500ml', 'Ate', 28000.00, 55, 3),
(13, 'EN-301', 'Juego de 4 Bujías Iridium Power', 'NGK', 136000.00, 28, 4),
(14, 'EN-302', 'Bobina de Encendido Individual Tipo Lápiz', 'Denso', 175000.00, 18, 4),
(15, 'EN-303', 'Cables de Alta Siliconados Juego x4', 'Bosch', 89000.00, 22, 4),
(16, 'IN-304', 'Sensor de Oxígeno (Sonda Lambda) 4 Cables', 'Delphi', 215000.00, 12, 10),
(17, 'IN-305', 'Sensor de Posición del Cigüeñal (CKP)', 'Delphi', 142000.00, 15, 10),
(18, 'IN-306', 'Pila Bomba de Gasolina Eléctrica Universal', 'Bosch', 125000.00, 19, 4),
(19, 'SU-401', 'Amortiguador Delantero a Gas (Unidad)', 'Monroe', 245000.00, 14, 5),
(20, 'SU-402', 'Amortiguador Trasero Hidráulico (Unidad)', 'KYB', 198000.00, 16, 5),
(21, 'SU-403', 'Terminal de Dirección Exterior', 'Moog', 68000.00, 26, 5),
(22, 'SU-404', 'Rótula de Suspensión Inferior', 'TRW', 74000.00, 22, 5),
(23, 'SU-405', 'Buje de Tijera Delantera Caucho-Metal', 'Sidem', 36000.00, 40, 5),
(24, 'SU-406', 'Axial de Caja de Dirección', 'Moog', 82000.00, 18, 5),
(25, 'EL-501', 'Batería Libre de Mantenimiento 12V 65Ah (800 CCA)', 'MAC Silver Plus', 395000.00, 11, 6),
(26, 'EL-502', 'Bombillo Halógeno H4 12V 60/55W Luz Blanca', 'Osram Night Breaker', 46000.00, 38, 6),
(27, 'EL-503', 'Alternador Completo 12V 90A', 'Valeo', 640000.00, 5, 6),
(28, 'EL-504', 'Motor de Arranque 12V 9 Dientes', 'Bosch', 520000.00, 6, 6),
(29, 'MT-601', 'Kit de Repartición (Correa + Tensor + Polea Guía)', 'Gates', 310000.00, 15, 9),
(30, 'MT-602', 'Correa de Accesorios / Alternador 6PK1880', 'Continental', 64000.00, 25, 9),
(31, 'MT-603', 'Rodamiento de Rueda Delantera con ABS', 'SKF', 138000.00, 20, 9),
(32, 'RF-701', 'Bomba de Agua con Empaque Metálico', 'GMB', 155000.00, 14, 11),
(33, 'RF-702', 'Termostato con Carcasa y Sensor 88°C', 'Wahler', 96000.00, 17, 11),
(34, 'RF-703', 'Refrigerante Orgánico Concentrado Galón (50/50)', 'Prestone', 58000.00, 32, 11),
(35, 'EM-801', 'Empaque de Culata Multilámina en Acero (MLS)', 'Victor Reinz', 145000.00, 10, 12),
(36, 'EM-802', 'Juego de Empaques Tapa Válvulas Silicona', 'Sabó', 52000.00, 24, 12);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `vehiculo`
--

CREATE TABLE `vehiculo` (
  `id` int(11) NOT NULL,
  `placa` varchar(10) NOT NULL,
  `marca` varchar(30) NOT NULL,
  `modelo` varchar(30) NOT NULL,
  `anio` varchar(4) NOT NULL,
  `color` varchar(20) NOT NULL,
  `propietario` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `empleado`
--
ALTER TABLE `empleado`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `documento` (`documento`);

--
-- Indices de la tabla `facturas`
--
ALTER TABLE `facturas`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `j4rol`
--
ALTER TABLE `j4rol`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `j4user`
--
ALTER TABLE `j4user`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `j4user` (`user`) USING BTREE;

--
-- Indices de la tabla `person`
--
ALTER TABLE `person`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `documento` (`documento`);

--
-- Indices de la tabla `proveedor`
--
ALTER TABLE `proveedor`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nit` (`nit`);

--
-- Indices de la tabla `repuesto`
--
ALTER TABLE `repuesto`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `referencia` (`referencia`),
  ADD KEY `fk_repuesto_proveedor` (`id_proveedor`);

--
-- Indices de la tabla `vehiculo`
--
ALTER TABLE `vehiculo`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `placa` (`placa`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `empleado`
--
ALTER TABLE `empleado`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `facturas`
--
ALTER TABLE `facturas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `j4user`
--
ALTER TABLE `j4user`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT de la tabla `person`
--
ALTER TABLE `person`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `proveedor`
--
ALTER TABLE `proveedor`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT de la tabla `repuesto`
--
ALTER TABLE `repuesto`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT de la tabla `vehiculo`
--
ALTER TABLE `vehiculo`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `repuesto`
--
ALTER TABLE `repuesto`
  ADD CONSTRAINT `fk_repuesto_proveedor` FOREIGN KEY (`id_proveedor`) REFERENCES `proveedor` (`id`) ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
