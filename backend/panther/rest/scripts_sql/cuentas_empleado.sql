CREATE TABLE IF NOT EXISTS cuenta_empleado (
    usuario_id INT NOT NULL PRIMARY KEY,
    cedula VARCHAR(10) NOT NULL UNIQUE,
    FOREIGN KEY (usuario_id) REFERENCES j4user(id),
    FOREIGN KEY (cedula) REFERENCES empleado_taller(cedula)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
