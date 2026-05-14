// Decisão técnica: dashboard concentra pesquisa e resumo actual, enquanto serviços cuidam da comunicação HTTP.

import { Component, DestroyRef, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  LucideAngularModule,
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Download,
  Heart,
  MapPin,
  Moon,
  Search,
  Sun
} from 'lucide-angular';
import { WeatherService } from '../../../core/services/weather.service';
import { ExportService } from '../../../core/services/export.service';
import { I18nService } from '../../../core/services/i18n.service';
import { WeatherCurrent, WeatherResponse } from '../../../core/services/api.types';
import { TemperaturePipe } from '../../../shared/pipes/temperature.pipe';
import { DateFormatPipe } from '../../../shared/pipes/date-format.pipe';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

type LastWeatherQuery =
  | { type: 'city'; city: string }
  | { type: 'coordinates'; lat: number; lon: number; label: string };

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    TemperaturePipe,
    DateFormatPipe,
    LoadingSpinnerComponent,
    LucideAngularModule.pick({
      Cloud,
      CloudDrizzle,
      CloudFog,
      CloudLightning,
      CloudRain,
      CloudSnow,
      CloudSun,
      Download,
      Heart,
      MapPin,
      Moon,
      Search,
      Sun
    })
  ],
  template: `
    <section class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">{{ t('dashboard.title') }}</h1>
          <p class="muted">{{ t('dashboard.subtitle') }}</p>
        </div>
      </div>

      <form class="panel form-row" [formGroup]="form" (ngSubmit)="search()">
        <label class="field">
          <span>{{ t('weather.city') }}</span>
          <input type="text" formControlName="city" [placeholder]="t('weather.cityPlaceholder')">
        </label>
        <button class="btn primary" type="submit" [disabled]="form.invalid || loading()">
          <lucide-icon name="search" size="18" />
          {{ t('weather.search') }}
        </button>
        <button class="btn" type="button" (click)="useLocation()" [disabled]="loading()">
          <lucide-icon name="map-pin" size="18" />
          GPS
        </button>
      </form>

      @if (error()) {
        <p class="error">{{ error() }}</p>
      }

      @if (loading()) {
        <div class="panel"><app-loading-spinner /></div>
      }

      @if (weather(); as data) {
        <article class="weather-card current">
          <div class="current-main">
            <div>
              <p class="muted">{{ data.current.date | dateFormat: { dateStyle: 'medium', timeStyle: 'short' } }}</p>
              <h2>{{ data.current.city }}, {{ data.current.country }}</h2>
              <strong class="temp">{{ data.current.temperature | temperature }}</strong>
              <p>{{ data.current.condition }}</p>
            </div>
            <lucide-icon class="weather-icon" [name]="data.current.icon" size="104" />
          </div>

          @if (data.current.alerts.length > 0) {
            <div class="alert">
              {{ t('weather.alert') }}:
              @for (alert of data.current.alerts; track alert) {
                <strong>{{ alertLabel(alert) }}</strong>
              }
            </div>
          }

          <div class="metric-list">
            <div class="metric"><span>{{ t('weather.humidity') }}</span><strong>{{ metric(data.current.humidity, '%') }}</strong></div>
            <div class="metric"><span>{{ t('weather.wind') }}</span><strong>{{ metric(data.current.wind_speed, 'm/s') }}</strong></div>
            <div class="metric"><span>{{ t('weather.pressure') }}</span><strong>{{ metric(data.current.pressure, 'hPa') }}</strong></div>
            <div class="metric"><span>{{ t('weather.feelsLike') }}</span><strong>{{ data.current.feels_like | temperature }}</strong></div>
            <div class="metric"><span>{{ t('weather.uv') }}</span><strong>{{ data.current.uv_index ?? t('weather.unavailable') }}</strong></div>
            <div class="metric"><span>{{ t('weather.coordinates') }}</span><strong>{{ coords(data.current) }}</strong></div>
          </div>

          <div class="form-row actions">
            <button class="btn" type="button" (click)="saveFavourite(data.current)">
              <lucide-icon name="heart" size="18" />
              {{ t('weather.saveFavourite') }}
            </button>
            <button class="btn" type="button" (click)="exportPdf(data.current)">
              <lucide-icon name="download" size="18" />
              PDF
            </button>
            <button class="btn" type="button" (click)="exportCsv(data.current)">
              <lucide-icon name="download" size="18" />
              CSV
            </button>
            <a class="btn" [routerLink]="['/city', data.current.city]">{{ t('weather.details') }}</a>
          </div>
          @if (message()) {
            <p class="muted">{{ message() }}</p>
          }
        </article>

        <section class="forecast">
          <h2>{{ t('weather.nextDays') }}</h2>
          <div class="grid three">
            @for (day of data.daily; track day.date) {
              <article class="panel day">
                <strong>{{ day.date | dateFormat }}</strong>
                <lucide-icon class="day-icon" [name]="day.icon" size="64" />
                <p>{{ day.condition }}</p>
                <p><strong>{{ day.min | temperature }}</strong> / <strong>{{ day.max | temperature }}</strong></p>
              </article>
            }
          </div>
        </section>
      }
    </section>
  `,
  styles: [`
    .current {
      padding: 20px;
      margin-top: 18px;
    }

    .current-main {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 18px;
      margin-bottom: 18px;
    }

    .current-main h2 {
      margin: 0;
      font-size: 1.8rem;
    }

    .temp {
      display: block;
      font-size: clamp(2.4rem, 7vw, 4.4rem);
      margin: 8px 0;
    }

    .weather-icon {
      width: 110px;
      height: 110px;
      color: var(--primary);
    }

    .actions {
      margin-top: 16px;
    }

    .forecast {
      margin-top: 24px;
    }

    .day {
      min-height: 210px;
    }

    .day-icon {
      width: 72px;
      height: 72px;
      color: var(--primary);
    }
  `]
})
export class DashboardComponent {
  private readonly lastQueryKey = 'weather_last_query';
  private readonly legacyLastCityKey = 'weather_last_city';
  private readonly fb = inject(FormBuilder);
  private readonly weatherService = inject(WeatherService);
  private readonly exportService = inject(ExportService);
  private readonly i18n = inject(I18nService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(false);
  readonly error = signal('');
  readonly message = signal('');
  readonly weather = signal<WeatherResponse | null>(null);
  readonly form = this.fb.nonNullable.group({
    city: ['', [Validators.required, Validators.minLength(2)]]
  });

  constructor() {
    // Decisão técnica: ao recarregar, repete a última consulta real feita pelo utilizador.
    const lastQuery = this.restoreLastQuery();
    if (lastQuery?.type === 'coordinates') {
      this.form.controls.city.setValue(lastQuery.label);
      queueMicrotask(() => this.searchCoordinates(lastQuery.lat, lastQuery.lon, lastQuery.label));
      return;
    }

    if (lastQuery?.type === 'city') {
      this.form.controls.city.setValue(lastQuery.city);
      queueMicrotask(() => this.search());
      return;
    }

    queueMicrotask(() => this.useLocation());
  }

  t(key: string): string {
    return this.i18n.t(key);
  }

  search(): void {
    if (this.form.invalid) {
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.message.set('');
    this.weatherService.searchByCity(this.form.controls.city.value, this.i18n.language())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.weather.set(response.data);
          this.storeLastQuery({ type: 'city', city: response.data.current.city || this.form.controls.city.value });
          this.loading.set(false);
        },
        error: () => {
          this.error.set(this.t('weather.searchError'));
          this.loading.set(false);
        }
      });
  }

  useLocation(): void {
    if (!navigator.geolocation) {
      this.error.set(this.t('weather.gpsUnavailable'));
      return;
    }

    this.loading.set(true);
    this.error.set('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.searchCoordinates(
          position.coords.latitude,
          position.coords.longitude,
          this.t('weather.currentLocation')
        );
      },
      () => {
        this.error.set(this.t('weather.gpsDenied'));
        this.loading.set(false);
      }
    );
  }

  saveFavourite(current: WeatherCurrent): void {
    this.weatherService.addFavourite(current.city, current.country)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.message.set(this.t('weather.favouriteSaved')),
        error: () => this.message.set(this.t('weather.favouriteExists'))
      });
  }

  exportPdf(current: WeatherCurrent): void {
    this.exportService.downloadPdf(current)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  exportCsv(current: WeatherCurrent): void {
    this.exportService.downloadCurrentCsv(current)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  coords(current: WeatherCurrent): string {
    return current.coordinates ? `${current.coordinates.lat.toFixed(2)}, ${current.coordinates.lon.toFixed(2)}` : this.t('common.notAvailable');
  }

  metric(value: number | null, unit: string): string {
    return value === null ? this.t('common.notAvailable') : `${value}${unit === '%' ? '' : ' '}${unit}`;
  }

  alertLabel(alert: string): string {
    return this.t(`alerts.${alert}`);
  }

  private searchCoordinates(lat: number, lon: number, label: string): void {
    this.loading.set(true);
    this.error.set('');
    this.message.set('');
    this.weatherService.searchByCoordinates(lat, lon, this.i18n.language(), label)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const currentLabel = response.data.current.city || label;
          this.weather.set(response.data);
          this.form.controls.city.setValue(currentLabel);
          this.storeLastQuery({ type: 'coordinates', lat, lon, label: currentLabel });
          this.loading.set(false);
        },
        error: () => {
          this.error.set(this.t('weather.searchError'));
          this.loading.set(false);
        }
      });
  }

  private restoreLastQuery(): LastWeatherQuery | null {
    const raw = localStorage.getItem(this.lastQueryKey);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as LastWeatherQuery;
        if (parsed.type === 'city' && parsed.city.trim().length >= 2) {
          return parsed;
        }
        if (parsed.type === 'coordinates' && Number.isFinite(parsed.lat) && Number.isFinite(parsed.lon)) {
          return parsed;
        }
      } catch {
        localStorage.removeItem(this.lastQueryKey);
      }
    }

    const legacyCity = localStorage.getItem(this.legacyLastCityKey);
    return legacyCity ? { type: 'city', city: legacyCity } : null;
  }

  private storeLastQuery(query: LastWeatherQuery): void {
    localStorage.setItem(this.lastQueryKey, JSON.stringify(query));
    if (query.type === 'city') {
      localStorage.setItem(this.legacyLastCityKey, query.city);
    }
  }
}
