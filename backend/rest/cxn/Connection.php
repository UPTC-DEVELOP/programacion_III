<?php
declare(strict_types=1);
namespace panther\cxn;
use PDO;
use PDOStatement;
use PDOException;

use panther\cxn\LoginMysql;
use panther\util\ExcepcionAPI;
use panther\util\Status;

/**
 * ============================================================
 * Clase: Connection
 * ------------------------------------------------------------
 * Descripción:
 *  - Gestiona la conexión a la base de datos MySQL.
 *  - Implementa el patrón Singleton para garantizar
 *    una única conexión activa durante la ejecución.
 *  - Usa PDO como capa de abstracción de base de datos.
 * ------------------------------------------------------------
 * Caso de Uso:
 *  - Módulo PANTHER - Seguridad
 * ------------------------------------------------------------
 * @author
 *     Josué Nicolás Pinzón Villamil
 * @updated
 *     Actualizado por Proyecto Actualización Panther 2025
 * ============================================================
 */
class Connection
{
    /**
     * ============================================================
     * @var ?Connection $db
     * Instancia única de la clase Connection (patrón Singleton)
     * ============================================================
     */
    private static ?Connection $db = null;

    /**
     * ============================================================
     * @var ?PDO $pdo
     * Instancia activa de la conexión PDO
     * ============================================================
     */
    private static ?PDO $pdo = null;

    /**
     * ============================================================
     * Constructor privado
     * ------------------------------------------------------------
     * - Se ejecuta solo una vez cuando se crea la instancia Singleton.
     * - Intenta establecer una conexión a la base de datos.
     * ============================================================
     */
    final private function __construct()
    {
        try {
            self::getConnection();
        } catch (PDOException $e) {
            // Lanza una excepción personalizada si falla la conexión
            throw new ExcepcionApi(
                Status::INTERNAL_SERVER_ERROR,
                Status::ST500,
                "Error al conectar a la base de datos: " . $e->getMessage()
            );
        }
    }

    /**
     * ============================================================
     * Método estático getInstance()
     * ------------------------------------------------------------
     * - Retorna una única instancia de la clase Connection.
     * - Si no existe, la crea automáticamente.
     *
     * @return Connection Instancia única del manejador de conexión
     * ============================================================
     */
    public static function getInstance(): Connection
    {
        if (self::$db === null) {
            self::$db = new self();
        }
        return self::$db;
    }

    /**
     * ============================================================
     * Método getConnection()
     * ------------------------------------------------------------
     * - Devuelve la conexión PDO activa.
     * - Si no existe, la crea basándose en las constantes de LoginMysql.php.
     *
     * Constantes necesarias:
     *   HOST_NAME, DATA_BASE, USER, PASSWORD
     *
     * Opciones de configuración PDO:
     *   - UTF-8 por defecto.
     *   - Modo de error: Excepciones.
     *   - Modo de recuperación de datos: FETCH_ASSOC.
     *
     * @return PDO Conexión activa a la base de datos
     * ============================================================
     */
    public function getConnection(): PDO
    {
        if (self::$pdo === null) {
            // Obtener configuración desde LoginMysql
            $config  = LoginMysql::getConfig();
            $port    = $config['PORT'] ?? '3306';
            $charset = $config['CHARSET'] ?? 'utf8mb4';

            // Construcción del DSN (compatible con MariaDB y MySQL 8.0+)
            $dsn = sprintf(
                'mysql:host=%s;port=%s;dbname=%s;charset=%s',
                $config['HOST_NAME'],
                $port,
                $config['DATA_BASE'],
                $charset
            );

            // Configuración de opciones PDO
            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,   // Lanzar excepciones en errores
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,         // Resultados asociativos
                PDO::ATTR_PERSISTENT         => false,                    // Conexión no persistente
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES {$charset} COLLATE utf8mb4_unicode_ci"
            ];

            try {
                // Crear conexión PDO
                self::$pdo = new PDO($dsn, $config['USER'], $config['PASSWORD'], $options);
            } catch (PDOException $e) {
                // Captura de error al crear la conexión
               throw new ExcepcionApi(
                    Status::INTERNAL_SERVER_ERROR,
                    Status::ST500,
                    "Error PDO al inicializar la conexión: " . $e->getMessage()
                );
            }
        }

        return self::$pdo;
    }

    /**
     * ============================================================
     * Método __clone()
     * ------------------------------------------------------------
     * - Protege el patrón Singleton impidiendo la clonación.
     * ============================================================
     */
    final protected function __clone(): void
    {
        // No se permite clonar la instancia Singleton
    }

    /**
     * ============================================================
     * Método destructor
     * ------------------------------------------------------------
     * - Libera la conexión PDO cuando el objeto se destruye.
     * - Cierra explícitamente la conexión asignando null.
     * ============================================================
     */
    public function __destruct()
    {
        self::$pdo = null;
    }

    /**
     * ============================================================
     * Método close()
     * ------------------------------------------------------------
     * - Permite cerrar manualmente la conexión PDO.
     * ============================================================
     */
    public function close(): void
    {
        self::$pdo = null;
    }
}
?>
