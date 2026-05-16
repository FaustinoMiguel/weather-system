<?php
// Helper para respostas JSON uniformes: { success, data, message }
class Response {
    public static function json(bool $success, mixed $data = null, string $message = '', int $code = 200): void {
        http_response_code($code);
        echo json_encode([
            'success' => $success,
            'data'    => $data,
            'message' => $message,
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    public static function ok(mixed $data = null, string $message = 'OK'): void {
        self::json(true, $data, $message, 200);
    }

    public static function created(mixed $data = null, string $message = 'Criado com sucesso.'): void {
        self::json(true, $data, $message, 201);
    }

    public static function error(string $message, int $code = 400): void {
        self::json(false, null, $message, $code);
    }

    public static function unauthorized(string $message = 'Não autorizado.'): void {
        self::json(false, null, $message, 401);
    }

    public static function notFound(string $message = 'Não encontrado.'): void {
        self::json(false, null, $message, 404);
    }

    public static function serverError(string $message = 'Erro interno do servidor.'): void {
        self::json(false, null, $message, 500);
    }
}
