import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { AuthCallbackComponent } from './features/auth-callback/auth-callback.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'auth/callback', component: AuthCallbackComponent },
  { path: '**', redirectTo: '' }
];
