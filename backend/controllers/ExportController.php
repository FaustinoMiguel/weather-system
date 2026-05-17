<?php
// Exportação de dados meteorológicos em CSV e PDF.
class ExportController {

    // Cabeçalhos CSV por língua
    private static array $csvHeaders = [
        'pt' => ['Data/Hora', 'Cidade', 'País', 'Temperatura (°C)', 'Condição'],
        'en' => ['Date/Time', 'City',   'Country', 'Temperature (°C)', 'Condition'],
    ];

    // Nome do ficheiro CSV por língua
    private static array $csvFilenames = [
        'pt' => 'historico',
        'en' => 'history',
    ];

    // Nome do ficheiro PDF por língua
    private static array $pdfFilenames = [
        'pt' => 'relatorio',
        'en' => 'report',
    ];

    /**
     * Devolve a língua pedida (pt|en), com fallback para 'pt'.
     */
    private function lang(): string {
        $lang = strtolower(trim($_GET['lang'] ?? 'pt'));
        return in_array($lang, ['pt', 'en'], true) ? $lang : 'pt';
    }

    public function csv(): void {
        $payload  = AuthMiddleware::handle();
        $model    = new SearchHistory();
        $history  = $model->findByUser((int)$payload['user_id'], 100);
        $lang     = $this->lang();
        $filename = self::$csvFilenames[$lang] . '_' . date('Ymd_His') . '.csv';

        // FIX: garante que não há Content-Type residual antes de enviar ficheiro
        header_remove('Content-Type');
        header('Content-Type: text/csv; charset=UTF-8');
        header('Content-Disposition: attachment; filename="' . $filename . '"');

        $out = fopen('php://output', 'w');
        // BOM para Excel reconhecer UTF-8
        fwrite($out, "\xEF\xBB\xBF");

        fputcsv($out, self::$csvHeaders[$lang], ';');
        foreach ($history as $row) {
            fputcsv($out, [
                $row['searched_at'],
                $row['city_name'],
                $row['country_code'],
                $row['temperature'],
                $row['condition_text'],
            ], ';');
        }
        fclose($out);
        exit;
    }

    public function pdf(): void {
        $payload  = AuthMiddleware::handle();
        $cityName = Validator::sanitize($_GET['city'] ?? '');
        $lang     = $this->lang();

        // Determina a query para a WeatherAPI:
        // se vier city=... usa-a; caso contrário usa o último registo do histórico.
        if ($cityName) {
            $query = $cityName;
        } else {
            $model   = new SearchHistory();
            $history = $model->findByUser((int)$payload['user_id'], 1);
            if (empty($history)) {
                $msg = $lang === 'en'
                    ? 'No search history. Search for a city first.'
                    : 'Sem histórico de pesquisas. Pesquise uma cidade primeiro.';
                Response::error($msg);
                return;
            }
            $query = $history[0]['city_name'];
        }

        // Chama a WeatherAPI em tempo real para obter todos os campos
        $raw = $this->fetchWeather($query, $lang);
        if (!$raw) {
            $msg = $lang === 'en'
                ? "Could not retrieve weather data for \"$query\"."
                : "Não foi possível obter dados meteorológicos para \"$query\".";
            Response::notFound($msg);
            return;
        }

        $cur  = $raw['current']  ?? [];
        $loc  = $raw['location'] ?? [];
        $cond = $cur['condition'] ?? [];

        $pdfData = [
            'city'        => $loc['name']               ?? $query,
            'country'     => $loc['country']             ?? '',
            'temperature' => number_format((float)($cur['temp_c']       ?? 0), 1),
            'feels_like'  => number_format((float)($cur['feelslike_c']  ?? 0), 1),
            'humidity'    => ($cur['humidity']            ?? '--') . ' %',
            'wind_speed'  => number_format((float)($cur['wind_kph']     ?? 0), 1),
            'pressure'    => number_format((float)($cur['pressure_mb']  ?? 0), 1),
            'uv_index'    => $cur['uv']                  ?? '--',
            'condition'   => $cond['text']               ?? '--',
        ];

        $pdf      = new SimplePdf($lang);
        $content  = $pdf->generate($pdfData);
        $filename = self::$pdfFilenames[$lang] . '_' . date('Ymd_His') . '.pdf';

        header_remove('Content-Type');
        header('Content-Type: application/pdf');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Content-Length: ' . strlen($content));
        echo $content;
        exit;
    }

    /**
     * Chama WeatherAPI /current.json via cURL e devolve o array descodificado, ou null em caso de erro.
     * O parâmetro $lang selecciona a língua da condição devolvida pela API.
     */
    private function fetchWeather(string $query, string $lang = 'pt'): ?array {
        // WeatherAPI usa 'pt' para Português e 'en' para Inglês
        $url = 'https://api.weatherapi.com/v1/current.json?' . http_build_query([
            'key'  => WEATHERAPI_KEY,
            'q'    => $query,
            'aqi'  => 'no',
            'lang' => $lang,
        ]);

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
        if (!is_array($data) || isset($data['error']) || !isset($data['current'])) return null;
        return $data;
    }
}
