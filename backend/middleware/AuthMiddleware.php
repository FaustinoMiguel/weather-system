<?php
// Middleware de autenticação — verifica token JWT em rotas protegidas.
class AuthMiddleware {
    public static function handle(): array {
        $headers = getallheaders();
        $auth    = $headers['Authorization'] ?? $headers['authorization'] ?? '';

        if (!str_starts_with($auth, 'Bearer ')) {
            Response::unauthorized('Token não fornecido.');
        }

        $token   = substr($auth, 7);
        $payload = JwtHelper::verify($token);

        if (!$payload) {
            Response::unauthorized('Token inválido ou expirado.');
        }

        return $payload; // contém user_id, email, name
    }
}
