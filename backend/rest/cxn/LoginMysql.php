<?php
declare(strict_types=1);

namespace panther\cxn;

use RuntimeException;

/**
 * ============================================================
 * Clase: LoginMysql
 * ------------------------------------------------------------
 * Gestiona las credenciales y configuración de conexión
 * a la base de datos MySQL según el entorno definido.
 *
 * Compatible con PSR-4 y Composer Autoload.
 *
 * @author
 *     Josué Nicolás Pinzón Villamil
 * @updated
 *     Actualizado por Proyecto Actualización Panther 2025
 * ============================================================
 */
final class LoginMysql
{
    /**
     * Entorno actual del sistema (dev, test, prod)
     */
    private const ENVIRONMENT = 'dev';

    /**
     * Configuración de conexión para cada entorno
     */
    private const CONFIG = [
        'dev' => [
            'HOST_NAME' => '127.0.0.1',
            'PORT'      => '3306',
            'DATA_BASE' => 'taller_mecanico',
            'USER'      => 'root',
            'PASSWORD'  => '12345',
            'CHARSET'   => 'utf8mb4',
        ],
        'test' => [
            'HOST_NAME' => '127.0.0.1',
            'PORT'      => '3306',
            'DATA_BASE' => 'taller_mecanico',
            'USER'      => 'root',
            'PASSWORD'  => '12345',
            'CHARSET'   => 'utf8mb4',
        ],
        'prod' => [
            'HOST_NAME' => 'localhost',
            'PORT'      => '3306',
            'DATA_BASE' => 'panther_prod',
            'USER'      => 'panther_user',
            'PASSWORD'  => 'contraseña_segura_aquí',
            'CHARSET'   => 'utf8mb4',
        ],
    ];

    /**
     * Obtiene la configuración activa según el entorno
     *
     * @return array<string,string>
     * @throws RuntimeException si el entorno es inválido
     */
    public static function getConfig(): array
    {
        $env = self::ENVIRONMENT;
        return self::CONFIG[$env]
            ?? throw new RuntimeException("Entorno de ejecución no válido: {$env}");
    }

    /**
     * Retorna una constante específica del entorno actual
     *
     * @param string $key
     * @return string
     * @throws RuntimeException
     */
    public static function get(string $key): string
    {
        $config = self::getConfig();

        return $config[$key]
            ?? throw new RuntimeException("Parámetro de conexión no encontrado: {$key}");
    }
}