import { Injectable, signal } from '@angular/core';
import { catchError, map, Observable, of, switchMap, tap, throwError } from 'rxjs';
import { ApiService } from './api.service';
import { AuthResponse, SecurityAlertResponse, SocialProvider, UserProfile } from '../models/api.models';

const STORAGE_KEY = 'emitra.auth.token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly user = signal<UserProfile | null>(null);
  readonly authLoading = signal(false);
  readonly mfaRequired = signal(false);
  readonly mfaChallengeToken = signal('');
  readonly availableMfaMethods = signal<string[]>([]);

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

  login(email: string, password: string, mfaCode = ''): Observable<UserProfile | null> {
    this.authLoading.set(true);
    return this.api.post<AuthResponse>('/api/auth/login', {
      email,
      password,
      mfaCode: mfaCode || null,
      mfaChallengeToken: this.mfaChallengeToken() || null
    }).pipe(
      tap((response) => {
        if (response.mfaRequired) {
          this.mfaRequired.set(true);
          this.mfaChallengeToken.set(response.mfaChallengeToken ?? '');
          this.availableMfaMethods.set(response.availableMfaMethods ?? []);
          return;
        }

        this.mfaRequired.set(false);
        this.mfaChallengeToken.set('');
        this.availableMfaMethods.set([]);
        if (response.token) {
          this.setToken(response.token);
        }
      }),
      switchMap(() => this.initialize()),
      tap(() => this.authLoading.set(false)),
      catchError((error) => {
        this.authLoading.set(false);
        return throwError(() => error);
      }),
      map((user) => user)
    );
  }

  signup(name: string, email: string, password: string): Observable<UserProfile> {
    this.authLoading.set(true);
    return this.api.post<AuthResponse>('/api/auth/signup', { name, email, password }).pipe(
      tap((response) => {
        if (response.token) {
          this.setToken(response.token);
        }
      }),
      switchMap(() => this.initialize()),
      tap(() => this.authLoading.set(false)),
      catchError((error) => {
        this.authLoading.set(false);
        return throwError(() => error);
      }),
      map((user) => user as UserProfile)
    );
  }

  logout(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.user.set(null);
    this.mfaRequired.set(false);
    this.mfaChallengeToken.set('');
    this.availableMfaMethods.set([]);
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

  getSecurityAlert(language: string): Observable<SecurityAlertResponse> {
    const token = this.getToken();
    if (!token) {
      return of({ message: '' });
    }

    return this.api.get<SecurityAlertResponse>(`/api/auth/security-alert?language=${encodeURIComponent(language)}`, token).pipe(
      catchError(() => of({ message: '' }))
    );
  }

  private setToken(token: string): void {
    localStorage.setItem(STORAGE_KEY, token);
  }
}
