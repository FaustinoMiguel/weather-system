<?php
// Model de utilizadores — CRUD com PDO e prepared statements.
class User {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    public function findByEmail(string $email): ?array {
        $stmt = $this->db->prepare('SELECT * FROM users WHERE email = ? LIMIT 1');
        $stmt->execute([$email]);
        return $stmt->fetch() ?: null;
    }

    public function findById(int $id): ?array {
        $stmt = $this->db->prepare('SELECT id, name, email, language, theme, created_at FROM users WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        return $stmt->fetch() ?: null;
    }

    public function create(string $name, string $email, string $password): int {
        $hash = password_hash($password, PASSWORD_BCRYPT);
        $stmt = $this->db->prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)');
        $stmt->execute([$name, $email, $hash]);
        return (int)$this->db->lastInsertId();
    }

    public function findByIdWithPassword(int $id): ?array {
        $stmt = $this->db->prepare('SELECT id, password FROM users WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        return $stmt->fetch() ?: null;
    }

    public function verifyPassword(string $password, string $hash): bool {
        return password_verify($password, $hash);
    }

    public function updatePreferences(int $userId, string $language, string $theme): bool {
        $stmt = $this->db->prepare('UPDATE users SET language = ?, theme = ? WHERE id = ?');
        return $stmt->execute([$language, $theme, $userId]);
    }

    public function updatePassword(int $userId, string $newPassword): bool {
        $hash = password_hash($newPassword, PASSWORD_BCRYPT);
        $stmt = $this->db->prepare('UPDATE users SET password = ? WHERE id = ?');
        return $stmt->execute([$hash, $userId]);
    }
}
