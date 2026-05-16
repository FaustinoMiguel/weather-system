<?php
class SearchHistory {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    public function add(int $userId, array $weatherData): void {
        $stmt = $this->db->prepare(
            'INSERT INTO search_history 
             (user_id, city_name, country_code, latitude, longitude, temperature, condition_text)
             VALUES (?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $userId,
            $weatherData['city'],
            $weatherData['country_code'],
            $weatherData['latitude'],
            $weatherData['longitude'],
            $weatherData['temperature'],
            $weatherData['condition'],
        ]);
    }

    public function findByUser(int $userId, int $limit = 20): array {
        $stmt = $this->db->prepare(
            'SELECT * FROM search_history WHERE user_id = ? ORDER BY searched_at DESC LIMIT ?'
        );
        $stmt->execute([$userId, $limit]);
        return $stmt->fetchAll();
    }

    public function clearByUser(int $userId): void {
        $this->db->prepare('DELETE FROM search_history WHERE user_id = ?')->execute([$userId]);
    }
}
