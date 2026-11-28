-- ============================================================================
-- Olimac Riders Store - Datos Base de Acceso (Panther)
-- Archivo: database/seed_taller.sql
-- Compatibilidad: MariaDB 10.4+ y MySQL 8.0+ (utf8mb4_unicode_ci)
--
-- Este archivo inserta únicamente roles y usuarios base para autenticación.
-- No inserta datos de ejemplo en las tablas de negocio (repuestos, clientes,
-- vehículos, inventario, órdenes, facturas, empleados ni proveedores).
--
-- Credenciales base Panther (j4user):
--   Usuario: admin     | Contraseña: admin123 | Rol: ADMIN
--   Usuario: mecanico  | Contraseña: admin123 | Rol: MECANICO
-- ============================================================================

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `taller_mecanico`;

-- 1. Roles base Panther
INSERT IGNORE INTO `j4rol` (`id`, `name`, `description`) VALUES
(1, 'ADMIN', 'Administrador general del taller mecánico'),
(2, 'MECANICO', 'Técnico encargado de órdenes de servicio e inventario'),
(3, 'RECEPCIONISTA', 'Atención al cliente, vehículos y facturación');

-- 2. Usuarios base Panther (password hash BCRYPT de "admin123")
INSERT IGNORE INTO `j4user` (`id`, `user`, `password`, `keyAPI`, `roles`) VALUES
(1, 'admin', '$2y$12$wDSNdxbZDuQ1dbuMub6tO.CUzjPo.9/d6o5HKzH/HxFGrweeJHc4O', 'panther_taller_admin_2026_key001', 'ADMIN'),
(2, 'mecanico', '$2y$12$wDSNdxbZDuQ1dbuMub6tO.CUzjPo.9/d6o5HKzH/HxFGrweeJHc4O', 'panther_taller_mec_2026_key002', 'MECANICO');
