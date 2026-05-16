<?php
// Envio de emails via SMTP nativo (sem dependências).
// Usado para recuperação de senha.
class Mailer {
    public static function send(string $to, string $subject, string $htmlBody): bool {
        // Usa mail() nativo do PHP — para produção substituir por PHPMailer ou similar
        $headers  = "MIME-Version: 1.0\r\n";
        $headers .= "Content-type: text/html; charset=UTF-8\r\n";
        $headers .= "From: " . MAIL_FROM_NAME . " <" . MAIL_FROM . ">\r\n";
        $headers .= "Reply-To: " . MAIL_FROM . "\r\n";
        $headers .= "X-Mailer: PHP/" . phpversion();

        return mail($to, $subject, $htmlBody, $headers);
    }

    public static function sendPasswordReset(string $to, string $name, string $token): bool {
        $link    = APP_URL . '/reset-password?token=' . urlencode($token);
        $subject = 'Recuperação de senha — Weather App';
        $body    = "
        <html><body style='font-family:sans-serif;max-width:480px;margin:auto'>
          <h2>Recuperação de senha</h2>
          <p>Olá <strong>" . htmlspecialchars($name) . "</strong>,</p>
          <p>Recebemos um pedido de recuperação de senha para a tua conta.</p>
          <p>
            <a href='$link' style='background:#3B82F6;color:#fff;padding:10px 20px;
               border-radius:6px;text-decoration:none;display:inline-block'>
              Redefinir senha
            </a>
          </p>
          <p style='color:#666;font-size:13px'>Este link expira em 1 hora.<br>
             Se não fizeste este pedido, ignora este email.</p>
        </body></html>";

        return self::send($to, $subject, $body);
    }
}
