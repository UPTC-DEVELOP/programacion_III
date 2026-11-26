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

    private static function escribir($sql, $params, $db = null)
    {
        try {
            $consulta = ($db ?? self::db())->prepare($sql);
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
        UserAction::authenticator(true);
        if ($ruta && $ruta !== ['']) self::rutaInvalida();
        $sql = 'SELECT e.*, u.user AS usuario FROM empleado_taller e LEFT JOIN cuenta_empleado c ON c.cedula=e.cedula LEFT JOIN j4user u ON u.id=c.usuario_id ORDER BY e.apellido,e.nombre,e.cedula';
        return new ContentBody(OK, 200, self::db()->query($sql)->fetchAll(PDO::FETCH_ASSOC));
    }

    private static function rolId($db, $cargo)
    {
        $roles = ['Recepción'=>'recepcion', 'Administrador'=>'admin', 'Mecánico'=>'mecanico',
                  'Almacenista'=>'almacenista', 'Jefe de taller'=>'jefe_taller'];
        $q = $db->prepare('SELECT id FROM j4rol WHERE name=?');
        $q->execute([$roles[$cargo]]);
        $ids = $q->fetchAll(PDO::FETCH_COLUMN);
        if (count($ids) !== 1) throw new ExcepcionAPI(BAD_REQUEST, 400, 'Revisa el rol en Panther.');
        return $ids[0];
    }

    private static function crearCuenta($db, $obj, $cedula)
    {
        $usuario = $obj->usuario ?? null;
        $clave = $obj->clave ?? null;
        if (!is_string($usuario) || !preg_match('/\A(?=.*[A-Za-z])[A-Za-z0-9._-]{6,30}\z/', $usuario)
            || !is_string($clave) || preg_match('/\A.{6}/us', $clave) !== 1 || strlen($clave) > 72 || strpos($clave, chr(0)) !== false) {
            throw new ExcepcionAPI(BAD_REQUEST, 400, 'Usa un usuario de 3 a 30 caracteres y una contraseña de al menos 6 caracteres.');
        }
        $q = $db->prepare('SELECT id FROM j4user WHERE user=? FOR UPDATE');
        $q->execute([$usuario]);
        if ($q->fetchColumn() !== false) throw new ExcepcionAPI(BAD_REQUEST, 409, 'Ese usuario ya existe.');
        $q = $db->prepare('INSERT INTO j4user (user,password,keyAPI,roles) VALUES (?,?,?,?)');
        try {
            $q->execute([$usuario,password_hash($clave,PASSWORD_BCRYPT),UserAction::getKeyAPI(),self::rolId($db,$obj->rol)]);
        } catch (PDOException $e) {
            if ((int)($e->errorInfo[1] ?? 0) === 1062) throw new ExcepcionAPI(BAD_REQUEST,409,'Ese usuario ya existe.');
            throw $e;
        }
        $id = $db->lastInsertId();
        $db->prepare('INSERT INTO cuenta_empleado(usuario_id,cedula) VALUES (?,?)')->execute([$id,$cedula]);
    }

    public static function post($ruta)
    {
        UserAction::authenticator(true);
        if ($ruta && $ruta !== ['']) self::rutaInvalida();
        $obj = JSONUtil::decodeJSON();
        $campos = self::ficha($obj);
        if (!is_string($obj->cedula ?? null) || !preg_match('/^[0-9]{7,10}$/D', $obj->cedula)) {
            throw new ExcepcionAPI(BAD_REQUEST, 400, 'Revisa la cédula.');
        }
        $campos['cedula'] = $obj->cedula;
        $db = self::db();
        $db->beginTransaction();
        try {
            self::escribir('INSERT INTO empleado_taller (cedula,nombre,apellido,telefono,correo,rol) VALUES (:cedula,:nombre,:apellido,:telefono,:correo,:rol)', $campos, $db);
            self::crearCuenta($db,$obj,$obj->cedula);
            $db->commit();
        } catch (Throwable $error) {
            if ($db->inTransaction()) $db->rollBack();
            if ($error instanceof PDOException) {
                throw new ExcepcionAPI(INTERNAL_SERVER_ERROR, 500, 'No se pudo completar el registro del empleado y su cuenta.');
            }
            throw $error;
        }
        header('Cache-Control: no-store');
        return new ContentBody(OK, 201, $obj->cedula);
    }

    public static function put($ruta)
    {
        UserAction::authenticator(true);
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
        $db = self::db();
        $db->beginTransaction();
        try {
            $q = $db->prepare('SELECT rol FROM empleado_taller WHERE cedula=? FOR UPDATE');
            $q->execute([$ruta[0]]);
            $antes = $q->fetchColumn();
            if ($antes === false) throw new ExcepcionAPI(NOT_FOUND,404,'Empleado no encontrado.');
            self::escribir($sql,$campos,$db);
            $q = $db->prepare('SELECT usuario_id FROM cuenta_empleado WHERE cedula=?');
            $q->execute([$ruta[0]]);
            $id = $q->fetchColumn();
            if ($id === false && isset($campos['rol']) && isset($obj->usuario)) {
                self::crearCuenta($db,$obj,$ruta[0]);
            } elseif ($id !== false && isset($campos['rol']) && $antes !== $campos['rol']) {
                $db->prepare('UPDATE j4user SET roles=?,sesionHasta=NULL WHERE id=?')
                   ->execute([self::rolId($db,$campos['rol']),$id]);
            } elseif ($id !== false && ($campos['estado'] ?? '') === 'Inactivo') {
                $db->prepare('UPDATE j4user SET sesionHasta=NULL WHERE id=?')->execute([$id]);
            }
            $db->commit();
        } catch (Throwable $error) {
            if ($db->inTransaction()) $db->rollBack();
            throw $error;
        }
        return new ContentBody(OK, 200, $ruta[0]);
    }
}
