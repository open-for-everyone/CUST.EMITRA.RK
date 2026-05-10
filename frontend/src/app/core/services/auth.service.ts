import { Injectable, signal } from '@angular/core';
import { catchError, map, Observable, of, tap, throwError } from 'rxjs';
import { ApiService } from './api.service';
import { AuthResponse, SocialProvider, UserProfile } from '../models/api.models';

const STORAGE_KEY = 'emitra.auth.token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly user = signal<UserProfile | null>(null);
  readonly authLoading = signal(false);

  constructor(private readonly api: ApiService) {}

  initialize(): Observable<UserProfile | null> {
    const token = this.getToken();
    if (!token) {
      this.user.set(null);
      return of(null);
    }

    return this.api.get<UserProfile>('/api/auth/me', token).pipe(
      tap((profile) => this.user.set(profile)),
      catchError(() => {
        this.logout();
        return of(null);
      })
    );
  }

  login(email: string, password: string): Observable<UserProfile> {
    this.authLoading.set(true);
    return this.api.post<AuthResponse>('/api/auth/login', { email, password }).pipe(
      tap((response) => this.setToken(response.token)),
      map(() => ({ name: '', email: '', createdAtUtc: '' } as UserProfile)),
      tap(() => this.authLoading.set(false)),
      catchError((error) => {
        this.authLoading.set(false);
        return throwError(() => error);
      }),
      tap(() => {
        this.initialize().subscribe();
      }),
      map(() => this.user() as UserProfile)
    );
  }

  signup(name: string, email: string, password: string): Observable<UserProfile> {
    this.authLoading.set(true);
    return this.api.post<AuthResponse>('/api/auth/signup', { name, email, password }).pipe(
      tap((response) => this.setToken(response.token)),
      map(() => ({ name: '', email: '', createdAtUtc: '' } as UserProfile)),
      tap(() => this.authLoading.set(false)),
      catchError((error) => {
        this.authLoading.set(false);
        return throwError(() => error);
      }),
      tap(() => {
        this.initialize().subscribe();
      }),
      map(() => this.user() as UserProfile)
    );
  }

  logout(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.user.set(null);
  }

  getToken(): string {
    return localStorage.getItem(STORAGE_KEY) ?? '';
  }

  completeSocialLogin(token: string): void {
    if (!token) {
      return;
    }

    this.setToken(token);
  }

  getSocialProviders(): Observable<SocialProvider[]> {
    return this.api.get<SocialProvider[]>('/api/auth/social/providers').pipe(
      catchError(() => of([]))
    );
  }

  startSocialLogin(provider: string): void {
    const callbackUrl = `${window.location.origin}/auth/callback`;
    const url = `${this.api.getApiBaseUrl()}/api/auth/social/${provider}/start?returnUrl=${encodeURIComponent(callbackUrl)}`;
    window.location.href = url;
  }

  private setToken(token: string): void {
    localStorage.setItem(STORAGE_KEY, token);
  }
}
