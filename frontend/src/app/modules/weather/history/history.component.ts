import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { WeatherService } from '../../../core/services/weather.service';
import { ExportService } from '../../../core/services/export.service';
import { I18nService } from '../../../core/services/i18n.service';
import { SearchHistoryItem } from '../../../core/services/api.types';
import { DateFormatPipe } from '../../../shared/pipes/date-format.pipe';
import { TemperaturePipe } from '../../../shared/pipes/temperature.pipe';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [DateFormatPipe, TemperaturePipe, LoadingSpinnerComponent],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h2>📋 {{ i18n.t('history.title') }}</h2>
        <div class="header-actions">
          <button class="btn-export" (click)="exportService.downloadCsv()">
            📊 {{ i18n.t('history.exportCsv') }}
          </button>
          @if (history().length) {
            <button class="btn-clear" (click)="clearAll()">🗑 {{ i18n.t('history.clear') }}</button>
          }
        </div>
      </div>

      <app-loading-spinner [visible]="loading()" [inline]="true" />

      @if (!loading() && history().length === 0) {
        <div class="empty-state">
          <p>{{ i18n.t('history.empty') }}</p>
        </div>
      }

      @if (!loading() && history().length) {
        <div class="history-table-wrap">
          <table class="history-table">
            <thead>
              <tr>
                <th>{{ i18n.t('history.colDate') }}</th>
                <th>{{ i18n.t('history.colCity') }}</th>
                <th>{{ i18n.t('history.colCountry') }}</th>
                <th>{{ i18n.t('history.colTemp') }}</th>
                <th>{{ i18n.t('history.colCondition') }}</th>
              </tr>
            </thead>
            <tbody>
              @for (item of history(); track item.id) {
                <tr>
                  <td>{{ item.searched_at | dateFormat }}</td>
                  <td>{{ item.city_name }}</td>
                  <td>{{ item.country_code }}</td>
                  <td>{{ item.temperature | temperature }}</td>
                  <td>{{ item.condition_text }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-container { max-width: 900px; margin: 0 auto; padding: 1.5rem 1rem; }
    .page-header { display: flex; align-items: center; justify-content: space-between;
                   margin-bottom: 1.5rem; flex-wrap: wrap; gap: .75rem; }
    .page-header h2 { font-size: 1.3rem; font-weight: 600; margin: 0; }
    .header-actions { display: flex; gap: .5rem; }
    .btn-export { background: var(--color-primary); color: #fff; border: none; border-radius: 8px;
                  padding: .5rem 1rem; cursor: pointer; font-size: .85rem; }
    .btn-clear { background: #fee2e2; color: #991b1b; border: none; border-radius: 8px;
                 padding: .5rem 1rem; cursor: pointer; font-size: .85rem; }
    .empty-state { text-align: center; padding: 3rem 1rem; color: var(--color-text-secondary); }
    .history-table-wrap { overflow-x: auto; border-radius: 12px;
                          box-shadow: 0 2px 8px rgba(0,0,0,.06); }
    .history-table { width: 100%; border-collapse: collapse; background: var(--color-card); }
    .history-table th { background: var(--color-bg-secondary); padding: .75rem 1rem;
                        text-align: left; font-size: .85rem; font-weight: 600;
                        color: var(--color-text-secondary); }
    .history-table td { padding: .7rem 1rem; font-size: .9rem; border-top: 1px solid var(--color-border); }
    .history-table tr:hover td { background: var(--color-bg-secondary); }
  `]
})
export class HistoryComponent implements OnInit, OnDestroy {
  weatherService = inject(WeatherService);
  exportService  = inject(ExportService);
  i18n           = inject(I18nService);

  history  = signal<SearchHistoryItem[]>([]);
  loading  = signal(true);
  private destroy$ = new Subject<void>();

  ngOnInit(): void { this.load(); }

  load(): void {
    this.weatherService.getHistory().pipe(takeUntil(this.destroy$)).subscribe({
      next:  (res) => { this.history.set(res.data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  clearAll(): void {
    this.weatherService.clearHistory().subscribe(() => this.history.set([]));
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}
