import { Routes } from '@angular/router';
import { authGuard, publicOnlyGuard } from './core/auth/auth.guard';
import { LoginComponent } from './features/auth/login/login';
import { SignupComponent } from './features/auth/signup/signup';
import { CategoryListComponent } from './features/categories/category-list/category-list';
import { AuthRedirectComponent } from './features/shell/auth-redirect/auth-redirect';
import { UserDashboardComponent } from './features/user/user-dashboard/user-dashboard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: AuthRedirectComponent
  },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [publicOnlyGuard]
  },
  {
    path: 'signup',
    component: SignupComponent,
    canActivate: [publicOnlyGuard]
  },
  {
    path: 'admin',
    component: CategoryListComponent,
    canActivate: [authGuard]
  },
  {
    path: 'user',
    component: UserDashboardComponent,
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
