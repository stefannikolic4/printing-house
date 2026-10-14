import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Sesion } from '../services/sesion';

export const adminGuard: CanActivateFn = () => {
  const sesija = inject(Sesion);
  const ruter = inject(Router);
  if (sesija.jeAdmin()) return true;
  return ruter.createUrlTree(['/admin']);
};
