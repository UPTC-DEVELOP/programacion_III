<?php

/**
 * Representa errores controlados durante la integración con Clarisa.
 *
 * El mensaje público y los datos conservados nunca deben incluir credenciales,
 * tokens, contenido enviado ni la respuesta externa completa.
 */
class ExcepcionClarisa extends Exception
{
    const LONGITUD_MAXIMA_MOTIVO = 500;
    const MAXIMO_ELEMENTOS_CONFIRMACION = 30;
    const MAXIMA_PROFUNDIDAD_CONFIRMACION = 5;

    const TIPO_CONFIGURACION = 'configuration';
    const TIPO_SEGURIDAD = 'security';
    const TIPO_CONEXION = 'connection';
    const TIPO_TIEMPO_ESPERA = 'timeout';
    const TIPO_TLS = 'tls';
    const TIPO_HTTP = 'http';
    const TIPO_RESPUESTA = 'response';
    const TIPO_BASE_DATOS = 'database';

    private $tipoError;
    private $codigoHttp;
    private $reintentable;
    private $datosRespuesta;

    /**
     * Crea una excepción controlada y sanitiza los metadatos externos.
     *
     * @param string $tipoError Categoría estable del error.
     * @param string $mensaje Mensaje seguro para consumo interno.
     * @param int|null $codigoHttp Código de estado HTTP, cuando esté disponible.
     * @param bool $reintentable Indica si la operación podría repetirse.
     * @param mixed $datosRespuesta Respuesta externa que será sanitizada.
     * @param Throwable|null $excepcionAnterior Excepción original, si existe.
     */
    public function __construct(
        $tipoError,
        $mensaje,
        $codigoHttp = null,
        $reintentable = false,
        $datosRespuesta = null,
        $excepcionAnterior = null
    ) {
        parent::__construct($mensaje, 0, $excepcionAnterior);

        $this->tipoError = $tipoError;
        $this->codigoHttp = $codigoHttp;
        $this->reintentable = $reintentable;
        $this->datosRespuesta = $this->sanitizarDatosRespuesta($datosRespuesta);
    }

    /**
     * Obtiene la categoría estable del error.
     *
     * @return string
     */
    public function obtenerTipoError()
    {
        return $this->tipoError;
    }

    /**
     * Obtiene el código HTTP asociado, si fue recibido.
     *
     * @return int|null
     */
    public function obtenerCodigoHttp()
    {
        return $this->codigoHttp;
    }

    /**
     * Indica si el error admite un reintento posterior.
     *
     * @return bool
     */
    public function esReintentable()
    {
        return $this->reintentable;
    }

    /**
     * Obtiene metadatos sanitizados de la respuesta externa.
     *
     * Solo contiene campos públicos permitidos y nunca retorna tokens,
     * credenciales ni el cuerpo externo completo.
     *
     * @return array|null
     */
    public function obtenerDatosRespuesta()
    {
        return $this->datosRespuesta;
    }

    /**
     * Conserva únicamente los campos públicos de una respuesta de Clarisa.
     *
     * @param mixed $datosRespuesta Respuesta externa decodificada.
     * @return array|null Confirmación estructurada y sanitizada.
     */
    public static function sanitizarConfirmacion($datosRespuesta)
    {
        if (!is_array($datosRespuesta)) {
            return null;
        }

        $confirmacion = self::seleccionarCamposConfirmacion($datosRespuesta);

        if (isset($datosRespuesta['data'])
            && is_array($datosRespuesta['data'])) {
            $detalle = self::seleccionarCamposConfirmacion(
                $datosRespuesta['data']
            );

            if (count($detalle) > 0) {
                $confirmacion['data'] = $detalle;
            }
        }

        return count($confirmacion) === 0 ? null : $confirmacion;
    }

    private static function seleccionarCamposConfirmacion($datos)
    {
        $resultado = array();

        if (array_key_exists('success', $datos)
            && is_bool($datos['success'])) {
            $resultado['success'] = $datos['success'];
        }

        $camposTexto = array(
            'textResponse',
            'titleResponse',
            'errorMessage',
            'message',
            'mensaje',
            'detalle',
            'motivo'
        );

        foreach ($camposTexto as $campo) {
            if (!array_key_exists($campo, $datos)) {
                continue;
            }

            $valor = self::sanitizarTextoPublico($datos[$campo]);

            if ($valor !== null) {
                $resultado[$campo] = $valor;
            }
        }

        $camposIdentificadores = array(
            'lastAction',
            'estadoClarisa',
            'estadoDIAN',
            'codError',
            'uuid',
            'numeroDocumento',
            'fechaValidacion'
        );

        foreach ($camposIdentificadores as $campo) {
            if (!array_key_exists($campo, $datos)) {
                continue;
            }

            $valor = self::sanitizarIdentificadorPublico($datos[$campo]);

            if ($valor !== null || $datos[$campo] === null) {
                $resultado[$campo] = $valor;
            }
        }

        foreach (array('errores', 'errors', 'error', 'result') as $campo) {
            if (!array_key_exists($campo, $datos)) {
                continue;
            }

            $valor = self::sanitizarEstructuraPublica(
                $datos[$campo],
                0,
                $campo
            );

            if ($valor !== null || $datos[$campo] === null) {
                $resultado[$campo] = $valor;
            }
        }

        return $resultado;
    }

