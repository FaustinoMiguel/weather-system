import { Pipe, PipeTransform } from '@angular/core';

// Formata temperatura com unidade, ex: 25.3 → "25°C"
// Aceita number | string para compatibilidade com PHP/PDO (DECIMAL é devolvido como string)
@Pipe({ name: 'temperature', standalone: true })
export class TemperaturePipe implements PipeTransform {
  transform(value: number | string | null | undefined, unit = '°C', decimals = 0): string {
    if (value === null || value === undefined || value === '') return '--';
    const num = Number(value);
    if (isNaN(num)) return '--';
    return `${num.toFixed(decimals)}${unit}`;
  }
}
