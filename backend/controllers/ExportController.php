<?php
// Exportação de dados meteorológicos em CSV e PDF.
class ExportController {

    public function csv(): void {
        $payload = AuthMiddleware::handle();
        $model   = new SearchHistory();
        $history = $model->findByUser((int)$payload['user_id'], 100);

        header('Content-Type: text/csv; charset=UTF-8');
        header('Content-Disposition: attachment; filename="historico_' . date('Ymd_His') . '.csv"');

        $out = fopen('php://output', 'w');
        // BOM para Excel reconhecer UTF-8
        fwrite($out, "\xEF\xBB\xBF");

        fputcsv($out, ['Data/Hora', 'Cidade', 'País', 'Temperatura (°C)', 'Condição'], ';');
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
        $payload = AuthMiddleware::handle();

        // Necessita de city_name via query string para gerar relatório específico
        $cityName = Validator::sanitize($_GET['city'] ?? '');

        if ($cityName) {
            // Busca última pesquisa desta cidade no histórico do utilizador
            $model   = new SearchHistory();
            $history = $model->findByUser((int)$payload['user_id'], 50);
            $data    = null;

            foreach ($history as $row) {
                if (strtolower($row['city_name']) === strtolower($cityName)) {
                    $data = $row;
                    break;
                }
            }

            if (!$data) {
                Response::notFound('Sem dados desta cidade no histórico.');
            }

            $pdfData = [
                'city'        => $data['city_name'],
                'country'     => $data['country_code'],
                'temperature' => $data['temperature'],
                'feels_like'  => '--',
                'humidity'    => '--',
                'wind_speed'  => '--',
                'pressure'    => '--',
                'uv_index'    => '--',
                'condition'   => $data['condition_text'],
            ];
        } else {
            // Exporta último registo do histórico
            $model   = new SearchHistory();
            $history = $model->findByUser((int)$payload['user_id'], 1);
            if (empty($history)) Response::error('Sem histórico de pesquisas.');

            $row     = $history[0];
            $pdfData = [
                'city'        => $row['city_name'],
                'country'     => $row['country_code'],
                'temperature' => $row['temperature'],
                'feels_like'  => '--',
                'humidity'    => '--',
                'wind_speed'  => '--',
                'pressure'    => '--',
                'uv_index'    => '--',
                'condition'   => $row['condition_text'],
            ];
        }

        $pdf = new SimplePdf();
        $content = $pdf->generate($pdfData);

        header('Content-Type: application/pdf');
        header('Content-Disposition: attachment; filename="relatorio_' . date('Ymd_His') . '.pdf"');
        header('Content-Length: ' . strlen($content));
        echo $content;
        exit;
    }
}
