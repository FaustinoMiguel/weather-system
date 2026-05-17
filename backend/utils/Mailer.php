<?php
/**
 * Mailer — envio de email via SMTP ou fallback para log.
 */
class Mailer {

    public static function sendPasswordReset(
        string $to,
        string $name,
        string $token,
        string $lang = 'pt'
    ): bool {
        $appUrl   = defined('APP_URL') ? rtrim(APP_URL, '/') : 'http://localhost:4200';
        $resetUrl = $appUrl . '/reset-password?token=' . $token;

        if ($lang === 'en') {
            $subject = 'Password Reset — Weather App';
            $html    = self::templateEn($name, $resetUrl);
        } else {
            $subject = 'Recuperação de senha — Weather App';
            $html    = self::templatePt($name, $resetUrl);
        }

        self::log($to, $subject, $resetUrl);

        if (self::credentialsOk()) {
            self::smtp($to, $subject, $html);
        }

        return true;
    }

    private static function templatePt(string $name, string $url): string {
        $n = htmlspecialchars($name);
        $u = htmlspecialchars($url);
        return "
        <html><body style='font-family:sans-serif;max-width:520px;margin:auto;color:#1e293b'>
          <div style='text-align:center;padding:2rem 0 1rem'>
            <span style='font-size:2.5rem'>🌤</span>
            <h2 style='margin:.5rem 0;color:#1e293b'>Weather App</h2>
          </div>
          <div style='background:#f8fafc;border-radius:12px;padding:2rem;border:1px solid #e2e8f0'>
            <h3 style='color:#1d4ed8;margin-top:0'>Recuperação de senha</h3>
            <p>Olá <strong>$n</strong>,</p>
            <p>Recebemos um pedido para redefinir a senha da tua conta. Clica no botão abaixo:</p>
            <div style='text-align:center;margin:2rem 0'>
              <a href='$u' style='background:#1d4ed8;color:#fff;padding:.85rem 2rem;border-radius:8px;
                        text-decoration:none;font-weight:700;font-size:1rem;display:inline-block'>
                🔐 Redefinir senha
              </a>
            </div>
            <p style='font-size:.85rem;color:#64748b'>
              Ou copia este link:<br>
              <a href='$u' style='color:#3b82f6;word-break:break-all'>$u</a>
            </p>
          </div>
          <div style='padding:1.5rem;font-size:.8rem;color:#94a3b8;text-align:center'>
            Este link expira em <strong>1 hora</strong>.<br>
            Se não fizeste este pedido, ignora este email.
          </div>
        </body></html>";
    }

    private static function templateEn(string $name, string $url): string {
        $n = htmlspecialchars($name);
        $u = htmlspecialchars($url);
        return "
        <html><body style='font-family:sans-serif;max-width:520px;margin:auto;color:#1e293b'>
          <div style='text-align:center;padding:2rem 0 1rem'>
            <span style='font-size:2.5rem'>🌤</span>
            <h2 style='margin:.5rem 0;color:#1e293b'>Weather App</h2>
          </div>
          <div style='background:#f8fafc;border-radius:12px;padding:2rem;border:1px solid #e2e8f0'>
            <h3 style='color:#1d4ed8;margin-top:0'>Password Reset</h3>
            <p>Hi <strong>$n</strong>,</p>
            <p>Click the button below to reset your password:</p>
            <div style='text-align:center;margin:2rem 0'>
              <a href='$u' style='background:#1d4ed8;color:#fff;padding:.85rem 2rem;border-radius:8px;
                        text-decoration:none;font-weight:700;font-size:1rem;display:inline-block'>
                🔐 Reset Password
              </a>
            </div>
            <p style='font-size:.85rem;color:#64748b'>
              Or copy this link:<br>
              <a href='$u' style='color:#3b82f6;word-break:break-all'>$u</a>
            </p>
          </div>
          <div style='padding:1.5rem;font-size:.8rem;color:#94a3b8;text-align:center'>
            This link expires in <strong>1 hour</strong>.<br>
            If you did not request this, ignore this email.
          </div>
        </body></html>";
    }

