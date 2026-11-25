<?php

require_once __DIR__ . '/CifradoTokenClarisa.php';
require_once __DIR__ . '/ExcepcionClarisa.php';
require_once __DIR__ . '/../../querys/integration/ConsultaClarisa.php';
require_once __DIR__ . '/../../cxn/LoginMysql.php';
require_once __DIR__ . '/../../cxn/Connection.php';

/**
 * Persiste contextos de Clarisa mediante PDO y consultas preparadas.
 */
class RepositorioCacheClarisa
{
    const LONGITUD_IDENTIFICADOR_CUENTA = 64;
    const LONGITUD_MAXIMA_NOMBRE_USUARIO = 255;
    const TIEMPO_MAXIMO_BLOQUEO_SEGUNDOS = 30;
    const FORMATO_FECHA_CONTEXTO = 'Y-m-d\TH:i:s\Z';
    const FORMATO_FECHA_BASE_DATOS = 'Y-m-d H:i:s';

    private $pdo;
    private $cifrado;

    /**
     * @param PDO|null $pdo Conexión inyectable; usa Connection por defecto.
     * @param CifradoTokenClarisa|null $cifrado Cifrador validado.
     */
    public function __construct($pdo = null, $cifrado = null)
    {
        if ($pdo === null) {
            $pdo = Connection::getInstance()->getConnection();
        }

        if (!($pdo instanceof PDO)) {
            throw new ExcepcionClarisa(
                ExcepcionClarisa::TIPO_CONFIGURACION,
                'La conexión entregada a la caché de Clarisa no es válida.'
            );
        }

        if ($cifrado === null) {
            $cifrado = new CifradoTokenClarisa();
        }

        if (!($cifrado instanceof CifradoTokenClarisa)) {
            throw new ExcepcionClarisa(
                ExcepcionClarisa::TIPO_CONFIGURACION,
                'El cifrador entregado a la caché de Clarisa no es válido.'
            );
        }

        $this->pdo = $pdo;
        $this->cifrado = $cifrado;
    }

    /**
     * Recupera un contexto únicamente cuando su vigencia supera la fecha dada.
     *
     * @param string $identificadorCuenta SHA-256 de endpoint y cuenta.
     * @param DateTimeInterface|null $fechaActual Fecha UTC para consulta o pruebas.
     * @return array|null Contexto descifrado o null cuando no está vigente.
     * @throws ExcepcionClarisa Ante errores de base de datos o integridad.
     */
    public function obtenerContextoVigente($identificadorCuenta, $fechaActual = null)
    {
        $this->validarIdentificadorCuenta($identificadorCuenta);
        $fechaActualUtc = $this->normalizarFechaActual($fechaActual);

        try {
            $sentencia = $this->pdo->prepare(CONSULTA_CACHE_CLARISA_VIGENTE);
            $sentencia->bindValue(1, $identificadorCuenta, PDO::PARAM_STR);
            $sentencia->bindValue(
                2,
                $fechaActualUtc->format(self::FORMATO_FECHA_BASE_DATOS),
                PDO::PARAM_STR
            );
            $sentencia->execute();
            $fila = $sentencia->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $excepcion) {
            throw $this->crearExcepcionBaseDatos(
                'No fue posible consultar la caché de autenticación de Clarisa.'
            );
        }

        if ($fila === false) {
            return null;
        }

        return $this->convertirFilaEnContexto($identificadorCuenta, $fila);
    }

