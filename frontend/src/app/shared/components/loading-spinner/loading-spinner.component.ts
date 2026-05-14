// Decisão técnica: spinner reutilizável mantém feedback visual consistente durante pedidos HTTP.

import { Component } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  template: `<span class="spinner" aria-live="polite"></span>`,
  styles: [`
    .spinner {
      width: 22px;
      height: 22px;
      display: inline-block;
      border: 3px solid var(--border);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 800ms linear infinite;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
  `]
})
export class LoadingSpinnerComponent {}
