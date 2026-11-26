INSERT INTO j4rol (id, name, description)
SELECT COALESCE(MAX(id), 0) + 1, 'recepcion', 'Recepción del taller'
FROM j4rol
HAVING COUNT(CASE WHEN name = 'recepcion' THEN 1 END) = 0;

INSERT INTO j4rol (id, name, description)
SELECT COALESCE(MAX(id), 0) + 1, 'mecanico', 'Mecánico del taller'
FROM j4rol
HAVING COUNT(CASE WHEN name = 'mecanico' THEN 1 END) = 0;

INSERT INTO j4rol (id, name, description)
SELECT COALESCE(MAX(id), 0) + 1, 'almacenista', 'Almacenista del taller'
FROM j4rol
HAVING COUNT(CASE WHEN name = 'almacenista' THEN 1 END) = 0;

SELECT id, name, description
FROM j4rol
ORDER BY id;