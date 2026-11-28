<?php
declare(strict_types=1);

namespace panther\util;

/** Credenciales y URLs del ambiente de pruebas de Clarisa. */
final class ClarisaConfig
{
    public const URL_LOGIN = 'https://pru.clarisacloud.com:8443/seguridad/rest/api/v1/login/';
    public const URL_FACTURA_NACIONAL = 'https://pru.clarisacloud.com:8443/api/factura/rest/v1/factura/nacional';

    public const SANDBOX_HOST = 'pru.clarisacloud.com';
    public const SANDBOX_PORT = 8443;
    public const SANDBOX_SCHEME = 'https';

    // Usuario y contraseña del ambiente de pruebas
    public const CLARISA_USERNAME = 'DEMO_API';
    public const CLARISA_PASSWORD = '12345678';

    // Datos del emisor en pruebas
    public const EMISOR_NIT = '900000000';
    public const NUMERO_RESOLUCION = '18760000001';
    public const PREFIJO_DCTO = 'SETP';

    public const DIAS_VENCIMIENTO = 15;
    public const CURL_TIMEOUT = 30;
    public const CURL_CONNECT_TIMEOUT = 10;

    public static function credencialesConfiguradas(): bool
    {
        return trim(self::CLARISA_USERNAME) !== '' && trim(self::CLARISA_PASSWORD) !== '';
    }
}
