// Decisão técnica: detalhe reutiliza endpoint de forecast sem gravar histórico em navegações internas.

import { Component, DestroyRef, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { WeatherService } from '../../../core/services/weather.service';
import { I18nService } from '../../../core/services/i18n.service';
import { WeatherResponse } from '../../../core/services/api.types';
import { TemperaturePipe } from '../../../shared/pipes/temperature.pipe';
import { DateFormatPipe } from '../../../shared/pipes/date-format.pipe';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-city-detail',
  standalone: true,
  imports: [TemperaturePipe, DateFormatPipe, LoadingSpinnerComponent],
  template: `
    <section class="page">
      @if (loading()) {
        <app-loading-spinner />
      }
      @if (error()) {
        <p class="error">{{ error() }}</p>
      }
      @if (weather(); as data) {
        <div class="page-header">
          <div>
            <h1 class="page-title">{{ data.current.city }}, {{ data.current.country }}</h1>
            <p class="muted">{{ data.current.condition }}</p>
          </div>
          <strong class="detail-temp">{{ data.current.temperature | temperature }}</strong>
        </div>

        <div class="grid two">
          <section class="panel">
            <h2>{{ t('weather.current') }}</h2>
            <div class="metric-list">
              <div class="metric"><span>{{ t('weather.humidity') }}</span><strong>{{ data.current.humidity }}%</strong></div>
              <div class="metric"><span>{{ t('weather.wind') }}</span><strong>{{ data.current.wind_speed }} m/s</strong></div>
              <div class="metric"><span>{{ t('weather.pressure') }}</span><strong>{{ data.current.pressure }} hPa</strong></div>
            </div>
          </section>
          <section class="panel">
            <h2>{{ t('weather.nextDays') }}</h2>
            <div class="list">
              @for (day of data.daily; track day.date) {
                <div class="list-item">
                  <span>{{ day.date | dateFormat }}</span>
                  <strong>{{ day.min | temperature }} / {{ day.max | temperature }}</strong>
                </div>
              }
            </div>
          </section>
        </div>
      }
    </section>
  `,
  styles: [`
    .detail-temp {
      font-size: 2.6rem;
      color: var(--primary);
    }
  `]
})
export class CityDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly weatherService = inject(WeatherService);
  private readonly i18n = inject(I18nService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly error = signal('');
  readonly weather = signal<WeatherResponse | null>(null);

  constructor() {
    const city = this.route.snapshot.paramMap.get('city') ?? '';
    this.weatherService.forecast(city, this.i18n.language())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.weather.set(response.data);
          this.loading.set(false);
        },
        error: () => {
          this.error.set(this.t('weather.searchError'));
          this.loading.set(false);
        }
      });
  }

  t(key: string): string {
    return this.i18n.t(key);
  }
}
