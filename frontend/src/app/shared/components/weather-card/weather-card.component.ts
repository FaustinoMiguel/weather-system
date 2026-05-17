import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { WeatherData } from '../../../core/services/api.types';
import { TemperaturePipe } from '../../pipes/temperature.pipe';
import { I18nService } from '../../../core/services/i18n.service';

@Component({
  selector: 'app-weather-card',
  standalone: true,
  imports: [TemperaturePipe],
  template: `
    @if (weather) {
      <div class="wcard" [class.extreme]="weather.is_extreme" [class.night]="!weather.is_day">

        <!-- Alerta extremo -->
        @if (weather.is_extreme) {
          <div class="extreme-banner">
            <span class="extreme-icon">⚠️</span>
            <span>{{ i18n.t('weather.extremeAlert') }}</span>
          </div>
        }

        <!-- Header com gradiente atmosférico -->
        <div class="wcard-header" [style]="getHeaderStyle()">
          <div class="header-content">
            <div class="location">
              <h2 class="city">{{ weather.city }}</h2>
              <p class="country">{{ weather.country }}</p>
            </div>
            <div class="condition-visual">
              <span class="weather-emoji">{{ getIcon(weather.icon, weather.is_day, weather.temperature, weather.precipitation) }}</span>
              <p class="condition-label">{{ weather.condition }}</p>
            </div>
          </div>

          <!-- Temperatura principal -->
          <div class="temp-display">
            <span class="temp-value">{{ weather.temperature | temperature }}</span>
            <span class="temp-feels">{{ i18n.t('weather.feelsLike') }} {{ weather.feels_like | temperature }}</span>
          </div>
        </div>

        <!-- Métricas -->
        <div class="metrics">
          <div class="metric-item">
            <span class="metric-icon">💧</span>
            <span class="metric-val">{{ weather.humidity }}%</span>
            <span class="metric-lbl">{{ i18n.t('weather.humidity') }}</span>
          </div>
          <div class="metric-item">
            <span class="metric-icon">💨</span>
            <span class="metric-val">{{ weather.wind_speed }}<small>km/h</small></span>
            <span class="metric-lbl">{{ i18n.t('weather.wind') }}</span>
          </div>
          <div class="metric-item">
            <span class="metric-icon">🌡</span>
            <span class="metric-val">{{ weather.pressure }}<small>hPa</small></span>
            <span class="metric-lbl">{{ i18n.t('weather.pressure') }}</span>
          </div>
          <div class="metric-item">
            <span class="metric-icon">☀️</span>
            <span class="metric-val">{{ weather.uv_index }}</span>
            <span class="metric-lbl">{{ i18n.t('weather.uvIndex') }}</span>
          </div>
          <div class="metric-item">
            <span class="metric-icon">🌧</span>
            <span class="metric-val">{{ weather.precipitation }}<small>mm</small></span>
            <span class="metric-lbl">{{ i18n.t('weather.precipitation') }}</span>
          </div>
          <div class="metric-item">
            <span class="metric-icon">☁️</span>
            <span class="metric-val">{{ weather.cloud_cover }}%</span>
            <span class="metric-lbl">{{ i18n.t('weather.cloudCover') }}</span>
          </div>
        </div>

        <!-- Acções -->
        @if (showActions) {
          <div class="wcard-actions">
            <button class="action-btn fav" [class.is-fav]="isFav" (click)="toggleFav.emit(weather)">
              {{ isFav ? '💛' : '🤍' }}
              <span>{{ isFav ? i18n.t('weather.removeFromFav') : i18n.t('weather.addToFav') }}</span>
            </button>
            <button class="action-btn pdf" (click)="exportPdf.emit(weather.city)">
              📄 <span>{{ i18n.t('weather.exportPdf') }}</span>
            </button>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .wcard {
      border-radius: var(--radius-xl);
      overflow: hidden;
      box-shadow: var(--shadow-lg);
      border: 1px solid var(--color-border-light);
      margin-bottom: 1.5rem;
      animation: fadeUp .4s var(--transition-normal) both;
      transition: transform var(--transition-normal), box-shadow var(--transition-normal);
    }
    .wcard:hover { transform: translateY(-2px); box-shadow: 0 20px 60px rgba(15,45,107,.18); }
    .wcard.extreme { border-color: #f59e0b; }

    /* Alerta */
    .extreme-banner {
      display: flex; align-items: center; gap: .6rem;
      padding: .6rem 1.25rem; font-size: .85rem; font-weight: 600;
      background: linear-gradient(135deg, #fef3c7, #fde68a);
      color: #92400e; border-bottom: 1px solid #fcd34d;
    }
    [data-theme="dark"] .extreme-banner { background: linear-gradient(135deg, #451a03, #78350f); color: #fcd34d; border-color: #92400e; }

    /* Header atmosférico */
    .wcard-header {
      padding: 1.75rem 1.5rem 1.5rem;
      position: relative; overflow: hidden;
    }
    .wcard-header::after {
      content: ''; position: absolute;
      inset: 0; background: rgba(0,0,0,.08);
      pointer-events: none;
    }
    .header-content {
      display: flex; justify-content: space-between;
      align-items: flex-start; margin-bottom: 1.25rem;
      position: relative; z-index: 1;
    }
    .city {
      font-family: var(--font-display); font-size: 1.75rem;
      font-weight: 800; color: #fff; letter-spacing: -.04em; margin: 0;
      text-shadow: 0 2px 12px rgba(0,0,0,.2);
    }
    .country { color: rgba(255,255,255,.8); font-size: .875rem; margin: .2rem 0 0; }
    .condition-visual { text-align: center; }
    .weather-emoji { font-size: 3.5rem; display: block; filter: drop-shadow(0 4px 8px rgba(0,0,0,.2)); }
    .condition-label { color: rgba(255,255,255,.9); font-size: .8rem; font-weight: 500; margin: .25rem 0 0; }

    .temp-display {
      position: relative; z-index: 1;
      display: flex; align-items: baseline; gap: 1rem;
    }
    .temp-value {
      font-family: var(--font-display); font-size: 4rem;
      font-weight: 800; color: #fff; line-height: 1;
      text-shadow: 0 4px 20px rgba(0,0,0,.2);
      letter-spacing: -.05em;
    }
    .temp-feels { color: rgba(255,255,255,.75); font-size: .875rem; }

    /* Métricas */
    .metrics {
      display: grid; grid-template-columns: repeat(3, 1fr);
      gap: 1px; background: var(--color-border-light);
    }
    .metric-item {
      background: var(--color-card);
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: .2rem;
      padding: 1.1rem .75rem; text-align: center;
      transition: background var(--transition-fast);
    }
    .metric-item:hover { background: var(--color-overlay); }
    .metric-icon { font-size: 1.3rem; }
    .metric-val {
      font-family: var(--font-display); font-size: 1.1rem;
      font-weight: 700; color: var(--color-text-primary); letter-spacing: -.02em;
    }
    .metric-val small { font-size: .65rem; font-weight: 400; margin-left: .1rem; color: var(--color-text-muted); }
    .metric-lbl { font-size: .72rem; color: var(--color-text-muted); font-weight: 500; }

    /* Acções */
    .wcard-actions {
      display: flex; gap: .75rem; padding: 1rem 1.25rem;
      background: var(--color-card); border-top: 1px solid var(--color-border-light);
    }
    .action-btn {
      flex: 1; display: flex; align-items: center; justify-content: center; gap: .45rem;
      padding: .6rem 1rem; border: none; border-radius: var(--radius-md);
      font-size: .85rem; font-weight: 600; cursor: pointer;
      transition: all var(--transition-fast);
    }
    .action-btn.fav { background: var(--color-bg-secondary); color: var(--color-text-secondary); border: 1px solid var(--color-border); }
    .action-btn.fav:hover, .action-btn.fav.is-fav { background: #fef3c7; color: #92400e; border-color: #fde68a; }
    .action-btn.pdf { background: rgba(59,130,246,.1); color: var(--color-primary); border: 1px solid rgba(59,130,246,.2); }
    .action-btn.pdf:hover { background: var(--color-primary); color: #fff; box-shadow: 0 2px 12px rgba(59,130,246,.4); }
    [data-theme="dark"] .action-btn.fav.is-fav { background: #451a03; color: #fcd34d; border-color: #92400e; }

    @media (max-width: 480px) {
      .metrics { grid-template-columns: repeat(2, 1fr); }
      .temp-value { font-size: 3rem; }
    }
  `]
})
export class WeatherCardComponent {
  @Input() weather!: WeatherData;
  @Input() isFav     = false;
  @Input() showActions = true;
  @Output() toggleFav = new EventEmitter<WeatherData>();
  @Output() exportPdf = new EventEmitter<string>();