    /**
     * Inserta o reemplaza atómicamente el contexto de una cuenta.
     *
     * @param string $identificadorCuenta Identidad estable de la integración.
     * @param array $contexto Contexto retornado por ServicioAutenticacionClarisa.
     * @return void
     * @throws ExcepcionClarisa Ante datos inválidos o errores de persistencia.
     */
    public function guardarContexto($identificadorCuenta, $contexto)
    {
        $this->validarIdentificadorCuenta($identificadorCuenta);
        $datos = $this->validarContexto($contexto);
        $datosAutenticados = $this->crearDatosAutenticados(
            $identificadorCuenta,
            $datos['permisosJson'],
            $datos['nombreUsuario'],
            $datos['fechaObtencion'],
            $datos['fechaExpiracion']
        );
        $tokenProtegido = $this->cifrado->cifrar(
            $contexto['tokenAutorizacion'],
            $datosAutenticados
        );
        $transaccionPropia = false;

        try {
            if (!$this->pdo->inTransaction()) {
                $this->pdo->beginTransaction();
                $transaccionPropia = true;
            }

            $actualizacion = $this->pdo->prepare(CONSULTA_CACHE_CLARISA_ACTUALIZAR);
            $this->enlazarContextoActualizado(
                $actualizacion,
                $identificadorCuenta,
                $tokenProtegido,
                $datos
            );
            $actualizacion->execute();

            if ($actualizacion->rowCount() === 0
                && !$this->existeContexto($identificadorCuenta)) {
                $insercion = $this->pdo->prepare(CONSULTA_CACHE_CLARISA_INSERTAR);
                $this->enlazarContextoInsertado(
                    $insercion,
                    $identificadorCuenta,
                    $tokenProtegido,
                    $datos
                );
                $insercion->execute();
            }

            if ($transaccionPropia) {
                $this->pdo->commit();
            }
        } catch (PDOException $excepcion) {
            if ($transaccionPropia && $this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }

            throw $this->crearExcepcionBaseDatos(
                'No fue posible actualizar la caché de autenticación de Clarisa.'
            );
        }
    }

    /**
     * Elimina el token y sus metadatos para forzar una renovación posterior.
     */
    public function invalidarContexto($identificadorCuenta)
    {
        $this->validarIdentificadorCuenta($identificadorCuenta);

        try {
            $sentencia = $this->pdo->prepare(CONSULTA_CACHE_CLARISA_INVALIDAR);
            $sentencia->bindValue(1, $identificadorCuenta, PDO::PARAM_STR);
            $sentencia->execute();
        } catch (PDOException $excepcion) {
            throw $this->crearExcepcionBaseDatos(
                'No fue posible invalidar la caché de autenticación de Clarisa.'
            );
        }
    }

    /**
     * Obtiene un bloqueo asesor de MariaDB asociado exclusivamente a la cuenta.
     */
    public function adquirirBloqueoRenovacion($identificadorCuenta, $tiempoEsperaSegundos)
    {
        $this->validarIdentificadorCuenta($identificadorCuenta);

        if (!is_int($tiempoEsperaSegundos)
            || $tiempoEsperaSegundos < 0
            || $tiempoEsperaSegundos > self::TIEMPO_MAXIMO_BLOQUEO_SEGUNDOS) {
            throw new ExcepcionClarisa(
                ExcepcionClarisa::TIPO_CONFIGURACION,
                'El tiempo de espera del bloqueo de Clarisa no es válido.'
            );
        }

        try {
            $sentencia = $this->pdo->prepare(CONSULTA_CACHE_CLARISA_ADQUIRIR_BLOQUEO);
            $sentencia->bindValue(1, $this->crearNombreBloqueo($identificadorCuenta), PDO::PARAM_STR);
            $sentencia->bindValue(2, $tiempoEsperaSegundos, PDO::PARAM_INT);
            $sentencia->execute();
            $resultado = $sentencia->fetchColumn();
        } catch (PDOException $excepcion) {
            throw $this->crearExcepcionBaseDatos(
                'No fue posible coordinar la renovación de la caché de Clarisa.',
                true
            );
        }

        if ((int) $resultado !== 1) {
            throw $this->crearExcepcionBaseDatos(
                'La renovación de Clarisa está siendo atendida por otro proceso.',
                true
            );
        }
    }

