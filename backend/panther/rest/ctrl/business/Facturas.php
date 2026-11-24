<?php
class Facturas
{
    const URL_PRUEBAS = 'https://pru.clarisacloud.com:8443/api/factura/rest/v1/factura/nacional';

    public static function init() {}

    private static function db()
    {
        return Connection::getInstance()->getConnection();
    }

    private static function consultar($id)
    {
        if (!ctype_digit((string)$id)) {
            throw new ExcepcionAPI(BAD_REQUEST, 400, 'ID de factura inválido.');
        }
        $consulta = self::db()->prepare('SELECT id, estado, detalle, documento FROM factura_taller WHERE id = ?');
        $consulta->execute([$id]);
        $fila = $consulta->fetch(PDO::FETCH_ASSOC);
        if (!$fila) {
            throw new ExcepcionAPI(NOT_FOUND, 404, 'No se encontró la factura.');
        }
        return $fila;
    }

    public static function get($ruta)
    {
        UserAction::authenticator();
        if (!$ruta || $ruta === ['']) {
            $sql = 'SELECT id, prefijo, consecutivo, estado FROM factura_taller ORDER BY id DESC';
            return new ContentBody(OK, 200, self::db()->query($sql)->fetchAll(PDO::FETCH_ASSOC));
        }
        $fila = self::consultar($ruta[0]);
        $fila['documento'] = json_decode($fila['documento']);
        return new ContentBody(OK, 200, $fila);
    }

    public static function post($ruta)
    {
        UserAction::authenticator();
        $datos = JSONUtil::decodeJSON();
        if (!$ruta || $ruta === ['']) {
            return self::guardar($datos);
        }
        if (count($ruta) === 2 && $ruta[1] === 'enviar') {
            return self::enviar($ruta[0], $datos->tokenClarisa ?? '');
        }
        throw new ExcepcionAPI(NOT_FOUND, 404, 'Ruta de facturación desconocida.');
    }

    private static function guardar($f)
    {
        if (!is_object($f) || !preg_match('/^[0-9]{1,9}$/D', $f->consecutivoDcto ?? '') ||
            !preg_match('/^[0-9]{1,20}$/D', $f->nit ?? '') ||
            !preg_match('/^[A-Za-z0-9]{1,15}$/D', $f->prefijoDcto ?? '') ||
            empty($f->cliente->numIdentificacion) || empty($f->cliente->nombreRazonSocial) ||
            empty($f->items) || !is_array($f->items) || !is_numeric($f->total ?? null) || $f->total <= 0) {
            throw new ExcepcionAPI(BAD_REQUEST, 400, 'Revisa el documento, el cliente, los ítems y el total.');
        }
        $total = 0;
        foreach ($f->items as $item) {
            if (!is_numeric($item->cantidad ?? null) || $item->cantidad <= 0 ||
                !is_numeric($item->precioBaseUnitario ?? null) || $item->precioBaseUnitario <= 0 ||
                ($item->impuestos[0]->tarifaTributo ?? null) !== 19) {
                throw new ExcepcionAPI(BAD_REQUEST, 400, 'Revisa la cantidad, precio e IVA de los ítems.');
            }
            $base = round($item->cantidad * $item->precioBaseUnitario, 2);
            $total += $base + round($base * 0.19, 2);
        }
        if (round($total * 100) !== round((float)$f->total * 100)) {
            throw new ExcepcionAPI(BAD_REQUEST, 400, 'El total no coincide con los ítems.');
        }
        $json = json_encode($f, JSON_UNESCAPED_UNICODE);
        $db = self::db();
        $sql = 'INSERT INTO factura_taller(nit,prefijo,consecutivo,documento) VALUES (?,?,?,?)
                ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)';
        $db->prepare($sql)->execute([$f->nit, $f->prefijoDcto, $f->consecutivoDcto, $json]);
        $fila = self::consultar($db->lastInsertId());
        if ($fila['documento'] !== $json) {
            throw new ExcepcionAPI(BAD_REQUEST, 409, 'Este consecutivo ya identifica otra factura. Revisa el número.');
        }
        return new ContentBody(OK, 200, ['id' => $fila['id'], 'estado' => $fila['estado']]);
    }

    private static function enviar($id, $token)
    {
        if (!is_string($token) || !preg_match('/^Bearer [^\s\x00-\x1f\x7f]+$/iD', $token)) {
            throw new ExcepcionAPI(BAD_REQUEST, 400, 'Token de Clarisa inválido.');
        }
        if (!function_exists('curl_init')) {
            throw new ExcepcionAPI(INTERNAL_SERVER_ERROR, 500, 'Habilita la extensión curl de PHP en XAMPP.');
        }
        $fila = self::consultar($id);
        $db = self::db();
        $reserva = $db->prepare("UPDATE factura_taller SET estado='enviando', detalle='' WHERE id=? AND estado IN ('guardada','rechazada')");
        $reserva->execute([$id]);
        if (!$reserva->rowCount()) {
            throw new ExcepcionAPI(BAD_REQUEST, 409, 'Consulta el estado de esta factura antes de volver a enviarla.');
        }
        $curl = curl_init(self::URL_PRUEBAS);
        curl_setopt_array($curl, [
            CURLOPT_POST => true, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 25,
            CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'Accept: application/json', 'Authorization: ' . $token],
            CURLOPT_POSTFIELDS => $fila['documento']
        ]);
        $respuesta = curl_exec($curl);
        $http = curl_getinfo($curl, CURLINFO_HTTP_CODE);
        $datos = is_string($respuesta) ? json_decode($respuesta) : null;
        curl_close($curl);
        $estado = 'por_verificar';
        $detalle = 'Respuesta sin confirmar. Consulta el consecutivo en Clarisa antes de reintentar.';
        if ($http >= 200 && $http < 300 && ($datos->success ?? null) === true) {
            $estado = 'enviada';
            $detalle = 'Clarisa confirmó la recepción. CUFE: ' . ($datos->data->informacionFacQR->CUFE ?? 'sin informar');
        } elseif ($http === 401 || $http === 403 || (($datos->success ?? null) === false && $http < 500 && $http !== 409)) {
            $estado = 'rechazada';
            $detalle = is_string($datos->textResponse ?? null) ? $datos->textResponse : 'Clarisa rechazó la solicitud. Revisa el acceso y los datos.';
        }
        $detalle = function_exists('mb_substr') ? mb_substr($detalle, 0, 500) : substr($detalle, 0, 490);
        $db->prepare('UPDATE factura_taller SET estado=?, detalle=? WHERE id=?')->execute([$estado, $detalle, $id]);
        return new ContentBody(OK, 200, ['id' => $id, 'estado' => $estado, 'detalle' => $detalle]);
    }
}
