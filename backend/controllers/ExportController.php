<?php
// Decisão técnica: exportações retornam ficheiros reais para serem descarregados directamente pelo browser.

declare(strict_types=1);

final class ExportController
{
    private SearchHistory $history;

    public function __construct(PDO $db)
    {
        $this->history = new SearchHistory($db);
    }

    public function csv(array $query, array $user): void
    {
        if (isset($query['city'])) {
            header('Content-Type: text/csv; charset=utf-8');
            header('Content-Disposition: attachment; filename="weather-current.csv"');
            $output = fopen('php://output', 'w');
            fputcsv($output, ['Cidade', 'Temperatura', 'Humidade', 'Vento', 'Pressão', 'Condição', 'Data']);
            fputcsv($output, [
                $query['city'] ?? '',
                $query['temperature'] ?? '',
                $query['humidity'] ?? '',
                $query['wind_speed'] ?? '',
                $query['pressure'] ?? '',
                $query['condition'] ?? '',
                date('Y-m-d H:i:s'),
            ]);
            fclose($output);
            exit;
        }

        $rows = $this->history->latest($user['id'], 100);
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="weather-history.csv"');

        $output = fopen('php://output', 'w');
        fputcsv($output, ['Cidade', 'País', 'Temperatura', 'Condição', 'Data']);
        foreach ($rows as $row) {
            fputcsv($output, [
                $row['city_name'],
                $row['country_code'],
                $row['temperature'],
                $row['condition_text'],
                $row['searched_at'],
            ]);
        }
        fclose($output);
        exit;
    }

    public function pdf(array $query, array $user): void
    {
        $lines = [
            'Cidade: ' . (string) ($query['city'] ?? 'N/D'),
            'Data: ' . date('Y-m-d H:i:s'),
            'Temperatura: ' . (string) ($query['temperature'] ?? 'N/D') . ' C',
            'Humidade: ' . (string) ($query['humidity'] ?? 'N/D') . ' %',
            'Vento: ' . (string) ($query['wind_speed'] ?? 'N/D') . ' m/s',
            'Pressão: ' . (string) ($query['pressure'] ?? 'N/D') . ' hPa',
            'Condição: ' . (string) ($query['condition'] ?? 'N/D'),
        ];
        $pdf = SimplePdf::render('Relatório Meteorológico', $lines);

        header('Content-Type: application/pdf');
        header('Content-Disposition: attachment; filename="weather-report.pdf"');
        header('Content-Length: ' . strlen($pdf));
        echo $pdf;
        exit;
    }
}
