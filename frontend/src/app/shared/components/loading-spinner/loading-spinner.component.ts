import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  template: `
    @if (visible) {
      <div class="spinner-wrap" [class.inline]="inline">
        <div class="spinner-ring">
          <div></div><div></div><div></div><div></div>
        </div>
        @if (message) { <p class="spinner-msg">{{ message }}</p> }
      </div>
    }
  `,
  styles: [`
    .spinner-wrap {
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      gap: 1rem; padding: 3rem 2rem;
    }
    .spinner-wrap:not(.inline) {
      position: fixed; inset: 0; z-index: 999;
      background: rgba(7,14,26,.6); backdrop-filter: blur(4px);
    }
    .spinner-ring {
      position: relative; width: 44px; height: 44px;
    }
    .spinner-ring div {
      position: absolute; inset: 0;
      border: 3px solid transparent;
      border-top-color: var(--color-primary);
      border-radius: 50%;
      animation: spin .8s cubic-bezier(.68,-.55,.27,1.55) infinite;
    }
    .spinner-ring div:nth-child(2) { inset: 6px; animation-delay: -.15s; border-top-color: var(--color-accent); }
    .spinner-ring div:nth-child(3) { inset: 12px; animation-delay: -.3s; }
    .spinner-ring div:nth-child(4) { inset: 18px; animation-delay: -.45s; border-top-color: var(--color-accent); }
    .spinner-msg { font-size: .85rem; color: var(--color-text-secondary); animation: pulse 1.5s infinite; }
  `]
})
export class LoadingSpinnerComponent {
  @Input() visible = false;
  @Input() inline  = false;
  @Input() message = '';
}