    private static function sanitizarEstructuraPublica(
        $valor,
        $profundidad,
        $clave = null
    ) {
        if ($profundidad > self::MAXIMA_PROFUNDIDAD_CONFIRMACION) {
            return null;
        }

        if ($valor === null || is_bool($valor) || is_int($valor) || is_float($valor)) {
            return $valor;
        }

        if (is_string($valor)) {
            return in_array(
                $clave,
                array('codError', 'uuid', 'numeroDocumento', 'fechaValidacion'),
                true
            )
                ? self::sanitizarIdentificadorPublico($valor)
                : self::sanitizarTextoPublico($valor);
        }

        if (!is_array($valor)) {
            return null;
        }

        $resultado = array();
        $cantidad = 0;
        $esLista = count($valor) === 0
            || array_keys($valor) === range(0, count($valor) - 1);

        foreach ($valor as $claveActual => $dato) {
            if ($cantidad >= self::MAXIMO_ELEMENTOS_CONFIRMACION) {
                break;
            }

            if (!$esLista
                && (!is_string($claveActual)
                    || self::esClaveSensible($claveActual))) {
                continue;
            }

            $datoSanitizado = self::sanitizarEstructuraPublica(
                $dato,
                $profundidad + 1,
                is_string($claveActual) ? $claveActual : null
            );

            if ($datoSanitizado === null && $dato !== null) {
                continue;
            }

            if ($esLista) {
                $resultado[] = $datoSanitizado;
            } else {
                $resultado[$claveActual] = $datoSanitizado;
            }

            $cantidad++;
        }

        return $resultado;
    }

    private static function sanitizarIdentificadorPublico($valor)
    {
        if ($valor === null || is_bool($valor) || is_int($valor) || is_float($valor)) {
            return $valor;
        }

        if (!is_string($valor)) {
            return null;
        }

        $valor = html_entity_decode(
            strip_tags($valor),
            ENT_QUOTES | ENT_HTML5,
            'UTF-8'
        );
        $valor = preg_replace('/[\x00-\x1F\x7F]+/u', ' ', $valor);
        $valor = trim(preg_replace('/\s+/u', ' ', (string) $valor));

        if ($valor === ''
            || preg_match(
                '#(?:Bearer\s+|token\s*[:=]|password\s*[:=]|contrase(?:ñ|n)a\s*[:=]|secret\s*[:=]|stack\s+trace|sqlstate|pdoexception|fatal\s+error|\b[A-Z]:[\\\\/]|/(?:var|home|srv|etc|opt|usr|tmp|xampp|wamp64)/)#iu',
                $valor
            )) {
            return null;
        }

        if (function_exists('mb_strlen')
            && mb_strlen($valor, 'UTF-8') > 200) {
            return mb_substr($valor, 0, 200, 'UTF-8');
        }

        return strlen($valor) > 200 ? substr($valor, 0, 200) : $valor;
    }

    private static function esClaveSensible($clave)
    {
        return preg_match(
            '/(?:authorization|contrase(?:n|ñ)a|credential|password|secret|token|api[_ -]?key|stack|trace|exception|sql|query|ruta|path|server|servidor)/iu',
            $clave
        ) === 1;
    }

    /**
     * Extrae un motivo público desde campos textuales expresamente permitidos.
     *
     * @param mixed $datosRespuesta Respuesta externa decodificada.
     * @return string|null Motivo limitado y sin datos sensibles conocidos.
     */
    public static function extraerMotivoSeguro($datosRespuesta)
    {
        if (!is_array($datosRespuesta)) {
            return null;
        }

        $camposPermitidos = array(
            'errorMessage',
            'textResponse',
            'motivo',
            'message',
            'mensaje',
            'error',
            'descripcion',
            'detalle',
            'titleResponse'
        );
        $candidatos = array();

        if (isset($datosRespuesta['data'])
            && is_array($datosRespuesta['data'])) {
            self::agregarErroresOficiales(
                $candidatos,
                isset($datosRespuesta['data']['errores'])
                    ? $datosRespuesta['data']['errores']
                    : null
            );
        }

        self::agregarErroresOficiales(
            $candidatos,
            isset($datosRespuesta['errores'])
                ? $datosRespuesta['errores']
                : null
        );

        foreach ($camposPermitidos as $campo) {
            if (array_key_exists($campo, $datosRespuesta)) {
                $candidatos[] = $datosRespuesta[$campo];
            }
        }

        if (array_key_exists('data', $datosRespuesta)) {
            if (is_string($datosRespuesta['data'])) {
                $candidatos[] = $datosRespuesta['data'];
            } elseif (is_array($datosRespuesta['data'])) {
                foreach ($camposPermitidos as $campo) {
                    if (array_key_exists($campo, $datosRespuesta['data'])) {
                        $candidatos[] = $datosRespuesta['data'][$campo];
                    }
                }
            }
        }

        $motivos = array();

        foreach ($candidatos as $candidato) {
            $motivo = self::sanitizarTextoPublico($candidato);

            if ($motivo !== null && !in_array($motivo, $motivos, true)) {
                $motivos[] = $motivo;

                if (count($motivos) === 3) {
                    break;
                }
            }
        }

        return count($motivos) === 0
            ? null
            : self::sanitizarTextoPublico(implode('; ', $motivos));
    }

