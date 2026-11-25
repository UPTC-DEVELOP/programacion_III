<?php

require_once __DIR__ . '/ConfiguracionClarisa.php';
require_once __DIR__ . '/ClienteHttpClarisa.php';
require_once __DIR__ . '/ExcepcionClarisa.php';

/**
 * Autentica el backend contra el ambiente de pruebas de Clarisa.
 *
 * El contexto resultante contiene únicamente la información necesaria para una
 * futura caché del servidor. El token debe tratarse como secreto y nunca debe
 * enviarse al frontend, registrarse ni incluirse en mensajes de error.
 */
class ServicioAutenticacionClarisa
{
    const VIGENCIA_TOKEN_SEGUNDOS = 43200;
    const MARGEN_SEGURIDAD_EXPIRACION_SEGUNDOS = 900;
    const LONGITUD_MAXIMA_TOKEN = 8192;
    const LONGITUD_MAXIMA_TEXTO = 255;
    const CODIGO_HTTP_AUTENTICACION_EXITOSA = 200;
    const PREFIJO_AUTORIZACION_BEARER = 'Bearer ';
    const ZONA_HORARIA_UTC = 'UTC';
    const FORMATO_FECHA_UTC = 'Y-m-d\TH:i:s\Z';

    private $configuracion;
    private $clienteHttp;
    private $reloj;

    /**
     * Prepara el servicio con dependencias reales o simuladas.
     *
     * @param ConfiguracionClarisa|null $configuracion Configuración validada.
     * @param ClienteHttpClarisa|null $clienteHttp Cliente HTTP de Clarisa.
     * @param callable|null $reloj Fuente de fecha utilizada en pruebas.
     * @throws ExcepcionClarisa Si alguna dependencia es inválida.
     */
    public function __construct($configuracion = null, $clienteHttp = null, $reloj = null)
    {
        if ($configuracion === null) {
            $configuracion = new ConfiguracionClarisa();
        }

        if (!($configuracion instanceof ConfiguracionClarisa)) {
            throw new ExcepcionClarisa(
                ExcepcionClarisa::TIPO_CONFIGURACION,
                'La configuración de autenticación de Clarisa no es válida.'
            );
        }

        if ($clienteHttp === null) {
            $clienteHttp = new ClienteHttpClarisa($configuracion);
        }

        if (!($clienteHttp instanceof ClienteHttpClarisa)) {
            throw new ExcepcionClarisa(
                ExcepcionClarisa::TIPO_CONFIGURACION,
                'El cliente HTTP de Clarisa no es válido.'
            );
        }

        if ($reloj !== null && !is_callable($reloj)) {
            throw new ExcepcionClarisa(
                ExcepcionClarisa::TIPO_CONFIGURACION,
                'El reloj de autenticación de Clarisa no es válido.'
            );
        }

        $this->configuracion = $configuracion;
        $this->clienteHttp = $clienteHttp;
        $this->reloj = $reloj;
    }

    /**
     * Solicita y valida un contexto de autenticación de Clarisa.
     *
     * Envía los campos externos usuario y contrasenia, valida success, data,
     * token, permisos y usuario, y calcula la vigencia local con margen de
     * seguridad.
     *
     * @return array Contiene tokenAutorizacion, permisos, usuario,
     * fechaObtencion y fechaExpiracion.
     * @throws ExcepcionClarisa Ante errores de configuración, transporte o respuesta.
     */
    public function autenticar()
    {
        $contenido = array(
            'usuario' => $this->configuracion->obtenerUsuario(),
            'contrasenia' => $this->configuracion->obtenerContrasenia()
        );

        $respuesta = $this->clienteHttp->enviarPostJson(
            $this->configuracion->obtenerUrlAutenticacion(),
            $contenido
        );

        $documento = $this->validarRespuestaHttp($respuesta);

        if (!array_key_exists('success', $documento) || !is_bool($documento['success'])) {
            throw $this->crearExcepcionRespuestaInvalida();
        }

        if ($documento['success'] === false) {
            throw new ExcepcionClarisa(
                ExcepcionClarisa::TIPO_RESPUESTA,
                'Clarisa no autorizó la autenticación del servicio.'
            );
        }

        if (!isset($documento['data']) || !is_array($documento['data'])) {
            throw $this->crearExcepcionRespuestaInvalida();
        }

        $datos = $documento['data'];
        $tokenAutorizacion = $this->normalizarTokenAutorizacion(
            isset($datos['token']) ? $datos['token'] : null
        );
        $permisos = $this->validarPermisos(
            isset($datos['permisos']) ? $datos['permisos'] : null
        );
        $usuario = $this->extraerDatosUsuario(
            isset($datos['usuario']) ? $datos['usuario'] : null
        );
        $fechaObtencion = $this->obtenerFechaActualUtc();
        $vigenciaUtil = self::VIGENCIA_TOKEN_SEGUNDOS
            - self::MARGEN_SEGURIDAD_EXPIRACION_SEGUNDOS;
        $fechaExpiracion = $fechaObtencion->modify('+' . $vigenciaUtil . ' seconds');

        return array(
            'tokenAutorizacion' => $tokenAutorizacion,
            'permisos' => $permisos,
            'usuario' => $usuario,
            'fechaObtencion' => $this->formatearFechaUtc($fechaObtencion),
            'fechaExpiracion' => $this->formatearFechaUtc($fechaExpiracion)
        );
    }