  i18n = inject(I18nService);

  getHeaderStyle(): string {
    const gradients: Record<string, string> = {
      'clear':         'linear-gradient(135deg, #f97316 0%, #f59e0b 50%, #fbbf24 100%)',
      'mainly-clear':  'linear-gradient(135deg, #3b82f6 0%, #60a5fa 50%, #93c5fd 100%)',
      'partly-cloudy': 'linear-gradient(135deg, #64748b 0%, #94a3b8 50%, #60a5fa 100%)',
      'cloudy':        'linear-gradient(135deg, #475569 0%, #64748b 50%, #94a3b8 100%)',
      'fog':           'linear-gradient(135deg, #6b7280 0%, #9ca3af 50%, #d1d5db 100%)',
      'drizzle':       'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 50%, #7dd3fc 100%)',
      'rain':          'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 50%, #60a5fa 100%)',
      'heavy-rain':    'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 50%, #2563eb 100%)',
      'snow':          'linear-gradient(135deg, #bfdbfe 0%, #dde8f5 50%, #f1f5f9 100%)',
      'heavy-snow':    'linear-gradient(135deg, #93c5fd 0%, #bfdbfe 50%, #e0f2fe 100%)',
      'showers':       'linear-gradient(135deg, #0369a1 0%, #0ea5e9 50%, #38bdf8 100%)',
      'thunderstorm':  'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
    };
    const icon = this.weather.icon ?? 'clear';
    const gradient = gradients[icon] ?? gradients['partly-cloudy'];
    // Versão noturna mais escura
    if (!this.weather.is_day) {
      return `background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1e293b 100%)`;
    }
    return `background: ${gradient}`;
  }

