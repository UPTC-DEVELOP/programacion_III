<?php
class Empleados
{
    public static function init() {}

    private static function db()
    {
        return Connection::getInstance()->getConnection();
    }

    private static function rutaInvalida()
    {
        throw new ExcepcionAPI(NOT_FOUND, 404, 'Ruta de empleados desconocida.');
    }

    private static function ficha($obj)
    {
        $reglas = [
            'nombre' => '/^[A-Za-zÁÉÍÓÚáéíóúÑñ ]{2,30}$/uD',
            'apellido' => '/^[A-Za-zÁÉÍÓÚáéíóúÑñ ]{2,30}$/uD',
            'telefono' => '/^3[0-9]{9}$/D',
            'rol' => '/^(Administrador|Recepción|Mecánico|Almacenista|Jefe de taller)$/D'
        ];
        $campos = [];
        foreach ($reglas as $campo => $regla) {
            $valor = $obj->$campo ?? null;
            if (!is_string($valor) || !preg_match($regla, trim($valor))) {
                throw new ExcepcionAPI(BAD_REQUEST, 400, 'Revisa el campo ' . $campo . '.');
            }
            $campos[$campo] = trim($valor);
        }
        $correo = $obj->correo ?? '';
        if (!is_string($correo) || strlen(trim($correo)) > 100 ||
            (trim($correo) !== '' && !filter_var(trim($correo), FILTER_VALIDATE_EMAIL))) {
            throw new ExcepcionAPI(BAD_REQUEST, 400, 'Revisa el correo electrónico.');
        }
        $campos['correo'] = trim($correo) === '' ? null : trim($correo);
        return $campos;
    }

    private static function escribir($sql, $params)
    {
        try {
            $consulta = self::db()->prepare($sql);
            $consulta->execute($params);
            return $consulta->rowCount();
        } catch (PDOException $e) {
            if ((int)($e->errorInfo[1] ?? 0) === 1062) {
                throw new ExcepcionAPI(BAD_REQUEST, 409, 'La cédula o el correo ya están registrados.');
            }
            throw new ExcepcionAPI(INTERNAL_SERVER_ERROR, 500, 'No se pudo guardar el empleado.');
        }
    }

    public static function get($ruta)
    {
        UserAction::authenticator();
        if ($ruta && $ruta !== ['']) self::rutaInvalida();
        $sql = 'SELECT cedula, nombre, apellido, telefono, correo, rol, estado FROM empleado_taller ORDER BY apellido, nombre, cedula';
        return new ContentBody(OK, 200, self::db()->query($sql)->fetchAll(PDO::FETCH_ASSOC));
    }

    public static function post($ruta)
    {
        UserAction::authenticator();
        if ($ruta && $ruta !== ['']) self::rutaInvalida();
        $obj = JSONUtil::decodeJSON();
        $campos = self::ficha($obj);
        if (!is_string($obj->cedula ?? null) || !preg_match('/^[0-9]{7,10}$/D', $obj->cedula)) {
            throw new ExcepcionAPI(BAD_REQUEST, 400, 'Revisa la cédula.');
        }
        $campos['cedula'] = $obj->cedula;
        self::escribir('INSERT INTO empleado_taller (cedula,nombre,apellido,telefono,correo,rol) VALUES (:cedula,:nombre,:apellido,:telefono,:correo,:rol)', $campos);
        return new ContentBody(OK, 201, $obj->cedula);
    }

    public static function put($ruta)
    {
        UserAction::authenticator();
        if (!preg_match('/^[0-9]{7,10}$/D', $ruta[0] ?? '') || count($ruta) > 2) self::rutaInvalida();
        $obj = JSONUtil::decodeJSON();
        if (count($ruta) === 2) {
            if ($ruta[1] !== 'estado') self::rutaInvalida();
            if (!in_array($obj->estado ?? null, ['Activo','Inactivo'], true)) {
                throw new ExcepcionAPI(BAD_REQUEST, 400, 'Estado inválido.');
            }
            $campos = ['estado' => $obj->estado];
            $sql = 'UPDATE empleado_taller SET estado=:estado WHERE cedula=:cedula';
        } else {
            $campos = self::ficha($obj);
            $sql = 'UPDATE empleado_taller SET nombre=:nombre, apellido=:apellido, telefono=:telefono, correo=:correo, rol=:rol WHERE cedula=:cedula';
        }
        $campos['cedula'] = $ruta[0];
        if (self::escribir($sql, $campos) === 0) {
            $existe = self::db()->prepare('SELECT 1 FROM empleado_taller WHERE cedula=?');
            $existe->execute([$ruta[0]]);
            if (!$existe->fetchColumn()) throw new ExcepcionAPI(NOT_FOUND, 404, 'Empleado no encontrado.');
        }
        return new ContentBody(OK, 200, $ruta[0]);
    }
}
