// Decisão técnica: pipe centraliza formatação de temperaturas e mantém templates limpos.

import { Pipe, PipeTransform, inject } from '@angular/core';
import { I18nService } from '../../core/services/i18n.service';

@Pipe({
  name: 'temperature',
  standalone: true,
  pure: false
})
export class TemperaturePipe implements PipeTransform {
  private readonly i18n = inject(I18nService);

  transform(value: number | string | null | undefined): string {
    if (value === null || value === undefined || value === '') {
      return this.i18n.t('common.notAvailable');
    }

    return `${Number(value).toFixed(1)} °C`;
  }
}
