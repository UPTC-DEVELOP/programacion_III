<?php
// Servicio Clarisa Sandbox

require_once __DIR__ . '/../cxn/clarisa.config.php';

class ClarisaService
{
    // Login y envio
    public static function loginSandbox($contrasenia)
    {
        $contrasenia = trim((string) $contrasenia);
        if ($contrasenia === '') {
            return self::resultado(false, 400, null, null, 'Debe ingresar la clave de la API Clarisa.');
        }

        $respuesta = self::peticion(CLARISA_LOGIN_PATH, 'POST', array(
            'usuario' => CLARISA_SANDBOX_USER,
            'contrasenia' => $contrasenia
        ), null);

        if (!$respuesta['ok']) {
            $mensaje = self::mensajeDeError($respuesta['data']);
            if ($mensaje === '') {
                $mensaje = 'No fue posible autenticar contra Clarisa Sandbox (HTTP ' . $respuesta['status'] . ').';
            }
            return self::resultado(false, $respuesta['status'], null, $respuesta['data'], $mensaje);
        }

        $data = $respuesta['data'];
        if (!is_array($data) && !is_object($data)) {
            return self::resultado(false, $respuesta['status'], null, $data, 'Respuesta de login Clarisa inválida.');
        }

        $dataArr = self::aArray($data);
        if (empty($dataArr['success'])) {
            $mensaje = self::mensajeDeError($dataArr);
            return self::resultado(false, $respuesta['status'], null, $dataArr, $mensaje !== '' ? $mensaje : 'Credenciales Clarisa rechazadas.');
        }

        $token = null;
        if (isset($dataArr['data']['token'])) {
            $token = $dataArr['data']['token'];
        }
        if (!$token) {
            return self::resultado(false, $respuesta['status'], null, $dataArr, 'Clarisa no devolvió token de autenticación.');
        }

        $permisos = isset($dataArr['data']['permisos']) && is_array($dataArr['data']['permisos'])
            ? $dataArr['data']['permisos']
            : array();
        if (!in_array(CLARISA_PERMISO_FACTURACION, $permisos, true)) {
            return self::resultado(false, 403, null, $dataArr, 'El usuario Clarisa no tiene permiso de facturación electrónica.');
        }

        $authToken = strpos($token, 'Bearer ') === 0 ? $token : ('Bearer ' . $token);
        return self::resultado(true, $respuesta['status'], $authToken, $dataArr, null);
    }

    public static function enviarFacturaSandbox($token, $datosFactura)
    {
        if (!$token) {
            return self::resultado(false, 401, null, null, 'Token Clarisa ausente.');
        }

        $respuesta = self::peticion(CLARISA_FACTURA_PATH, 'POST', $datosFactura, $token);
        if ($respuesta['curl_error']) {
            return self::resultado(false, 0, null, null, 'Error de red hacia Clarisa: ' . $respuesta['curl_error']);
        }

        $dataArr = self::aArray($respuesta['data']);
        $estadoHttp = (int) $respuesta['status'];
        $okNegocio = $respuesta['ok'] && !empty($dataArr['success']);

        if (!$okNegocio) {
            $mensaje = self::mensajeDeError($dataArr);
            if ($mensaje === '') {
                $mensaje = 'Clarisa rechazó la factura (HTTP ' . $estadoHttp . ').';
            }
            return self::resultado(false, $estadoHttp, $token, $dataArr, $mensaje);
        }

        return self::resultado(true, $estadoHttp, $token, $dataArr, null);
    }

    public static function consultarEstadoSandbox($token, $nit, $numeroDocumento)
    {
        if (!$token) {
            return self::resultado(false, 401, null, null, 'Token Clarisa ausente.');
        }

        $query = http_build_query(array(
            'nit' => $nit,
            'tipoDocumento' => '01',
            'numeroDocumento' => $numeroDocumento
        ));
        $ruta = CLARISA_VALIDACION_PATH . '?' . $query;
        $respuesta = self::peticion($ruta, 'GET', null, $token);

        if ($respuesta['curl_error']) {
            return self::resultado(false, 0, null, null, 'Error de red hacia Clarisa: ' . $respuesta['curl_error']);
        }

        $dataArr = self::aArray($respuesta['data']);
        if (!$respuesta['ok']) {
            $mensaje = self::mensajeDeError($dataArr);
            if ($mensaje === '') {
                $mensaje = 'No se pudo consultar el estado DIAN (HTTP ' . $respuesta['status'] . ').';
            }
            return self::resultado(false, $respuesta['status'], $token, $dataArr, $mensaje);
        }

        return self::resultado(true, $respuesta['status'], $token, $dataArr, null);
    }

    // Respuesta Clarisa
    public static function extraerCufe($data)
    {
        $arr = self::aArray($data);
        $qr = array();
        if (isset($arr['data']['informacionFacQR']) && is_array($arr['data']['informacionFacQR'])) {
            $qr = $arr['data']['informacionFacQR'];
        } elseif (isset($arr['informacionFacQR']) && is_array($arr['informacionFacQR'])) {
            $qr = $arr['informacionFacQR'];
        }

        foreach (array('cufe', 'CUFE', 'cufeFactura') as $clave) {
            if (!empty($qr[$clave])) {
                return (string) $qr[$clave];
            }
        }
        if (!empty($arr['data']['cufe'])) {
            return (string) $arr['data']['cufe'];
        }
        if (!empty($arr['data']['uuid'])) {
            return (string) $arr['data']['uuid'];
        }
        if (!empty($arr['cufe'])) {
            return (string) $arr['cufe'];
        }
        return '';
    }

