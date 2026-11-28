-- Importar empleados.sql y catalogos_taller.sql antes de este archivo.
CREATE TABLE IF NOT EXISTS ordenes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vehiculo_id INT UNSIGNED NOT NULL,
    cliente_id INT UNSIGNED NOT NULL,
    mecanico_cedula VARCHAR(10) NULL,
    fecha_hora DATETIME NOT NULL,
    diagnostico TEXT NOT NULL,
    estado ENUM('pendiente', 'asignada', 'en_proceso', 'finalizada', 'cancelada') NOT NULL DEFAULT 'pendiente',
    horas_trabajadas DECIMAL(6,2) NOT NULL DEFAULT 0.00,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehiculo_id) REFERENCES vehiculo_taller(id),
    FOREIGN KEY (cliente_id) REFERENCES cliente_taller(id),
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