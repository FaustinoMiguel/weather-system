<?php
// Decisão técnica: histórico persiste apenas dados essenciais para listagem e exportação rápida.

declare(strict_types=1);

final class SearchHistory
{
    public function __construct(private readonly PDO $db)
    {
    }

    public function add(int $userId, string $city, ?string $country, ?float $temperature, string $condition): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO search_history (user_id, city_name, country_code, temperature, condition_text)
             VALUES (:user_id, :city, :country, :temperature, :condition)'
        );
        $stmt->execute([
            'user_id' => $userId,
            'city' => $city,
            'country' => $country,
            'temperature' => $temperature,
            'condition' => $condition,
        ]);
    }

    public function latest(int $userId, int $limit = 20): array
    {
        $stmt = $this->db->prepare(
            'SELECT id, city_name, country_code, temperature, condition_text, searched_at
             FROM search_history
             WHERE user_id = :user_id
             ORDER BY searched_at DESC
             LIMIT :limit'
        );
        $stmt->bindValue('user_id', $userId, PDO::PARAM_INT);
        $stmt->bindValue('limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    public function clear(int $userId): void
    {
        $stmt = $this->db->prepare('DELETE FROM search_history WHERE user_id = :user_id');
        $stmt->execute(['user_id' => $userId]);
    }
}
