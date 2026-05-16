<?php
// Geração e verificação de tokens JWT para autenticação stateless.
// Implementação manual sem dependências externas.
class JwtHelper {
    private static function base64UrlEncode(string $data): string {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function base64UrlDecode(string $data): string {
        $remainder = strlen($data) % 4;
        if ($remainder) {
            $data .= str_repeat('=', 4 - $remainder);
        }
        return base64_decode(strtr($data, '-_', '+/'));
    }

    public static function generate(array $payload): string {
        $header  = self::base64UrlEncode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
        $payload['iat'] = time();
        $payload['exp'] = time() + JWT_EXPIRY;
        $body    = self::base64UrlEncode(json_encode($payload));
        $sig     = self::base64UrlEncode(hash_hmac('sha256', "$header.$body", JWT_SECRET, true));
        return "$header.$body.$sig";
    }

    public static function verify(string $token): ?array {
        $parts = explode('.', $token);
        if (count($parts) !== 3) return null;

        [$header, $body, $sig] = $parts;
        $expected = self::base64UrlEncode(hash_hmac('sha256', "$header.$body", JWT_SECRET, true));

        // Comparação em tempo constante para prevenir timing attacks
        if (!hash_equals($expected, $sig)) return null;

        $payload = json_decode(self::base64UrlDecode($body), true);
        if (!$payload || (isset($payload['exp']) && $payload['exp'] < time())) return null;

        return $payload;
    }
}