    private static function credentialsOk(): bool {
        return defined('MAIL_USER')
            && MAIL_USER !== ''
            && MAIL_USER !== 'o_teu_email@gmail.com'
            && defined('MAIL_PASS')
            && MAIL_PASS !== ''
            && MAIL_PASS !== 'a_tua_senha_de_app';
    }

    private static function smtp(string $to, string $subject, string $html): bool {
        try {
            $host = defined('MAIL_HOST') ? MAIL_HOST : 'smtp.gmail.com';
            $user = MAIL_USER;
            $pass = MAIL_PASS;
            $from = defined('MAIL_FROM') ? MAIL_FROM : $user;
            $name = defined('MAIL_FROM_NAME') ? MAIL_FROM_NAME : 'Weather App';

            // Usa SSL implícito na porta 465 em vez de STARTTLS na 587.
            // No Windows com php -S, stream_socket_enable_crypto() ignora o
            // contexto SSL durante o upgrade STARTTLS, causando sempre
            // "certificate verify failed". Com ssl:// na ligação inicial o
            // contexto é aplicado correctamente e o problema não ocorre.
            $port = 465;

            $sslCtx = stream_context_create(['ssl' => [
                'verify_peer'       => false,
                'verify_peer_name'  => false,
                'allow_self_signed' => true,
            ]]);

            $errno = 0; $errstr = '';
            $sock = @stream_socket_client(
                "ssl://$host:$port", $errno, $errstr, 10,
                STREAM_CLIENT_CONNECT, $sslCtx
            );
            if (!$sock) return false;

            $read = fgets($sock, 512);
            if (!$read || $read[0] !== '2') { fclose($sock); return false; }

            fwrite($sock, "EHLO localhost\r\n");
            while ($line = fgets($sock, 512)) { if (strlen($line) > 3 && $line[3] === ' ') break; }

            fwrite($sock, "AUTH LOGIN\r\n"); fgets($sock, 512);
            fwrite($sock, base64_encode($user) . "\r\n"); fgets($sock, 512);
            fwrite($sock, base64_encode($pass) . "\r\n");
            $auth = fgets($sock, 512);
            if (!$auth || $auth[0] !== '2') { fclose($sock); return false; }

            $encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
            $encodedName    = '=?UTF-8?B?' . base64_encode($name)    . '?=';
            $headers = "From: $encodedName <$from>\r\n"
                     . "To: $to\r\n"
                     . "Subject: $encodedSubject\r\n"
                     . "MIME-Version: 1.0\r\n"
                     . "Content-Type: text/html; charset=UTF-8\r\n"
                     . "Content-Transfer-Encoding: base64\r\n";

            fwrite($sock, "MAIL FROM:<$from>\r\n"); fgets($sock, 512);
            fwrite($sock, "RCPT TO:<$to>\r\n");    fgets($sock, 512);
            fwrite($sock, "DATA\r\n");              fgets($sock, 512);
            fwrite($sock, $headers . "\r\n" . chunk_split(base64_encode($html)) . "\r\n.\r\n");
            $resp = fgets($sock, 512);
            fwrite($sock, "QUIT\r\n");
            fclose($sock);

            return $resp && $resp[0] === '2';
        } catch (\Throwable $e) {
            return false;
        }
    }

    private static function log(string $to, string $subject, string $resetUrl): void {
        $dir = __DIR__ . '/../logs';
        if (!is_dir($dir)) @mkdir($dir, 0755, true);

        $sep   = str_repeat('=', 65);
        $entry = "\n$sep\n"
               . " DATA:    " . date('Y-m-d H:i:s') . "\n"
               . " PARA:    $to\n"
               . " ASSUNTO: $subject\n"
               . " LINK:    $resetUrl\n"
               . $sep . "\n";

        @file_put_contents($dir . '/emails.log', $entry, FILE_APPEND | LOCK_EX);
    }
}
