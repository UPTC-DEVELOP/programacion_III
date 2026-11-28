--
-- Base de datos: `panther`
--
-- Estructura de tabla para la tabla `rol`
--

-- Ingreso a por restful
-- Authorization: 750e8b43e5ed564462c90ef0d382db26
-- {
--  "user":"admin",
--  "password":"12345"  
-- }

CREATE TABLE `j4rol` (
  `id` int(11) NOT NULL,
  `name` varchar(30) NOT NULL,
  `description` varchar(200) NOT NULL,
  `dateDelete` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Volcado de datos para la tabla `rol`
--

INSERT INTO `j4rol` (`id`, `name`, `description`) VALUES
(1, 'admin', 'Admin'),
(2, 'user', 'User generic');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `user`
--

CREATE TABLE `j4user` (
  `id` int(11) NOT NULL,
  `user` varchar(254) NOT NULL,
  `password` varchar(128) NOT NULL,
  `keyAPI` varchar(60) NOT NULL,
  `roles` int(2) NOT NULL DEFAULT 3,
  `dateDelete` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Volcado de datos para la tabla `user`
--

INSERT INTO `j4user` (`id`, `user`, `password`, `keyAPI`, `roles`, `dateDelete`) VALUES
(1, 'admin', '$2y$10$rCdykaN0YQL/H4VJW0RKae69B2QekbrO3Iuj8OxFy/V1syHOmpfmO', '750e8b43e5ed564462c90ef0d382db26', 1, NULL);


--
-- Indices de la tabla `rol`
--
ALTER TABLE `j4rol`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `user`
--
ALTER TABLE `j4user`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `j4user` (`user`) USING BTREE;

--
-- AUTO_INCREMENT de la tabla `user`
--
ALTER TABLE `j4user`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

CREATE TABLE `documenttype` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre_corto` varchar(5) DEFAULT NULL,
  `nombre_largo` text DEFAULT NULL,
  `dateDelete` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `documenttype` (`id`, `nombre_corto`, `nombre_largo`, `dateDelete`) VALUES
(1, 'CC', 'Cedula ciudadania', NULL),
(2, 'CE', 'Cedula Extranjeria', NULL),
(3, 'NIT', 'Numero Identificacion Tributario', NULL),
(11, 'PA', 'Pasaporte', NULL);

CREATE TABLE `person` (
  `id` int(11) NOT NULL,
  `name` varchar(30) NOT NULL,
  `lastName` varchar(30) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `dateDelete` datetime DEFAULT NULL,
  `document_type_id` int(11) NOT NULL,
  `identitydocument` varchar(20) NOT NULL,
  `email` text DEFAULT NULL,
  `address` varchar(60) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Indices de la tabla `person`
--
ALTER TABLE `person`
  ADD PRIMARY KEY (`id`),
  ADD KEY `documenttype` (`document_type_id`);

--
-- AUTO_INCREMENT de la tabla `person`
--
ALTER TABLE `person`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `person`
  ADD CONSTRAINT `fk_person_documenttype`
  FOREIGN KEY (`document_type_id`) REFERENCES `documenttype` (`id`)
  ON UPDATE CASCADE;

COMMIT;

INSERT INTO person(name, lastName, phone, document_type_id, identitydocument)
VALUES ('Nicolás', 'Pinzón', '3419478', 1, '3419478');
