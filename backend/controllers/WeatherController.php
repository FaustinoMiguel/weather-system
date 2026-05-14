<?php
// Decisão técnica: o backend consulta a Open-Meteo e mantém o frontend desacoplado da API externa.

declare(strict_types=1);

final class WeatherController
{
    public function __construct(private readonly PDO $db)
    {
    }

    public function search(array $query, array $user): void
    {
        $data = $this->fetchForecast($query);
        $mapped = WeatherMapper::map($data, $this->language($query));
        $history = new SearchHistory($this->db);
        $current = $mapped['current'];
        $history->add(
            $user['id'],
            (string) $current['city'],
            (string) $current['country'],
            $current['temperature'] === null ? null : (float) $current['temperature'],
            (string) $current['condition']
        );

        Response::json(true, $mapped, 'Previsão carregada com sucesso.');
    }

    public function forecast(array $query, array $user = []): void
    {
        $data = $this->fetchForecast($query);
        Response::json(true, WeatherMapper::map($data, $this->language($query)), 'Previsão de 5 dias carregada com sucesso.');
    }

    private function fetchForecast(array $query): array
    {
        $location = $this->resolveLocation($query);
        $params = [
            'latitude' => (string) $location['latitude'],
            'longitude' => (string) $location['longitude'],
            'current' => 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m',
            'daily' => 'weather_code,temperature_2m_max,temperature_2m_min,uv_index_max,wind_speed_10m_max,wind_direction_10m_dominant',
            'forecast_days' => '7',
            'timezone' => 'auto',
            'wind_speed_unit' => 'ms',
        ];

        $decoded = $this->requestJson(OPEN_METEO_FORECAST_URL, $params, 'Não foi possível consultar a Open-Meteo.');
        if (!isset($decoded['current'], $decoded['daily'])) {
            Response::error('Resposta meteorológica inválida.', 502);
        }

        $decoded['_location'] = $location;

        return $decoded;
    }

    private function resolveLocation(array $query): array
    {
        if (!empty($query['city'])) {
            $city = trim((string) $query['city']);
            if (!Validator::city($city)) {
                Response::error('Cidade inválida.', 422);
            }

            $geo = $this->requestJson(OPEN_METEO_GEOCODING_URL, [
                'name' => $city,
                'count' => '1',
                'language' => $this->language($query),
                'format' => 'json',
            ], 'Não foi possível localizar a cidade.');

            $result = $geo['results'][0] ?? null;
            if (!is_array($result)) {
                Response::error('Cidade não encontrada.', 404);
            }

            return [
                'city' => (string) ($result['name'] ?? $city),
                'country' => (string) ($result['country_code'] ?? ''),
                'country_name' => (string) ($result['country'] ?? ''),
                'latitude' => (float) $result['latitude'],
                'longitude' => (float) $result['longitude'],
                'timezone' => (string) ($result['timezone'] ?? 'auto'),
                'source' => 'city',
                'raw' => $result,
            ];
        }

        if (Validator::coordinates($query['lat'] ?? null, $query['lon'] ?? null)) {
            return [
                'city' => trim((string) ($query['label'] ?? 'Localização actual')),
                'country' => trim((string) ($query['country'] ?? 'GPS')),
                'country_name' => '',
                'latitude' => (float) $query['lat'],
                'longitude' => (float) $query['lon'],
                'timezone' => 'auto',
                'source' => 'coordinates',
                'raw' => null,
            ];
        }

        Response::error('Informe uma cidade ou coordenadas válidas.', 422);
    }

    private function requestJson(string $url, array $params, string $errorMessage): array
    {
        $requestUrl = $url . '?' . http_build_query($params);
        $context = stream_context_create(['http' => ['timeout' => 12, 'ignore_errors' => true]]);
        $body = file_get_contents($requestUrl, false, $context);
        $statusLine = $http_response_header[0] ?? 'HTTP/1.1 500';

        if ($body === false || !str_contains($statusLine, '200')) {
            Response::error($errorMessage, 502, ['status' => $statusLine]);
        }

        $decoded = json_decode($body, true);
        if (!is_array($decoded)) {
            Response::error('Resposta externa inválida.', 502);
        }

        return $decoded;
    }

    private function language(array $query): string
    {
        return ($query['lang'] ?? 'pt') === 'en' ? 'en' : 'pt';
    }
}
