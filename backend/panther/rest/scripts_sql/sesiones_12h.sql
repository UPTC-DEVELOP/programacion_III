-- Ejecutar en la base panther existente, con MariaDB.
ALTER TABLE j4user
    ADD COLUMN IF NOT EXISTS intentosFallidos SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS bloqueoHasta DATETIME NULL DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS sesionHasta DATETIME NULL DEFAULT NULL;

INSERT INTO j4rol (id,name,description)
SELECT COALESCE(MAX(id),0)+1,'jefe_taller','Jefe de taller' FROM j4rol
HAVING COUNT(CASE WHEN name='jefe_taller' THEN 1 END)=0;
