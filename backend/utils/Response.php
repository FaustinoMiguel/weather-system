<?php
// Decisão técnica: respostas uniformes simplificam o tratamento no Angular e os testes de API.

declare(strict_types=1);

final class Response
{
    public static function json(bool $success, mixed $data = null, string $message = '', int $status = 200): void
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
        header('Pragma: no-cache');
        echo json_encode([
            'success' => $success,
            'data' => $data,
            'message' => $message,
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    public static function error(string $message, int $status = 400, mixed $data = null): void
    {
        self::json(false, $data, $message, $status);
    }
}
