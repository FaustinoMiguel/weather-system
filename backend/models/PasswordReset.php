<?php
// Decisão técnica: guardar hash do token reduz impacto caso a tabela de recuperação seja exposta.

declare(strict_types=1);

final class PasswordReset
{
    public function __construct(private readonly PDO $db)
    {
    }

    public function create(int $userId, string $plainToken): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO password_resets (user_id, token, expires_at) VALUES (:user_id, :token, :expires_at)'
        );
        $stmt->execute([
            'user_id' => $userId,
            'token' => hash('sha256', $plainToken),
            'expires_at' => date('Y-m-d H:i:s', time() + 3600),
        ]);
    }

    public function valid(string $plainToken): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT * FROM password_resets
             WHERE token = :token AND used = 0 AND expires_at >= NOW()
             ORDER BY created_at DESC
             LIMIT 1'
        );
        $stmt->execute(['token' => hash('sha256', $plainToken)]);
        $reset = $stmt->fetch();

        return $reset ?: null;
    }

    public function markUsed(int $id): void
    {
        $stmt = $this->db->prepare('UPDATE password_resets SET used = 1 WHERE id = :id');
        $stmt->execute(['id' => $id]);
    }
}
