import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
  template: `
    @if (auth.isLoggedIn()) {
      <app-navbar />
    }
    <main class="main-content">
      <router-outlet />
    </main>
  `,
  styles: [`
    :host { display: block; min-height: 100vh; background: var(--color-bg); }
    .main-content { min-height: calc(100vh - 56px); }
  `]
})
export class AppComponent {
  auth = inject(AuthService);
}
