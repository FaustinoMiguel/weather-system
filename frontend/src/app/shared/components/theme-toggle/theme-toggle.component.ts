// Decisão técnica: botão dedicado evita lógica de tema espalhada pela navbar e páginas.

import { Component, inject } from '@angular/core';
import { LucideAngularModule, Moon, Sun } from 'lucide-angular';
import { ThemeService } from '../../../core/services/theme.service';
import { I18nService } from '../../../core/services/i18n.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [LucideAngularModule.pick({ Moon, Sun })],
  template: `
    <button class="btn icon-btn" type="button" [title]="t('common.theme')" (click)="theme.toggle()">
      <lucide-icon [name]="theme.theme() === 'dark' ? 'sun' : 'moon'" size="19" />
    </button>
  `
})
export class ThemeToggleComponent {
  readonly theme = inject(ThemeService);
  private readonly i18n = inject(I18nService);

  t(key: string): string {
    return this.i18n.t(key);
  }
}
