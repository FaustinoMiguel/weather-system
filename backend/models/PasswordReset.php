<?php
class PasswordReset {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    public function create(int $userId): string {
        // Remove tokens anteriores do utilizador
        $this->db->prepare('DELETE FROM password_resets WHERE user_id = ?')->execute([$userId]);

        $token  = bin2hex(random_bytes(32));
        $expiry = date('Y-m-d H:i:s', time() + 3600); // 1 hora
        $stmt   = $this->db->prepare('INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)');
        $stmt->execute([$userId, $token, $expiry]);
        return $token;
    }

    public function findValid(string $token): ?array {
        $stmt = $this->db->prepare(
            'SELECT * FROM password_resets 
             WHERE token = ? AND expires_at > NOW() AND used = 0 LIMIT 1'
        );
        $stmt->execute([$token]);
        return $stmt->fetch() ?: null;
    }

    public function markUsed(int $id): void {
        $this->db->prepare('UPDATE password_resets SET used = 1 WHERE id = ?')->execute([$id]);
    }
}
