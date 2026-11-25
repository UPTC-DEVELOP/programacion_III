<?php

require_once __DIR__ . '/ConfiguracionClarisa.php';
require_once __DIR__ . '/ExcepcionClarisa.php';

/**
 * Ejecuta solicitudes HTTP JSON contra los servicios autorizados de Clarisa.
 *
 * Utiliza cURL nativo en ejecución real. Un transporte opcional permite probar
 * el comportamiento con respuestas simuladas sin establecer conexiones de red.
 */
class ClienteHttpClarisa
{
    const CODIGO_HTTP_MINIMO = 100;
    const CODIGO_HTTP_MAXIMO = 599;
    const CODIGO_HTTP_TIEMPO_ESPERA = 408;
    const CODIGO_HTTP_PROCESAMIENTO_PENDIENTE = 425;
    const CODIGO_HTTP_DEMASIADAS_SOLICITUDES = 429;
    const CODIGO_HTTP_ERROR_SERVIDOR_MINIMO = 500;
    const CODIGO_HTTP_EXITO_MINIMO = 200;
    const CODIGO_HTTP_EXITO_MAXIMO_EXCLUSIVO = 300;
    const LONGITUD_MAXIMA_NOMBRE_CABECERA = 128;
    const LONGITUD_MAXIMA_VALOR_CABECERA = 8192;
    const CODIGO_ERROR_CURL_CERTIFICADO_CA = 60;
    const AGENTE_USUARIO = 'ServicesMechanic-Panther/1.0';

    private $configuracion;
    private $transporte;

    /**
     * Prepara el cliente HTTP con configuración y transporte opcional.
     *
     * @param ConfiguracionClarisa|null $configuracion Configuración validada.
     * @param callable|null $transporte Transporte utilizado solo para pruebas.
     * @throws ExcepcionClarisa Si alguna dependencia es inválida.
     */
    public function __construct($configuracion = null, $transporte = null)
    {
        if ($configuracion !== null && !($configuracion instanceof ConfiguracionClarisa)) {
            throw new ExcepcionClarisa(
                ExcepcionClarisa::TIPO_CONFIGURACION,
                'La configuración entregada al cliente Clarisa no es válida.'
            );
        }

        if ($transporte !== null && !is_callable($transporte)) {
            throw new ExcepcionClarisa(
                ExcepcionClarisa::TIPO_CONFIGURACION,
                'El transporte entregado al cliente Clarisa no es válido.'
            );
        }

        $this->configuracion = $configuracion === null
            ? new ConfiguracionClarisa()
            : $configuracion;
        $this->transporte = $transporte;
    }

    /**
     * Envía una solicitud POST con contenido JSON.
     *
     * @param string $url Endpoint autorizado de Clarisa.
     * @param array|object $contenido Datos que se codificarán como JSON.
     * @param array $cabeceras Cabeceras adicionales no reservadas.
     * @return array Contiene codigoHttp y datos decodificados.
     * @throws ExcepcionClarisa Ante errores de configuración, red, TLS, HTTP o JSON.
     */
    public function enviarPostJson($url, $contenido, $cabeceras = array())
    {
        $this->configuracion->validarUrlPermitida($url);

        if (!is_array($contenido) && !is_object($contenido)) {
            throw new ExcepcionClarisa(
                ExcepcionClarisa::TIPO_CONFIGURACION,
                'El cuerpo enviado a Clarisa debe ser un objeto JSON.'
            );
        }

        $contenidoCodificado = json_encode(
            $contenido,
            JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
        );

        if ($contenidoCodificado === false) {
            throw new ExcepcionClarisa(
                ExcepcionClarisa::TIPO_CONFIGURACION,
                'No fue posible codificar la solicitud JSON para Clarisa.'
            );
        }

        $cabecerasSolicitud = $this->prepararCabeceras($cabeceras);
        $respuestaCruda = $this->transporte === null
            ? $this->ejecutarCurl($url, $contenidoCodificado, $cabecerasSolicitud)
            : $this->ejecutarTransporteSimulado(
                $url,
                $contenidoCodificado,
                $cabecerasSolicitud
            );

        return $this->procesarRespuesta($respuestaCruda);
    }

