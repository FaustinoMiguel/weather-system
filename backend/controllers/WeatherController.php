<?php
// Integração com Open-Meteo API (gratuita, sem chave de API).
class WeatherController {

    private const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
    private const FORECAST_URL  = 'https://api.open-meteo.com/v1/forecast';

    // implode() não é permitido em const no PHP — string directa
    private const CURRENT_VARS = 'temperature_2m,apparent_temperature,relative_humidity_2m,is_day,precipitation,weather_code,cloud_cover,surface_pressure,wind_speed_10m,wind_direction_10m,uv_index';
    private const DAILY_VARS   = 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,uv_index_max';

    public function search(): void {
        $payload = AuthMiddleware::handle();
        $city    = Validator::sanitize($_GET['city'] ?? '');
        $lang    = $_GET['lang'] ?? 'pt';
        if (!$city) Response::error('Parâmetro "city" é obrigatório.');
        $location = $this->geocode($city, $lang);
        if (!$location) Response::notFound("Cidade '$city' não encontrada.");
        $weather = $this->fetchCurrent($location, $lang);
        if (!$weather) Response::serverError('Erro ao obter dados meteorológicos.');
        (new SearchHistory())->add((int)$payload['user_id'], $weather);
        Response::ok($weather);
    }

    public function forecast(): void {
        AuthMiddleware::handle();
        $city = Validator::sanitize($_GET['city'] ?? '');
        $lang = $_GET['lang'] ?? 'pt';
        if (!$city) Response::error('Parâmetro "city" é obrigatório.');
        $location = $this->geocode($city, $lang);
        if (!$location) Response::notFound("Cidade '$city' não encontrada.");
        $forecast = $this->fetchForecast($location, $lang);
        if (!$forecast) Response::serverError('Erro ao obter previsão.');
        Response::ok([
            'location' => ['city' => $location['name'], 'country' => $location['country'],
                           'latitude' => $location['latitude'], 'longitude' => $location['longitude']],
            'forecast' => $forecast,
        ]);
    }

    public function searchByCoords(): void {
        $payload = AuthMiddleware::handle();
        $lat = (float)($_GET['lat'] ?? 0);
        $lon = (float)($_GET['lon'] ?? 0);
        $lang = $_GET['lang'] ?? 'pt';
        if (!$lat || !$lon) Response::error('Parâmetros "lat" e "lon" são obrigatórios.');
        $location = $this->reverseGeocode($lat, $lon, $lang) ?? [
            'name' => 'Localização actual', 'country' => '', 'country_code' => '',
            'latitude' => $lat, 'longitude' => $lon, 'timezone' => 'auto'
        ];
        $weather = $this->fetchCurrent($location, $lang);
        if (!$weather) Response::serverError('Erro ao obter dados meteorológicos.');
        (new SearchHistory())->add((int)$payload['user_id'], $weather);
        Response::ok($weather);
    }

    public function compare(): void {
        AuthMiddleware::handle();
        $city1 = Validator::sanitize($_GET['city1'] ?? '');
        $city2 = Validator::sanitize($_GET['city2'] ?? '');
        $lang  = $_GET['lang'] ?? 'pt';
        if (!$city1 || !$city2) Response::error('Parâmetros "city1" e "city2" são obrigatórios.');
        $loc1 = $this->geocode($city1, $lang);
        $loc2 = $this->geocode($city2, $lang);
        if (!$loc1) Response::notFound("Cidade '$city1' não encontrada.");
        if (!$loc2) Response::notFound("Cidade '$city2' não encontrada.");
        Response::ok(['city1' => $this->fetchCurrent($loc1, $lang), 'city2' => $this->fetchCurrent($loc2, $lang)]);
    }

    private function geocode(string $city, string $lang = 'pt'): ?array {
        $data = $this->httpGet(self::GEOCODING_URL . '?' . http_build_query([
            'name' => $city, 'count' => 1, 'language' => $lang, 'format' => 'json',
        ]));
        return $data['results'][0] ?? null;
    }

    private function reverseGeocode(float $lat, float $lon, string $lang = 'pt'): ?array {
        $ctx  = stream_context_create(['http' => ['header' => "User-Agent: WeatherApp/1.0\r\n"]]);
        $resp = @file_get_contents("https://nominatim.openstreetmap.org/reverse?lat=$lat&lon=$lon&format=json", false, $ctx);
        if (!$resp) return null;
        $data = json_decode($resp, true);
        if (!$data || !isset($data['address'])) return null;
        return [
            'name'         => $data['address']['city'] ?? $data['address']['town'] ?? $data['address']['village'] ?? 'Localização',
            'country'      => $data['address']['country'] ?? '',
            'country_code' => strtoupper($data['address']['country_code'] ?? ''),
            'latitude'     => $lat, 'longitude' => $lon, 'timezone' => 'auto',
        ];
    }

    private function fetchCurrent(array $location, string $lang = 'pt'): ?array {
        $data = $this->httpGet(self::FORECAST_URL . '?' . http_build_query([
            'latitude' => $location['latitude'], 'longitude' => $location['longitude'],
            'current' => self::CURRENT_VARS, 'wind_speed_unit' => 'kmh',
            'timezone' => $location['timezone'] ?? 'auto', 'forecast_days' => 1,
        ]));
        if (!$data || !isset($data['current'])) return null;
        return WeatherMapper::mapCurrent($data['current'], $data['current_units'] ?? [], $location, $lang);
    }

    private function fetchForecast(array $location, string $lang = 'pt'): ?array {
        $data = $this->httpGet(self::FORECAST_URL . '?' . http_build_query([
            'latitude' => $location['latitude'], 'longitude' => $location['longitude'],
            'daily' => self::DAILY_VARS, 'wind_speed_unit' => 'kmh',
            'timezone' => $location['timezone'] ?? 'auto', 'forecast_days' => 7,
        ]));
        if (!$data || !isset($data['daily'])) return null;
        return WeatherMapper::mapForecast($data['daily'], $data['daily_units'] ?? [], $lang);
    }

    private function httpGet(string $url): ?array {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 10,
            CURLOPT_USERAGENT => 'WeatherApp/1.0', CURLOPT_SSL_VERIFYPEER => false, // desactivado em dev — XAMPP Windows nao tem CA bundle configurado
        ]);
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        if ($response === false || $httpCode !== 200) return null;
        $data = json_decode($response, true);
        return is_array($data) ? $data : null;
    }

    // Previsão por coordenadas GPS — evita geocodificar nome de cidade genérico
    public function forecastByCoords(): void {
        AuthMiddleware::handle();
        $lat  = (float)($_GET['lat']  ?? 0);
        $lon  = (float)($_GET['lon']  ?? 0);
        $lang = $_GET['lang'] ?? 'pt';
        $city = $_GET['city'] ?? '';

        if (!$lat || !$lon) Response::error('Parâmetros lat e lon são obrigatórios.');

        $location = [
            'name'         => $city ?: 'Localização actual',
            'country'      => '',
            'country_code' => '',
            'latitude'     => $lat,
            'longitude'    => $lon,
            'timezone'     => 'auto',
        ];

        $forecast = $this->fetchForecast($location, $lang);
        if (!$forecast) Response::serverError('Erro ao obter previsão.');

        Response::ok([
            'location' => ['city' => $location['name'], 'country' => '', 'latitude' => $lat, 'longitude' => $lon],
            'forecast' => $forecast,
        ]);
    }

}