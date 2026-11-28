CREATE TABLE IF NOT EXISTS clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL,
    email VARCHAR(120) NULL,
    telefono VARCHAR(30) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS vehiculos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    placa VARCHAR(15) NOT NULL UNIQUE,
    cliente_id INT NOT NULL,
    marca VARCHAR(60) NULL,
    modelo VARCHAR(60) NULL,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS ordenes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vehiculo_id INT NOT NULL,
    cliente_id INT NOT NULL,
    mecanico_cedula VARCHAR(10) NULL,
    fecha_hora DATETIME NOT NULL,
    diagnostico TEXT NOT NULL,
    estado ENUM('pendiente', 'asignada', 'en_proceso', 'finalizada', 'cancelada') NOT NULL DEFAULT 'pendiente',
    horas_trabajadas DECIMAL(6,2) NOT NULL DEFAULT 0.00,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehiculo_id) REFERENCES vehiculos(id),
    FOREIGN KEY (cliente_id) REFERENCES clientes(id),
    FOREIGN KEY (mecanico_cedula) REFERENCES empleado_taller(cedula)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS orden_horas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    orden_id INT NOT NULL,
    mecanico_cedula VARCHAR(10) NOT NULL,
    horas DECIMAL(5,2) NOT NULL,
    nota VARCHAR(255) NULL,
    registrado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (orden_id) REFERENCES ordenes(id),
    FOREIGN KEY (mecanico_cedula) REFERENCES empleado_taller(cedula)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;