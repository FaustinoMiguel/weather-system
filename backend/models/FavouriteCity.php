<?php
class FavouriteCity {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    public function findByUser(int $userId): array {
        $stmt = $this->db->prepare('SELECT * FROM favourite_cities WHERE user_id = ? ORDER BY added_at DESC');
        $stmt->execute([$userId]);
        return $stmt->fetchAll();
    }

    public function add(int $userId, string $cityName, string $countryCode, float $lat, float $lon): array {
        // Verifica se já existe (para evitar erro de duplicate key)
        $check = $this->db->prepare(
            'SELECT id FROM favourite_cities WHERE user_id = ? AND city_name = ? LIMIT 1'
        );
        $check->execute([$userId, $cityName]);
        if ($existing = $check->fetch()) {
            return ['id' => (int)$existing['id'], 'city_name' => $cityName, 'country_code' => $countryCode];
        }

        $stmt = $this->db->prepare(
            'INSERT INTO favourite_cities (user_id, city_name, country_code, latitude, longitude)
             VALUES (?, ?, ?, ?, ?)'
        );
        $stmt->execute([$userId, $cityName, $countryCode, $lat, $lon]);
        return ['id' => (int)$this->db->lastInsertId(), 'city_name' => $cityName, 'country_code' => $countryCode];
    }

    public function remove(int $id, int $userId): bool {
        $stmt = $this->db->prepare('DELETE FROM favourite_cities WHERE id = ? AND user_id = ?');
        $stmt->execute([$id, $userId]);
        return $stmt->rowCount() > 0;
    }

    public function exists(int $userId, string $cityName, string $countryCode): bool {
        $stmt = $this->db->prepare(
            'SELECT id FROM favourite_cities WHERE user_id = ? AND city_name = ? AND country_code = ? LIMIT 1'
        );
        $stmt->execute([$userId, $cityName, $countryCode]);
        return (bool)$stmt->fetch();
    }
}
