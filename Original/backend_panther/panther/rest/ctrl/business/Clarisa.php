<?php

/**
 * Descripcion: Proxy hacia la API de Clarisa (modo "proxy").
 *
 *  POST clarisa/login    {usuario, contrasenia}  -> valida contra Clarisa y entrega la keyAPI de Panther
 *  POST clarisa/factura  {token, factura}        -> reenvia la factura a Clarisa (requiere keyAPI Panther)
 *
 * Ventaja: la clave se valida en el servidor (nadie obtiene acceso a los CRUD sin credenciales
 * validas de Clarisa) y se evitan problemas de CORS. Requiere la extension cURL y que el hosting
 * permita conexiones salientes al puerto 8443. Si no es posible, el frontend usa el modo "directo".
 *
 * Caso de Uso: PANTHER - Business (TallerMax)
 */
class Clarisa implements IRequest
{
    public static function init()
    {
    }

    public static function get()
    {
        throw new ExcepcionApi(BAD_REQUEST, ST400, error_url);
    }

    public static function put($request)
    {
        throw new ExcepcionApi(BAD_REQUEST, ST400, error_url);
    }

    public static function delete()
    {
        throw new ExcepcionApi(BAD_REQUEST, ST400, error_url);
    }

    public static function post($request)
    {
        $action = isset($request[0]) ? $request[0] : '';
        if ($action === 'login') {
            return self::login();
        }
        if ($action === 'factura') {
            return self::factura();
        }
        throw new ExcepcionApi(NOT_FOUND, ST404, error_notExist);
    }

    private static function login()
    {
        $body = JSONUtil::decodeJSON();
        $usuario = is_object($body) && isset($body->usuario) ? trim($body->usuario) : '';
        $clave = is_object($body) && isset($body->contrasenia) ? (string) $body->contrasenia : '';
        if (mb_strlen($usuario) < 5 || mb_strlen($usuario) > 255 || strlen($clave) < 5 || strlen($clave) > 255) {
            throw new ExcepcionApi(BAD_REQUEST, ST400, "Usuario y contraseña deben tener entre 5 y 255 caracteres.");
        }

        $r = self::call(CLARISA_LOGIN_URL, array('usuario' => $usuario, 'contrasenia' => $clave), array());
        $json = $r['json'];

        if ($r['status'] >= 200 && $r['status'] < 300 && is_array($json) && !empty($json['success']) && !empty($json['data']['token'])) {
            $user = UserAction::issueKeyForClarisaUser($usuario);
            return new ContentBody(OK, ST200, array(
                'keyAPI' => $user->keyAPI,
                'roles' => $user->roles,
                'clarisa' => $json['data'],
                'message' => isset($json['textResponse']) ? $json['textResponse'] : sucessful
            ));
        }

        $msg = "Usuario o contraseña incorrectos.";
        if (is_array($json)) {
            if (!empty($json['errores']['errores'])) {
                $msgs = array();
                foreach ($json['errores']['errores'] as $e) {
                    if (isset($e['errorMessage'])) {
                        $msgs[] = $e['errorMessage'];
                    }
                }
                if ($msgs) {
                    $msg = implode(' ', $msgs);
                }
            } elseif (!empty($json['textResponse'])) {
                $msg = $json['textResponse'];
            }
        }
        throw new ExcepcionApi(UNAUTHORIZED, ST401, $msg);
    }

    private static function factura()
    {
        UserAction::authenticator();
        $body = JSONUtil::decodeJSON();
        if (!is_object($body) || empty($body->token) || !isset($body->factura)) {
            throw new ExcepcionApi(BAD_REQUEST, ST400, error_noParameter);
        }
        $headers = array(CLARISA_TOKEN_HEADER . ': ' . CLARISA_TOKEN_PREFIX . $body->token);
        $r = self::call(CLARISA_FACTURA_URL, $body->factura, $headers);

        // Se devuelve siempre el resultado de Clarisa tal cual para que el frontend decida
        return new ContentBody(OK, ST200, array(
            'clarisaStatus' => $r['status'],
            'clarisaBody' => $r['json'] !== null ? $r['json'] : $r['raw']
        ));
    }

    /**
     * POST JSON por cURL. Devuelve array(status, json, raw).
     */
    private static function call($url, $payload, $extraHeaders)
    {
        if (!function_exists('curl_init')) {
            throw new ExcepcionApi(BAD_GATEWAY, ST502, "El servidor no tiene cURL. Configure el frontend en modo 'directo'.");
        }
        $ch = curl_init($url);
        curl_setopt_array($ch, array(
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE),
            CURLOPT_HTTPHEADER => array_merge(array('Content-Type: application/json', 'Accept: application/json'), $extraHeaders),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => 10,
            CURLOPT_TIMEOUT => 40
        ));
        $raw = curl_exec($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($raw === false) {
            throw new ExcepcionApi(BAD_GATEWAY, ST502, "No se pudo conectar con Clarisa desde el servidor ($error). Use el modo 'directo'.");
        }
        $json = json_decode($raw, true);
        return array('status' => $status, 'json' => $json, 'raw' => $raw);
    }
}
?>
