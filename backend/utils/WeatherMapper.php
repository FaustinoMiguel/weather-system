<?php
// Decisão técnica: normalizar a resposta da Open-Meteo preserva o contrato usado pelo frontend.

declare(strict_types=1);

final class WeatherMapper
{
    public static function map(array $raw, string $language = 'pt'): array
    {
        $currentRaw = $raw['current'] ?? [];
        $location = $raw['_location'] ?? [];
        $daily = self::daily($raw['daily'] ?? [], $language);
        $code = (int) ($currentRaw['weather_code'] ?? 0);
        $wind = self::numberOrNull($currentRaw['wind_speed_10m'] ?? null);
        $temperature = self::numberOrNull($currentRaw['temperature_2m'] ?? null);

        $current = [
            'city' => (string) ($location['city'] ?? ''),
            'country' => (string) ($location['country'] ?? ''),
            'coordinates' => [
                'lat' => (float) ($location['latitude'] ?? $raw['latitude'] ?? 0),
                'lon' => (float) ($location['longitude'] ?? $raw['longitude'] ?? 0),
            ],
            'temperature' => $temperature,
            'feels_like' => self::numberOrNull($currentRaw['apparent_temperature'] ?? null),
            'humidity' => self::numberOrNull($currentRaw['relative_humidity_2m'] ?? null),
            'pressure' => self::numberOrNull($currentRaw['surface_pressure'] ?? null),
            'wind_speed' => $wind,
            'wind_direction' => self::numberOrNull($currentRaw['wind_direction_10m'] ?? null),
            'condition' => self::condition($code, $language),
            'condition_code' => (string) $code,
            'icon' => self::icon($code, ((int) ($currentRaw['is_day'] ?? 1)) === 1),
            'uv_index' => self::numberOrNull(($raw['daily']['uv_index_max'][0] ?? null)),
            'uv_note' => 'Índice UV máximo diário fornecido pela Open-Meteo.',
            'date' => (string) ($currentRaw['time'] ?? ''),
            'alerts' => self::alerts($temperature, $wind, $code),
        ];

        return [
            'current' => $current,
            'daily' => $daily,
            'raw_city' => [
                'id' => $location['raw']['id'] ?? null,
                'name' => $location['city'] ?? '',
                'country' => $location['country'] ?? '',
                'coord' => $current['coordinates'],
            ],
        ];
    }

    private static function daily(array $dailyRaw, string $language): array
    {
        $dates = $dailyRaw['time'] ?? [];
        $days = [];

        foreach ($dates as $index => $date) {
            $code = (int) ($dailyRaw['weather_code'][$index] ?? 0);
            $max = self::numberOrNull($dailyRaw['temperature_2m_max'][$index] ?? null);
            $wind = self::numberOrNull($dailyRaw['wind_speed_10m_max'][$index] ?? null);

            $days[] = [
                'date' => (string) $date,
                'min' => self::numberOrNull($dailyRaw['temperature_2m_min'][$index] ?? null),
                'max' => $max,
                'humidity' => null,
                'pressure' => null,
                'wind_speed' => $wind,
                'condition' => self::condition($code, $language),
                'condition_code' => (string) $code,
                'icon' => self::icon($code, true),
                'uv_index' => self::numberOrNull($dailyRaw['uv_index_max'][$index] ?? null),
                'alerts' => self::alerts($max, $wind, $code),
            ];
        }

        return $days;
    }

    private static function condition(int $code, string $language): string
    {
        $pt = [
            0 => 'Céu limpo',
            1 => 'Principalmente limpo',
            2 => 'Parcialmente nublado',
            3 => 'Nublado',
            45 => 'Nevoeiro',
            48 => 'Nevoeiro com geada',
            51 => 'Chuvisco fraco',
            53 => 'Chuvisco moderado',
            55 => 'Chuvisco intenso',
            56 => 'Chuvisco gelado fraco',
            57 => 'Chuvisco gelado intenso',
            61 => 'Chuva fraca',
            63 => 'Chuva moderada',
            65 => 'Chuva forte',
            66 => 'Chuva gelada fraca',
            67 => 'Chuva gelada forte',
            71 => 'Neve fraca',
            73 => 'Neve moderada',
            75 => 'Neve forte',
            77 => 'Grãos de neve',
            80 => 'Aguaceiros fracos',
            81 => 'Aguaceiros moderados',
            82 => 'Aguaceiros fortes',
            85 => 'Aguaceiros de neve fracos',
            86 => 'Aguaceiros de neve fortes',
            95 => 'Trovoada',
            96 => 'Trovoada com granizo fraco',
            99 => 'Trovoada com granizo forte',
        ];
        $en = [
            0 => 'Clear sky',
            1 => 'Mainly clear',
            2 => 'Partly cloudy',
            3 => 'Overcast',
            45 => 'Fog',
            48 => 'Depositing rime fog',
            51 => 'Light drizzle',
            53 => 'Moderate drizzle',
            55 => 'Dense drizzle',
            56 => 'Light freezing drizzle',
            57 => 'Dense freezing drizzle',
            61 => 'Slight rain',
            63 => 'Moderate rain',
            65 => 'Heavy rain',
            66 => 'Light freezing rain',
            67 => 'Heavy freezing rain',
            71 => 'Slight snow',
            73 => 'Moderate snow',
            75 => 'Heavy snow',
            77 => 'Snow grains',
            80 => 'Slight rain showers',
            81 => 'Moderate rain showers',
            82 => 'Violent rain showers',
            85 => 'Slight snow showers',
            86 => 'Heavy snow showers',
            95 => 'Thunderstorm',
            96 => 'Thunderstorm with slight hail',
            99 => 'Thunderstorm with heavy hail',
        ];

        $labels = $language === 'en' ? $en : $pt;

        return $labels[$code] ?? ($language === 'en' ? 'Unknown weather' : 'Condição desconhecida');
    }

    private static function icon(int $code, bool $isDay): string
    {
        if ($code === 0) {
            return $isDay ? 'sun' : 'moon';
        }
        if (in_array($code, [1, 2], true)) {
            return 'cloud-sun';
        }
        if ($code === 3) {
            return 'cloud';
        }
        if (in_array($code, [45, 48], true)) {
            return 'cloud-fog';
        }
        if (in_array($code, [51, 53, 55, 56, 57], true)) {
            return 'cloud-drizzle';
        }
        if (in_array($code, [61, 63, 65, 66, 67, 80, 81, 82], true)) {
            return 'cloud-rain';
        }
        if (in_array($code, [71, 73, 75, 77, 85, 86], true)) {
            return 'cloud-snow';
        }
        if (in_array($code, [95, 96, 99], true)) {
            return 'cloud-lightning';
        }

        return 'cloud';
    }

    private static function alerts(?float $temperature, ?float $wind, int $code): array
    {
        $alerts = [];

        if ($temperature !== null && $temperature >= 38) {
            $alerts[] = 'heat';
        }
        if ($temperature !== null && $temperature <= 2) {
            $alerts[] = 'cold';
        }
        if (($wind !== null && $wind >= 17) || in_array($code, [95, 96, 99], true)) {
            $alerts[] = 'storm';
        }
        if (in_array($code, [65, 66, 67, 80, 81, 82], true)) {
            $alerts[] = 'heavy_rain';
        }

        return $alerts;
    }

    private static function numberOrNull(mixed $value): ?float
    {
        return is_numeric($value) ? (float) $value : null;
    }
}
