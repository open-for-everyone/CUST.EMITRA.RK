import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'emitra.ui.theme';

export type AppTheme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<AppTheme>(this.resolveInitialTheme());

  toggleTheme(): void {
    const next: AppTheme = this.theme() === 'light' ? 'dark' : 'light';
    this.applyTheme(next);
  }

  applyTheme(theme?: AppTheme): void {
    const target = theme ?? this.theme();
    this.theme.set(target);
    localStorage.setItem(STORAGE_KEY, target);
    document.documentElement.setAttribute('data-theme', target);
  }

  private resolveInitialTheme(): AppTheme {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') return stored as AppTheme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
}
