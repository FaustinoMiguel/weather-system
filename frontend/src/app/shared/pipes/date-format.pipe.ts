// Decisão técnica: pipe de data respeita o locale activo sem duplicar Intl nos componentes.

import { Pipe, PipeTransform, inject } from '@angular/core';
import { I18nService } from '../../core/services/i18n.service';

@Pipe({
  name: 'dateFormat',
  standalone: true,
  pure: false
})
export class DateFormatPipe implements PipeTransform {
  private readonly i18n = inject(I18nService);

  transform(value: string | null | undefined, options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' }): string {
    if (!value) {
      return this.i18n.t('common.notAvailable');
    }

    const locale = this.i18n.language() === 'pt' ? 'pt-PT' : 'en-US';
    return new Intl.DateTimeFormat(locale, options).format(new Date(value));
  }
}
