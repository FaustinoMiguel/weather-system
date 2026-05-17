<?php
// Mapeia respostas da WeatherAPI.com para o formato interno da aplicação.
class WeatherMapper {

    // Códigos de condição WeatherAPI considerados extremos
    // https://www.weatherapi.com/docs/weather_conditions.json
    private static array $extremeCodes = [
        1117, // Blizzard
        1225, // Heavy snow
        1237, // Ice pellets
        1252, // Heavy sleet
        1261, // Heavy ice pellets
        1264, // Heavy ice pellets
        1273, // Moderate/heavy rain with thunder
        1276, // Moderate/heavy rain with thunder
        1279, // Moderate/heavy snow with thunder
        1282, // Moderate/heavy snow with thunder
    ];

    // Mapeia resposta /current.json ou /forecast.json (campo current) para formato interno
    public static function mapCurrent(array $raw, string $lang = 'pt'): array {
        $loc  = $raw['location'] ?? [];
        $cur  = $raw['current']  ?? [];
        $cond = $cur['condition'] ?? [];

        $temp    = (float)($cur['temp_c']      ?? 0);
        $code    = (int)($cond['code']          ?? 0);
        $condTxt = $cond['text']                ?? '';

        return [
            'city'           => $loc['name']      ?? '',
            'country'        => $loc['country']   ?? '',
            'country_code'   => $loc['country'] ?? '',      // WeatherAPI devolve nome completo em EN
            'latitude'       => (float)($loc['lat'] ?? 0),
            'longitude'      => (float)($loc['lon'] ?? 0),
            'timezone'       => $loc['tz_id']     ?? 'UTC',
            'temperature'    => $temp,
            'feels_like'     => (float)($cur['feelslike_c']      ?? 0),
            'humidity'       => (int)($cur['humidity']           ?? 0),
            'wind_speed'     => (float)($cur['wind_kph']         ?? 0),
            'wind_direction' => (int)($cur['wind_degree']        ?? 0),
            'pressure'       => (float)($cur['pressure_mb']      ?? 0),
            'uv_index'       => (float)($cur['uv']               ?? 0),
            'cloud_cover'    => (int)($cur['cloud']              ?? 0),
            'precipitation'  => (float)($cur['precip_mm']        ?? 0),
            'is_day'         => (bool)($cur['is_day']            ?? 1),
            'condition'      => $condTxt,
            'condition_code' => $code,
            'icon'           => self::iconFromCode($code),
            'is_extreme'     => in_array($code, self::$extremeCodes)
                                || $temp > 40
                                || $temp < -10,
            'units' => [
                'temperature' => '°C',
                'wind_speed'  => 'km/h',
                'pressure'    => 'hPa',
            ],
        ];
    }

    // Mapeia array de dias do /forecast.json para formato interno
    public static function mapForecast(array $forecastdays, string $lang = 'pt'): array {
        $result = [];
        foreach ($forecastdays as $day) {
            $d    = $day['day']       ?? [];
            $cond = $d['condition']   ?? [];
            $code = (int)($cond['code']              ?? 0);
            $precip_chance = (int)($d['daily_chance_of_rain'] ?? 0);
            $cloud_cover   = (int)($d['avghumidity']          ?? 0); // WeatherAPI day avg (cloud not in day obj)
            $precip_mm     = (float)($d['totalprecip_mm']     ?? 0);

            $result[] = [
                'date'           => $day['date']                     ?? '',
                'temp_max'       => (float)($d['maxtemp_c']          ?? 0),
                'temp_min'       => (float)($d['mintemp_c']          ?? 0),
                'precipitation'  => $precip_mm,
                'precip_chance'  => $precip_chance,
                'cloud_cover'    => $cloud_cover,
                'wind_speed'     => (float)($d['maxwind_kph']        ?? 0),
                'uv_index_max'   => (float)($d['uv']                 ?? 0),
                'condition'      => $cond['text']                    ?? '',
                'condition_code' => $code,
                'icon'           => self::iconFromCode($code, $precip_chance, $precip_mm),
            ];
        }
        return $result;
    }

    /**
     * Converte código WeatherAPI numa categoria de ícone usada pelo frontend.
     *
     * Usa três níveis de probabilidade para evitar ícones de chuva enganadores
     * em dias de previsão onde a chuva é apenas uma possibilidade remota:
     *
     *   precip_chance < 20 %               → nublado (sem chuva no ícone)
     *   precip_chance 20–50 % OU mm < 1.5  → possibilidade (partly-cloudy / drizzle leve)
     *   precip_chance > 50 % E mm >= 1.5   → chuva confirmada
     */
    private static function iconFromCode(int $code, int $precipChance = 100, float $precipMm = 99.0): string {
        // Sem precipitação
        if (in_array($code, [1000])) return 'clear';
        if (in_array($code, [1003])) return 'mainly-clear';
        if (in_array($code, [1006])) return 'partly-cloudy';
        if (in_array($code, [1009])) return 'cloudy';
        if (in_array($code, [1030, 1135, 1147])) return 'fog';

        // Neve/gelo — nunca rebaixar
        if (in_array($code, [1066, 1069, 1072, 1114, 1117, 1204, 1207, 1210, 1213, 1216,
                              1219, 1222, 1225, 1237, 1249, 1252, 1255, 1258, 1261, 1264])) return 'snow';

        // Trovoada — manter sempre
        if (in_array($code, [1087, 1273, 1276, 1279, 1282])) return 'thunderstorm';

        // Chuva ligeira / garoa (1063 = possible rain, 1150-1183 = light drizzle/rain)
        $lightRainCodes = [1063, 1150, 1153, 1168, 1171, 1180, 1183];
        if (in_array($code, $lightRainCodes)) {
            if ($precipChance < 20)                              return 'cloudy';       // quase impossível
            if ($precipChance < 50 || $precipMm < 1.5)          return 'partly-cloudy'; // possibilidade baixa-média
            return 'drizzle';                                                           // confirmado
        }

        // Chuva moderada/forte (1186-1246)
        if (in_array($code, [1186, 1189, 1192, 1195, 1198, 1201, 1240, 1243, 1246])) {
            if ($precipChance < 20)                              return 'cloudy';
            if ($precipChance < 50 || $precipMm < 1.5)          return 'partly-cloudy';
            if ($precipChance < 70 || $precipMm < 5.0)          return 'drizzle';      // moderado mas não garantido
            return 'rain';                                                              // confirmado
        }

        return 'clear';
    }
}
