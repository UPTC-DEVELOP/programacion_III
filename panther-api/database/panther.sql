-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 27-11-2026 a las 20:40:03
-- Versión del servidor: 12.2.2-MariaDB
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
-- Estructura de tabla para la tabla `cliente`
--

CREATE TABLE `cliente` (
  `id` int(11) NOT NULL,
  `nombres` varchar(40) NOT NULL,
  `apellidos` varchar(40) NOT NULL,
  `tipo_identificacion` enum('Cédula de ciudadanía','Cédula de extranjería','Pasaporte','NIT') NOT NULL,
  `numero_identificacion` varchar(20) NOT NULL,
  `correo` varchar(100) NOT NULL,
  `direccion` varchar(80) NOT NULL,
  `telefono` varchar(15) NOT NULL,
  `fecha_registro` timestamp NOT NULL DEFAULT current_timestamp(),
  `dateDelete` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Volcado de datos para la tabla `cliente`
--

INSERT INTO `cliente` (`id`, `nombres`, `apellidos`, `tipo_identificacion`, `numero_identificacion`, `correo`, `direccion`, `telefono`, `fecha_registro`, `dateDelete`) VALUES
(1, 'Marco', 'Moreno  López', 'Cédula de ciudadanía', '102356789', 'carlos.moreno@email.com', 'Calle Principal # 4-20', '3101236567', '2026-11-18 16:52:44', NULL),
(2, 'Marcos Andrés', 'Moreno García', 'Cédula de ciudadanía', '1335679', 'carlos.moreno@email.com', 'Calle Principal # 4-20', '3101236567', '2026-11-18 17:05:20', '2026-11-18 18:12:09'),
(3, 'Panther', 'Prueba', 'Cédula de ciudadanía', '987654321', 'panther@example.com', 'Calle API 123', '3009876543', '2026-11-19 01:02:12', '2026-11-26 19:36:20'),
(4, 'UI Panther', 'Navegador', 'Cédula de ciudadanía', '555444333', 'ui.panther@example.com', 'Avenida Panther 45', '3015554443', '2026-11-19 01:03:24', '2026-11-26 02:45:04'),
(5, 'Marcos Suárez', 'Moreno García', 'Cédula de ciudadanía', '13356794', 'carlos.@email.com', 'Calle Principal # 4-20', '3101236567', '2026-11-20 01:48:34', NULL),
(6, 'Marcos Suárez', 'Moreno García', 'Cédula de ciudadanía', '13356794', 'carlos.@email.com', 'Calle Principal # 4-20', '3101236567', '2026-11-20 01:51:02', NULL),
(7, 'hector miguel', 'Moreno Martinez', 'Cédula de ciudadanía', '10020338', 'miguel.more@gmail.com', 'Calle principal 4-30', '3108502622', '2026-11-20 17:13:19', NULL),
(8, 'Marcos ', 'Moreno', 'Cédula de ciudadanía', '13356794', 'carlos.@email.com', 'Calle Principal # 4-20', '3101236567', '2026-11-20 17:23:10', '2026-11-20 21:59:09');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `configuracion`
--

CREATE TABLE `configuracion` (
  `id` int(11) NOT NULL,
  `iva` decimal(5,2) NOT NULL DEFAULT 19.00,
  `valor_mano_obra` decimal(12,2) NOT NULL DEFAULT 0.00,
  `porcentaje_utilidad` decimal(5,2) NOT NULL DEFAULT 0.00,
  `fecha_actualizacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `dateDelete` datetime DEFAULT NULL
) ;

--
-- Volcado de datos para la tabla `configuracion`
--

INSERT INTO `configuracion` (`id`, `iva`, `valor_mano_obra`, `porcentaje_utilidad`, `fecha_actualizacion`, `dateDelete`) VALUES
(2, 19.00, 45000.01, 29.00, '2026-11-25 23:42:31', NULL),
(3, 19.00, 400.01, 25.00, '2026-11-27 16:33:52', NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `empleado`
--

CREATE TABLE `empleado` (
  `id` int(11) NOT NULL,
  `nombres` varchar(50) NOT NULL,
  `apellidos` varchar(50) NOT NULL,
  `tipo_identificacion` enum('Cédula de ciudadanía','Cédula de extranjería','Pasaporte','NIT') NOT NULL,
  `identificacion` varchar(20) NOT NULL,
  `telefono` varchar(15) NOT NULL,
  `direccion` varchar(100) NOT NULL,
  `cargo` varchar(50) NOT NULL,
  `especialidad` varchar(100) NOT NULL,
  `estado` enum('Disponible','Ocupado','No disponible') NOT NULL DEFAULT 'Disponible',
  `fecha_registro` timestamp NOT NULL DEFAULT current_timestamp(),
  `dateDelete` datetime DEFAULT NULL
) ;

--
-- Volcado de datos para la tabla `empleado`
--

INSERT INTO `empleado` (`id`, `nombres`, `apellidos`, `tipo_identificacion`, `identificacion`, `telefono`, `direccion`, `cargo`, `especialidad`, `estado`, `fecha_registro`, `dateDelete`) VALUES
(1, 'Nevardo José', 'Moreno López', 'Cédula de ciudadanía', '79451230', '3124567890', 'Carrera 7 # 12-34', 'Mecánico', 'Motor y suspensión', 'Ocupado', '2026-11-20 18:27:00', NULL),
(2, 'Marcos Antonio', 'Moreno lopez', 'Cédula de ciudadanía', '19802738', '3108502622', 'Carrera 7 # 12-34', 'Mecánico  jefe', 'Motor y pictura', 'Disponible', '2026-11-26 01:39:14', NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `factura`
--

CREATE TABLE `factura` (
  `id` int(11) NOT NULL,
  `fecha` date NOT NULL,
  `total` decimal(14,2) NOT NULL,
  `cliente_id` int(11) DEFAULT NULL,
  `nit_emisor` varchar(20) DEFAULT NULL,
  `numero_resolucion` varchar(30) DEFAULT NULL,
  `numero_documento_comercial` varchar(40) DEFAULT NULL,
  `tipo_factura` varchar(30) DEFAULT NULL,
  `fecha_vencimiento` date DEFAULT NULL,
  `medio_pago` varchar(20) DEFAULT NULL,
  `naturaleza_cliente` varchar(20) DEFAULT NULL,
  `observacion` varchar(500) DEFAULT NULL,
  `tipo_descuento_general` varchar(20) DEFAULT NULL,
  `descuento_general_valor` decimal(14,2) NOT NULL DEFAULT 0.00,
  `subtotal` decimal(14,2) NOT NULL DEFAULT 0.00,
  `descuento_lineas` decimal(14,2) NOT NULL DEFAULT 0.00,
  `descuento_general` decimal(14,2) NOT NULL DEFAULT 0.00,
  `impuestos` decimal(14,2) NOT NULL DEFAULT 0.00,
  `estado_envio` enum('BORRADOR','PENDIENTE','ENVIADA','ERROR') NOT NULL DEFAULT 'BORRADOR',
  `respuesta_envio` text DEFAULT NULL,
  `fecha_registro` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Volcado de datos para la tabla `factura`
--

INSERT INTO `factura` (`id`, `fecha`, `total`, `cliente_id`, `nit_emisor`, `numero_resolucion`, `numero_documento_comercial`, `tipo_factura`, `fecha_vencimiento`, `medio_pago`, `naturaleza_cliente`, `observacion`, `tipo_descuento_general`, `descuento_general_valor`, `subtotal`, `descuento_lineas`, `descuento_general`, `impuestos`, `estado_envio`, `respuesta_envio`, `fecha_registro`) VALUES
(1, '2026-11-09', 55000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 0.00, 0.00, 0.00, 0.00, 'BORRADOR', NULL, '2026-11-27 15:41:14'),
(2, '2028-11-09', 58500.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 0.00, 0.00, 0.00, 0.00, 'BORRADOR', NULL, '2026-11-27 15:41:14'),
(3, '2026-11-27', 46000.00, 1, '12345', '18760000001', 'SETP990000034', 'venta-nacional', '2026-11-27', 'efectivo', 'NATURALES', '', 'valor', 0.00, 40000.00, 0.00, 0.00, 6000.00, 'ERROR', 'No se pudo enviar la factura (200): Fallo al crear Factura', '2026-11-27 15:45:36'),
(8, '2026-11-27', 285600.00, 1, '12345', '18760000001', 'SETP990000035', 'venta-nacional', '2026-11-27', 'efectivo', 'NATURALES', 'Prueba de factura desde Postman', 'valor', 0.00, 240000.00, 0.00, 0.00, 45600.00, 'BORRADOR', NULL, '2026-11-27 18:24:43'),
(9, '2026-11-27', 285600.00, 1, '12345', '18760000001', 'SETP990000039', 'venta-nacional', '2026-11-27', 'efectivo', 'NATURALES', 'Prueba de factura desde Postman', 'valor', 0.00, 240000.00, 0.00, 0.00, 45600.00, 'ERROR', 'No se pudo enviar la factura (200): Fallo al crear Factura', '2026-11-27 18:25:03');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `factura_detalle`
--

CREATE TABLE `factura_detalle` (
  `id` int(11) NOT NULL,
  `factura_id` int(11) NOT NULL,
  `servicio_id` int(11) DEFAULT NULL,
  `nombre` varchar(120) NOT NULL,
  `precio_unitario` decimal(14,2) NOT NULL,
  `precio_referencia` decimal(14,2) NOT NULL DEFAULT 0.00,
  `cantidad` decimal(12,2) NOT NULL,
  `codigo` varchar(40) NOT NULL,
  `unidad` varchar(20) NOT NULL,
  `impuesto` enum('iva-19','iva-5','excluido','exento') NOT NULL,
  `tasa_impuesto` decimal(5,2) NOT NULL DEFAULT 0.00,
  `descuento_porcentaje` decimal(5,2) NOT NULL DEFAULT 0.00,
  `descuento_valor` decimal(14,2) NOT NULL DEFAULT 0.00,
  `subtotal` decimal(14,2) NOT NULL,
  `valor_impuesto` decimal(14,2) NOT NULL DEFAULT 0.00,
  `total` decimal(14,2) NOT NULL,
  `observacion` varchar(300) NOT NULL DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Volcado de datos para la tabla `factura_detalle`
--

INSERT INTO `factura_detalle` (`id`, `factura_id`, `servicio_id`, `nombre`, `precio_unitario`, `precio_referencia`, `cantidad`, `codigo`, `unidad`, `impuesto`, `tasa_impuesto`, `descuento_porcentaje`, `descuento_valor`, `subtotal`, `valor_impuesto`, `total`, `observacion`) VALUES
(1, 3, NULL, 'CADENA DE REPARTO', 40000.00, 0.00, 1.00, 'REP-FLT-003', 'unidad', 'iva-19', 15.00, 0.00, 0.00, 40000.00, 6000.00, 46000.00, ''),
(6, 8, NULL, 'se le va cambiar la cadena de reparto', 240000.00, 0.00, 1.00, 'OS-2', 'unidad', 'iva-19', 19.00, 0.00, 0.00, 240000.00, 45600.00, 285600.00, ''),
(7, 9, NULL, 'se le va cambiar la cadena de reparto', 240000.00, 0.00, 1.00, 'OS-2', 'unidad', 'iva-19', 19.00, 0.00, 0.00, 240000.00, 45600.00, 285600.00, '');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `j4rol`
--

CREATE TABLE `j4rol` (
  `id` int(11) NOT NULL,
  `name` varchar(30) NOT NULL,
  `description` varchar(200) NOT NULL,
  `dateDelete` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Volcado de datos para la tabla `j4rol`
--

INSERT INTO `j4rol` (`id`, `name`, `description`, `dateDelete`) VALUES
(1, 'admin', 'Admin', NULL),
(2, 'user', 'User generic', NULL),
(3, 'Cliente', 'Rol con permisos de compra', '2026-10-24 19:18:16');

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
  `dateDelete` timestamp NULL DEFAULT NULL,
  `token_clarisa` text DEFAULT NULL,
  `fecha_expedicion_token` timestamp NULL DEFAULT NULL,
  `fecha_expiracion` datetime DEFAULT NULL,
  `creado_en` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Volcado de datos para la tabla `j4user`
--

INSERT INTO `j4user` (`id`, `user`, `password`, `keyAPI`, `roles`, `dateDelete`, `token_clarisa`, `fecha_expedicion_token`, `fecha_expiracion`, `creado_en`) VALUES
(1, 'admin', '$2y$10$rKEhCUW2XL1QakrBfapoAuZsfiLcbtaCZbotq/ABkPdX9iCgJuA2i', '750e8b43e5ed564462c90ef0d382db26', 1, NULL, NULL, NULL, NULL, '2026-11-17 16:53:09'),
(17, 'Estud', '$2y$10$n08QoECpbgJGZDxQ8MGrseORfmNZyq4.FVlD.jK6iSr/WrgVl4iVO', '228f92ceef8ccb898435e66180877b44', 1, '2026-10-24 23:53:26', NULL, NULL, NULL, '2026-11-17 16:53:09'),
(29, 'DEMO_API', '$2y$10$w9nB2/V.xzikHJetEWwhSeDBxRSF37roQEoX/n2AO0oWd6mRjK6CW', 'f32859562a69f5540eb73e7b8f89b8ae', 2, NULL, 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI5MyIsInNlZ3VuZG9Ob21icmUiOiJkZW1vIiwicHJpbWVyTm9tYnJlIjoiZGVtb19hcGkiLCJwcmltZXJBcGVsbGlkbyI6ImRlbW9fYXBpIiwiaXNzIjoiMTc5LjUxLjEyNS4yMjIiLCJzZWd1bmRvQXBlbGxpZG8iOiIiLCJub21icmVVc3VhcmlvIjoiREVNT19BUEkiLCJyb2wiOiJxZ2xFUGJmb1RZQk9uK1AyYTFpYTdiZThlL0xReE1Nek5LTnpZOHNlS0JvPSIsIm5iZiI6MTc5NTgwNzI1NiwiZXhwIjoxNzk1ODUwNDU2LCJpYXQiOjE3OTU4MDcyNTYsImVtYWlsIjoiZGVtb0BjbGFyaXNhY2xvdWQuY29tIiwidGVuYW50Ijo4MDAwfQ.EvKjf8dDWgDPc_gOMforAvbWTfx516r4dwEAq253r3s', '2026-11-27 19:20:56', '2026-11-28 07:20:56', '2026-11-17 23:49:45'),
(63, 'Cliente', '$2y$10$/STs8DeehMDqC.6f89GK9.WeVnyM8/V9fX5qyGAL/.Z.gpOH0I.DW', '95582d66a12592997274041205f8c44c', 3, NULL, NULL, NULL, NULL, '2026-11-27 19:10:32');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `person`
--

CREATE TABLE `person` (
  `id` int(11) NOT NULL,
  `name` varchar(30) NOT NULL,
  `lastName` varchar(30) NOT NULL,
  `phone` int(10) NOT NULL,
  `dateDelete` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Volcado de datos para la tabla `person`
--

INSERT INTO `person` (`id`, `name`, `lastName`, `phone`, `dateDelete`) VALUES
(1, 'Nicolás', 'Pinzón', 3419478, '2026-10-24 18:10:04'),
(2, 'Carlos', 'actualizado', 310123456, '2026-10-24 18:10:04'),
(3, 'Luis', 'Jaramillo', 347080433, NULL),
(4, 'Marcos', 'Moreno', 4567890, '2026-10-24 18:18:11'),
(5, 'Marcos', 'Ruiz', 4567890, NULL),
(6, 'Juan David', 'Quitero', 4563647, '2026-10-31 17:27:42');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `repuesto`
--

CREATE TABLE `repuesto` (
  `id` int(11) NOT NULL,
  `referencia` varchar(50) NOT NULL,
  `descripcion` varchar(255) NOT NULL,
  `marca` varchar(50) NOT NULL,
  `precio_unitario` decimal(12,2) NOT NULL,
  `stock_actual` int(11) NOT NULL DEFAULT 0,
  `stock_minimo` int(11) NOT NULL DEFAULT 0,
  `stock_maximo` int(11) NOT NULL DEFAULT 100,
  `fecha_registro` timestamp NOT NULL DEFAULT current_timestamp(),
  `dateDelete` datetime DEFAULT NULL
) ;

--
-- Volcado de datos para la tabla `repuesto`
--

INSERT INTO `repuesto` (`id`, `referencia`, `descripcion`, `marca`, `precio_unitario`, `stock_actual`, `stock_minimo`, `stock_maximo`, `fecha_registro`, `dateDelete`) VALUES
(1, 'Volante ', 'Repuesto creado por prueba ', 'Panther', 125000.50, 12, 2, 50, '2026-11-21 01:15:24', '2026-11-21 02:15:48'),
(2, 'REP-FLT-001', 'Filtro de aceite de motor', 'Bosch', 25000.00, 15, 4, 50, '2026-11-21 15:44:03', '2026-11-21 17:43:33'),
(3, 'REP-FLT-003', 'CADENA DE REPARTO', 'Bosch', 40000.00, 15, 4, 50, '2026-11-26 17:55:19', NULL),
(4, 'RF3456', 'Gaton hidráulico', 'Panter', 40000.00, 34, 20, 40, '2026-11-26 18:37:29', NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `servicio`
--

CREATE TABLE `servicio` (
  `id` int(11) NOT NULL,
  `cliente_id` int(11) NOT NULL,
  `vehiculo_id` int(11) NOT NULL,
  `empleado_id` int(11) NOT NULL,
  `configuracion_id` int(11) DEFAULT NULL,
  `estado` enum('Pendiente','En proceso','Finalizado') NOT NULL DEFAULT 'Pendiente',
  `estado_facturacion` enum('No disponible','Disponible','Facturado') NOT NULL DEFAULT 'No disponible',
  `descripcion` text NOT NULL,
  `horas_empleadas` decimal(6,2) NOT NULL DEFAULT 0.00,
  `valor_mano_obra` decimal(12,2) NOT NULL DEFAULT 0.00,
  `fecha_inicio` date NOT NULL,
  `fecha_estimada_fin` date NOT NULL,
  `prioridad` enum('Baja','Media','Alta','Urgente') NOT NULL DEFAULT 'Media',
  `observaciones` text DEFAULT NULL,
  `fecha_registro` timestamp NOT NULL DEFAULT current_timestamp(),
  `dateDelete` datetime DEFAULT NULL
) ;

--
-- Volcado de datos para la tabla `servicio`
--

INSERT INTO `servicio` (`id`, `cliente_id`, `vehiculo_id`, `empleado_id`, `configuracion_id`, `estado`, `estado_facturacion`, `descripcion`, `horas_empleadas`, `valor_mano_obra`, `fecha_inicio`, `fecha_estimada_fin`, `prioridad`, `observaciones`, `fecha_registro`, `dateDelete`) VALUES
(1, 1, 3, 1, NULL, 'Finalizado', 'Disponible', 'Mantenimiento preventivo de frenos y cambio de pastillas delanteras', 3.00, 50000.00, '2026-11-25', '2026-11-27', 'Alta', 'Revisar discos de freno y purgar líquido hidráulico', '2026-11-25 16:50:50', NULL),
(2, 1, 4, 1, NULL, 'Finalizado', 'Facturado', 'se le va cambiar la cadena de reparto', 4.00, 50000.00, '2026-11-26', '2026-11-30', 'Media', '', '2026-11-26 19:38:11', NULL),
(3, 1, 3, 1, NULL, 'Finalizado', 'Disponible', 'Se realizo cambion de la cadena de reparto', 3.00, 40000.00, '2026-11-27', '2026-11-27', 'Media', '', '2026-11-27 16:32:10', NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `servicio_repuesto`
--

CREATE TABLE `servicio_repuesto` (
  `servicio_id` int(11) NOT NULL,
  `repuesto_id` int(11) NOT NULL,
  `cantidad` int(11) NOT NULL DEFAULT 1,
  `precio_unitario` decimal(12,2) NOT NULL DEFAULT 0.00
) ;

--
-- Volcado de datos para la tabla `servicio_repuesto`
--

INSERT INTO `servicio_repuesto` (`servicio_id`, `repuesto_id`, `cantidad`, `precio_unitario`) VALUES
(1, 3, 1, 40000.00),
(2, 3, 1, 40000.00),
(3, 3, 1, 40000.00);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `vehiculo`
--

CREATE TABLE `vehiculo` (
  `id` int(11) NOT NULL,
  `placa` varchar(15) NOT NULL,
  `modelo` varchar(40) NOT NULL,
  `color` varchar(25) NOT NULL,
  `propietario_id` int(11) NOT NULL,
  `fecha_ingreso` date NOT NULL,
  `hora_ingreso` time NOT NULL,
  `dateDelete` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Volcado de datos para la tabla `vehiculo`
--

INSERT INTO `vehiculo` (`id`, `placa`, `modelo`, `color`, `propietario_id`, `fecha_ingreso`, `hora_ingreso`, `dateDelete`) VALUES
(1, 'ABC123', 'Chevrolet Spark 2022', 'Blanco', 1, '2026-11-19', '09:30:00', '2026-11-26 02:07:13'),
(2, 'XYZ789', 'Mazda 3 2024', 'Gris', 4, '2026-11-19', '10:15:00', NULL),
(3, 'JKL456', 'Renault Duster 2021', 'Negro', 1, '2026-11-19', '14:45:00', NULL),
(4, 'DEF456', 'Toyota Corolla 2023', 'Plateado', 1, '2026-11-19', '09:15:00', NULL);

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `cliente`
--
ALTER TABLE `cliente`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `configuracion`
--
ALTER TABLE `configuracion`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `empleado`
--
ALTER TABLE `empleado`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_empleado_tipo_identificacion` (`tipo_identificacion`,`identificacion`);

--
-- Indices de la tabla `factura`
--
ALTER TABLE `factura`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_factura_numero_documento` (`numero_documento_comercial`),
  ADD KEY `idx_factura_cliente` (`cliente_id`);

--
-- Indices de la tabla `factura_detalle`
--
ALTER TABLE `factura_detalle`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_factura_detalle_servicio` (`servicio_id`),
  ADD KEY `idx_factura_detalle_factura` (`factura_id`);

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
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `repuesto`
--
ALTER TABLE `repuesto`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_repuesto_referencia` (`referencia`);

--
-- Indices de la tabla `servicio`
--
ALTER TABLE `servicio`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_servicio_cliente` (`cliente_id`),
  ADD KEY `idx_servicio_vehiculo` (`vehiculo_id`),
  ADD KEY `idx_servicio_empleado` (`empleado_id`),
  ADD KEY `idx_servicio_configuracion` (`configuracion_id`);

--
-- Indices de la tabla `servicio_repuesto`
--
ALTER TABLE `servicio_repuesto`
  ADD PRIMARY KEY (`servicio_id`,`repuesto_id`),
  ADD KEY `idx_sr_repuesto` (`repuesto_id`);

--
-- Indices de la tabla `vehiculo`
--
ALTER TABLE `vehiculo`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_vehiculo_placa` (`placa`),
  ADD KEY `idx_vehiculo_propietario` (`propietario_id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `cliente`
--
ALTER TABLE `cliente`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT de la tabla `configuracion`
--
ALTER TABLE `configuracion`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `empleado`
--
ALTER TABLE `empleado`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `factura`
--
ALTER TABLE `factura`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT de la tabla `factura_detalle`
--
ALTER TABLE `factura_detalle`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de la tabla `j4rol`
--
ALTER TABLE `j4rol`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `j4user`
--
ALTER TABLE `j4user`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=66;

--
-- AUTO_INCREMENT de la tabla `person`
--
ALTER TABLE `person`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `repuesto`
--
ALTER TABLE `repuesto`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `servicio`
--
ALTER TABLE `servicio`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `vehiculo`
--
ALTER TABLE `vehiculo`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `factura`
--
ALTER TABLE `factura`
  ADD CONSTRAINT `fk_factura_cliente` FOREIGN KEY (`cliente_id`) REFERENCES `cliente` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Filtros para la tabla `factura_detalle`
--
ALTER TABLE `factura_detalle`
  ADD CONSTRAINT `fk_factura_detalle_factura` FOREIGN KEY (`factura_id`) REFERENCES `factura` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_factura_detalle_servicio` FOREIGN KEY (`servicio_id`) REFERENCES `servicio` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Filtros para la tabla `servicio`
--
ALTER TABLE `servicio`
  ADD CONSTRAINT `fk_servicio_cliente` FOREIGN KEY (`cliente_id`) REFERENCES `cliente` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_servicio_configuracion` FOREIGN KEY (`configuracion_id`) REFERENCES `configuracion` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_servicio_empleado` FOREIGN KEY (`empleado_id`) REFERENCES `empleado` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_servicio_vehiculo` FOREIGN KEY (`vehiculo_id`) REFERENCES `vehiculo` (`id`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `servicio_repuesto`
--
ALTER TABLE `servicio_repuesto`
  ADD CONSTRAINT `fk_sr_repuesto` FOREIGN KEY (`repuesto_id`) REFERENCES `repuesto` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_sr_servicio` FOREIGN KEY (`servicio_id`) REFERENCES `servicio` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `vehiculo`
--
ALTER TABLE `vehiculo`
  ADD CONSTRAINT `fk_vehiculo_cliente` FOREIGN KEY (`propietario_id`) REFERENCES `cliente` (`id`) ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
