<?php
// Gerador de PDF sem dependencias externas -- layout profissional.
// Especificacao PDF 1.4 com fontes built-in Helvetica.
// Suporte multilíngue: 'pt' (Português) e 'en' (English).
//
// NOTA TÉCNICA: todos os textos com acentos são escritos como escapes octais
// \ddd no stream PDF — assim este ficheiro é 100% ASCII puro e o encoding
// do servidor PHP nunca interfere com os caracteres acentuados.
class SimplePdf {
    private array  $objects  = [];
    private int    $objCount = 0;
    private string $fontR;
    private string $fontB;
    private array  $labels;

    // Textos pré-convertidos para WinAnsi em escapes octais PDF.
    // Cada string aqui é ASCII puro — os acentos estão como \ddd.
    // Gerado a partir de: mb_convert_encoding(utf8, Windows-1252)
    // e depois cada byte > 127 convertido para \ddd octal.
    private static array $translations = [
        'pt' => [
            'app_name'      => 'WEATHER APP',
            'report_title'  => 'Relat\363rio Meteorol\363gico',
            'generated_at'  => 'Gerado em:',
            'current_cond'  => 'Condi\347\343o actual:',
            'section_label' => 'DADOS ACTUAIS',
            'temperature'   => 'Temperatura',
            'feels_like'    => 'Sensa\347\343o t\351rmica',
            'humidity'      => 'Humidade relativa',
            'wind_speed'    => 'Velocidade do vento',
            'pressure'      => 'Press\343o atmosf\351rica',
            'uv_index'      => '\315ndice UV',
            'unit_temp'     => '\260C',
            'unit_wind'     => 'km/h',
            'unit_pressure' => 'hPa',
            'disclaimer'    => 'Os dados reflectem as condi\347\365es no momento da gera\347\343o deste relat\363rio.',
            'footer'        => 'Dados por WeatherAPI.com  |  Weather App',
        ],
        'en' => [
            'app_name'      => 'WEATHER APP',
            'report_title'  => 'Weather Report',
            'generated_at'  => 'Generated at:',
            'current_cond'  => 'Current condition:',
            'section_label' => 'CURRENT DATA',
            'temperature'   => 'Temperature',
            'feels_like'    => 'Feels like',
            'humidity'      => 'Relative humidity',
            'wind_speed'    => 'Wind speed',
            'pressure'      => 'Atmospheric pressure',
            'uv_index'      => 'UV Index',
            'unit_temp'     => '\260C',
            'unit_wind'     => 'km/h',
            'unit_pressure' => 'hPa',
            'disclaimer'    => 'Data reflects conditions at the time this report was generated.',
            'footer'        => 'Data by WeatherAPI.com  |  Weather App',
        ],
    ];

    public function __construct(string $lang = 'pt') {
        // Pré-reserva ID 1 para o dicionário /Pages (preenchido em generate()).
        // Sem esta reserva, fontB ficaria em ID 2 e seria sobrescrita por /Pages.
        ++$this->objCount;      // objCount = 1
        $this->objects[1] = ''; // placeholder — substituído em generate()

        $this->fontR  = $this->obj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica      /Encoding /WinAnsiEncoding >>');
        $this->fontB  = $this->obj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
        $this->labels = self::$translations[$lang] ?? self::$translations['pt'];
    }

    private function obj(string $content): string {
        $id = ++$this->objCount;
        $this->objects[$id] = $content;
        return "$id 0 R";
    }

