import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { WeatherService } from '../../../core/services/weather.service';
import { ExportService } from '../../../core/services/export.service';
import { I18nService } from '../../../core/services/i18n.service';
import { WeatherData, ForecastDay, FavouriteCity } from '../../../core/services/api.types';
import { TemperaturePipe } from '../../../shared/pipes/temperature.pipe';
import { DateFormatPipe } from '../../../shared/pipes/date-format.pipe';
import { WeatherCardComponent } from '../../../shared/components/weather-card/weather-card.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [FormsModule, TemperaturePipe, DateFormatPipe, WeatherCardComponent, LoadingSpinnerComponent],
  template: `
    <div class="dashboard">

      <!-- Banner GPS a detectar -->
      @if (gpsLoading()) {
        <div class="gps-banner">
          <span class="gps-spinner"></span>
          {{ i18n.t('dashboard.detectingLocation') }}
        </div>
      }

      <!-- Banner erro GPS -->
      @if (gpsError()) {
        <div class="gps-error-banner">
          ⚠️ {{ gpsError() }}
          <button class="btn-retry-gps" (click)="loadGpsLocation()">🔄 {{ i18n.t('dashboard.retryGps') }}</button>
        </div>
      }

      <!-- Barra de pesquisa -->
      <div class="search-section">
        <form class="search-form" (ngSubmit)="search()">
          <input class="search-input" type="text" [(ngModel)]="cityInput" name="city"
                 [placeholder]="i18n.t('dashboard.searchPlaceholder')" autocomplete="off" />
          <button class="btn-search" type="submit" [disabled]="loading() || gpsLoading()">
            🔍 {{ i18n.t('dashboard.search') }}
          </button>
          <button class="btn-gps" type="button" (click)="loadGpsLocation()"
                  [disabled]="loading() || gpsLoading()" [title]="i18n.t('dashboard.useGps')">
            📍
          </button>
        </form>
        @if (error()) { <p class="search-error">{{ error() }}</p> }
      </div>

      <app-loading-spinner [visible]="loading()" [inline]="true" [message]="i18n.t('dashboard.loading')" />

      <!-- Card principal -->
      @if (weather() && !loading()) {
        <div class="source-badge">
          @if (isGpsResult()) {
            <span class="badge gps">📍 {{ i18n.t('dashboard.yourLocation') }}</span>
          } @else {
            <span class="badge search">🔍 {{ i18n.t('dashboard.searchResult') }}</span>
          }
        </div>

        <app-weather-card
          [weather]="weather()!"
          [isFav]="isFavourite()"
          (toggleFav)="toggleFavourite($event)"
          (exportPdf)="exportService.downloadPdf($event)" />
      }

      <!-- Previsão 7 dias -->
      @if (forecast().length && !loading()) {
        <section class="forecast-section">
          <h3>{{ i18n.t('dashboard.forecast7days') }}</h3>
          <div class="forecast-grid">
            @for (day of forecast(); track day.date) {
              <div class="forecast-card">
                <p class="forecast-date">{{ day.date | dateFormat }}</p>
                <span class="forecast-icon">{{ getIcon(day.condition_code) }}</span>
                <p class="forecast-cond">{{ day.condition }}</p>
                <p class="forecast-temp">
                  <span class="max">{{ day.temp_max | temperature }}</span>
                  <span class="min">{{ day.temp_min | temperature }}</span>
                </p>
                <p class="forecast-extra">💧 {{ day.precipitation }}mm · 💨 {{ day.wind_speed }}km/h</p>
              </div>
            }
          </div>
        </section>
      }
    </div>
  `,
  styles: [`
    .dashboard { max-width: 900px; margin: 0 auto; padding: 1.5rem 1rem; }

    .gps-banner, .gps-error-banner {
      display: flex; align-items: center; gap: .75rem;
      padding: .75rem 1rem; border-radius: 10px; margin-bottom: 1rem; font-size: .9rem;
    }
    .gps-banner       { background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; }
    .gps-error-banner { background: #fef3c7; color: #92400e; border: 1px solid #fcd34d; flex-wrap: wrap; }
    :host-context([data-theme="dark"]) .gps-banner       { background: #1e3a5f; color: #93c5fd; border-color: #1e40af; }
    :host-context([data-theme="dark"]) .gps-error-banner { background: #451a03; color: #fcd34d; border-color: #92400e; }

    .gps-spinner { width:16px;height:16px;border:2px solid #93c5fd;border-top-color:#1e40af;
                   border-radius:50%;animation:spin .7s linear infinite;flex-shrink:0; }
    .btn-retry-gps { background:rgba(0,0,0,.08);border:none;border-radius:6px;
                     padding:.3rem .7rem;cursor:pointer;font-size:.82rem;margin-left:auto; }

    .source-badge { margin-bottom: .6rem; }
    .badge { display:inline-flex;align-items:center;gap:.35rem;font-size:.8rem;
             font-weight:500;padding:.3rem .75rem;border-radius:20px; }
    .badge.gps    { background:#dbeafe;color:#1d4ed8; }
    .badge.search { background:#f3f4f6;color:#374151; }
    :host-context([data-theme="dark"]) .badge.gps    { background:#1e3a5f;color:#93c5fd; }
    :host-context([data-theme="dark"]) .badge.search { background:#374151;color:#d1d5db; }

    .search-section { margin-bottom: 1.25rem; }
    .search-form { display:flex;gap:.5rem; }
    .search-input { flex:1;padding:.7rem 1rem;border:1.5px solid var(--color-border);
                    border-radius:10px;font-size:1rem;background:var(--color-card);
                    color:var(--color-text-primary); }
    .search-input:focus { outline:none;border-color:var(--color-primary); }
    .btn-search { background:var(--color-primary);color:#fff;border:none;border-radius:10px;
                  padding:.7rem 1.2rem;cursor:pointer;font-size:.95rem;white-space:nowrap;transition:opacity .2s; }
    .btn-search:disabled { opacity:.6;cursor:not-allowed; }
    .btn-gps { background:var(--color-bg-secondary);border:1.5px solid var(--color-border);
               border-radius:10px;padding:.7rem .9rem;cursor:pointer;font-size:1.1rem; }
    .search-error { color:#dc2626;font-size:.9rem;margin-top:.5rem; }

    .forecast-section { margin-top:1.75rem; }
    .forecast-section h3 { font-size:1.1rem;font-weight:600;margin-bottom:.75rem; }
    .forecast-grid { display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:.75rem; }
    .forecast-card { background:var(--color-card);border-radius:12px;padding:.9rem .6rem;
                     text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.06); }
    .forecast-date { font-size:.78rem;color:var(--color-text-secondary);margin:0 0 .4rem; }
    .forecast-icon { font-size:1.8rem; }
    .forecast-cond { font-size:.75rem;color:var(--color-text-secondary);margin:.3rem 0; }
    .forecast-temp { display:flex;justify-content:center;gap:.5rem;font-weight:600;margin:.3rem 0; }
    .forecast-temp .max { color:#ef4444; }
    .forecast-temp .min { color:#3b82f6; }
    .forecast-extra { font-size:.72rem;color:var(--color-text-secondary);margin:0; }
    @keyframes spin { to { transform:rotate(360deg); } }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  weatherService = inject(WeatherService);
  exportService  = inject(ExportService);
  i18n           = inject(I18nService);

  cityInput   = '';
  weather     = signal<WeatherData | null>(null);
  forecast    = signal<ForecastDay[]>([]);
  favourites  = signal<FavouriteCity[]>([]);
  loading     = signal(false);
  gpsLoading  = signal(false);
  error       = signal('');
  gpsError    = signal('');
  isGpsResult = signal(false);

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.loadFavourites();
    this.loadGpsLocation();   // detecta localização automáticamente ao abrir
  }

  loadGpsLocation(): void {
    this.gpsError.set('');
    if (!navigator.geolocation) {
      this.gpsError.set(this.i18n.t('dashboard.gpsNotSupported'));
      return;
    }
    this.gpsLoading.set(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat  = pos.coords.latitude;
        const lon  = pos.coords.longitude;
        const lang = this.i18n.lang();

        this.weatherService.searchByCoords(lat, lon, lang)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (res) => {
              this.weather.set(res.data);
              this.isGpsResult.set(true);
              this.gpsLoading.set(false);
              // Usa coordenadas directamente para a previsão — evita geocodificar "Localização actual"
              this.loadForecastByCoords(lat, lon, res.data.city, lang);
              this.loadFavourites();
            },
            error: () => {
              this.gpsLoading.set(false);
              this.gpsError.set(this.i18n.t('dashboard.gpsApiError'));
            }
          });
      },
      (err) => {
        this.gpsLoading.set(false);
        this.gpsError.set(
          err.code === err.PERMISSION_DENIED
            ? this.i18n.t('dashboard.gpsPermissionDenied')
            : this.i18n.t('dashboard.gpsError')
        );
      },
      { timeout: 10000, maximumAge: 300000 }
    );
  }

  search(): void {
    if (!this.cityInput.trim()) return;
    this.loading.set(true);
    this.error.set('');
    this.gpsError.set('');
    const lang = this.i18n.lang();

    this.weatherService.searchByCity(this.cityInput, lang)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.weather.set(res.data);
          this.isGpsResult.set(false);
          this.loading.set(false);
          // Pesquisa manual — usa nome da cidade para a previsão normalmente
          this.loadForecastByCity(this.cityInput, lang);
          this.loadFavourites();
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set(err.error?.message ?? this.i18n.t('dashboard.searchError'));
        }
      });
  }

  toggleFavourite(w: WeatherData): void {
    const existing = this.favourites().find(
      f => f.city_name === w.city && f.country_code === w.country_code
    );
    if (existing) {
      this.weatherService.removeFavourite(existing.id).subscribe(() => this.loadFavourites());
    } else {
      this.weatherService.addFavourite(w).subscribe(() => this.loadFavourites());
    }
  }

  isFavourite(): boolean {
    const w = this.weather();
    if (!w) return false;
    return this.favourites().some(
      f => f.city_name === w.city && f.country_code === w.country_code
    );
  }

  // Previsão por coordenadas — para resultados GPS onde o nome pode ser genérico
  private loadForecastByCoords(lat: number, lon: number, city: string, lang: string): void {
    this.weatherService.getForecastByCoords(lat, lon, city, lang)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next:  (res) => this.forecast.set(res.data.forecast),
        error: () => {}
      });
  }

  // Previsão por nome de cidade — para pesquisas manuais
  private loadForecastByCity(city: string, lang: string): void {
    this.weatherService.getForecast(city, lang)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next:  (res) => this.forecast.set(res.data.forecast),
        error: () => {}
      });
  }

  private loadFavourites(): void {
    this.weatherService.getFavourites()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next:  (res) => this.favourites.set(res.data),
        error: () => {}
      });
  }

  getIcon(code: number): string {
    if (code === 0)                return '☀️';
    if ([1, 2].includes(code))     return '⛅';
    if (code === 3)                return '☁️';
    if ([45, 48].includes(code))   return '🌫️';
    if (code >= 51 && code <= 67)  return '🌧';
    if (code >= 71 && code <= 77)  return '❄️';
    if (code >= 80 && code <= 82)  return '🌧';
    if (code >= 95)                return '⛈';
    return '🌡';
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}
