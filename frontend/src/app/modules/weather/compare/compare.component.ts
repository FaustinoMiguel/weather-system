import { Component, inject, signal, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { WeatherService } from '../../../core/services/weather.service';
import { I18nService } from '../../../core/services/i18n.service';
import { WeatherData } from '../../../core/services/api.types';
import { TemperaturePipe } from '../../../shared/pipes/temperature.pipe';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-compare',
  standalone: true,
  imports: [FormsModule, TemperaturePipe, LoadingSpinnerComponent],
  template: `
    <div class="page-container">
      <h2>⚖️ {{ i18n.t('compare.title') }}</h2>

      <form class="compare-form" (ngSubmit)="compare()">
        <input type="text" [(ngModel)]="city1" name="city1" required
               [placeholder]="i18n.t('compare.city1Placeholder')" class="city-input" />
        <span class="vs-badge">VS</span>
        <input type="text" [(ngModel)]="city2" name="city2" required
               [placeholder]="i18n.t('compare.city2Placeholder')" class="city-input" />
        <button type="submit" class="btn-compare" [disabled]="loading()">
          @if (loading()) { ⏳ } @else { {{ i18n.t('compare.compareBtn') }} }
        </button>
      </form>

      @if (error()) { <p class="error-msg">{{ error() }}</p> }

      <app-loading-spinner [visible]="loading()" [inline]="true" />

      @if (result()) {
        <div class="compare-grid">
          @for (w of [result()!.city1, result()!.city2]; track w.city) {
            <div class="compare-card" [class.extreme]="w.is_extreme">
              <h3>{{ w.city }}, {{ w.country }}</h3>
              @if (w.is_extreme) { <span class="alert-badge">⚠️ {{ i18n.t('weather.extreme') }}</span> }
              <div class="big-temp">{{ w.temperature | temperature }}</div>
              <p class="condition">{{ w.condition }}</p>
              <div class="metrics">
                <div class="metric-row"><span>💧 {{ i18n.t('weather.humidity') }}</span><strong>{{ w.humidity }}%</strong></div>
                <div class="metric-row"><span>💨 {{ i18n.t('weather.wind') }}</span><strong>{{ w.wind_speed }} km/h</strong></div>
                <div class="metric-row"><span>🌡 {{ i18n.t('weather.pressure') }}</span><strong>{{ w.pressure }} hPa</strong></div>
                <div class="metric-row"><span>☀️ {{ i18n.t('weather.uvIndex') }}</span><strong>{{ w.uv_index }}</strong></div>
                <div class="metric-row"><span>🌧 {{ i18n.t('weather.precipitation') }}</span><strong>{{ w.precipitation }} mm</strong></div>
              </div>
            </div>
          }
        </div>

        <!-- Diferenças -->
        <div class="diff-section">
          <h4>{{ i18n.t('compare.differences') }}</h4>
          <p>{{ i18n.t('compare.tempDiff') }}: <strong>{{ tempDiff() }}°C</strong></p>
          <p>{{ i18n.t('compare.humidityDiff') }}: <strong>{{ humidityDiff() }}%</strong></p>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-container { max-width: 900px; margin: 0 auto; padding: 1.5rem 1rem; }
    h2 { font-size: 1.3rem; font-weight: 600; margin-bottom: 1.25rem; }
    .compare-form { display: flex; align-items: center; gap: .75rem; flex-wrap: wrap; margin-bottom: 1.5rem; }
    .city-input { flex: 1; min-width: 160px; padding: .65rem 1rem; border: 1.5px solid var(--color-border);
                  border-radius: 10px; font-size: .95rem; background: var(--color-card);
                  color: var(--color-text-primary); }
    .vs-badge { font-weight: 700; font-size: 1rem; color: var(--color-text-secondary); }
    .btn-compare { background: var(--color-primary); color: #fff; border: none; border-radius: 10px;
                   padding: .65rem 1.3rem; cursor: pointer; font-size: .95rem; }
    .btn-compare:disabled { opacity: .6; }
    .error-msg { color: #dc2626; font-size: .9rem; }
    .compare-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem; }
    .compare-card { background: var(--color-card); border-radius: 14px; padding: 1.25rem;
                    box-shadow: 0 2px 8px rgba(0,0,0,.07); }
    .compare-card.extreme { border: 2px solid #f59e0b; }
    .compare-card h3 { margin: 0 0 .5rem; font-size: 1.05rem; }
    .alert-badge { background: #fef3c7; color: #92400e; border-radius: 6px; padding: .2rem .6rem;
                   font-size: .78rem; display: inline-block; margin-bottom: .5rem; }
    .big-temp { font-size: 2.5rem; font-weight: 700; color: var(--color-primary); margin: .3rem 0; }
    .condition { color: var(--color-text-secondary); font-size: .9rem; margin-bottom: .75rem; }
    .metrics { display: flex; flex-direction: column; gap: .4rem; }
    .metric-row { display: flex; justify-content: space-between; font-size: .88rem; }
    .diff-section { background: var(--color-card); border-radius: 12px; padding: 1rem 1.25rem;
                    box-shadow: 0 2px 8px rgba(0,0,0,.06); }
    .diff-section h4 { margin: 0 0 .75rem; font-size: 1rem; }
    .diff-section p { margin: .3rem 0; font-size: .9rem; color: var(--color-text-secondary); }
    @media (max-width: 600px) { .compare-grid { grid-template-columns: 1fr; } }
  `]
})
export class CompareComponent implements OnDestroy {
  weatherService = inject(WeatherService);
  i18n           = inject(I18nService);

  city1   = '';
  city2   = '';
  loading = signal(false);
  error   = signal('');
  result  = signal<{ city1: WeatherData; city2: WeatherData } | null>(null);
  private destroy$ = new Subject<void>();

  compare(): void {
    if (!this.city1.trim() || !this.city2.trim()) return;
    this.loading.set(true);
    this.error.set('');
    this.weatherService.compareCities(this.city1, this.city2, this.i18n.lang())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next:  (res) => { this.result.set(res.data); this.loading.set(false); },
        error: (err) => {
          this.loading.set(false);
          this.error.set(err.error?.message ?? this.i18n.t('compare.error'));
        }
      });
  }

  tempDiff(): string {
    const r = this.result();
    if (!r) return '--';
    return Math.abs(r.city1.temperature - r.city2.temperature).toFixed(1);
  }

  humidityDiff(): number {
    const r = this.result();
    if (!r) return 0;
    return Math.abs(r.city1.humidity - r.city2.humidity);
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}
