<?php
class AccesoTaller
{
    public static $perfilActual = null;

    public static function controlar($recurso, $ruta, $metodo, $vista)
    {
        self::$perfilActual = null;

        if ($recurso === 'useraction' && in_array($ruta, [['login'], ['logout']], true) && $metodo === 'post') return;
        $headers = array_change_key_case(apache_request_headers(), CASE_LOWER);
        $token = $headers['authorization'] ?? '';
        $db = Connection::getInstance()->getConnection();
        $q = $db->prepare("SELECT r.name AS rol, c.cedula, e.estado, e.rol AS cargo
            FROM j4user u JOIN j4rol r ON r.id=u.roles
            LEFT JOIN cuenta_empleado c ON c.usuario_id=u.id
            LEFT JOIN empleado_taller e ON e.cedula=c.cedula
            WHERE u.keyAPI=? AND u.sesionHasta > UTC_TIMESTAMP() AND u.dateDelete IS NULL");
        $q->execute([hash('sha224', $token)]);
        $perfil = $q->fetch(PDO::FETCH_ASSOC);
        if ($token === '' || !$perfil) throw new ExcepcionAPI(UNAUTHORIZED, 401, 'Inicia sesión.');
        $rol = $perfil['rol'];
        $cargos = ['admin'=>'Administrador','recepcion'=>'Recepción','mecanico'=>'Mecánico','almacenista'=>'Almacenista','jefe_taller'=>'Jefe de taller'];
        if (($perfil['cedula'] !== null || $rol !== 'admin') &&
            ($perfil['estado'] !== 'Activo' || ($cargos[$rol] ?? '') !== $perfil['cargo'])) {
            throw new ExcepcionAPI(FORBIDDEN, 403, 'La cuenta requiere un empleado activo con el cargo correspondiente.');
        }

        self::$perfilActual = $perfil;

        if ($recurso === 'perfil' && !$ruta && $metodo === 'get') {
            $vista->viewPrint(new ContentBody(OK, 200, ['rol'=>$rol, 'cedula'=>$perfil['cedula']]));
            return;
        }
        if ($rol === 'admin') return;
        if ($rol === 'recepcion' && $recurso === 'facturas' && in_array($metodo, ['get','post'], true)) return;

        if ($recurso === 'ordenes') {
            if ($metodo === 'get' && in_array($rol, ['recepcion', 'jefe_taller', 'mecanico'], true)) return;
            if ($metodo === 'post' && (!$ruta || $ruta === ['']) && in_array($rol, ['recepcion', 'jefe_taller'], true)) return;
            if ($metodo === 'put' && count($ruta) === 2 && $ruta[1] === 'asignacion' && in_array($rol, ['recepcion', 'jefe_taller'], true)) return;
            if ($metodo === 'put' && count($ruta) === 2 && $ruta[1] === 'horas' && in_array($rol, ['mecanico', 'jefe_taller'], true)) return;
            if ($metodo === 'put' && count($ruta) === 2 && $ruta[1] === 'estado' && in_array($rol, ['jefe_taller', 'recepcion', 'mecanico'], true)) return;
        }

        throw new ExcepcionAPI(FORBIDDEN, 403, 'Tu rol no tiene permiso para esta operación.');
    }
}