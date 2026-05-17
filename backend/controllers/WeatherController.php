<?php
// Integração com WeatherAPI.com (https://www.weatherapi.com)
// Requer WEATHERAPI_KEY em config.php
class WeatherController {

    private const BASE_URL     = 'https://api.weatherapi.com/v1';
    private const CURRENT_URL  = self::BASE_URL . '/current.json';
    private const FORECAST_URL = self::BASE_URL . '/forecast.json';
    private const SEARCH_URL   = self::BASE_URL . '/search.json';

    public function search(): void {
        $payload = AuthMiddleware::handle();
        $city    = Validator::sanitize($_GET['city'] ?? '');
        $lang    = $_GET['lang'] ?? 'pt';
        if (!$city) Response::error('Parâmetro "city" é obrigatório.');

        $raw = $this->httpGet(self::CURRENT_URL, ['q' => $city, 'lang' => $lang, 'aqi' => 'no']);
        if (!$raw) Response::notFound("Cidade '$city' não encontrada.");

        $weather = WeatherMapper::mapCurrent($raw, $lang);
        (new SearchHistory())->add((int)$payload['user_id'], $weather);
        Response::ok($weather);
    }

    public function forecast(): void {
        AuthMiddleware::handle();
        $city = Validator::sanitize($_GET['city'] ?? '');
        $lang = $_GET['lang'] ?? 'pt';
        if (!$city) Response::error('Parâmetro "city" é obrigatório.');

        $raw = $this->httpGet(self::FORECAST_URL, ['q' => $city, 'days' => 7, 'lang' => $lang, 'aqi' => 'no', 'alerts' => 'no']);
        if (!$raw) Response::notFound("Cidade '$city' não encontrada.");

        Response::ok([
            'location' => [
                'city'      => $raw['location']['name'],
                'country'   => $raw['location']['country'],
                'latitude'  => $raw['location']['lat'],
                'longitude' => $raw['location']['lon'],
            ],
            'forecast' => WeatherMapper::mapForecast($raw['forecast']['forecastday'] ?? [], $lang),
        ]);
    }

    public function searchByCoords(): void {
        $payload = AuthMiddleware::handle();
        $lat  = (float)($_GET['lat'] ?? 0);
        $lon  = (float)($_GET['lon'] ?? 0);
        $lang = $_GET['lang'] ?? 'pt';
        if (!$lat || !$lon) Response::error('Parâmetros "lat" e "lon" são obrigatórios.');

        $raw = $this->httpGet(self::CURRENT_URL, ['q' => "$lat,$lon", 'lang' => $lang, 'aqi' => 'no']);
        if (!$raw) Response::serverError('Erro ao obter dados meteorológicos.');

        $weather = WeatherMapper::mapCurrent($raw, $lang);
        (new SearchHistory())->add((int)$payload['user_id'], $weather);
        Response::ok($weather);
    }

    public function compare(): void {
        AuthMiddleware::handle();
        $city1 = Validator::sanitize($_GET['city1'] ?? '');
        $city2 = Validator::sanitize($_GET['city2'] ?? '');
        $lang  = $_GET['lang'] ?? 'pt';
        if (!$city1 || !$city2) Response::error('Parâmetros "city1" e "city2" são obrigatórios.');

        $raw1 = $this->httpGet(self::CURRENT_URL, ['q' => $city1, 'lang' => $lang, 'aqi' => 'no']);
        $raw2 = $this->httpGet(self::CURRENT_URL, ['q' => $city2, 'lang' => $lang, 'aqi' => 'no']);

        if (!$raw1) Response::notFound("Cidade '$city1' não encontrada.");
        if (!$raw2) Response::notFound("Cidade '$city2' não encontrada.");

        Response::ok([
            'city1' => WeatherMapper::mapCurrent($raw1, $lang),
            'city2' => WeatherMapper::mapCurrent($raw2, $lang),
        ]);
    }

    // Sugestões de cidades para autocomplete via /search.json da WeatherAPI
    public function suggest(): void {
        AuthMiddleware::handle();
        $query = Validator::sanitize($_GET['q'] ?? '');

        if (strlen($query) < 2) { Response::ok([]); return; }

        $results = $this->httpGet(self::SEARCH_URL, ['q' => $query]);
        if (!$results || !is_array($results)) { Response::ok([]); return; }

        $suggestions = array_map(fn($r) => [
            'name'         => $r['name']    ?? '',
            'country'      => $r['country'] ?? '',
            'country_code' => '',
            'admin1'       => $r['region']  ?? '',
            'latitude'     => (float)($r['lat'] ?? 0),
            'longitude'    => (float)($r['lon'] ?? 0),
            'timezone'     => '',
        ], $results);

        Response::ok($suggestions);
    }

    public function forecastByCoords(): void {
        AuthMiddleware::handle();
        $lat  = (float)($_GET['lat']  ?? 0);
        $lon  = (float)($_GET['lon']  ?? 0);
        $lang = $_GET['lang'] ?? 'pt';
        if (!$lat || !$lon) Response::error('Parâmetros lat e lon são obrigatórios.');

        $raw = $this->httpGet(self::FORECAST_URL, ['q' => "$lat,$lon", 'days' => 7, 'lang' => $lang, 'aqi' => 'no', 'alerts' => 'no']);
        if (!$raw) Response::serverError('Erro ao obter previsão.');

        Response::ok([
            'location' => [
                'city'      => $raw['location']['name'],
                'country'   => $raw['location']['country'],
                'latitude'  => $lat,
                'longitude' => $lon,
            ],
            'forecast' => WeatherMapper::mapForecast($raw['forecast']['forecastday'] ?? [], $lang),
        ]);
    }

    private function httpGet(string $endpoint, array $params = []): ?array {
        $params['key'] = WEATHERAPI_KEY;
        $url = $endpoint . '?' . http_build_query($params);

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 10,
            CURLOPT_USERAGENT      => 'WeatherApp/2.0',
            CURLOPT_SSL_VERIFYPEER => false,
        ]);
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($response === false || $httpCode !== 200) return null;
        $data = json_decode($response, true);
        if (!is_array($data) || isset($data['error'])) return null;
        return $data;
    }
}
