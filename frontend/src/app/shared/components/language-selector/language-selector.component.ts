// Decisão técnica: select nativo é acessível e troca o dicionário sem reload.

import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { I18nService } from '../../../core/services/i18n.service';

@Component({
  selector: 'app-language-selector',
  standalone: true,
  imports: [FormsModule],
  template: `
    <select class="language" [ngModel]="i18n.language()" (ngModelChange)="setLanguage($event)" [title]="t('common.language')">
      <option value="pt">PT</option>
      <option value="en">EN</option>
    </select>
  `,
  styles: [`
    .language {
      min-height: 42px;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 0 10px;
      background: var(--surface);
      color: var(--text);
    }
  `]
})
export class LanguageSelectorComponent {
  readonly i18n = inject(I18nService);

  setLanguage(language: string): void {
    this.i18n.setLanguage(language === 'en' ? 'en' : 'pt');
  }

  t(key: string): string {
    return this.i18n.t(key);
  }
}
