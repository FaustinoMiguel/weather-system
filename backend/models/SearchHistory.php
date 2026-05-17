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
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // PDO devolve DECIMAL como string — forçar tipos numéricos para JSON correcto
        return array_map(function (array $row): array {
            $row['id']          = (int)   $row['id'];
            $row['user_id']     = (int)   $row['user_id'];
            $row['latitude']    = $row['latitude']    !== null ? (float) $row['latitude']    : null;
            $row['longitude']   = $row['longitude']   !== null ? (float) $row['longitude']   : null;
            $row['temperature'] = $row['temperature'] !== null ? (float) $row['temperature'] : null;
            return $row;
        }, $rows);
    }

    public function clearByUser(int $userId): void {
        $this->db->prepare('DELETE FROM search_history WHERE user_id = ?')->execute([$userId]);
    }
}