    /**
     * Ejecuta la solicitud real mediante cURL con verificación TLS obligatoria.
     *
     * @param string $url Endpoint autorizado.
     * @param string $contenidoCodificado Cuerpo JSON ya codificado.
     * @param array $cabeceras Cabeceras HTTP preparadas.
     * @return array Contiene codigoHttp y cuerpo sin decodificar.
     * @throws ExcepcionClarisa Ante fallos de configuración, conexión o TLS.
     */
    private function ejecutarCurl($url, $contenidoCodificado, $cabeceras)
    {
        if (!extension_loaded('curl') || !function_exists('curl_init')) {
            throw new ExcepcionClarisa(
                ExcepcionClarisa::TIPO_CONFIGURACION,
                'La extensión cURL de PHP es necesaria para conectar con Clarisa.'
            );
        }

        $manejador = curl_init();

        if ($manejador === false) {
            throw new ExcepcionClarisa(
                ExcepcionClarisa::TIPO_CONEXION,
                'No fue posible preparar la conexión segura con Clarisa.',
                null,
                true
            );
        }

        $cuerpoRespuesta = '';
        $respuestaDemasiadoGrande = false;
        $maximoBytesRespuesta = $this->configuracion->obtenerTamanoMaximoRespuestaBytes();

        $opciones = array(
            CURLOPT_URL => $url,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $contenidoCodificado,
            CURLOPT_HTTPHEADER => $cabeceras,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => false,
            CURLOPT_MAXREDIRS => 0,
            CURLOPT_CONNECTTIMEOUT => $this->configuracion->obtenerTiempoEsperaConexion(),
            CURLOPT_TIMEOUT => $this->configuracion->obtenerTiempoEsperaSolicitud(),
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_SSL_VERIFYHOST => 2,
            CURLOPT_NOSIGNAL => true,
            CURLOPT_USERAGENT => self::AGENTE_USUARIO,
            CURLOPT_WRITEFUNCTION => function ($manejadorCurl, $fragmento) use (
                &$cuerpoRespuesta,
                &$respuestaDemasiadoGrande,
                $maximoBytesRespuesta
            ) {
                if (strlen($cuerpoRespuesta) + strlen($fragmento) > $maximoBytesRespuesta) {
                    $respuestaDemasiadoGrande = true;
                    return 0;
                }

                $cuerpoRespuesta .= $fragmento;
                return strlen($fragmento);
            }
        );

        if (defined('CURLOPT_PROTOCOLS') && defined('CURLPROTO_HTTPS')) {
            $opciones[CURLOPT_PROTOCOLS] = CURLPROTO_HTTPS;
        }

        if (defined('CURLOPT_REDIR_PROTOCOLS') && defined('CURLPROTO_HTTPS')) {
            $opciones[CURLOPT_REDIR_PROTOCOLS] = CURLPROTO_HTTPS;
        }

        $rutaCertificadosCa = $this->configuracion->obtenerRutaCertificadosCa();

        if ($rutaCertificadosCa !== null) {
            $opciones[CURLOPT_CAINFO] = $rutaCertificadosCa;
        }

        try {
            if (!curl_setopt_array($manejador, $opciones)) {
                throw new ExcepcionClarisa(
                    ExcepcionClarisa::TIPO_CONFIGURACION,
                    'No fue posible configurar la conexión segura con Clarisa.'
                );
            }

            $ejecutado = curl_exec($manejador);
            $errorCurl = curl_errno($manejador);
            $codigoHttp = curl_getinfo(
                $manejador,
                defined('CURLINFO_RESPONSE_CODE')
                    ? CURLINFO_RESPONSE_CODE
                    : CURLINFO_HTTP_CODE
            );

            if ($respuestaDemasiadoGrande) {
                throw new ExcepcionClarisa(
                    ExcepcionClarisa::TIPO_RESPUESTA,
                    'La respuesta de Clarisa supera el tamaño permitido.'
                );
            }

            if ($ejecutado === false || $errorCurl !== 0) {
                throw $this->crearExcepcionCurl($errorCurl);
            }

            return array(
                'codigoHttp' => (int) $codigoHttp,
                'cuerpo' => $cuerpoRespuesta
            );
        } finally {
            curl_close($manejador);
        }
    }

