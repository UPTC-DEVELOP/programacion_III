<?php
// El router de Panther valida recurso, sesión y rol antes de llamar estos métodos.
abstract class CatalogoTaller
{
    public static function init() {}

    private static function db()
    {
        return Connection::getInstance()->getConnection();
    }

    private static function id($ruta)
    {
        if (count($ruta) !== 1 || !preg_match('/^[1-9][0-9]{0,9}$/D', $ruta[0])) {
            throw new ExcepcionAPI(NOT_FOUND, 404, 'Ruta desconocida.');
        }
        return $ruta[0];
    }

    private static function campos()
    {
        $obj = JSONUtil::decodeJSON();
        if (!is_object($obj)) throw new ExcepcionAPI(BAD_REQUEST, 400, 'Se esperaba una ficha JSON.');
        $datos = [];
        foreach (static::REGLAS as $campo => $patron) {
            $valor = $obj->$campo ?? '';
            if (!is_string($valor) && !is_int($valor)) throw new ExcepcionAPI(BAD_REQUEST, 400, 'Revisa ' . $campo);
            $valor = trim((string)$valor);
            if (!preg_match($patron, $valor) ||
                ($campo === 'correo' && $valor !== '' && !filter_var($valor, FILTER_VALIDATE_EMAIL)) ||
                ($campo === 'anio' && ((int)$valor < 1950 || (int)$valor > (int)date('Y') + 1))) {
                throw new ExcepcionAPI(BAD_REQUEST, 400, 'Revisa el campo ' . $campo . '.');
            }
            $datos[$campo] = $campo === 'kilometraje' && $valor === '' ? null : $valor;
        }
        return $datos;
    }

    private static function escribir($sql, $params)
    {
        try {
            $q = self::db()->prepare($sql);
            $q->execute($params);
            return $q->rowCount();
        } catch (PDOException $e) {
            $n = (int)($e->errorInfo[1] ?? 0);
            if ($n === 1062) throw new ExcepcionAPI(BAD_REQUEST, 409, 'El identificador o el dato único ya está registrado.');
            if ($n === 1451 || $n === 1452) throw new ExcepcionAPI(BAD_REQUEST, 409, 'Revisa la relación con otros registros.');
            throw new ExcepcionAPI(INTERNAL_SERVER_ERROR, 500, 'No se pudo guardar el cambio en Panther.');
        }
    }

    public static function get($ruta)
    {
        if (!$ruta || $ruta === ['']) {
            $lista = self::db()->query(static::LECTURA . ' ORDER BY t.id')->fetchAll(PDO::FETCH_ASSOC);
            return new ContentBody(OK, 200, $lista);
        }
        $q = self::db()->prepare(static::LECTURA . ' WHERE t.id=?');
        $q->execute([self::id($ruta)]);
        $fila = $q->fetch(PDO::FETCH_ASSOC);
        if (!$fila) throw new ExcepcionAPI(NOT_FOUND, 404, 'Registro inexistente.');
        return new ContentBody(OK, 200, $fila);
    }

    public static function post($ruta)
    {
        if ($ruta && $ruta !== ['']) throw new ExcepcionAPI(NOT_FOUND, 404, 'Ruta desconocida.');
        $datos = self::campos();
        $columnas = implode(',', array_keys($datos));
        $marcas = implode(',', array_fill(0, count($datos), '?'));
        self::escribir('INSERT INTO ' . static::TABLA . " ($columnas) VALUES ($marcas)", array_values($datos));
        return new ContentBody(OK, 201, ['id' => self::db()->lastInsertId()]);
    }

    public static function put($ruta)
    {
        $id = self::id($ruta);
        $datos = self::campos();
        $columnas = implode('=?,', array_keys($datos)) . '=?';
        $params = array_values($datos);
        $params[] = $id;
        if (!self::escribir('UPDATE ' . static::TABLA . " SET $columnas WHERE id=?", $params)) self::get($ruta);
        return new ContentBody(OK, 200, ['id' => $id]);
    }