    /**
     * Converte uma string UTF-8 para escapes octais PDF (\ddd).
     * Cada byte > 127 vira \ddd, tornando o stream 100% ASCII puro.
     * Também escapa \, (, ) que são especiais no formato PDF.
     */
    private function esc(string $text): string {
        // Converte UTF-8 → Windows-1252 usando mb_convert_encoding
        // (disponível em todas as instalações PHP modernas)
        $win = mb_convert_encoding($text, 'Windows-1252', 'UTF-8');

        $result = '';
        $len    = strlen($win);
        for ($i = 0; $i < $len; $i++) {
            $b = ord($win[$i]);
            if ($b === ord('\\')) {
                $result .= '\\\\';
            } elseif ($b === ord('(')) {
                $result .= '\\(';
            } elseif ($b === ord(')')) {
                $result .= '\\)';
            } elseif ($b > 127) {
                // Escreve como escape octal PDF: \ddd
                $result .= '\\' . sprintf('%03o', $b);
            } else {
                $result .= chr($b);
            }
        }
        return $result;
    }

    public function generate(array $data): string {
        $stream   = $this->buildPage($data);
        $streamId = ++$this->objCount;
        $this->objects[$streamId] = '<< /Length ' . strlen($stream) . " >>\nstream\n" . $stream . "\nendstream";

        $fonts   = "<< /F1 {$this->fontR} /F2 {$this->fontB} >>";
        $resObj  = $this->obj("<< /Font $fonts >>");
        $pageObj = $this->obj("<< /Type /Page /Parent 1 0 R /MediaBox [0 0 595 842] /Contents $streamId 0 R /Resources $resObj >>");

        // Preenche o slot 1 pré-reservado com o dicionário /Pages real.
        // Antes da correcção este código sobrescrevia o ID 2 (Helvetica-Bold),
        // corrompendo /F2 e causando erros de caracteres no PDF.
        $this->objects[1] = "<< /Type /Pages /Kids [$pageObj] /Count 1 >>";

        $catalogId = $this->obj('<< /Type /Catalog /Pages 1 0 R >>');

        $out     = "%PDF-1.4\n";
        $offsets = [];
        foreach ($this->objects as $id => $c) {
            $offsets[$id] = strlen($out);
            $out .= "$id 0 obj\n$c\nendobj\n";
        }
        $xref = strlen($out);
        $out .= 'xref' . "\n" . '0 ' . ($this->objCount + 1) . "\n";
        $out .= "0000000000 65535 f \n";
        for ($i = 1; $i <= $this->objCount; $i++) {
            $out .= str_pad($offsets[$i] ?? 0, 10, '0', STR_PAD_LEFT) . " 00000 n \n";
        }
        $out .= 'trailer' . "\n" . '<< /Size ' . ($this->objCount + 1) . " /Root $catalogId >>\n";
        $out .= "startxref\n$xref\n%%EOF";
        return $out;
    }