    /**
     * Ejecuta el transporte inyectado para pruebas sin conexión externa.
     *
     * El callable recibe POST, URL, contenido JSON y cabeceras. Debe retornar
     * un arreglo con las claves internas codigoHttp y cuerpo.
     *
     * @param string $url Endpoint autorizado.
     * @param string $contenidoCodificado Cuerpo JSON ya codificado.
     * @param array $cabeceras Cabeceras HTTP preparadas.
     * @return array
     * @throws ExcepcionClarisa Si el transporte falla o retorna datos inválidos.
     */
    private function ejecutarTransporteSimulado($url, $contenidoCodificado, $cabeceras)
    {
        try {
            $respuesta = call_user_func(
                $this->transporte,
                'POST',
                $url,
                $contenidoCodificado,
                $cabeceras
            );
        } catch (ExcepcionClarisa $excepcion) {
            throw $excepcion;
        } catch (Throwable) {
            throw new ExcepcionClarisa(
                ExcepcionClarisa::TIPO_CONEXION,
                'La comunicación simulada con Clarisa no pudo completarse.',
                null,
                true
            );
        }

        if (!is_array($respuesta)
            || !isset($respuesta['codigoHttp'])
            || !is_int($respuesta['codigoHttp'])
            || $respuesta['codigoHttp'] < self::CODIGO_HTTP_MINIMO
            || $respuesta['codigoHttp'] > self::CODIGO_HTTP_MAXIMO
            || !array_key_exists('cuerpo', $respuesta)
            || !is_string($respuesta['cuerpo'])) {
            throw new ExcepcionClarisa(
                ExcepcionClarisa::TIPO_RESPUESTA,
                'El transporte de Clarisa devolvió una respuesta no válida.'
            );
        }

        return $respuesta;
    }

    /**
     * Valida el código HTTP y decodifica el cuerpo JSON recibido.
     *
     * @param array $respuesta Respuesta interna con codigoHttp y cuerpo.
     * @return array Contiene codigoHttp y datos decodificados.
     * @throws ExcepcionClarisa Ante códigos no exitosos o JSON inválido.
     */
    private function procesarRespuesta($respuesta)
    {
        $codigoHttp = $respuesta['codigoHttp'];
        $cuerpo = $respuesta['cuerpo'];
        $datosDecodificados = null;
        $jsonValido = false;

        if ($cuerpo !== '') {
            $datosDecodificados = json_decode($cuerpo, true);
            $jsonValido = json_last_error() === JSON_ERROR_NONE;
        }

        if ($codigoHttp < self::CODIGO_HTTP_EXITO_MINIMO
            || $codigoHttp >= self::CODIGO_HTTP_EXITO_MAXIMO_EXCLUSIVO) {
            throw new ExcepcionClarisa(
                ExcepcionClarisa::TIPO_HTTP,
                'Clarisa respondió con un código HTTP no exitoso.',
                $codigoHttp,
                $this->esCodigoReintentable($codigoHttp),
                $jsonValido ? $datosDecodificados : null
            );
        }

        if (!$jsonValido || !is_array($datosDecodificados)) {
            throw new ExcepcionClarisa(
                ExcepcionClarisa::TIPO_RESPUESTA,
                'Clarisa devolvió una respuesta JSON no válida.',
                $codigoHttp
            );
        }

        return array(
            'codigoHttp' => $codigoHttp,
            'datos' => $datosDecodificados
        );
    }

