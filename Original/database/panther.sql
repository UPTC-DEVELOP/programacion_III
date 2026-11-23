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
  `description` varchar(200) NOT NULL
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
  `roles` int(30) NOT NULL,
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
  
CREATE TABLE `person` (
  `id` int(11) NOT NULL,
  `name` varchar(30) NOT NULL,
  `lastName` varchar(30) NOT NULL,
  `phone` int(10) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Indices de la tabla `person`
--
ALTER TABLE `person`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT de la tabla `person`
--
ALTER TABLE `person`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;COMMIT;

INSERT INTO person(name, lastName, phone) VALUES ('Nicolás','Pinzón',3419478);
