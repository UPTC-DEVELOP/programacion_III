<?php

class DatabaseMigrations
{
    const MIGRATION_VERSION = '2026112701';
    const LOCK_NAME = 'panther_schema_migrations';

    public static function run(PDO $pdo)
    {
        $lock = $pdo->prepare('SELECT GET_LOCK(?, 10)');
        $lock->execute(array(self::LOCK_NAME));

        if ((int) $lock->fetchColumn() !== 1) {
            throw new RuntimeException('No fue posible obtener el bloqueo para actualizar el esquema de Panther.');
        }

        try {
            $pdo->exec(
                'CREATE TABLE IF NOT EXISTS panther_schema_migrations (
                    version VARCHAR(64) NOT NULL PRIMARY KEY,
                    applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=latin1'
            );

            $statement = $pdo->prepare(
                'SELECT COUNT(*) FROM panther_schema_migrations WHERE version = ?'
            );
            $statement->execute(array(self::MIGRATION_VERSION));

            if ((int) $statement->fetchColumn() > 0) {
                return;
            }

            self::migrate($pdo);

            $statement = $pdo->prepare(
                'INSERT INTO panther_schema_migrations (version) VALUES (?)'
            );
            $statement->execute(array(self::MIGRATION_VERSION));
        } finally {
            $release = $pdo->prepare('SELECT RELEASE_LOCK(?)');
            $release->execute(array(self::LOCK_NAME));
        }
    }

    private static function migrate(PDO $pdo)
    {
        if (!self::tableExists($pdo, 'person') || !self::tableExists($pdo, 'j4rol')) {
            throw new RuntimeException(
                'Faltan tablas base de Panther. Importe database/panther.sql antes de iniciar la API.'
            );
        }

        $pdo->exec(
            'CREATE TABLE IF NOT EXISTS documenttype (
                id INT(11) NOT NULL AUTO_INCREMENT,
                nombre_corto VARCHAR(5) DEFAULT NULL,
                nombre_largo TEXT DEFAULT NULL,
                dateDelete DATETIME DEFAULT NULL,
                PRIMARY KEY (id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci'
        );

        $pdo->exec(
            "INSERT IGNORE INTO documenttype (id, nombre_corto, nombre_largo, dateDelete) VALUES
                (1, 'CC', 'Cedula ciudadania', NULL),
                (2, 'CE', 'Cedula Extranjeria', NULL),
                (3, 'NIT', 'Numero Identificacion Tributario', NULL),
                (11, 'PA', 'Pasaporte', NULL)"
        );

        self::addColumn($pdo, 'j4rol', 'dateDelete', 'TIMESTAMP NULL DEFAULT NULL');
        $pdo->exec('ALTER TABLE j4user MODIFY roles INT(2) NOT NULL DEFAULT 3');
        self::addColumn($pdo, 'person', 'dateDelete', 'DATETIME DEFAULT NULL');
        self::addColumn($pdo, 'person', 'document_type_id', 'INT(11) NULL DEFAULT NULL');
        self::addColumn($pdo, 'person', 'identitydocument', 'VARCHAR(20) NULL DEFAULT NULL');
        self::addColumn($pdo, 'person', 'email', 'TEXT DEFAULT NULL');
        self::addColumn($pdo, 'person', 'address', 'VARCHAR(60) DEFAULT NULL');

        $pdo->exec('ALTER TABLE person MODIFY phone VARCHAR(20) NOT NULL');

        if (!self::indexExists($pdo, 'person', 'documenttype')) {
            $pdo->exec('ALTER TABLE person ADD KEY documenttype (document_type_id)');
        }

        if (!self::foreignKeyExists($pdo, 'person', 'document_type_id', 'documenttype', 'id')) {
            $pdo->exec(
                'ALTER TABLE person
                    ADD CONSTRAINT fk_person_documenttype
                    FOREIGN KEY (document_type_id) REFERENCES documenttype (id)
                    ON UPDATE CASCADE'
            );
        }
    }

    private static function tableExists(PDO $pdo, $table)
    {
        $statement = $pdo->prepare(
            'SELECT COUNT(*) FROM information_schema.TABLES
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?'
        );
        $statement->execute(array($table));
        return (int) $statement->fetchColumn() > 0;
    }

    private static function columnExists(PDO $pdo, $table, $column)
    {
        $statement = $pdo->prepare(
            'SELECT COUNT(*) FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?'
        );
        $statement->execute(array($table, $column));
        return (int) $statement->fetchColumn() > 0;
    }

    private static function addColumn(PDO $pdo, $table, $column, $definition)
    {
        if (!self::columnExists($pdo, $table, $column)) {
            $pdo->exec('ALTER TABLE `' . $table . '` ADD COLUMN `' . $column . '` ' . $definition);
        }
    }

    private static function indexExists(PDO $pdo, $table, $index)
    {
        $statement = $pdo->prepare(
            'SELECT COUNT(*) FROM information_schema.STATISTICS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?'
        );
        $statement->execute(array($table, $index));
        return (int) $statement->fetchColumn() > 0;
    }

    private static function foreignKeyExists(PDO $pdo, $table, $column, $referencedTable, $referencedColumn)
    {
        $statement = $pdo->prepare(
            'SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE
             WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_NAME = ?
               AND COLUMN_NAME = ?
               AND REFERENCED_TABLE_NAME = ?
               AND REFERENCED_COLUMN_NAME = ?'
        );
        $statement->execute(array($table, $column, $referencedTable, $referencedColumn));
        return (int) $statement->fetchColumn() > 0;
    }
}
