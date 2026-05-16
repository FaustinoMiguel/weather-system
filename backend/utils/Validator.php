<?php
// Validação de inputs nos endpoints — previne dados inválidos e injections.
class Validator {
    private array $errors = [];

    public function required(string $field, mixed $value): self {
        if ($value === null || $value === '') {
            $this->errors[$field] = "O campo '$field' é obrigatório.";
        }
        return $this;
    }

    public function email(string $field, mixed $value): self {
        if ($value !== '' && !filter_var($value, FILTER_VALIDATE_EMAIL)) {
            $this->errors[$field] = "O campo '$field' deve ser um email válido.";
        }
        return $this;
    }

    public function minLength(string $field, mixed $value, int $min): self {
        if (is_string($value) && strlen($value) < $min) {
            $this->errors[$field] = "O campo '$field' deve ter pelo menos $min caracteres.";
        }
        return $this;
    }

    public function maxLength(string $field, mixed $value, int $max): self {
        if (is_string($value) && strlen($value) > $max) {
            $this->errors[$field] = "O campo '$field' não pode ter mais de $max caracteres.";
        }
        return $this;
    }

    public function in(string $field, mixed $value, array $allowed): self {
        if (!in_array($value, $allowed, true)) {
            $this->errors[$field] = "O valor de '$field' é inválido.";
        }
        return $this;
    }

    public function passes(): bool {
        return empty($this->errors);
    }

    public function getErrors(): array {
        return $this->errors;
    }

    public static function sanitize(string $value): string {
        return htmlspecialchars(strip_tags(trim($value)), ENT_QUOTES, 'UTF-8');
    }
}
