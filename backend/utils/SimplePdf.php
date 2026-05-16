<?php
// Gerador de PDF simples sem dependências externas.
// Gera PDF com relatório meteorológico usando especificação PDF 1.4.
class SimplePdf {
    private array $pages   = [];
    private array $objects = [];
    private int   $objCount = 0;
    private string $fontObj;
    private string $boldFontObj;

    public function __construct() {
        // Regista fontes base (Helvetica built-in no PDF)
        $this->fontObj     = $this->addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
        $this->boldFontObj = $this->addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");
    }

    private function addObject(string $content): string {
        $this->objCount++;
        $id = $this->objCount;
        $this->objects[$id] = $content;
        return "$id 0 R";
    }

    private function escape(string $text): string {
        // Converte UTF-8 para latin1 para compatibilidade com PDF base-14
        $text = iconv('UTF-8', 'ISO-8859-1//TRANSLIT//IGNORE', $text);
        return str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], $text);
    }

    public function generate(array $data): string {
        $city     = $data['city'] ?? 'N/A';
        $country  = $data['country'] ?? '';
        $temp     = $data['temperature'] ?? '--';
        $feels    = $data['feels_like'] ?? '--';
        $humidity = $data['humidity'] ?? '--';
        $wind     = $data['wind_speed'] ?? '--';
        $pressure = $data['pressure'] ?? '--';
        $uv       = $data['uv_index'] ?? '--';
        $cond     = $data['condition'] ?? '--';
        $date     = date('d/m/Y H:i');

        // Constrói stream de conteúdo da página
        $stream = $this->buildPage($city, $country, $temp, $feels, $humidity, $wind, $pressure, $uv, $cond, $date);

        $streamObj  = $this->addObject("stream\n$stream\nendstream");
        $pageContent = "<< /Length " . strlen($stream) . " >>\n$stream";

        // Recria stream obj com comprimento correcto
        $this->objCount--;
        unset($this->objects[$this->objCount + 1]);
        $this->objCount++;
        $streamId = $this->objCount;
        $this->objects[$streamId] = "<< /Length " . strlen($stream) . " >>\nstream\n$stream\nendstream";

        $fontResources = "<< /F1 {$this->fontObj} /F2 {$this->boldFontObj} >>";
        $resourceObj   = $this->addObject("<< /Font $fontResources >>");
        $pageObj       = $this->addObject("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents $streamId 0 R /Resources $resourceObj >>");
        $pagesObj      = "2 0 R";

        // Monta PDF final
        $output  = "%PDF-1.4\n";
        $offsets = [];

        // Reserva obj 2 para Pages
        $pagesContent = "<< /Type /Pages /Kids [$pageObj] /Count 1 >>";
        $this->objects[2] = $pagesContent;
        if ($this->objCount < 2) $this->objCount = 2;

        $catalogId = $this->addObject("<< /Type /Catalog /Pages 2 0 R >>");

        foreach ($this->objects as $id => $content) {
            $offsets[$id] = strlen($output);
            $output .= "$id 0 obj\n$content\nendobj\n";
        }

        $xrefOffset = strlen($output);
        $output .= "xref\n0 " . ($this->objCount + 1) . "\n";
        $output .= "0000000000 65535 f \n";
        for ($i = 1; $i <= $this->objCount; $i++) {
            $off = $offsets[$i] ?? 0;
            $output .= str_pad($off, 10, '0', STR_PAD_LEFT) . " 00000 n \n";
        }
        $output .= "trailer\n<< /Size " . ($this->objCount + 1) . " /Root $catalogId >>\n";
        $output .= "startxref\n$xrefOffset\n%%EOF";

        return $output;
    }

    private function buildPage(string $city, string $country, mixed $temp, mixed $feels,
                                mixed $humidity, mixed $wind, mixed $pressure, mixed $uv,
                                string $cond, string $date): string {
        $lines = [];
        // Cabeçalho
        $lines[] = "BT /F2 20 Tf 50 800 Td (" . $this->escape("Relatório Meteorológico") . ") Tj ET";
        $lines[] = "BT /F1 11 Tf 50 778 Td (" . $this->escape("Gerado em: $date") . ") Tj ET";
        // Linha separadora
        $lines[] = "0.8 0.8 0.8 RG 1 w 50 768 m 545 768 l S";
        // Cidade
        $lines[] = "BT /F2 16 Tf 50 748 Td (" . $this->escape("$city, $country") . ") Tj ET";
        $lines[] = "BT /F1 13 Tf 50 728 Td (" . $this->escape("Condição: $cond") . ") Tj ET";
        // Dados meteorológicos
        $rows = [
            ["Temperatura", "{$temp} °C"],
            ["Sensação térmica", "{$feels} °C"],
            ["Humidade", "{$humidity} %"],
            ["Velocidade do vento", "{$wind} km/h"],
            ["Pressão atmosférica", "{$pressure} hPa"],
            ["Índice UV", (string)$uv],
        ];
        $y = 700;
        foreach ($rows as [$label, $value]) {
            $lines[] = "BT /F2 11 Tf 50 $y Td (" . $this->escape($label . ":") . ") Tj ET";
            $lines[] = "BT /F1 11 Tf 200 $y Td (" . $this->escape($value) . ") Tj ET";
            $y -= 22;
        }
        // Rodapé
        $lines[] = "0.8 0.8 0.8 RG 50 60 m 545 60 l S";
        $lines[] = "BT /F1 9 Tf 50 45 Td (" . $this->escape("Dados fornecidos por Open-Meteo (open-meteo.com)") . ") Tj ET";

        return implode("\n", $lines);
    }
}
