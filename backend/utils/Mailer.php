<?php
// Decisão técnica: usar mail() quando disponível e registar fallback local evita bloquear recuperação em ambiente académico.

declare(strict_types=1);

final class Mailer
{
    public static function sendPasswordReset(string $email, string $name, string $token): void
    {
        $resetUrl = FRONTEND_URL . '/reset-password?token=' . urlencode($token);
        $subject = 'Recuperação de senha';
        $message = "Olá {$name},\n\nUse este link temporário para redefinir a senha:\n{$resetUrl}\n\nSe não pediu isto, ignore a mensagem.";
        $headers = 'From: ' . MAIL_FROM;

        if (!@mail($email, $subject, $message, $headers)) {
            $storage = dirname(__DIR__) . '/storage';
            if (!is_dir($storage)) {
                mkdir($storage, 0775, true);
            }
            file_put_contents($storage . '/password_reset.log', '[' . date('c') . "] {$email}: {$resetUrl}\n", FILE_APPEND);
        }
    }
}
