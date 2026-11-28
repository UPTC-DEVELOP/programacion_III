<?php
declare(strict_types=1);

namespace panther\util;

/** Cliente cURL de Clarisa (solo pruebas). */
final class ClarisaService
{
    private const URL_LOGIN = ClarisaConfig::URL_LOGIN;
    private const URL_FACTURA_NACIONAL = ClarisaConfig::URL_FACTURA_NACIONAL;

    /**
     * @return array{token: string, raw: array, success: bool, message: string}
     * @throws ExcepcionAPI
     */
    public function autenticar(?string $usuario = null, ?string $contrasenia = null): array
    {
        $user = trim((string) ($usuario ?? ClarisaConfig::CLARISA_USERNAME));
        $pass = (string) ($contrasenia ?? ClarisaConfig::CLARISA_PASSWORD);

        if ($user === '' || $pass === '') {
            throw new ExcepcionAPI(
                Status::BAD_REQUEST,
                Status::ST400,
                'Faltan las credenciales de Clarisa en ClarisaConfig.php.'
            );
        }

        $resultado = $this->requestJson(self::URL_LOGIN, [
            'usuario' => $user,
            'contrasenia' => $pass,
        ], null);

        $body = $resultado['body'];
        $httpCode = $resultado['httpCode'];
        $success = (bool) ($body['success'] ?? false);
        $token = '';
        if (isset($body['data']['token']) && is_string($body['data']['token'])) {
            $token = trim($body['data']['token']);
        }

        if ($httpCode === 401 || !$success || $token === '') {
            $mensaje = $this->mensajeClarisa(
                $body,
                'No se pudo iniciar sesión en Clarisa. Revisa usuario, contraseña o el servidor de pruebas.'
            );
            throw new ExcepcionAPI(Status::UNAUTHORIZED, Status::ST401, $mensaje);
        }

        return [
            'token' => $token,
            'raw' => $body,
            'success' => true,
            'message' => $this->mensajeClarisa($body, 'Sesión Clarisa iniciada.'),
        ];
    }

    /**
     * @param array<string, mixed> $payload
     * @return array{httpCode: int, body: array, success: bool, message: string}
     * @throws ExcepcionAPI
     */
    public function enviarFacturaNacional(array $payload, string $tokenClarisa): array
    {
        $token = trim($tokenClarisa);
        if ($token === '') {
            throw new ExcepcionAPI(
                Status::UNAUTHORIZED,
                Status::ST401,
                'No hay token de Clarisa. Inicia sesión como ADMIN o reintenta la autenticación.'
            );
        }

        $resultado = $this->requestJson(self::URL_FACTURA_NACIONAL, $payload, $token);
        $body = $resultado['body'];
        $httpCode = $resultado['httpCode'];
        $success = (bool) ($body['success'] ?? ($httpCode === 200));

        return [
            'httpCode' => $httpCode,
            'body' => $body,
            'success' => $success && $httpCode >= 200 && $httpCode < 300,
            'message' => $this->mensajeClarisa(
                $body,
                $httpCode === 200
                    ? 'Factura enviada a Clarisa.'
                    : 'Clarisa respondió con validación o error.'
            ),
        ];
    }

    /** @throws ExcepcionAPI */
    private function assertSandboxUrl(string $url): void
    {
        $parts = parse_url($url);
        if ($parts === false) {
            throw new ExcepcionAPI(
                Status::INTERNAL_SERVER_ERROR,
                Status::ST500,
                'URL de Clarisa inválida. La petición no se envió.'
            );
        }

        $scheme = strtolower((string) ($parts['scheme'] ?? ''));
        $host = strtolower((string) ($parts['host'] ?? ''));
        $port = isset($parts['port']) ? (int) $parts['port'] : null;

        if (
            $scheme !== ClarisaConfig::SANDBOX_SCHEME
            || $host !== ClarisaConfig::SANDBOX_HOST
            || $port !== ClarisaConfig::SANDBOX_PORT
        ) {
            throw new ExcepcionAPI(
                Status::FORBIDDEN,
                Status::ST403,
                'Solo se permite el servidor de pruebas de Clarisa (pru.clarisacloud.com:8443).'
            );
        }

        $permitidas = [self::URL_LOGIN, self::URL_FACTURA_NACIONAL];
        if (!in_array($url, $permitidas, true)) {
            throw new ExcepcionAPI(
                Status::FORBIDDEN,
                Status::ST403,
                'La URL no coincide con los endpoints de pruebas de Clarisa.'
            );
        }
    }

