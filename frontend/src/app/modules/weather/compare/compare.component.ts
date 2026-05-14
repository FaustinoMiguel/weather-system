// Decisão técnica: comparação usa forkJoin para apresentar duas cidades apenas quando ambas as respostas chegam.

import { Component, DestroyRef, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule, Scale } from 'lucide-angular';
import { WeatherService } from '../../../core/services/weather.service';
import { I18nService } from '../../../core/services/i18n.service';
import { WeatherResponse } from '../../../core/services/api.types';
import { TemperaturePipe } from '../../../shared/pipes/temperature.pipe';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-compare',
  standalone: true,
  imports: [ReactiveFormsModule, TemperaturePipe, LoadingSpinnerComponent, LucideAngularModule.pick({ Scale })],
  template: `
    <section class="page">
      <div class="page-header">
        <h1 class="page-title">{{ t('compare.title') }}</h1>
      </div>

      <form class="panel form-row" [formGroup]="form" (ngSubmit)="compare()">
        <label class="field">
          <span>{{ t('compare.left') }}</span>
          <input type="text" formControlName="left" placeholder="Luanda">
        </label>
        <label class="field">
          <span>{{ t('compare.right') }}</span>
          <input type="text" formControlName="right" placeholder="Lisboa">
        </label>
        <button class="btn primary" type="submit" [disabled]="form.invalid || loading()">
          <lucide-icon name="scale" size="18" />
          {{ t('compare.action') }}
        </button>
      </form>

      @if (loading()) {
        <div class="panel"><app-loading-spinner /></div>
      }
      @if (error()) {
        <p class="error">{{ error() }}</p>
      }

      @if (left(); as leftData) {
        @if (right(); as rightData) {
          <div class="grid two compare-grid">
            <article class="panel compare-card">
              <h2>{{ leftData.current.city }}, {{ leftData.current.country }}</h2>
              <strong>{{ leftData.current.temperature | temperature }}</strong>
              <p>{{ leftData.current.condition }}</p>
              <div class="metric-list">
                <div class="metric"><span>{{ t('weather.humidity') }}</span><strong>{{ leftData.current.humidity }}%</strong></div>
                <div class="metric"><span>{{ t('weather.wind') }}</span><strong>{{ leftData.current.wind_speed }} m/s</strong></div>
                <div class="metric"><span>{{ t('weather.pressure') }}</span><strong>{{ leftData.current.pressure }} hPa</strong></div>
              </div>
            </article>
            <article class="panel compare-card">
              <h2>{{ rightData.current.city }}, {{ rightData.current.country }}</h2>
              <strong>{{ rightData.current.temperature | temperature }}</strong>
              <p>{{ rightData.current.condition }}</p>
              <div class="metric-list">
                <div class="metric"><span>{{ t('weather.humidity') }}</span><strong>{{ rightData.current.humidity }}%</strong></div>
                <div class="metric"><span>{{ t('weather.wind') }}</span><strong>{{ rightData.current.wind_speed }} m/s</strong></div>
                <div class="metric"><span>{{ t('weather.pressure') }}</span><strong>{{ rightData.current.pressure }} hPa</strong></div>
              </div>
            </article>
          </div>
        }
      }
    </section>
  `,
  styles: [`
    .compare-grid {
      margin-top: 18px;
    }

    .compare-card > strong {
      display: block;
      color: var(--primary);
      font-size: 2.4rem;
      margin: 8px 0;
    }
  `]
})
export class CompareComponent {
  private readonly fb = inject(FormBuilder);
  private readonly weatherService = inject(WeatherService);
  private readonly i18n = inject(I18nService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(false);
  readonly error = signal('');
  readonly left = signal<WeatherResponse | null>(null);
  readonly right = signal<WeatherResponse | null>(null);
  readonly form = this.fb.nonNullable.group({
    left: ['', [Validators.required, Validators.minLength(2)]],
    right: ['', [Validators.required, Validators.minLength(2)]]
  });

  t(key: string): string {
    return this.i18n.t(key);
  }

  compare(): void {
    if (this.form.invalid) {
      return;
    }

    this.loading.set(true);
    this.error.set('');
    const value = this.form.getRawValue();
    forkJoin({
      left: this.weatherService.forecast(value.left, this.i18n.language()),
      right: this.weatherService.forecast(value.right, this.i18n.language())
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.left.set(response.left.data);
          this.right.set(response.right.data);
          this.loading.set(false);
        },
        error: () => {
          this.error.set(this.t('compare.error'));
          this.loading.set(false);
        }
      });
  }
}
