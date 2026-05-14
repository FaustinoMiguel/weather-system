// Decisão técnica: guarda funcional usa estado local do AuthService e redirecciona antes de carregar páginas privadas.

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.isAuthenticated ? true : router.createUrlTree(['/login']);
};
