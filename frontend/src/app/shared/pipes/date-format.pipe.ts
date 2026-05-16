import { Pipe, PipeTransform } from '@angular/core';

// Formata datas do histórico (YYYY-MM-DD ou ISO) para formato legível.
@Pipe({ name: 'dateFormat', standalone: true })
export class DateFormatPipe implements PipeTransform {
  transform(value: string | null | undefined, locale = 'pt-PT'): string {
    if (!value) return '--';
    try {
      const date = new Date(value);
      return new Intl.DateTimeFormat(locale, {
        day: '2-digit', month: 'short', year: 'numeric',
      }).format(date);
    } catch {
      return value;
    }
  }
}
