--
-- Base de datos de TallerPro sobre el framework Panther
--
-- Importar completo en phpMyAdmin (local en XAMPP o en el hosting).
-- En local la base se llama `panther`; en el hosting usa la que te asigne el panel.
-- Se puede ejecutar varias veces: no borra tablas ni datos existentes.
--
-- Ingreso por restful:
--   POST /useraction/login   { "user": "admin", "password": "12345" }
--   Cabecera para el resto:  authorization: 750e8b43e5ed564462c90ef0d382db26
--

SET NAMES utf8mb4;

-- --------------------------------------------------------
-- Seguridad (Panther)
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `j4rol` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(30) NOT NULL,
  `description` varchar(200) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

INSERT IGNORE INTO `j4rol` (`id`, `name`, `description`) VALUES
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
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Contraseña: 12345
INSERT IGNORE INTO `j4user` (`id`, `user`, `password`, `keyAPI`, `roles`, `dateDelete`) VALUES
(1, 'admin', '$2y$10$rCdykaN0YQL/H4VJW0RKae69B2QekbrO3Iuj8OxFy/V1syHOmpfmO', '750e8b43e5ed564462c90ef0d382db26', 1, NULL);

-- --------------------------------------------------------
-- Ejemplos de Panther
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `person` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(30) NOT NULL,
  `lastName` varchar(30) NOT NULL,
  `phone` int(10) NOT NULL,
  `dateDelete` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Bases creadas con la versión anterior de este script
ALTER TABLE `person` ADD COLUMN IF NOT EXISTS `dateDelete` timestamp NULL DEFAULT NULL;

CREATE TABLE IF NOT EXISTS `factura` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `numero` varchar(20) NOT NULL,
  `cliente` varchar(60) NOT NULL,
  `fecha` date NOT NULL,
  `total` decimal(12,2) NOT NULL,
  `dateDelete` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- TallerPro (columnas iguales a las que envía el frontend)
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `cliente` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `cedula` varchar(20) NOT NULL,
  `email` varchar(120) NOT NULL,
  `telefono` varchar(20) NOT NULL,
  `empresa` varchar(100) DEFAULT NULL,
  `estado` varchar(10) NOT NULL DEFAULT 'Activo',
  `dateDelete` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `empleado` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `cedula` varchar(20) NOT NULL,
  `cargo` varchar(50) NOT NULL,
  `telefono` varchar(20) NOT NULL,
  `dateDelete` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `administrador` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `usuario` varchar(20) NOT NULL,
  `correo` varchar(120) NOT NULL,
  `rol` varchar(20) NOT NULL DEFAULT 'Administrador',
  `dateDelete` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS servicio (
  id int(11) NOT NULL AUTO_INCREMENT,
  id_cliente int(11) NOT NULL,
  id_auto int(11) DEFAULT NULL,
  fecha date NOT NULL,
  descripcion varchar(255) NOT NULL,
  costo decimal(12,2) NOT NULL DEFAULT 0,
  estado varchar(15) NOT NULL DEFAULT 'Pendiente',
  dateDelete timestamp NULL DEFAULT NULL,
  PRIMARY KEY (id),
  KEY fk_servicio_cliente (id_cliente),
  CONSTRAINT fk_servicio_cliente FOREIGN KEY (id_cliente) REFERENCES cliente (id) ON DELETE RESTRICT
  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- Autos de los clientes (recurso REST "autos")
CREATE TABLE IF NOT EXISTS `auto` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `placa` varchar(10) NOT NULL,
  `marca` varchar(50) NOT NULL,
  `modelo` varchar(50) NOT NULL,
  `anio` year DEFAULT NULL,
  `color` varchar(30) DEFAULT NULL,
  `kilometraje` int(10) UNSIGNED DEFAULT NULL,
  `id_cliente` int(11) NOT NULL,
  `dateDelete` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_auto_cliente` (`id_cliente`),
  CONSTRAINT `fk_auto_cliente` FOREIGN KEY (`id_cliente`) REFERENCES `cliente` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- --------------------------------------------------------
-- Gestión de citas TallerPro
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `cita` (
    `id_cita` INT NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(120) NOT NULL,
    `correo` VARCHAR(150) NOT NULL,
    `telefono` VARCHAR(15) NOT NULL,
    `servicio` VARCHAR(100) NOT NULL,
    `mensaje` TEXT NOT NULL,
    `fecha_cita` DATE NOT NULL,
    `hora_cita` TIME NOT NULL,
    `estado` ENUM(
        'Pendiente',
        'Confirmada',
        'Cancelada',
        'Atendida'
    ) NOT NULL DEFAULT 'Pendiente',
    `fecha_registro` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id_cita`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- --------------------------------------------------------
-- Datos de ejemplo (solo si las tablas están vacías)
-- --------------------------------------------------------

INSERT INTO `person` (name, lastName, phone)
SELECT 'Nicolás', 'Pinzón', 3419478 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `person`);

INSERT INTO `cliente` (nombre, cedula, email, telefono, empresa, estado)
SELECT * FROM (SELECT 'Daniela Osorio' AS n, '1056777098' AS c, 'daniela.osorio@gmail.com' AS e, '3137826573' AS t, 'Quest' AS em, 'Activo' AS es UNION ALL
               SELECT 'María Fernanda Gómez López', '1007654321', 'maria@tallerpro.com', '310 987 6543', 'Logística S.A.', 'Activo' UNION ALL
               SELECT 'Paula García', '1012345678', 'paula@tallerpro.com', '320 555 1234', 'Independiente', 'Inactivo') d
WHERE NOT EXISTS (SELECT 1 FROM `cliente`);

INSERT INTO `empleado` (nombre, cedula, cargo, telefono)
SELECT * FROM (SELECT 'Juan Carlos Rodríguez Pérez' AS n, '1001234567' AS c, 'Mecánico' AS ca, '300 123 4567' AS t UNION ALL
               SELECT 'María Fernanda Gómez López', '1007654321', 'Recepcionista', '310 987 6543') d
WHERE NOT EXISTS (SELECT 1 FROM `empleado`);

INSERT INTO `administrador` (nombre, usuario, correo, rol)
SELECT * FROM (SELECT 'Laura Gómez' AS n, 'lauraadmin' AS u, 'laura@tallerpro.com' AS c, 'SuperAdmin' AS r UNION ALL
               SELECT 'Camilo Pérez', 'camilo', 'camilo@tallerpro.com', 'Administrador' UNION ALL
               SELECT 'Paula García', 'paula', 'paula@tallerpro.com', 'Administrador' UNION ALL
               SELECT 'Andrés López', 'andres', 'andres@tallerpro.com', 'Administrador') d
WHERE NOT EXISTS (SELECT 1 FROM `administrador`);

INSERT INTO `auto` (placa, marca, modelo, anio, color, kilometraje, id_cliente)
SELECT 'ABC123', 'Chevrolet', 'Spark GT', 2018, 'Rojo', 65000, (SELECT MIN(id) FROM `cliente`) FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `auto`) AND EXISTS (SELECT 1 FROM `cliente`);
