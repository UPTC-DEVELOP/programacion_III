<?php

require_once __DIR__ . '/ConfiguracionClarisa.php';
require_once __DIR__ . '/RepositorioCacheClarisa.php';
require_once __DIR__ . '/ServicioAutenticacionClarisa.php';

/**
 * Reutiliza o renueva de forma coordinada el contexto de Clarisa.
 */
class ServicioCacheClarisa
{
    const TIEMPO_ESPERA_BLOQUEO_SEGUNDOS = 5;

    private $configuracion;
    private $repositorio;
    private $servicioAutenticacion;
    private $reloj;

    /**
     * @param ConfiguracionClarisa|null $configuracion Configuración validada.
     * @param RepositorioCacheClarisa|null $repositorio Persistencia de la caché.
     * @param ServicioAutenticacionClarisa|null $servicioAutenticacion Autenticador.
     * @param callable|null $reloj Fuente UTC inyectable para pruebas.
     */
    public function __construct(
        $configuracion = null,
        $repositorio = null,
        $servicioAutenticacion = null,
        $reloj = null
    ) {
        if ($configuracion === null) {
            $configuracion = new ConfiguracionClarisa();
        }

        if (!($configuracion instanceof ConfiguracionClarisa)) {
            throw new ExcepcionClarisa(
                ExcepcionClarisa::TIPO_CONFIGURACION,
                'La configuración de la caché de Clarisa no es válida.'
            );
        }

        if ($repositorio === null) {
            $repositorio = new RepositorioCacheClarisa();
        }

        if (!($repositorio instanceof RepositorioCacheClarisa)) {
            throw new ExcepcionClarisa(
                ExcepcionClarisa::TIPO_CONFIGURACION,
                'El repositorio de la caché de Clarisa no es válido.'
            );
        }

        if ($servicioAutenticacion === null) {
            $servicioAutenticacion = new ServicioAutenticacionClarisa($configuracion);
        }

        if (!($servicioAutenticacion instanceof ServicioAutenticacionClarisa)) {
            throw new ExcepcionClarisa(
                ExcepcionClarisa::TIPO_CONFIGURACION,
                'El servicio de autenticación entregado a la caché no es válido.'
            );
        }

        if ($reloj !== null && !is_callable($reloj)) {
            throw new ExcepcionClarisa(
                ExcepcionClarisa::TIPO_CONFIGURACION,
                'El reloj de la caché de Clarisa no es válido.'
            );
        }

        $this->configuracion = $configuracion;
        $this->repositorio = $repositorio;
        $this->servicioAutenticacion = $servicioAutenticacion;
        $this->reloj = $reloj;
    }

    /**
     * Devuelve un contexto vigente o lo obtiene de Clarisa y lo almacena.
     *
     * La segunda consulta, realizada después de adquirir el bloqueo, evita que
     * procesos concurrentes renueven simultáneamente una misma cuenta.
     *
     * @return array Contexto de autorización compatible con Clarisa.
     * @throws ExcepcionClarisa Ante fallos de caché o autenticación.
     */
    public function obtenerContexto()
    {
        $identificadorCuenta = $this->configuracion->obtenerIdentificadorCuentaCache();
        $contexto = $this->repositorio->obtenerContextoVigente(
            $identificadorCuenta,
            $this->obtenerFechaActualUtc()
        );

        if ($contexto !== null) {
            return $contexto;
        }

        $bloqueoAdquirido = false;

        try {
            $this->repositorio->adquirirBloqueoRenovacion(
                $identificadorCuenta,
                self::TIEMPO_ESPERA_BLOQUEO_SEGUNDOS
            );
            $bloqueoAdquirido = true;

            $contexto = $this->repositorio->obtenerContextoVigente(
                $identificadorCuenta,
                $this->obtenerFechaActualUtc()
            );

            if ($contexto !== null) {
                return $contexto;
            }

            $contexto = $this->servicioAutenticacion->autenticar();
            $this->repositorio->guardarContexto($identificadorCuenta, $contexto);

            return $contexto;
        } finally {
            if ($bloqueoAdquirido) {
                $this->repositorio->liberarBloqueoRenovacion($identificadorCuenta);
            }
        }
    }

    /**
     * Elimina el contexto de la cuenta configurada.
     */
    public function invalidarContexto()
    {
        $this->repositorio->invalidarContexto(
            $this->configuracion->obtenerIdentificadorCuentaCache()
        );
    }

    private function obtenerFechaActualUtc()
    {
        if ($this->reloj === null) {
            $fecha = new DateTimeImmutable('now', new DateTimeZone('UTC'));
        } else {
            $reloj = $this->reloj;
            $fecha = call_user_func($reloj);
        }

        if (!($fecha instanceof DateTimeInterface)) {
            throw new ExcepcionClarisa(
                ExcepcionClarisa::TIPO_CONFIGURACION,
                'El reloj de la caché de Clarisa no produjo una fecha válida.'
            );
        }

        return (new DateTimeImmutable('@' . $fecha->getTimestamp()))
            ->setTimezone(new DateTimeZone('UTC'));
    }
}
