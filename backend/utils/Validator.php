<?php
// Decisão técnica: validação explícita em utilitário mantém controllers curtos e previsíveis.

declare(strict_types=1);

final class Validator
{
    public static function required(array $payload, array $fields): array
    {
        $errors = [];
        foreach ($fields as $field) {
            $value = $payload[$field] ?? null;
            if ($value === null || trim((string) $value) === '') {
                $errors[$field] = 'Campo obrigatório.';
            }
        }

        return $errors;
    }

    public static function email(string $email): bool
    {
        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
    }

    public static function password(string $password): bool
    {
        return strlen($password) >= 8
            && preg_match('/[A-Z]/', $password) === 1
            && preg_match('/[a-z]/', $password) === 1
            && preg_match('/[0-9]/', $password) === 1;
    }

    public static function city(string $city): bool
    {
        return preg_match('/^[\p{L}\p{M}\s.\'-]{2,100}$/u', $city) === 1;
    }

    public static function coordinates(mixed $lat, mixed $lon): bool
    {
        return is_numeric($lat)
            && is_numeric($lon)
            && (float) $lat >= -90
            && (float) $lat <= 90
            && (float) $lon >= -180
            && (float) $lon <= 180;
    }
}
