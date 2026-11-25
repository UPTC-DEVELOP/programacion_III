<?php

require_once __DIR__ . '/ExcepcionClarisa.php';

/**
 * Centraliza la configuración del ambiente de pruebas de Clarisa.
 *
 * Las credenciales se leen exclusivamente desde variables de entorno. La URL
 * configurada debe coincidir exactamente con el endpoint de pruebas autorizado.
 */
class ConfiguracionClarisa
{
    const URL_AUTENTICACION_PRUEBAS = 'https://pru.clarisacloud.com:8443/seguridad/rest/api/v1/login/';
    const URL_FACTURACION_PRUEBAS = 'https://pru.clarisacloud.com:8443/api/factura/rest/v1/factura/nacional';

    const TIEMPO_ESPERA_CONEXION_PREDETERMINADO_SEGUNDOS = 5;
    const TIEMPO_ESPERA_SOLICITUD_PREDETERMINADO_SEGUNDOS = 15;
    const TAMANO_MAXIMO_RESPUESTA_PREDETERMINADO_BYTES = 1048576;

    const TIEMPO_ESPERA_CONEXION_MINIMO_SEGUNDOS = 1;
    const TIEMPO_ESPERA_CONEXION_MAXIMO_SEGUNDOS = 30;
    const TIEMPO_ESPERA_SOLICITUD_MINIMO_SEGUNDOS = 1;
    const TIEMPO_ESPERA_SOLICITUD_MAXIMO_SEGUNDOS = 120;
    const TAMANO_RESPUESTA_MINIMO_BYTES = 1024;
    const TAMANO_RESPUESTA_MAXIMO_BYTES = 5242880;
    const LONGITUD_MINIMA_CREDENCIAL = 5;
    const LONGITUD_MAXIMA_CREDENCIAL = 255;

    const VARIABLE_ENTORNO_URL_AUTENTICACION = 'CLARISA_AUTH_URL';
    const VARIABLE_ENTORNO_USUARIO = 'CLARISA_USERNAME';
    const VARIABLE_ENTORNO_CONTRASENIA = 'CLARISA_PASSWORD';
    const VARIABLE_ENTORNO_TIEMPO_CONEXION = 'CLARISA_CONNECT_TIMEOUT';
    const VARIABLE_ENTORNO_TIEMPO_SOLICITUD = 'CLARISA_REQUEST_TIMEOUT';
    const VARIABLE_ENTORNO_MAXIMO_RESPUESTA = 'CLARISA_MAX_RESPONSE_BYTES';
    const VARIABLE_ENTORNO_CERTIFICADOS_CA = 'CLARISA_CA_BUNDLE';

    private $urlAutenticacion;
    private $tiempoEsperaConexion;
    private $tiempoEsperaSolicitud;
    private $tamanoMaximoRespuestaBytes;
    private $rutaCertificadosCa;

