<?php
// Decisão técnica: favoritos usam chave única por utilizador/cidade para evitar duplicados.

declare(strict_types=1);

final class FavouriteCity
{
    public function __construct(private readonly PDO $db)
    {
    }

    public function all(int $userId): array
    {
        $stmt = $this->db->prepare('SELECT id, city_name, country_code, added_at FROM favourite_cities WHERE user_id = :user_id ORDER BY added_at DESC');
        $stmt->execute(['user_id' => $userId]);

        return $stmt->fetchAll();
    }

    public function create(int $userId, string $city, string $country): int
    {
        $stmt = $this->db->prepare('INSERT INTO favourite_cities (user_id, city_name, country_code) VALUES (:user_id, :city, :country)');
        $stmt->execute([
            'user_id' => $userId,
            'city' => $city,
            'country' => strtoupper($country),
        ]);

        return (int) $this->db->lastInsertId();
    }

    public function delete(int $userId, int $id): bool
    {
        $stmt = $this->db->prepare('DELETE FROM favourite_cities WHERE id = :id AND user_id = :user_id');
        $stmt->execute(['id' => $id, 'user_id' => $userId]);

        return $stmt->rowCount() > 0;
    }
}
