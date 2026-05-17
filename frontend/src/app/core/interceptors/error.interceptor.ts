import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { catchError, throwError } from 'rxjs';

// Interceptor global de erros HTTP.
// - 401 (não autorizado): limpa sessão e redireciona para login
// - Outros erros: propaga normalmente para os componentes tratarem
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const auth   = inject(AuthService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) {
        // Token expirado ou inválido — forçar logout
        localStorage.removeItem('weather_token');
        localStorage.removeItem('weather_user');
        router.navigate(['/login']);
      }
      return throwError(() => err);
    })
  );
};