    /**
     * Recupera mensajes de las colecciones de errores documentadas por Clarisa.
     *
     * @param array $candidatos Lista que recibe mensajes sin sanitizar.
     * @param mixed $errores Estructura errores o errores.errores.
     * @return void
     */
    private static function agregarErroresOficiales(&$candidatos, $errores)
    {
        if (!is_array($errores)) {
            return;
        }

        if (isset($errores['errorMessage'])) {
            $candidatos[] = $errores['errorMessage'];
        }

        if (isset($errores['errores']) && is_array($errores['errores'])) {
            self::agregarErroresOficiales($candidatos, $errores['errores']);
        }

        foreach ($errores as $clave => $error) {
            if ($clave === 'errorMessage' || $clave === 'errores') {
                continue;
            }

            if (is_array($error) && isset($error['errorMessage'])) {
                $candidatos[] = $error['errorMessage'];
            }
        }
    }

    /**
     * Reduce una respuesta externa a metadatos estrictamente necesarios.
     *
     * @param mixed $datosRespuesta Respuesta externa decodificada.
     * @return array|null
     */
    private function sanitizarDatosRespuesta($datosRespuesta)
    {
        return self::sanitizarConfirmacion($datosRespuesta);
    }

    /**
     * Normaliza un mensaje externo y oculta secretos o identificadores.
     *
     * @param mixed $texto Valor externo no confiable.
     * @return string|null
     */
    private static function sanitizarTextoPublico($texto)
    {
        if (!is_string($texto)) {
            return null;
        }

        $texto = html_entity_decode(
            strip_tags($texto),
            ENT_QUOTES | ENT_HTML5,
            'UTF-8'
        );
        $texto = preg_replace('/[\x00-\x1F\x7F]+/u', ' ', $texto);
        $texto = preg_replace('/\s+/u', ' ', $texto);
        $texto = trim((string) $texto);

        if ($texto === ''
            || preg_match(
                '/(?:stack\s+trace|sqlstate|pdoexception|fatal\s+error)/iu',
                $texto
            )) {
            return null;
        }

        $texto = preg_replace(
            '/(Bearer\s+)[A-Za-z0-9._~+\/=\-]{8,}/iu',
            '$1[dato protegido]',
            $texto
        );
        $texto = preg_replace(
            '/((?:token|authorization|autorizaci[oó]n|password|contrase(?:ñ|n)a|credential|credencial|secret|secreto|api[_ -]?key)\s*[:=]\s*["\']?)[^\s,;"\']+/iu',
            '$1[dato protegido]',
            $texto
        );
        $texto = preg_replace(
            '/[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}/iu',
            '[dato protegido]',
            $texto
        );
        $texto = preg_replace(
            '#\b[A-Z]:[\\\\/][^\s,;]+#iu',
            '[ruta protegida]',
            $texto
        );
        $texto = preg_replace(
            '#/(?:var|home|srv|etc|opt|usr|tmp|xampp|wamp64)/[^\s,;]+#iu',
            '[ruta protegida]',
            $texto
        );
        $texto = preg_replace(
            '/\b(?:\d{1,3}\.){3}\d{1,3}\b/u',
            '[dato protegido]',
            $texto
        );
        $texto = preg_replace('/\b\d{6,}\b/u', '[dato protegido]', $texto);

        if (!is_string($texto) || trim($texto) === '') {
            return null;
        }

        $texto = trim($texto);

        if (function_exists('mb_strlen')
            && mb_strlen($texto, 'UTF-8') > self::LONGITUD_MAXIMA_MOTIVO) {
            return rtrim(mb_substr(
                $texto,
                0,
                self::LONGITUD_MAXIMA_MOTIVO - 1,
                'UTF-8'
            )) . '…';
        }

        if (strlen($texto) > self::LONGITUD_MAXIMA_MOTIVO) {
            return rtrim(substr($texto, 0, self::LONGITUD_MAXIMA_MOTIVO - 3))
                . '...';
        }

        return $texto;
    }
}
