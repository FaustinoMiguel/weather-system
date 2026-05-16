import { Pipe, PipeTransform } from '@angular/core';

// Formata temperatura com unidade, ex: 25.3 → "25°C"
@Pipe({ name: 'temperature', standalone: true })
export class TemperaturePipe implements PipeTransform {
  transform(value: number | null | undefined, unit = '°C', decimals = 0): string {
    if (value === null || value === undefined) return '--';
    return `${value.toFixed(decimals)}${unit}`;
  }
}
