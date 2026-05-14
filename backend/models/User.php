<?php
// Decisão técnica: modelo encapsula queries de utilizadores e impede SQL espalhado pelos controllers.

declare(strict_types=1);

final class User
{
    public function __construct(private readonly PDO $db)
    {
    }

    public function create(string $name, string $email, string $password): int
    {
        $stmt = $this->db->prepare('INSERT INTO users (name, email, password) VALUES (:name, :email, :password)');
        $stmt->execute([
            'name' => $name,
            'email' => strtolower($email),
            'password' => password_hash($password, PASSWORD_DEFAULT),
        ]);

        return (int) $this->db->lastInsertId();
    }

    public function findByEmail(string $email): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM users WHERE email = :email LIMIT 1');
        $stmt->execute(['email' => strtolower($email)]);
        $user = $stmt->fetch();

        return $user ?: null;
    }

    public function findById(int $id): ?array
    {
        $stmt = $this->db->prepare('SELECT id, name, email, language, theme, created_at FROM users WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $user = $stmt->fetch();

        return $user ?: null;
    }

    public function updatePassword(int $id, string $password): void
    {
        $stmt = $this->db->prepare('UPDATE users SET password = :password WHERE id = :id');
        $stmt->execute([
            'id' => $id,
            'password' => password_hash($password, PASSWORD_DEFAULT),
        ]);
    }

    public function updatePreferences(int $id, string $language, string $theme): void
    {
        $stmt = $this->db->prepare('UPDATE users SET language = :language, theme = :theme WHERE id = :id');
        $stmt->execute([
            'id' => $id,
            'language' => $language,
            'theme' => $theme,
        ]);
    }
}
