import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent],
  template: `
    @if (auth.isLoggedIn()) {
      <div class="app-shell">
        <app-sidebar />
        <main class="main-content">
          <router-outlet />
        </main>
      </div>
    } @else {
      <router-outlet />
    }
  `
})
export class AppComponent {
  auth = inject(AuthService);
}
