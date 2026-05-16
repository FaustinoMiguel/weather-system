// Decisão técnica: footer simples reforça identidade sem ocupar espaço de trabalho das páginas.

import { Component, inject } from '@angular/core';
import { I18nService } from '../../../core/services/i18n.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  template: `
    <footer class="footer">
      <span>{{ t('footer.copy') }}</span>
    </footer>
  `,
  styles: [`
    .footer {
      color: var(--muted);
      border-top: 1px solid var(--border);
      padding: 18px min(24px, 4vw);
      text-align: center;
    }
  `]
})
export class FooterComponent {
  private readonly i18n = inject(I18nService);

  t(key: string): string {
    return this.i18n.t(key);
  }
}