    /**
     * Lee y valida la configuración privada del proceso servidor.
     *
     * @throws ExcepcionClarisa Si un valor es inválido o inseguro.
     */
    public function __construct()
    {
        $urlAutenticacion = $this->obtenerVariableEntornoOpcional(
            self::VARIABLE_ENTORNO_URL_AUTENTICACION
        );
        $this->urlAutenticacion = $urlAutenticacion === null
            ? self::URL_AUTENTICACION_PRUEBAS
            : trim($urlAutenticacion);
        if ($this->urlAutenticacion !== self::URL_AUTENTICACION_PRUEBAS) {
            throw new ExcepcionClarisa(
                ExcepcionClarisa::TIPO_SEGURIDAD,
                'El endpoint de autenticación solicitado no está autorizado para Clarisa.'
            );
        }

        $this->tiempoEsperaConexion = $this->obtenerEnteroEntorno(
            self::VARIABLE_ENTORNO_TIEMPO_CONEXION,
            self::TIEMPO_ESPERA_CONEXION_PREDETERMINADO_SEGUNDOS,
            self::TIEMPO_ESPERA_CONEXION_MINIMO_SEGUNDOS,
            self::TIEMPO_ESPERA_CONEXION_MAXIMO_SEGUNDOS
        );
        $this->tiempoEsperaSolicitud = $this->obtenerEnteroEntorno(
            self::VARIABLE_ENTORNO_TIEMPO_SOLICITUD,
            self::TIEMPO_ESPERA_SOLICITUD_PREDETERMINADO_SEGUNDOS,
            self::TIEMPO_ESPERA_SOLICITUD_MINIMO_SEGUNDOS,
            self::TIEMPO_ESPERA_SOLICITUD_MAXIMO_SEGUNDOS
        );
        $this->tamanoMaximoRespuestaBytes = $this->obtenerEnteroEntorno(
            self::VARIABLE_ENTORNO_MAXIMO_RESPUESTA,
            self::TAMANO_MAXIMO_RESPUESTA_PREDETERMINADO_BYTES,
            self::TAMANO_RESPUESTA_MINIMO_BYTES,
            self::TAMANO_RESPUESTA_MAXIMO_BYTES
        );

        if ($this->tiempoEsperaSolicitud < $this->tiempoEsperaConexion) {
            throw new ExcepcionClarisa(
                ExcepcionClarisa::TIPO_CONFIGURACION,
                'El tiempo total de Clarisa no puede ser menor que el tiempo de conexión.'
            );
        }

        $rutaCertificadosCa = $this->obtenerVariableEntornoOpcional(
            self::VARIABLE_ENTORNO_CERTIFICADOS_CA
        );

        if ($rutaCertificadosCa !== null) {
            $rutaCertificadosCa = trim($rutaCertificadosCa);

            if ($rutaCertificadosCa === ''
                || !is_file($rutaCertificadosCa)
                || !is_readable($rutaCertificadosCa)) {
                throw new ExcepcionClarisa(
                    ExcepcionClarisa::TIPO_CONFIGURACION,
                    'El archivo de certificados configurado para Clarisa no es legible.'
                );
            }
        }

        $this->rutaCertificadosCa = $rutaCertificadosCa;
    }

    /**
     * Obtiene el endpoint autorizado de autenticación.
     *
     * @return string
     */
    public function obtenerUrlAutenticacion()
    {
        return $this->urlAutenticacion;
    }

    /**
     * Obtiene el endpoint autorizado de facturación nacional de pruebas.
     *
     * @return string
     */
    public function obtenerUrlFacturacion()
    {
        return self::URL_FACTURACION_PRUEBAS;
    }

    /**
     * Obtiene el usuario de Clarisa desde el entorno privado.
     *
     * @return string
     * @throws ExcepcionClarisa Si la credencial está ausente o es inválida.
     */
    public function obtenerUsuario()
    {
        return $this->obtenerCredencialObligatoria(
            self::VARIABLE_ENTORNO_USUARIO,
            true
        );
    }

    /**
     * Obtiene la contraseña de Clarisa desde el entorno privado.
     *
     * @return string
     * @throws ExcepcionClarisa Si la credencial está ausente o es inválida.
     */
    public function obtenerContrasenia()
    {
        return $this->obtenerCredencialObligatoria(
            self::VARIABLE_ENTORNO_CONTRASENIA,
            false
        );
    }

    /**
     * Genera un identificador estable y no reversible para la cuenta integrada.
     *
     * Combina el endpoint autorizado y el usuario remoto. La contraseña no
     * interviene para que una rotación de credenciales conserve la misma caché.
     *
     * @return string SHA-256 hexadecimal de 64 caracteres.
     */
    public function obtenerIdentificadorCuentaCache()
    {
        return hash(
            'sha256',
            $this->urlAutenticacion . "\0" . $this->obtenerUsuario()
        );
    }

    /**
     * Obtiene el tiempo máximo para establecer la conexión.
     *
     * @return int Segundos.
     */
    public function obtenerTiempoEsperaConexion()
    {
        return $this->tiempoEsperaConexion;
    }

    /**
     * Obtiene el tiempo máximo total de una solicitud.
     *
     * @return int Segundos.
     */
    public function obtenerTiempoEsperaSolicitud()
    {
        return $this->tiempoEsperaSolicitud;
    }

