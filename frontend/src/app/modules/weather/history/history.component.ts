// Decisão técnica: histórico suporta limpeza e exportação CSV sem expor detalhes do endpoint ao template.

import { Component, DestroyRef, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule, Download, Trash2 } from 'lucide-angular';
import { WeatherService } from '../../../core/services/weather.service';
import { ExportService } from '../../../core/services/export.service';
import { I18nService } from '../../../core/services/i18n.service';
import { SearchHistoryItem } from '../../../core/services/api.types';
import { TemperaturePipe } from '../../../shared/pipes/temperature.pipe';
import { DateFormatPipe } from '../../../shared/pipes/date-format.pipe';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [RouterLink, TemperaturePipe, DateFormatPipe, LoadingSpinnerComponent, LucideAngularModule.pick({ Download, Trash2 })],
  template: `
    <section class="page">
      <div class="page-header">
        <h1 class="page-title">{{ t('nav.history') }}</h1>
        <div class="form-row">
          <button class="btn" type="button" (click)="exportCsv()">
            <lucide-icon name="download" size="18" />
            CSV
          </button>
          <button class="btn danger" type="button" (click)="clear()">
            <lucide-icon name="trash-2" size="18" />
            {{ t('history.clear') }}
          </button>
        </div>
      </div>

      @if (loading()) {
        <app-loading-spinner />
      }

      <div class="list">
        @for (item of history(); track item.id) {
          <div class="list-item">
            <a [routerLink]="['/city', item.city_name]">
              <strong>{{ item.city_name }}, {{ item.country_code ?? t('common.notAvailable') }}</strong>
              <span class="muted">{{ item.condition_text }} · {{ item.temperature | temperature }}</span>
            </a>
            <span class="muted">{{ item.searched_at | dateFormat: { dateStyle: 'medium', timeStyle: 'short' } }}</span>
          </div>
        } @empty {
          <p class="panel muted">{{ t('history.empty') }}</p>
        }
      </div>
    </section>
  `
})
export class HistoryComponent {
  private readonly weatherService = inject(WeatherService);
  private readonly exportService = inject(ExportService);
  private readonly i18n = inject(I18nService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly history = signal<SearchHistoryItem[]>([]);

  constructor() {
    this.load();
  }

  t(key: string): string {
    return this.i18n.t(key);
  }

  clear(): void {
    this.weatherService.clearHistory()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.history.set([])
      });
  }

  exportCsv(): void {
    this.exportService.downloadCsv()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  private load(): void {
    this.weatherService.history(30)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.history.set(response.data);
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
  }
}