    private function buildPage(array $d): string {
        $L = $this->labels;

        // Valores vindos da API — estes SIM passam pela esc() para converter
        // quaisquer acentos que a WeatherAPI possa devolver (nomes de cidades, condições)
        $city     = $d['city']        ?? 'N/A';
        $country  = $d['country']     ?? '';
        $temp     = $d['temperature'] ?? '--';
        $feels    = $d['feels_like']  ?? '--';
        $humidity = $d['humidity']    ?? '--';
        $wind     = $d['wind_speed']  ?? '--';
        $pressure = $d['pressure']    ?? '--';
        $uv       = (string)($d['uv_index'] ?? '--');
        $cond     = $d['condition']   ?? '--';
        $date     = date('d/m/Y H:i');
        $location = $country ? "$city, $country" : $city;

        // Labels estáticos já estão em octal — usados directamente no stream.
        // Valores dinâmicos passam pela esc().
        $ops = [];

        // ── Header bar (dark blue) ───────────────────────────────────────────
        $ops[] = '0.118 0.227 0.373 rg';
        $ops[] = '0 792 595 50 re f';
        $ops[] = '1 1 1 rg';
        $ops[] = 'BT /F2 8 Tf 50 826 Td (' . $L['app_name'] . ') Tj ET';
        $ops[] = 'BT /F2 17 Tf 50 804 Td (' . $L['report_title'] . ') Tj ET';
        $ops[] = 'BT /F1 8 Tf 400 826 Td (' . $L['generated_at'] . ' ' . $this->esc($date) . ') Tj ET';

        // ── Reset to black ───────────────────────────────────────────────────
        $ops[] = '0 0 0 rg';

        // ── Location block ───────────────────────────────────────────────────
        $ops[] = '0.118 0.478 0.706 rg';
        $ops[] = '50 756 4 32 re f';
        $ops[] = '0 0 0 rg';
        $ops[] = 'BT /F2 19 Tf 62 774 Td (' . $this->esc($location) . ') Tj ET';
        $ops[] = 'BT /F1 10 Tf 62 758 Td (' . $L['current_cond'] . ' ' . $this->esc($cond) . ') Tj ET';

        // ── Section divider + label ──────────────────────────────────────────
        $ops[] = '0.800 0.800 0.800 RG 0.5 w 50 748 m 545 748 l S';
        $ops[] = '0.500 0.500 0.500 rg';
        $ops[] = 'BT /F2 7.5 Tf 50 737 Td (' . $L['section_label'] . ') Tj ET';

        // ── Metric grid (2 columns x 3 rows) ────────────────────────────────
        $u_t = $L['unit_temp'];
        $u_w = $L['unit_wind'];
        $u_p = $L['unit_pressure'];

        $left  = [
            [$L['temperature'],  $this->esc($temp) . ' ' . $u_t],
            [$L['feels_like'],   $this->esc($feels) . ' ' . $u_t],
            [$L['humidity'],     $this->esc($humidity)],
        ];
        $right = [
            [$L['wind_speed'],  $this->esc($wind) . ' ' . $u_w],
            [$L['pressure'],    $this->esc($pressure) . ' ' . $u_p],
            [$L['uv_index'],    $this->esc($uv)],
        ];

        $y = 722;
        for ($i = 0; $i < 3; $i++) {
            if ($i % 2 === 0) {
                $ops[] = '0.957 0.965 0.980 rg';
                $ops[] = '50 ' . ($y - 7) . ' 495 26 re f';
                $ops[] = '0 0 0 rg';
            }
            $ops[] = '0.267 0.267 0.267 rg';
            $ops[] = 'BT /F2 10 Tf 58 '  . $y . ' Td (' . $left[$i][0]  . ':) Tj ET';
            $ops[] = '0.047 0.047 0.047 rg';
            $ops[] = 'BT /F1 10 Tf 200 ' . $y . ' Td (' . $left[$i][1]  . ') Tj ET';
            $ops[] = '0.267 0.267 0.267 rg';
            $ops[] = 'BT /F2 10 Tf 318 ' . $y . ' Td (' . $right[$i][0] . ':) Tj ET';
            $ops[] = '0.047 0.047 0.047 rg';
            $ops[] = 'BT /F1 10 Tf 455 ' . $y . ' Td (' . $right[$i][1] . ') Tj ET';
            $y -= 28;
        }

        $yTop = 726; $yBot = $y + 20;
        $ops[] = '0.800 0.800 0.800 RG 0.5 w 308 ' . $yBot . ' m 308 ' . $yTop . ' l S';
        $ops[] = '0.800 0.800 0.800 RG 0.5 w 50 '  . ($y + 18) . ' m 545 ' . ($y + 18) . ' l S';

        $noteY = $y + 4;
        $ops[] = '0.500 0.500 0.500 rg';
        $ops[] = 'BT /F1 8.5 Tf 50 ' . $noteY . ' Td (' . $L['disclaimer'] . ') Tj ET';

        $ops[] = '0.118 0.227 0.373 rg';
        $ops[] = '0 0 595 26 re f';
        $ops[] = '1 1 1 rg';
        $ops[] = 'BT /F1 8 Tf 50 9 Td ('  . $L['footer'] . ') Tj ET';
        $ops[] = 'BT /F1 8 Tf 440 9 Td (' . $this->esc($date) . ') Tj ET';

        return implode("\n", $ops);
    }
}
