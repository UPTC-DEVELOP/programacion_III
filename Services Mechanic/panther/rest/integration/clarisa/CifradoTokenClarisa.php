<?php

require_once __DIR__ . '/ExcepcionClarisa.php';

/**
 * Protege tokens de Clarisa mediante cifrado autenticado AES-256-GCM.
 */
class CifradoTokenClarisa
{
    const VARIABLE_ENTORNO_CLAVE = 'CLARISA_CACHE_KEY';
    const ALGORITMO_CIFRADO = 'aes-256-gcm';
    const LONGITUD_CLAVE_BYTES = 32;
    const LONGITUD_VECTOR_INICIALIZACION_BYTES = 12;
    const LONGITUD_ETIQUETA_BYTES = 16;
    const LONGITUD_MAXIMA_TOKEN = 8192;

    private $clave;
    private $longitudVectorInicializacion;

    /**
     * Lee una clave Base64 canónica de exactamente 32 bytes desde el entorno.
     *
     * @throws ExcepcionClarisa Si OpenSSL o la clave no son válidos.
     */
    public function __construct()
    {
        if (!extension_loaded('openssl')
            || !function_exists('openssl_encrypt')
            || !function_exists('openssl_decrypt')) {
            throw new ExcepcionClarisa(
                ExcepcionClarisa::TIPO_CONFIGURACION,
                'OpenSSL es necesario para proteger la caché de Clarisa.'
            );
        }

        $claveCodificada = getenv(self::VARIABLE_ENTORNO_CLAVE);

        if ($claveCodificada === false
            || !is_string($claveCodificada)
            || !preg_match('/^[A-Za-z0-9+\/]{43}=$/D', $claveCodificada)) {
            throw $this->crearExcepcionClaveInvalida();
        }

        $clave = base64_decode($claveCodificada, true);

        if ($clave === false
            || strlen($clave) !== self::LONGITUD_CLAVE_BYTES
            || base64_encode($clave) !== $claveCodificada) {
            throw $this->crearExcepcionClaveInvalida();
        }

        $longitudVector = openssl_cipher_iv_length(self::ALGORITMO_CIFRADO);

        if ($longitudVector !== self::LONGITUD_VECTOR_INICIALIZACION_BYTES) {
            throw new ExcepcionClarisa(
                ExcepcionClarisa::TIPO_CONFIGURACION,
                'La instalación OpenSSL no admite la configuración segura requerida.'
            );
        }

        $this->clave = $clave;
        $this->longitudVectorInicializacion = $longitudVector;
    }

    /**
     * Cifra y autentica un token usando un IV aleatorio por operación.
     *
     * @param string $tokenAutorizacion Token completo, incluido Bearer.
     * @param string $datosAutenticados Metadatos enlazados al cifrado.
     * @return array Texto cifrado, IV y etiqueta binarios.
     * @throws ExcepcionClarisa Ante datos inválidos o fallos criptográficos.
     */
    public function cifrar($tokenAutorizacion, $datosAutenticados)
    {
        $this->validarToken($tokenAutorizacion);
        $this->validarDatosAutenticados($datosAutenticados);

        try {
            $vectorInicializacion = random_bytes($this->longitudVectorInicializacion);
        } catch (Throwable $excepcion) {
            throw new ExcepcionClarisa(
                ExcepcionClarisa::TIPO_SEGURIDAD,
                'No fue posible generar material aleatorio seguro para la caché.'
            );
        }

        $etiquetaAutenticacion = '';
        $textoCifrado = openssl_encrypt(
            $tokenAutorizacion,
            self::ALGORITMO_CIFRADO,
            $this->clave,
            OPENSSL_RAW_DATA,
            $vectorInicializacion,
            $etiquetaAutenticacion,
            $datosAutenticados,
            self::LONGITUD_ETIQUETA_BYTES
        );

        if ($textoCifrado === false
            || strlen($etiquetaAutenticacion) !== self::LONGITUD_ETIQUETA_BYTES) {
            throw new ExcepcionClarisa(
                ExcepcionClarisa::TIPO_SEGURIDAD,
                'No fue posible cifrar el contexto de Clarisa de forma segura.'
            );
        }

        return array(
            'textoCifrado' => $textoCifrado,
            'vectorInicializacion' => $vectorInicializacion,
            'etiquetaAutenticacion' => $etiquetaAutenticacion
        );
    }

    /**
     * Verifica la etiqueta GCM y recupera el token original.
     *
     * @param string $textoCifrado Contenido binario cifrado.
     * @param string $vectorInicializacion IV binario almacenado.
     * @param string $etiquetaAutenticacion Etiqueta GCM binaria.
     * @param string $datosAutenticados Metadatos usados durante el cifrado.
     * @return string Token de autorización original.
     * @throws ExcepcionClarisa Si el contenido fue modificado o la clave difiere.
     */
    public function descifrar(
        $textoCifrado,
        $vectorInicializacion,
        $etiquetaAutenticacion,
        $datosAutenticados
    ) {
        if (!is_string($textoCifrado)
            || $textoCifrado === ''
            || strlen($textoCifrado) > self::LONGITUD_MAXIMA_TOKEN
            || !is_string($vectorInicializacion)
            || strlen($vectorInicializacion) !== $this->longitudVectorInicializacion
            || !is_string($etiquetaAutenticacion)
            || strlen($etiquetaAutenticacion) !== self::LONGITUD_ETIQUETA_BYTES) {
            throw $this->crearExcepcionContenidoInvalido();
        }

        $this->validarDatosAutenticados($datosAutenticados);

        $tokenAutorizacion = openssl_decrypt(
            $textoCifrado,
            self::ALGORITMO_CIFRADO,
            $this->clave,
            OPENSSL_RAW_DATA,
            $vectorInicializacion,
            $etiquetaAutenticacion,
            $datosAutenticados
        );

        if ($tokenAutorizacion === false) {
            throw $this->crearExcepcionContenidoInvalido();
        }

        $this->validarToken($tokenAutorizacion);

        return $tokenAutorizacion;
    }

    private function validarToken($tokenAutorizacion)
    {
        if (!is_string($tokenAutorizacion)
            || strpos($tokenAutorizacion, 'Bearer ') !== 0
            || strlen($tokenAutorizacion) <= strlen('Bearer ')
            || strlen($tokenAutorizacion) > self::LONGITUD_MAXIMA_TOKEN
            || preg_match('/[\x00-\x1F\x7F]/', $tokenAutorizacion) === 1) {
            throw new ExcepcionClarisa(
                ExcepcionClarisa::TIPO_SEGURIDAD,
                'El token entregado para la caché de Clarisa no es válido.'
            );
        }
    }

    private function validarDatosAutenticados($datosAutenticados)
    {
        if (!is_string($datosAutenticados)
            || $datosAutenticados === ''
            || strlen($datosAutenticados) > 65535) {
            throw new ExcepcionClarisa(
                ExcepcionClarisa::TIPO_SEGURIDAD,
                'Los metadatos autenticados de la caché no son válidos.'
            );
        }
    }

    private function crearExcepcionClaveInvalida()
    {
        return new ExcepcionClarisa(
            ExcepcionClarisa::TIPO_CONFIGURACION,
            'CLARISA_CACHE_KEY debe ser Base64 canónico de exactamente 32 bytes.'
        );
    }

    private function crearExcepcionContenidoInvalido()
    {
        return new ExcepcionClarisa(
            ExcepcionClarisa::TIPO_SEGURIDAD,
            'El contenido cifrado de la caché de Clarisa no superó la validación.'
        );
    }
}
