import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const expectedRoles = route.data?.['roles'] as string[] | undefined;

  return auth.loadCurrentUser().pipe(
    map(user => {
      if (!user) {
        return router.createUrlTree(['/login'], {
          queryParams: { returnUrl: state.url }
        });
      }

      if (!auth.hasAllowedRole(expectedRoles)) {
        return router.createUrlTree(['/user']);
      }

      return true;
    })
  );
};

export const publicOnlyGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.loadCurrentUser().pipe(
    map(user => user && user.status === 'active' ? router.createUrlTree([user.role === 'admin' ? '/admin' : '/user']) : true)
  );
};
