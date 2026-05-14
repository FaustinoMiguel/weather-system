// Decisão técnica: AppComponent funciona como shell comum; páginas ficam desacopladas no router.

import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent],
  template: `
    <app-navbar />
    <main>
      <router-outlet />
    </main>
    <app-footer />
  `
})
export class AppComponent {
  private readonly theme = inject(ThemeService);

  constructor() {
    this.theme.setTheme(this.theme.theme());
  }
}