    /**
     * Libera el bloqueo asesor adquirido para la cuenta.
     */
    public function liberarBloqueoRenovacion($identificadorCuenta)
    {
        $this->validarIdentificadorCuenta($identificadorCuenta);

        try {
            $sentencia = $this->pdo->prepare(CONSULTA_CACHE_CLARISA_LIBERAR_BLOQUEO);
            $sentencia->bindValue(1, $this->crearNombreBloqueo($identificadorCuenta), PDO::PARAM_STR);
            $sentencia->execute();
            $resultado = $sentencia->fetchColumn();
        } catch (PDOException $excepcion) {
            throw $this->crearExcepcionBaseDatos(
                'No fue posible liberar la coordinación de la caché de Clarisa.',
                true
            );
        }

        if ((int) $resultado !== 1) {
            throw $this->crearExcepcionBaseDatos(
                'El bloqueo de renovación de Clarisa no pudo liberarse.',
                true
            );
        }
    }

    private function convertirFilaEnContexto($identificadorCuenta, $fila)
    {
        $campos = array(
            'token_cifrado',
            'token_iv',
            'token_etiqueta',
            'permisos_json',
            'nombre_usuario_remoto',
            'fecha_obtencion',
            'fecha_expiracion'
        );

        foreach ($campos as $campo) {
            if (!array_key_exists($campo, $fila)) {
                throw $this->crearExcepcionContenidoInvalido();
            }
        }

        $permisosJson = $fila['permisos_json'];
        $nombreUsuario = $fila['nombre_usuario_remoto'];
        $fechaObtencion = $this->convertirFechaBaseDatos($fila['fecha_obtencion']);
        $fechaExpiracion = $this->convertirFechaBaseDatos($fila['fecha_expiracion']);

        if (!is_string($permisosJson)
            || !is_string($nombreUsuario)
            || !$this->esNombreUsuarioValido($nombreUsuario)) {
            throw $this->crearExcepcionContenidoInvalido();
        }

        $permisos = json_decode($permisosJson, true);

        if (json_last_error() !== JSON_ERROR_NONE
            || !$this->sonPermisosValidos($permisos)) {
            throw $this->crearExcepcionContenidoInvalido();
        }

        $datosAutenticados = $this->crearDatosAutenticados(
            $identificadorCuenta,
            $permisosJson,
            $nombreUsuario,
            $fechaObtencion,
            $fechaExpiracion
        );
        $tokenAutorizacion = $this->cifrado->descifrar(
            $this->normalizarBinario($fila['token_cifrado']),
            $this->normalizarBinario($fila['token_iv']),
            $this->normalizarBinario($fila['token_etiqueta']),
            $datosAutenticados
        );

        return array(
            'tokenAutorizacion' => $tokenAutorizacion,
            'permisos' => $permisos,
            'usuario' => array('nombreUsuario' => $nombreUsuario),
            'fechaObtencion' => $fechaObtencion,
            'fechaExpiracion' => $fechaExpiracion
        );
    }

    private function validarContexto($contexto)
    {
        $claves = array(
            'tokenAutorizacion',
            'permisos',
            'usuario',
            'fechaObtencion',
            'fechaExpiracion'
        );

        if (!is_array($contexto) || array_keys($contexto) !== $claves
            || !is_string($contexto['tokenAutorizacion'])
            || !$this->sonPermisosValidos($contexto['permisos'])
            || !is_array($contexto['usuario'])
            || array_keys($contexto['usuario']) !== array('nombreUsuario')
            || !$this->esNombreUsuarioValido($contexto['usuario']['nombreUsuario'])) {
            throw $this->crearExcepcionContenidoInvalido();
        }

        $fechaObtencion = $this->validarFechaContexto($contexto['fechaObtencion']);
        $fechaExpiracion = $this->validarFechaContexto($contexto['fechaExpiracion']);

        if ($fechaExpiracion <= $fechaObtencion) {
            throw $this->crearExcepcionContenidoInvalido();
        }

        $permisosJson = json_encode(
            $contexto['permisos'],
            JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
        );

        if ($permisosJson === false || strlen($permisosJson) > 65535) {
            throw $this->crearExcepcionContenidoInvalido();
        }

        return array(
            'permisosJson' => $permisosJson,
            'nombreUsuario' => $contexto['usuario']['nombreUsuario'],
            'fechaObtencion' => $contexto['fechaObtencion'],
            'fechaExpiracion' => $contexto['fechaExpiracion'],
            'fechaObtencionBaseDatos' => $fechaObtencion->format(self::FORMATO_FECHA_BASE_DATOS),
            'fechaExpiracionBaseDatos' => $fechaExpiracion->format(self::FORMATO_FECHA_BASE_DATOS)
        );
    }