    /**
     * Determina si un código HTTP permite reintentar la operación.
     *
     * @param int $codigoHttp Código recibido.
     * @return bool
     */
    private function esCodigoReintentable($codigoHttp)
    {
        return $codigoHttp === self::CODIGO_HTTP_TIEMPO_ESPERA
            || $codigoHttp === self::CODIGO_HTTP_PROCESAMIENTO_PENDIENTE
            || $codigoHttp === self::CODIGO_HTTP_DEMASIADAS_SOLICITUDES
            || $codigoHttp >= self::CODIGO_HTTP_ERROR_SERVIDOR_MINIMO;
    }

    /**
     * Prepara cabeceras adicionales y bloquea valores reservados o inseguros.
     *
     * @param array $cabeceras Cabeceras adicionales por nombre y valor.
     * @return array Cabeceras listas para cURL.
     * @throws ExcepcionClarisa Si una cabecera es inválida o reservada.
     */
    private function prepararCabeceras($cabeceras)
    {
        if (!is_array($cabeceras)) {
            throw new ExcepcionClarisa(
                ExcepcionClarisa::TIPO_CONFIGURACION,
                'Las cabeceras entregadas al cliente Clarisa no son válidas.'
            );
        }

        $cabecerasPreparadas = array(
            'Content-Type: application/json',
            'Accept: application/json'
        );
        $cabecerasReservadas = array('accept', 'content-length', 'content-type', 'host');

        foreach ($cabeceras as $nombre => $valor) {
            if (!is_string($nombre)
                || !is_string($valor)
                || !preg_match('/^[A-Za-z0-9!#$%&\x27*+.^_`|~-]+$/D', $nombre)
                || strlen($nombre) > self::LONGITUD_MAXIMA_NOMBRE_CABECERA
                || strlen($valor) > self::LONGITUD_MAXIMA_VALOR_CABECERA
                || preg_match('/[\x00-\x1F\x7F]/', $valor)
                || in_array(strtolower($nombre), $cabecerasReservadas, true)) {
                throw new ExcepcionClarisa(
                    ExcepcionClarisa::TIPO_SEGURIDAD,
                    'Una cabecera de la solicitud a Clarisa no está permitida.'
                );
            }

            $cabecerasPreparadas[] = $nombre . ': ' . $valor;
        }

        return $cabecerasPreparadas;
    }

    /**
     * Convierte un código de error cURL en una excepción controlada.
     *
     * @param int $errorCurl Código nativo de cURL.
     * @return ExcepcionClarisa
     */
    private function crearExcepcionCurl($errorCurl)
    {
        if ($errorCurl === CURLE_OPERATION_TIMEDOUT) {
            return new ExcepcionClarisa(
                ExcepcionClarisa::TIPO_TIEMPO_ESPERA,
                'La comunicación con Clarisa excedió el tiempo permitido.',
                null,
                true
            );
        }

        $erroresTls = array_filter(array(
            defined('CURLE_SSL_CONNECT_ERROR') ? CURLE_SSL_CONNECT_ERROR : null,
            defined('CURLE_PEER_FAILED_VERIFICATION') ? CURLE_PEER_FAILED_VERIFICATION : null,
            defined('CURLE_SSL_CACERT') ? CURLE_SSL_CACERT : null,
            defined('CURLE_SSL_CERTPROBLEM') ? CURLE_SSL_CERTPROBLEM : null,
            defined('CURLE_SSL_CIPHER') ? CURLE_SSL_CIPHER : null,
            defined('CURLE_SSL_CACERT_BADFILE') ? CURLE_SSL_CACERT_BADFILE : null,
            self::CODIGO_ERROR_CURL_CERTIFICADO_CA
        ), function ($valor) {
            return $valor !== null;
        });

        if (in_array($errorCurl, $erroresTls, true)) {
            return new ExcepcionClarisa(
                ExcepcionClarisa::TIPO_TLS,
                'No fue posible verificar la conexión TLS con Clarisa.'
            );
        }

        return new ExcepcionClarisa(
            ExcepcionClarisa::TIPO_CONEXION,
            'No fue posible establecer comunicación con Clarisa.',
            null,
            true
        );
    }
}