    /**
     * Valida el envoltorio interno producido por el cliente HTTP.
     *
     * @param mixed $respuesta Respuesta del cliente HTTP.
     * @return array Documento JSON externo de Clarisa.
     * @throws ExcepcionClarisa Si el código o la estructura son inválidos.
     */
    private function validarRespuestaHttp($respuesta)
    {
        if (!is_array($respuesta)
            || !isset($respuesta['codigoHttp'])
            || !is_int($respuesta['codigoHttp'])
            || $respuesta['codigoHttp'] !== self::CODIGO_HTTP_AUTENTICACION_EXITOSA
            || !isset($respuesta['datos'])
            || !is_array($respuesta['datos'])) {
            throw $this->crearExcepcionRespuestaInvalida();
        }

        return $respuesta['datos'];
    }

    /**
     * Normaliza el token para formar un único valor de autorización Bearer.
     *
     * @param mixed $token Token recibido en data.token.
     * @return string Token con un único prefijo Bearer.
     * @throws ExcepcionClarisa Si el token está ausente o es inseguro.
     */
    private function normalizarTokenAutorizacion($token)
    {
        if (!is_string($token)) {
            throw $this->crearExcepcionRespuestaInvalida();
        }

        $token = trim($token);

        if (preg_match('/^Bearer\s+(.+)$/i', $token, $coincidencias) === 1) {
            $token = trim($coincidencias[1]);
        }

        if ($token === ''
            || strlen($token) > self::LONGITUD_MAXIMA_TOKEN
            || preg_match('/[\x00-\x20\x7F]/', $token) === 1
            || preg_match('/^Bearer\s+/i', $token) === 1) {
            throw $this->crearExcepcionRespuestaInvalida();
        }

        return self::PREFIJO_AUTORIZACION_BEARER . $token;
    }

    /**
     * Valida que data.permisos sea una lista de textos seguros.
     *
     * @param mixed $permisos Permisos recibidos de Clarisa.
     * @return array Lista validada, que puede estar vacía.
     * @throws ExcepcionClarisa Si la estructura o un valor son inválidos.
     */
    private function validarPermisos($permisos)
    {
        if (!is_array($permisos) || !$this->esListaSecuencial($permisos)) {
            throw $this->crearExcepcionRespuestaInvalida();
        }

        $permisosValidados = array();

        foreach ($permisos as $permiso) {
            $permisosValidados[] = $this->validarValorTexto($permiso);
        }

        return $permisosValidados;
    }

    /**
     * Extrae del usuario remoto únicamente el nombre requerido por el contexto.
     *
     * El campo externo userName se conserva al leer la respuesta, pero se mapea
     * a la clave interna nombreUsuario.
     *
     * @param mixed $usuario Datos recibidos en data.usuario.
     * @return array Contiene nombreUsuario.
     * @throws ExcepcionClarisa Si userName está ausente o es inválido.
     */
    private function extraerDatosUsuario($usuario)
    {
        if (!is_array($usuario) || !array_key_exists('userName', $usuario)) {
            throw $this->crearExcepcionRespuestaInvalida();
        }

        return array(
            'nombreUsuario' => $this->validarValorTexto($usuario['userName'])
        );
    }

    /**
     * Valida un texto recibido desde la respuesta externa.
     *
     * @param mixed $valor Valor que se validará.
     * @return string Texto recortado y seguro.
     * @throws ExcepcionClarisa Si el valor no es texto o está fuera de límites.
     */
    private function validarValorTexto($valor)
    {
        if (!is_string($valor)) {
            throw $this->crearExcepcionRespuestaInvalida();
        }

        $valor = trim($valor);

        if ($valor === ''
            || strlen($valor) > self::LONGITUD_MAXIMA_TEXTO
            || preg_match('/[\x00-\x1F\x7F]/', $valor) === 1) {
            throw $this->crearExcepcionRespuestaInvalida();
        }

        return $valor;
    }

    /**
     * Comprueba que un arreglo utilice índices enteros consecutivos desde cero.
     *
     * @param array $valor Arreglo que se evaluará.
     * @return bool
     */
    private function esListaSecuencial($valor)
    {
        $indiceEsperado = 0;

        foreach ($valor as $indice => $valorIgnorado) {
            if ($indice !== $indiceEsperado) {
                return false;
            }

            $indiceEsperado++;
        }

        return true;
    }

    /**
     * Obtiene la fecha actual en UTC o utiliza el reloj inyectado de pruebas.
     *
     * @return DateTimeImmutable
     * @throws ExcepcionClarisa Si el reloj no entrega una fecha válida.
     */
    private function obtenerFechaActualUtc()
    {
        if ($this->reloj === null) {
            $fecha = new DateTimeImmutable(
                'now',
                new DateTimeZone(self::ZONA_HORARIA_UTC)
            );
        } else {
            $reloj = $this->reloj;
            $fecha = call_user_func($reloj);
        }

        if (!($fecha instanceof DateTimeInterface)) {
            throw new ExcepcionClarisa(
                ExcepcionClarisa::TIPO_CONFIGURACION,
                'El reloj de autenticación de Clarisa no produjo una fecha válida.'
            );
        }

        $fechaUtc = new DateTimeImmutable('@' . $fecha->getTimestamp());

        return $fechaUtc->setTimezone(new DateTimeZone(self::ZONA_HORARIA_UTC));
    }

    /**
     * Convierte una fecha al formato UTC estable del contexto interno.
     *
     * @param DateTimeInterface $fecha Fecha que se formateará.
     * @return string
     */
    private function formatearFechaUtc($fecha)
    {
        return $fecha->format(self::FORMATO_FECHA_UTC);
    }

    /**
     * Crea una excepción uniforme para respuestas externas inesperadas.
     *
     * @return ExcepcionClarisa
     */
    private function crearExcepcionRespuestaInvalida()
    {
        return new ExcepcionClarisa(
            ExcepcionClarisa::TIPO_RESPUESTA,
            'La respuesta de autenticación de Clarisa no tiene el formato esperado.'
        );
    }
}