    private function enlazarContextoActualizado(
        $sentencia,
        $identificadorCuenta,
        $tokenProtegido,
        $datos
    ) {
        $sentencia->bindValue(1, $tokenProtegido['textoCifrado'], PDO::PARAM_LOB);
        $sentencia->bindValue(2, $tokenProtegido['vectorInicializacion'], PDO::PARAM_LOB);
        $sentencia->bindValue(3, $tokenProtegido['etiquetaAutenticacion'], PDO::PARAM_LOB);
        $sentencia->bindValue(4, $datos['permisosJson'], PDO::PARAM_STR);
        $sentencia->bindValue(5, $datos['nombreUsuario'], PDO::PARAM_STR);
        $sentencia->bindValue(6, $datos['fechaObtencionBaseDatos'], PDO::PARAM_STR);
        $sentencia->bindValue(7, $datos['fechaExpiracionBaseDatos'], PDO::PARAM_STR);
        $sentencia->bindValue(8, $identificadorCuenta, PDO::PARAM_STR);
    }

    private function enlazarContextoInsertado(
        $sentencia,
        $identificadorCuenta,
        $tokenProtegido,
        $datos
    ) {
        $sentencia->bindValue(1, $identificadorCuenta, PDO::PARAM_STR);
        $sentencia->bindValue(2, $tokenProtegido['textoCifrado'], PDO::PARAM_LOB);
        $sentencia->bindValue(3, $tokenProtegido['vectorInicializacion'], PDO::PARAM_LOB);
        $sentencia->bindValue(4, $tokenProtegido['etiquetaAutenticacion'], PDO::PARAM_LOB);
        $sentencia->bindValue(5, $datos['permisosJson'], PDO::PARAM_STR);
        $sentencia->bindValue(6, $datos['nombreUsuario'], PDO::PARAM_STR);
        $sentencia->bindValue(7, $datos['fechaObtencionBaseDatos'], PDO::PARAM_STR);
        $sentencia->bindValue(8, $datos['fechaExpiracionBaseDatos'], PDO::PARAM_STR);
    }

    private function existeContexto($identificadorCuenta)
    {
        $sentencia = $this->pdo->prepare(CONSULTA_CACHE_CLARISA_EXISTE);
        $sentencia->bindValue(1, $identificadorCuenta, PDO::PARAM_STR);
        $sentencia->execute();

        return (int) $sentencia->fetchColumn() > 0;
    }

    private function sonPermisosValidos($permisos)
    {
        if (!is_array($permisos)) {
            return false;
        }

        $indiceEsperado = 0;

        foreach ($permisos as $indice => $permiso) {
            if ($indice !== $indiceEsperado
                || !is_string($permiso)
                || trim($permiso) === ''
                || strlen($permiso) > 255
                || preg_match('/[\x00-\x1F\x7F]/', $permiso) === 1) {
                return false;
            }

            $indiceEsperado++;
        }

        return true;
    }

    private function esNombreUsuarioValido($nombreUsuario)
    {
        return is_string($nombreUsuario)
            && trim($nombreUsuario) !== ''
            && strlen($nombreUsuario) <= self::LONGITUD_MAXIMA_NOMBRE_USUARIO
            && preg_match('/[\x00-\x1F\x7F]/', $nombreUsuario) !== 1;
    }