    /**
     * @param array<string, mixed> $payload
     * @return array{httpCode: int, body: array}
     * @throws ExcepcionAPI
     */
    private function requestJson(string $url, array $payload, ?string $token): array
    {
        $this->assertSandboxUrl($url);

        if (!function_exists('curl_init')) {
            throw new ExcepcionAPI(
                Status::INTERNAL_SERVER_ERROR,
                Status::ST500,
                'La extensión cURL de PHP no está disponible.'
            );
        }

        $jsonBody = json_encode($payload, JSON_UNESCAPED_UNICODE);
        if ($jsonBody === false) {
            throw new ExcepcionAPI(
                Status::BAD_REQUEST,
                Status::ST400,
                'No se pudo armar el JSON para Clarisa.'
            );
        }

        $headers = [
            'Content-Type: application/json',
            'Accept: application/json',
        ];
        if ($token !== null && $token !== '') {
            $headers[] = 'Authorization: ' . $token;
        }

        $ch = curl_init($url);
        if ($ch === false) {
            throw new ExcepcionAPI(
                Status::INTERNAL_SERVER_ERROR,
                Status::ST500,
                'No se pudo iniciar la conexión con Clarisa.'
            );
        }

        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_POSTFIELDS => $jsonBody,
            CURLOPT_TIMEOUT => ClarisaConfig::CURL_TIMEOUT,
            CURLOPT_CONNECTTIMEOUT => ClarisaConfig::CURL_CONNECT_TIMEOUT,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_SSL_VERIFYHOST => 2,
        ]);

        $this->assertSandboxUrl($url);

        $raw = curl_exec($ch);
        $errno = curl_errno($ch);
        $error = curl_error($ch);
        $httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($raw === false || $errno !== 0) {
            throw new ExcepcionAPI(
                Status::INTERNAL_SERVER_ERROR,
                Status::ST500,
                'Sin respuesta de Clarisa. ' .
                ($error !== '' ? $error : 'Revisa la conexión o inténtalo más tarde.')
            );
        }

        $decoded = json_decode($raw, true);
        if (!is_array($decoded)) {
            $decoded = [
                'success' => false,
                'titleResponse' => 'RESPUESTA_NO_JSON',
                'textResponse' => 'Clarisa devolvió una respuesta no JSON (HTTP ' . $httpCode . ').',
                'rawPreview' => mb_substr($raw, 0, 400),
            ];
        }

        return [
            'httpCode' => $httpCode > 0 ? $httpCode : 0,
            'body' => $decoded,
        ];
    }

    /** @param array<string, mixed> $body */
    private function mensajeClarisa(array $body, string $fallback): string
    {
        $texto = trim((string) ($body['textResponse'] ?? $body['text_response'] ?? ''));
        if ($texto !== '') {
            return $texto;
        }

        $titulo = trim((string) ($body['titleResponse'] ?? $body['title_response'] ?? ''));
        if ($titulo !== '') {
            return $titulo;
        }

        if (isset($body['data']['errores']) && is_array($body['data']['errores'])) {
            $partes = [];
            foreach ($body['data']['errores'] as $error) {
                if (!is_array($error)) {
                    continue;
                }
                $msg = $error['errorMessage'] ?? $error['mensaje'] ?? $error['message'] ?? $error['descripcion'] ?? null;
                if (is_string($msg) && trim($msg) !== '') {
                    $partes[] = trim($msg);
                }
            }
            if ($partes !== []) {
                return implode(' | ', $partes);
            }
        }

        return $fallback;
    }
}
