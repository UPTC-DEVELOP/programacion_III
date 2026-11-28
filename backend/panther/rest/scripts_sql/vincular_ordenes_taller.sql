-- MariaDB / phpMyAdmin. Ejecutar en panther sin escrituras simultáneas de órdenes.
-- Para instalaciones nuevas usar catalogos_taller.sql y después ordenes.sql.
DELIMITER $$
BEGIN NOT ATOMIC
    DECLARE fk_vehiculo VARCHAR(64);
    DECLARE fk_cliente VARCHAR(64);
    DECLARE actuales INT;
    SELECT COUNT(*) INTO actuales
    FROM information_schema.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ordenes'
      AND REFERENCED_TABLE_SCHEMA = DATABASE() AND REFERENCED_COLUMN_NAME = 'id'
      AND ((COLUMN_NAME = 'vehiculo_id' AND REFERENCED_TABLE_NAME = 'vehiculo_taller')
        OR (COLUMN_NAME = 'cliente_id' AND REFERENCED_TABLE_NAME = 'cliente_taller'));

    IF actuales <> 2 THEN
        IF EXISTS (SELECT 1 FROM ordenes LIMIT 1) THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Hay ordenes existentes. Se requiere mapear sus propietarios y vehiculos antes de migrar.';
        END IF;
        SELECT MAX(CASE WHEN COLUMN_NAME = 'vehiculo_id' AND REFERENCED_TABLE_NAME = 'vehiculos' THEN CONSTRAINT_NAME END),
               MAX(CASE WHEN COLUMN_NAME = 'cliente_id' AND REFERENCED_TABLE_NAME = 'clientes' THEN CONSTRAINT_NAME END)
          INTO fk_vehiculo, fk_cliente
        FROM information_schema.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ordenes'
          AND REFERENCED_TABLE_SCHEMA = DATABASE() AND REFERENCED_COLUMN_NAME = 'id';
        IF fk_vehiculo IS NULL OR fk_cliente IS NULL THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Las claves de ordenes difieren del esquema original. Revisa SHOW CREATE TABLE ordenes.';
        END IF;
        SET @cambio = CONCAT('ALTER TABLE ordenes DROP FOREIGN KEY `', REPLACE(fk_vehiculo,'`','``'),
            '`, DROP FOREIGN KEY `', REPLACE(fk_cliente,'`','``'), '`, ',
            'MODIFY vehiculo_id INT UNSIGNED NOT NULL, MODIFY cliente_id INT UNSIGNED NOT NULL, ',
            'ADD CONSTRAINT fk_orden_vehiculo_taller FOREIGN KEY (vehiculo_id) REFERENCES vehiculo_taller(id), ',
            'ADD CONSTRAINT fk_orden_cliente_taller FOREIGN KEY (cliente_id) REFERENCES cliente_taller(id)');
        PREPARE migracion FROM @cambio;
        EXECUTE migracion;
        DEALLOCATE PREPARE migracion;
    END IF;
END$$
DELIMITER ;