    private function validarIdentificadorCuenta($identificadorCuenta)
    {
        if (!is_string($identificadorCuenta)
            || !preg_match('/^[a-f0-9]{64}$/D', $identificadorCuenta)) {
            throw new ExcepcionClarisa(
                ExcepcionClarisa::TIPO_CONFIGURACION,
                'El identificador de la cuenta Clarisa no es válido.'
            );
        }
    }

    private function validarFechaContexto($valor)
    {
        if (!is_string($valor)) {
            throw $this->crearExcepcionContenidoInvalido();
        }

        $fecha = DateTimeImmutable::createFromFormat(
            '!' . self::FORMATO_FECHA_CONTEXTO,
            $valor,
            new DateTimeZone('UTC')
        );
        $errores = DateTimeImmutable::getLastErrors();

        if ($fecha === false
            || ($errores !== false
                && ($errores['warning_count'] > 0 || $errores['error_count'] > 0))
            || $fecha->format(self::FORMATO_FECHA_CONTEXTO) !== $valor) {
            throw $this->crearExcepcionContenidoInvalido();
        }

        return $fecha;
    }

    private function convertirFechaBaseDatos($valor)
    {
        if (!is_string($valor)) {
            throw $this->crearExcepcionContenidoInvalido();
        }

        $fecha = DateTimeImmutable::createFromFormat(
            '!' . self::FORMATO_FECHA_BASE_DATOS,
            $valor,
            new DateTimeZone('UTC')
        );
        $errores = DateTimeImmutable::getLastErrors();

        if ($fecha === false
            || ($errores !== false
                && ($errores['warning_count'] > 0 || $errores['error_count'] > 0))
            || $fecha->format(self::FORMATO_FECHA_BASE_DATOS) !== $valor) {
            throw $this->crearExcepcionContenidoInvalido();
        }

        return $fecha->format(self::FORMATO_FECHA_CONTEXTO);
    }

    private function normalizarFechaActual($fechaActual)
    {
        if ($fechaActual === null) {
            $fechaActual = new DateTimeImmutable('now', new DateTimeZone('UTC'));
        }

        if (!($fechaActual instanceof DateTimeInterface)) {
            throw new ExcepcionClarisa(
                ExcepcionClarisa::TIPO_CONFIGURACION,
                'La fecha de consulta de la caché de Clarisa no es válida.'
            );
        }

        return (new DateTimeImmutable('@' . $fechaActual->getTimestamp()))
            ->setTimezone(new DateTimeZone('UTC'));
    }

    private function crearDatosAutenticados(
        $identificadorCuenta,
        $permisosJson,
        $nombreUsuario,
        $fechaObtencion,
        $fechaExpiracion
    ) {
        $datos = json_encode(array(
            'identificadorCuenta' => $identificadorCuenta,
            'permisosJson' => $permisosJson,
            'nombreUsuario' => $nombreUsuario,
            'fechaObtencion' => $fechaObtencion,
            'fechaExpiracion' => $fechaExpiracion
        ), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        if ($datos === false) {
            throw $this->crearExcepcionContenidoInvalido();
        }

        return $datos;
    }

    private function normalizarBinario($valor)
    {
        if (is_resource($valor)) {
            $valor = stream_get_contents($valor);
        }

        if (!is_string($valor)) {
            throw $this->crearExcepcionContenidoInvalido();
        }

        return $valor;
    }

    private function crearNombreBloqueo($identificadorCuenta)
    {
        return 'clarisa_cache_' . substr($identificadorCuenta, 0, 50);
    }

    private function crearExcepcionBaseDatos($mensaje, $reintentable = false)
    {
        return new ExcepcionClarisa(
            ExcepcionClarisa::TIPO_BASE_DATOS,
            $mensaje,
            null,
            $reintentable
        );
    }

    private function crearExcepcionContenidoInvalido()
    {
        return new ExcepcionClarisa(
            ExcepcionClarisa::TIPO_SEGURIDAD,
            'El contenido de la caché de Clarisa no es válido o fue modificado.'
        );
    }
}