    /**
     * Obtiene el tamaño máximo permitido para una respuesta.
     *
     * @return int Bytes.
     */
    public function obtenerTamanoMaximoRespuestaBytes()
    {
        return $this->tamanoMaximoRespuestaBytes;
    }

    /**
     * Obtiene la ruta opcional del paquete de certificados de confianza.
     *
     * @return string|null
     */
    public function obtenerRutaCertificadosCa()
    {
        return $this->rutaCertificadosCa;
    }

    /**
     * Impide conexiones a destinos distintos de los servicios autorizados.
     *
     * La comparación exacta de esquema, host, puerto y ruta reduce el riesgo de
     * redirecciones inseguras y solicitudes del lado servidor no autorizadas.
     *
     * @param mixed $url URL que utilizará el cliente HTTP.
     * @return void
     * @throws ExcepcionClarisa Si la URL no coincide con el endpoint permitido.
     */
    public function validarUrlPermitida($url)
    {
        $urlsPermitidas = array(
            self::URL_AUTENTICACION_PRUEBAS,
            self::URL_FACTURACION_PRUEBAS
        );

        if (!is_string($url) || !in_array(trim($url), $urlsPermitidas, true)) {
            throw new ExcepcionClarisa(
                ExcepcionClarisa::TIPO_SEGURIDAD,
                'El endpoint solicitado no está autorizado para Clarisa.'
            );
        }
    }

    /**
     * Lee y valida una credencial obligatoria del entorno.
     *
     * @param string $nombre Nombre estable de la variable de entorno.
     * @param bool $recortarValor Indica si se eliminan espacios exteriores.
     * @return string
     * @throws ExcepcionClarisa Si el valor está ausente o fuera de rango.
     */
    private function obtenerCredencialObligatoria($nombre, $recortarValor)
    {
        $valor = getenv($nombre);

        if ($valor === false || !is_string($valor)) {
            throw new ExcepcionClarisa(
                ExcepcionClarisa::TIPO_CONFIGURACION,
                'Falta una credencial requerida para la integración con Clarisa.'
            );
        }

        if ($recortarValor) {
            $valor = trim($valor);
        }

        $longitud = function_exists('mb_strlen')
            ? mb_strlen($valor, 'UTF-8')
            : strlen($valor);

        if ($longitud < self::LONGITUD_MINIMA_CREDENCIAL
            || $longitud > self::LONGITUD_MAXIMA_CREDENCIAL) {
            throw new ExcepcionClarisa(
                ExcepcionClarisa::TIPO_CONFIGURACION,
                'Una credencial de Clarisa no cumple la longitud requerida.'
            );
        }

        return $valor;
    }

    /**
     * Lee una variable de entorno que puede estar ausente.
     *
     * @param string $nombre Nombre estable de la variable.
     * @return string|null
     */
    private function obtenerVariableEntornoOpcional($nombre)
    {
        $valor = getenv($nombre);

        return ($valor === false || $valor === '') ? null : $valor;
    }

    /**
     * Lee un entero opcional del entorno y valida sus límites.
     *
     * @param string $nombre Nombre estable de la variable.
     * @param int $valorPredeterminado Valor utilizado cuando no está definida.
     * @param int $minimo Límite inferior aceptado.
     * @param int $maximo Límite superior aceptado.
     * @return int
     * @throws ExcepcionClarisa Si el valor no es un entero dentro del rango.
     */
    private function obtenerEnteroEntorno($nombre, $valorPredeterminado, $minimo, $maximo)
    {
        $valor = $this->obtenerVariableEntornoOpcional($nombre);

        if ($valor === null) {
            return $valorPredeterminado;
        }

        $valorValidado = filter_var($valor, FILTER_VALIDATE_INT, array(
            'options' => array(
                'min_range' => $minimo,
                'max_range' => $maximo
            )
        ));

        if ($valorValidado === false) {
            throw new ExcepcionClarisa(
                ExcepcionClarisa::TIPO_CONFIGURACION,
                'Un valor numérico de la configuración de Clarisa no es válido.'
            );
        }

        return (int) $valorValidado;
    }
}
