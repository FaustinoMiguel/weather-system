import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ExportService } from '../../core/services/export.service';
import { I18nService } from '../../core/services/i18n.service';

@Component({
  selector: 'app-export',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page-container">
      <h2>📤 {{ i18n.t('export.title') }}</h2>
      <p class="subtitle">{{ i18n.t('export.subtitle') }}</p>

      <div class="export-cards">

        <!-- CSV -->
        <div class="export-card">
          <div class="export-icon">📊</div>
          <h3>{{ i18n.t('export.csvTitle') }}</h3>
          <p>{{ i18n.t('export.csvDesc') }}</p>
          <button class="btn-export csv" (click)="downloadCsv()">
            {{ i18n.t('export.downloadCsv') }}
          </button>
        </div>

        <!-- PDF -->
        <div class="export-card">
          <div class="export-icon">📄</div>
          <h3>{{ i18n.t('export.pdfTitle') }}</h3>
          <p>{{ i18n.t('export.pdfDesc') }}</p>
          <div class="pdf-city-input">
            <input type="text" [(ngModel)]="cityForPdf" name="city"
                   [placeholder]="i18n.t('export.pdfCityPlaceholder')" />
          </div>
          <button class="btn-export pdf" (click)="downloadPdf()">
            {{ i18n.t('export.downloadPdf') }}
          </button>
        </div>

      </div>

      @if (message()) {
        <div class="status-msg">{{ message() }}</div>
      }
    </div>
  `,
  styles: [`
    .page-container { max-width: 800px; margin: 0 auto; padding: 1.5rem 1rem; }
    h2 { font-size: 1.3rem; font-weight: 600; margin-bottom: .25rem; }
    .subtitle { color: var(--color-text-secondary); font-size: .9rem; margin-bottom: 2rem; }
    .export-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
    .export-card { background: var(--color-card); border-radius: 14px; padding: 1.5rem;
                   box-shadow: 0 2px 8px rgba(0,0,0,.07); display: flex; flex-direction: column; gap: .75rem; }
    .export-icon { font-size: 2.5rem; }
    .export-card h3 { margin: 0; font-size: 1.05rem; }
    .export-card p { margin: 0; font-size: .88rem; color: var(--color-text-secondary); flex: 1; }
    .pdf-city-input input { width: 100%; padding: .55rem .9rem; border: 1.5px solid var(--color-border);
                            border-radius: 8px; font-size: .9rem; background: var(--color-bg-secondary);
                            color: var(--color-text-primary); box-sizing: border-box; }
    .btn-export { border: none; border-radius: 10px; padding: .65rem 1.2rem; cursor: pointer;
                  font-size: .9rem; font-weight: 500; width: 100%; transition: opacity .2s; }
    .btn-export.csv { background: #10b981; color: #fff; }
    .btn-export.pdf { background: var(--color-primary); color: #fff; }
    .btn-export:hover { opacity: .85; }
    .status-msg { margin-top: 1.25rem; background: var(--color-bg-secondary); border-radius: 8px;
                  padding: .75rem 1rem; font-size: .9rem; color: var(--color-text-secondary); }
    @media (max-width: 600px) { .export-cards { grid-template-columns: 1fr; } }
  `]
})
export class ExportComponent {
  exportService = inject(ExportService);
  i18n          = inject(I18nService);

  cityForPdf = '';
  message    = signal('');

  downloadCsv(): void {
    this.exportService.downloadCsv();
    this.message.set(this.i18n.t('export.downloadingCsv'));
    setTimeout(() => this.message.set(''), 3000);
  }

  downloadPdf(): void {
    this.exportService.downloadPdf(this.cityForPdf || undefined);
    this.message.set(this.i18n.t('export.downloadingPdf'));
    setTimeout(() => this.message.set(''), 3000);
  }
}
