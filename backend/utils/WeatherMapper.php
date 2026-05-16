<?php
// Mapeia respostas da API Open-Meteo para o formato interno da aplicação.
// Open-Meteo usa códigos WMO (World Meteorological Organization) para condições meteorológicas.
class WeatherMapper {

    // Tabela de códigos WMO: https://open-meteo.com/en/docs#weathervariables
    private static array $wmoCodes = [
        0  => ['pt' => 'Céu limpo',           'en' => 'Clear sky',           'icon' => 'clear'],
        1  => ['pt' => 'Maioritariamente limpo','en' => 'Mainly clear',       'icon' => 'mainly-clear'],
        2  => ['pt' => 'Parcialmente nublado', 'en' => 'Partly cloudy',       'icon' => 'partly-cloudy'],
        3  => ['pt' => 'Nublado',              'en' => 'Overcast',            'icon' => 'cloudy'],
        45 => ['pt' => 'Nevoeiro',             'en' => 'Fog',                 'icon' => 'fog'],
        48 => ['pt' => 'Nevoeiro gelado',      'en' => 'Icy fog',             'icon' => 'fog'],
        51 => ['pt' => 'Chuviscos leves',      'en' => 'Light drizzle',       'icon' => 'drizzle'],
        53 => ['pt' => 'Chuviscos',            'en' => 'Drizzle',             'icon' => 'drizzle'],
        55 => ['pt' => 'Chuviscos intensos',   'en' => 'Heavy drizzle',       'icon' => 'drizzle'],
        56 => ['pt' => 'Chuviscos gelados',    'en' => 'Freezing drizzle',    'icon' => 'drizzle'],
        57 => ['pt' => 'Chuviscos gelados intensos','en' => 'Heavy freezing drizzle','icon' => 'drizzle'],
        61 => ['pt' => 'Chuva fraca',          'en' => 'Light rain',          'icon' => 'rain'],
        63 => ['pt' => 'Chuva',                'en' => 'Rain',                'icon' => 'rain'],
        65 => ['pt' => 'Chuva forte',          'en' => 'Heavy rain',          'icon' => 'heavy-rain'],
        66 => ['pt' => 'Chuva gelada',         'en' => 'Freezing rain',       'icon' => 'rain'],
        67 => ['pt' => 'Chuva gelada forte',   'en' => 'Heavy freezing rain', 'icon' => 'heavy-rain'],
        71 => ['pt' => 'Nevada fraca',         'en' => 'Light snow',          'icon' => 'snow'],
        73 => ['pt' => 'Nevada',               'en' => 'Snow',                'icon' => 'snow'],
        75 => ['pt' => 'Nevada forte',         'en' => 'Heavy snow',          'icon' => 'heavy-snow'],
        77 => ['pt' => 'Grãos de neve',        'en' => 'Snow grains',         'icon' => 'snow'],
        80 => ['pt' => 'Aguaceiros fracos',    'en' => 'Light showers',       'icon' => 'showers'],
        81 => ['pt' => 'Aguaceiros',           'en' => 'Showers',             'icon' => 'showers'],
        82 => ['pt' => 'Aguaceiros intensos',  'en' => 'Heavy showers',       'icon' => 'heavy-showers'],
        85 => ['pt' => 'Aguaceiros de neve',   'en' => 'Snow showers',        'icon' => 'snow-showers'],
        86 => ['pt' => 'Aguaceiros de neve intensos','en' => 'Heavy snow showers','icon' => 'snow-showers'],
        95 => ['pt' => 'Trovoada',             'en' => 'Thunderstorm',        'icon' => 'thunderstorm'],
        96 => ['pt' => 'Trovoada com granizo', 'en' => 'Thunderstorm with hail','icon' => 'thunderstorm'],
        99 => ['pt' => 'Trovoada com granizo forte','en' => 'Thunderstorm with heavy hail','icon' => 'thunderstorm'],
    ];

    // Códigos considerados condições extremas — dispara alerta visual no frontend
    private static array $extremeCodes = [65, 67, 75, 82, 85, 86, 95, 96, 99];

    public static function getCondition(int $code, string $lang = 'pt'): array {
        $entry = self::$wmoCodes[$code] ?? ['pt' => 'Desconhecido', 'en' => 'Unknown', 'icon' => 'unknown'];
        return [
            'description' => $entry[$lang] ?? $entry['en'],
            'icon'        => $entry['icon'],
        ];
    }

    // Mapeia resposta "current" do Open-Meteo para formato interno
    public static function mapCurrent(array $current, array $units, array $location, string $lang = 'pt'): array {
        $code      = (int)($current['weather_code'] ?? 0);
        $condition = self::getCondition($code, $lang);

        $mapped = [
            'city'          => $location['name'],
            'country'       => $location['country'],
            'country_code'  => strtoupper($location['country_code'] ?? ''),
            'latitude'      => (float)$location['latitude'],
            'longitude'     => (float)$location['longitude'],
            'timezone'      => $location['timezone'] ?? 'UTC',
            'temperature'   => (float)($current['temperature_2m'] ?? 0),
            'feels_like'    => (float)($current['apparent_temperature'] ?? 0),
            'humidity'      => (int)($current['relative_humidity_2m'] ?? 0),
            'wind_speed'    => (float)($current['wind_speed_10m'] ?? 0),
            'wind_direction'=> (int)($current['wind_direction_10m'] ?? 0),
            'pressure'      => (float)($current['surface_pressure'] ?? 0),
            'uv_index'      => (float)($current['uv_index'] ?? 0),
            'cloud_cover'   => (int)($current['cloud_cover'] ?? 0),
            'precipitation' => (float)($current['precipitation'] ?? 0),
            'is_day'        => (bool)($current['is_day'] ?? 1),
            'condition'     => $condition['description'],
            'condition_code'=> $code,
            'icon'          => $condition['icon'],
            'is_extreme'    => in_array($code, self::$extremeCodes) || 
                               ($current['temperature_2m'] ?? 20) > 40 || 
                               ($current['temperature_2m'] ?? 20) < -10,
            'units'         => [
                'temperature' => $units['temperature_2m'] ?? '°C',
                'wind_speed'  => $units['wind_speed_10m'] ?? 'km/h',
                'pressure'    => $units['surface_pressure'] ?? 'hPa',
            ],
        ];

        return $mapped;
    }

    // Mapeia previsão diária do Open-Meteo para formato interno
    public static function mapForecast(array $daily, array $units, string $lang = 'pt'): array {
        $forecast = [];
        $dates = $daily['time'] ?? [];

        foreach ($dates as $i => $date) {
            $code      = (int)($daily['weather_code'][$i] ?? 0);
            $condition = self::getCondition($code, $lang);

            $forecast[] = [
                'date'          => $date,
                'temp_max'      => (float)($daily['temperature_2m_max'][$i] ?? 0),
                'temp_min'      => (float)($daily['temperature_2m_min'][$i] ?? 0),
                'precipitation' => (float)($daily['precipitation_sum'][$i] ?? 0),
                'wind_speed'    => (float)($daily['wind_speed_10m_max'][$i] ?? 0),
                'uv_index_max'  => (float)($daily['uv_index_max'][$i] ?? 0),
                'condition'     => $condition['description'],
                'condition_code'=> $code,
                'icon'          => $condition['icon'],
            ];
        }

        return $forecast;
    }
}