  getIcon(icon: string, isDay: boolean, temp: number = 20, precip: number = 0, precipChance: number = 100): string {
    if (temp >= 40)  return '🔥';
    if (temp <= -15) return '🥶';
    // Três níveis de probabilidade de chuva
    const noRain     = precipChance < 20;                        // < 20 %  → nublado
    const maybeRain  = precipChance < 50 || precip < 1.5;       // 20-50 % → possibilidade
    // precipChance >= 50 && precip >= 1.5                       // > 50 %  → confirmado
    switch (icon) {
      case 'clear':
        if (!isDay) return temp <= 5 ? '🌃' : '🌕';
        if (temp >= 35) return '🌞';
        if (temp >= 25) return '☀️';
        if (temp >= 15) return '🌤️';
        return '🌥️';
      case 'mainly-clear':  return isDay ? (temp >= 22 ? '⛅' : '🌤️') : '🌙';
      case 'partly-cloudy': return isDay ? '⛅' : '☁️';
      case 'cloudy':        return '☁️';
      case 'fog':           return '🌫️';
      case 'drizzle':
        if (noRain)    return isDay ? '⛅' : '☁️';
        if (maybeRain) return isDay ? '🌦️' : '☁️';  // garoa possível
        return isDay ? '🌦' : '🌧';
      case 'rain':
        if (noRain)    return '⛅';
        if (maybeRain) return isDay ? '🌦️' : '☁️';  // possibilidade
        return precip > 15 ? '🌧' : '🌦';
      case 'heavy-rain':    return '🌧';
      case 'showers':
        if (noRain)    return isDay ? '⛅' : '☁️';
        if (maybeRain) return isDay ? '🌦️' : '☁️';
        return isDay ? '🌦' : '🌧';
      case 'snow':          return temp <= -5 ? '🌨️' : '❄️';
      case 'heavy-snow':    return '🌨️';
      case 'thunderstorm':  return '⛈';
      default:
        if (temp >= 28) return isDay ? '☀️' : '🌕';
        if (temp >= 18) return isDay ? '⛅' : '🌙';
        if (temp >= 8)  return '🌥️';
        return '❄️';
    }
  }
}
