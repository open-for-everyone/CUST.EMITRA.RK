import { InjectionToken } from '@angular/core';

declare global {
  interface Window {
    EMITRA_API_BASE_URL?: string;
  }
}

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  factory: () => (window.EMITRA_API_BASE_URL ?? '').trim().replace(/\/$/, '')
});
