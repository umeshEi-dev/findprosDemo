import { Routes } from '@angular/router';
import { CategoryListComponent } from './features/categories/category-list/category-list';

export const routes: Routes = [
  {
    path: '',
    component: CategoryListComponent
  },
  {
    path: '**',
    redirectTo: ''
  }
];