    public static function delete($ruta)
    {
        $id = self::id($ruta);
        if (!self::escribir('DELETE FROM ' . static::TABLA . ' WHERE id=?', [$id])) {
            throw new ExcepcionAPI(NOT_FOUND, 404, 'Registro inexistente.');
        }
        return new ContentBody(OK, 200, ['id' => $id]);
    }
}

class Clientes extends CatalogoTaller
{
    const TABLA = 'cliente_taller';
    const LECTURA = 'SELECT t.* FROM cliente_taller t';
    const REGLAS = ['documento'=>'/^[A-Za-z0-9-]{3,20}$/D','nombre'=>'/^.{2,100}$/uD',
                    'telefono'=>'/^[0-9]{7,10}$/D','correo'=>'/^.{0,100}$/uD'];
}

class Vehiculos extends CatalogoTaller
{
    const TABLA = 'vehiculo_taller';
    const LECTURA = 'SELECT t.*, c.nombre AS propietario FROM vehiculo_taller t JOIN cliente_taller c ON c.id=t.cliente_id';
    const REGLAS = ['placa'=>'/^[A-Z]{3}[0-9]{2}[A-Z0-9]$/D','cliente_id'=>'/^[1-9][0-9]{0,9}$/D',
                    'marca'=>'/^.{1,60}$/uD','modelo'=>'/^.{1,60}$/uD','anio'=>'/^[0-9]{4}$/D',
                    'color'=>'/^.{0,40}$/uD','kilometraje'=>'/^[0-9]{0,9}$/D'];
}

class Proveedores extends CatalogoTaller
{
    const TABLA = 'proveedor_taller';
    const LECTURA = 'SELECT t.* FROM proveedor_taller t';
    const REGLAS = ['codigo'=>'/^[A-Za-z0-9]{3,10}$/D','razonSocial'=>'/^.{3,100}$/uD','nit'=>'/^[0-9]{5,12}(-[0-9])?$/D',
                    'direccion'=>'/^.{5,100}$/uD','telefono'=>'/^[0-9]{7,10}$/D','correo'=>'/^.{3,100}$/uD'];

    public static function delete($ruta)
    {
        throw new ExcepcionAPI(BAD_REQUEST, 405, 'Usa el cambio de estado del proveedor.');
    }

    public static function put($ruta)
    {
        if (count($ruta) !== 2 || $ruta[1] !== 'estado') return parent::put($ruta);
        $id = array_shift($ruta);
        parent::get([$id]);
        $estado = JSONUtil::decodeJSON()->estado ?? '';
        if (!in_array($estado, ['Activo','Inactivo'], true)) throw new ExcepcionAPI(BAD_REQUEST, 400, 'Estado inválido.');
        $db = Connection::getInstance()->getConnection();
        $db->prepare('UPDATE proveedor_taller SET estado=? WHERE id=?')->execute([$estado,$id]);
        return new ContentBody(OK, 200, ['id'=>$id]);
    }
}

class Repuestos extends CatalogoTaller
{
    const TABLA = 'repuesto_taller';
    const LECTURA = 'SELECT t.* FROM repuesto_taller t';
    const REGLAS = ['referencia'=>'/^[A-Za-z0-9._-]{1,30}$/D','nombre'=>'/^.{2,100}$/uD','precio'=>'/^[0-9]{1,10}([.][0-9]{1,2})?$/D'];
    public static function delete($ruta)
    {
        if (count($ruta) !== 1 || !ctype_digit($ruta[0])) throw new ExcepcionAPI(NOT_FOUND,404,'Ruta desconocida.');
        $db = Connection::getInstance()->getConnection();
        try {
            $q = $db->prepare('DELETE FROM repuesto_taller WHERE id=? AND existencias=0');
            $q->execute([$ruta[0]]);
        } catch (PDOException $e) {
            throw new ExcepcionAPI(BAD_REQUEST,409,'El repuesto está relacionado con otros registros.');
        }
        if (!$q->rowCount()) {
            parent::get($ruta);
            throw new ExcepcionAPI(BAD_REQUEST,409,'El repuesto todavía tiene existencias.');
        }
        return new ContentBody(OK,200,['id'=>$ruta[0]]);
    }
}
