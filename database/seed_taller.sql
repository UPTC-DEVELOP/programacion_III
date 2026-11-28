-- Roles y usuarios base del taller.
-- Contraseña de todos: admin123
-- admin (ADMIN), mecanico (MECANICO), recepcionista (RECEPCIONISTA)

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `taller_mecanico`;

INSERT IGNORE INTO `j4rol` (`id`, `name`, `description`) VALUES
(1, 'ADMIN', 'Administrador general del taller mecánico'),
(2, 'MECANICO', 'Técnico encargado de órdenes de servicio e inventario'),
(3, 'RECEPCIONISTA', 'Atención al cliente, vehículos y facturación');

INSERT IGNORE INTO `j4user` (`id`, `user`, `password`, `keyAPI`, `roles`) VALUES
(1, 'admin', '$2y$12$wDSNdxbZDuQ1dbuMub6tO.CUzjPo.9/d6o5HKzH/HxFGrweeJHc4O', 'panther_taller_admin_2026_key001', 'ADMIN'),
(2, 'mecanico', '$2y$12$wDSNdxbZDuQ1dbuMub6tO.CUzjPo.9/d6o5HKzH/HxFGrweeJHc4O', 'panther_taller_mec_2026_key002', 'MECANICO'),
(3, 'recepcionista', '$2y$12$wDSNdxbZDuQ1dbuMub6tO.CUzjPo.9/d6o5HKzH/HxFGrweeJHc4O', 'panther_taller_recep_2026_key003', 'RECEPCIONISTA');
