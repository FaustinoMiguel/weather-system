<?php
// Decisão técnica: middleware valida JWT e blacklist antes de qualquer controller protegido executar.

declare(strict_types=1);

final class AuthMiddleware
{
    public static function user(PDO $db): array
    {
        $token = JwtHelper::bearerToken();
        if ($token === null) {
            Response::error('Token de autenticação em falta.', 401);
        }

        try {
            $payload = JwtHelper::verify($token);
        } catch (Throwable $error) {
            Response::error($error->getMessage(), 401);
        }

        $stmt = $db->prepare('SELECT id FROM jwt_blacklist WHERE token_jti = :jti AND expires_at >= NOW() LIMIT 1');
        $stmt->execute(['jti' => $payload['jti'] ?? '']);
        if ($stmt->fetch()) {
            Response::error('Sessão terminada. Faça login novamente.', 401);
        }

        return [
            'id' => (int) $payload['sub'],
            'email' => (string) ($payload['email'] ?? ''),
            'jti' => (string) ($payload['jti'] ?? ''),
            'exp' => (int) ($payload['exp'] ?? 0),
            'token' => $token,
        ];
    }
}
