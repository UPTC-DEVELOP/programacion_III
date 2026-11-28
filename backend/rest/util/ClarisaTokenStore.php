<?php
declare(strict_types=1);

namespace panther\util;

/** Guarda el token de Clarisa asociado a la sesión Panther. */
final class ClarisaTokenStore
{
    private const TTL_SECONDS = 12 * 60 * 60;

    public static function save(string $keyAPI, string $tokenClarisa): void
    {
        $key = trim($keyAPI);
        $token = trim($tokenClarisa);
        if ($key === '' || $token === '') {
            return;
        }

        $data = self::readAll();
        $data[self::hashKey($key)] = [
            'token' => $token,
            'saved_at' => time(),
        ];
        self::writeAll($data);
    }

    public static function get(string $keyAPI): ?string
    {
        $key = trim($keyAPI);
        if ($key === '') {
            return null;
        }

        $data = self::readAll();
        $hash = self::hashKey($key);
        if (!isset($data[$hash]) || !is_array($data[$hash])) {
            return null;
        }

        $savedAt = (int) ($data[$hash]['saved_at'] ?? 0);
        $token = trim((string) ($data[$hash]['token'] ?? ''));
        if ($token === '' || $savedAt <= 0 || (time() - $savedAt) > self::TTL_SECONDS) {
            unset($data[$hash]);
            self::writeAll($data);
            return null;
        }

        return $token;
    }

    public static function forget(string $keyAPI): void
    {
        $key = trim($keyAPI);
        if ($key === '') {
            return;
        }
        $data = self::readAll();
        unset($data[self::hashKey($key)]);
        self::writeAll($data);
    }

    private static function hashKey(string $keyAPI): string
    {
        return hash('sha256', $keyAPI);
    }

    private static function storagePath(): string
    {
        $dir = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'storage';
        if (!is_dir($dir)) {
            @mkdir($dir, 0750, true);
        }
        return $dir . DIRECTORY_SEPARATOR . 'clarisa_tokens.json';
    }

    /** @return array<string, array{token?: string, saved_at?: int}> */
    private static function readAll(): array
    {
        $path = self::storagePath();
        if (!is_file($path)) {
            return [];
        }
        $raw = @file_get_contents($path);
        if ($raw === false || trim($raw) === '') {
            return [];
        }
        $decoded = json_decode($raw, true);
        return is_array($decoded) ? $decoded : [];
    }

    /** @param array<string, mixed> $data */
    private static function writeAll(array $data): void
    {
        $path = self::storagePath();
        $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        if ($json === false) {
            return;
        }
        @file_put_contents($path, $json, LOCK_EX);
    }
}
