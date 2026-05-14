<?php
// Decisão técnica: gerar um PDF mínimo em PHP puro evita dependências externas para relatórios simples.

declare(strict_types=1);

final class SimplePdf
{
    public static function render(string $title, array $lines): string
    {
        $objects = [];
        $contentLines = ['BT', '/F1 18 Tf', '50 790 Td', '(' . self::escape($title) . ') Tj'];
        $contentLines[] = '/F1 11 Tf';
        foreach ($lines as $line) {
            $contentLines[] = '0 -20 Td';
            $contentLines[] = '(' . self::escape((string) $line) . ') Tj';
        }
        $contentLines[] = 'ET';
        $stream = implode("\n", $contentLines);

        $objects[] = '<< /Type /Catalog /Pages 2 0 R >>';
        $objects[] = '<< /Type /Pages /Kids [3 0 R] /Count 1 >>';
        $objects[] = '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>';
        $objects[] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
        $objects[] = "<< /Length " . strlen($stream) . " >>\nstream\n{$stream}\nendstream";

        $pdf = "%PDF-1.4\n";
        $offsets = [0];
        foreach ($objects as $index => $object) {
            $offsets[] = strlen($pdf);
            $objectNumber = $index + 1;
            $pdf .= "{$objectNumber} 0 obj\n{$object}\nendobj\n";
        }

        $xrefOffset = strlen($pdf);
        $pdf .= "xref\n0 " . (count($objects) + 1) . "\n";
        $pdf .= "0000000000 65535 f \n";
        for ($i = 1; $i <= count($objects); $i++) {
            $pdf .= sprintf("%010d 00000 n \n", $offsets[$i]);
        }
        $pdf .= "trailer\n<< /Size " . (count($objects) + 1) . " /Root 1 0 R >>\nstartxref\n{$xrefOffset}\n%%EOF";

        return $pdf;
    }

    private static function escape(string $text): string
    {
        return str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], $text);
    }
}
