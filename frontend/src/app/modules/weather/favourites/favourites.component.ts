// Decisão técnica: favoritos são carregados sob demanda e removidos de forma optimista apenas após sucesso da API.

import { Component, DestroyRef, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule, Trash2 } from 'lucide-angular';
import { WeatherService } from '../../../core/services/weather.service';
import { I18nService } from '../../../core/services/i18n.service';
import { FavouriteCity } from '../../../core/services/api.types';
import { DateFormatPipe } from '../../../shared/pipes/date-format.pipe';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-favourites',
  standalone: true,
  imports: [RouterLink, DateFormatPipe, LoadingSpinnerComponent, LucideAngularModule.pick({ Trash2 })],
  template: `
    <section class="page">
      <div class="page-header">
        <h1 class="page-title">{{ t('nav.favourites') }}</h1>
      </div>

      @if (loading()) {
        <app-loading-spinner />
      }

      <div class="list">
        @for (city of favourites(); track city.id) {
          <div class="list-item">
            <a [routerLink]="['/city', city.city_name]">
              <strong>{{ city.city_name }}, {{ city.country_code }}</strong>
              <span class="muted">{{ city.added_at | dateFormat }}</span>
            </a>
            <button class="btn icon-btn danger" type="button" [title]="t('common.remove')" (click)="remove(city.id)">
              <lucide-icon name="trash-2" size="18" />
            </button>
          </div>
        } @empty {
          <p class="panel muted">{{ t('favourites.empty') }}</p>
        }
      </div>
    </section>
  `
})
export class FavouritesComponent {
  private readonly weatherService = inject(WeatherService);
  private readonly i18n = inject(I18nService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly favourites = signal<FavouriteCity[]>([]);

  constructor() {
    this.load();
  }

  t(key: string): string {
    return this.i18n.t(key);
  }

  remove(id: number): void {
    this.weatherService.removeFavourite(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.favourites.update((items) => items.filter((item) => item.id !== id))
      });
  }

  private load(): void {
    this.weatherService.favourites()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.favourites.set(response.data);
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
  }
}