    public static function resolverEstadoDian($status, $data)
    {
        $arr = self::aArray($data);
        $estado = '';
        if (isset($arr['data']['estadoDIAN'])) {
            $estado = strtoupper((string) $arr['data']['estadoDIAN']);
        } elseif (isset($arr['estadoDIAN'])) {
            $estado = strtoupper((string) $arr['estadoDIAN']);
        }

        $verificando = self::estaVerificando($arr) || $estado === 'PENDIENTE' || $estado === 'VERIFICANDO';
        if ($verificando) {
            return 'VERIFICANDO';
        }
        if ((int) $status === 200 && !empty($arr['success']) && ($estado === 'APROBADA' || $estado === '')) {
            return 'APROBADA';
        }
        if ($estado === 'APROBADA') {
            return 'APROBADA';
        }
        if ($estado === 'RECHAZADA' || in_array((int) $status, array(206, 400, 422), true)) {
            return 'RECHAZADA';
        }
        return ((int) $status === 200 && !empty($arr['success'])) ? 'APROBADA' : 'RECHAZADA';
    }

    public static function estaVerificando($data)
    {
        $arr = self::aArray($data);
        return isset($arr['data']['estadoClarisa']) && $arr['data']['estadoClarisa'] === 'VERIFICANDO';
    }

    public static function mensajeDeError($data)
    {
        $arr = self::aArray($data);
        if (!$arr) {
            return '';
        }

        $contenedor = null;
        if (isset($arr['data']['errores'])) {
            $contenedor = $arr['data']['errores'];
        } elseif (isset($arr['errores'])) {
            $contenedor = $arr['errores'];
        }

        $lista = array();
        if (is_array($contenedor)) {
            if (isset($contenedor['errores']) && is_array($contenedor['errores'])) {
                $lista = $contenedor['errores'];
            } else {
                $lista = $contenedor;
            }
        }

        $mensajes = array();
        foreach ($lista as $error) {
            if (is_string($error)) {
                $mensajes[] = $error;
            } elseif (is_array($error)) {
                if (!empty($error['errorMessage'])) {
                    $mensajes[] = $error['errorMessage'];
                } elseif (!empty($error['mensaje'])) {
                    $mensajes[] = $error['mensaje'];
                } elseif (!empty($error['message'])) {
                    $mensajes[] = $error['message'];
                }
            }
        }

        if ($mensajes) {
            return implode(' · ', $mensajes);
        }
        if (!empty($arr['textResponse'])) {
            return (string) $arr['textResponse'];
        }
        return '';
    }

    // Peticiones cURL
    private static function peticion($ruta, $method = 'GET', $body = null, $token = null)
    {
        $url = rtrim(CLARISA_SANDBOX_BASE_URL, '/') . $ruta;
        $ch = curl_init($url);
        if ($ch === false) {
            return array('ok' => false, 'status' => 0, 'data' => null, 'curl_error' => 'No se pudo inicializar cURL.');
        }

        $headers = array('Content-Type: application/json', 'Accept: application/json');
        if ($token) {
            $headers[] = 'Authorization: ' . $token;
        }

        $opts = array(
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CUSTOMREQUEST => strtoupper($method),
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_TIMEOUT => CLARISA_TIMEOUT_SECONDS,
            CURLOPT_CONNECTTIMEOUT => 15,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_SSL_VERIFYHOST => 2
        );

        if ($body !== null && strtoupper($method) !== 'GET') {
            $opts[CURLOPT_POSTFIELDS] = is_string($body)
                ? $body
                : json_encode($body, JSON_UNESCAPED_UNICODE);
        }

        curl_setopt_array($ch, $opts);
        $raw = curl_exec($ch);
        $curlError = curl_error($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($raw === false) {
            return array('ok' => false, 'status' => 0, 'data' => null, 'curl_error' => $curlError ?: 'Fallo cURL sin detalle.');
        }

        $data = null;
        if ($raw !== '') {
            $decoded = json_decode($raw, true);
            $data = (json_last_error() === JSON_ERROR_NONE) ? $decoded : $raw;
        } else {
            $data = array();
        }

        return array(
            'ok' => $status >= 200 && $status < 300,
            'status' => $status,
            'data' => $data,
            'curl_error' => null
        );
    }

    private static function resultado($ok, $status, $token, $data, $error)
    {
        return array(
            'ok' => (bool) $ok,
            'status' => (int) $status,
            'token' => $token,
            'data' => $data,
            'error' => $error
        );
    }

    private static function aArray($data)
    {
        if ($data === null) {
            return array();
        }
        if (is_array($data)) {
            return $data;
        }
        if (is_object($data)) {
            return json_decode(json_encode($data), true) ?: array();
        }
        return array();
    }
}
?>
