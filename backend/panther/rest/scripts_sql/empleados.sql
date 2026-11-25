CREATE TABLE IF NOT EXISTS empleado_taller (
    cedula VARCHAR(10) PRIMARY KEY,
    nombre VARCHAR(30) NOT NULL,
    apellido VARCHAR(30) NOT NULL,
    telefono VARCHAR(10) NOT NULL,
    correo VARCHAR(100) NULL UNIQUE,
    rol VARCHAR(30) NOT NULL,
    estado ENUM('Activo','Inactivo') NOT NULL DEFAULT 'Activo'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
