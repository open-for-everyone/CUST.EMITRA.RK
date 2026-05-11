import { Injectable } from '@angular/core';
import { Observable, shareReplay, catchError, of } from 'rxjs';
import { ApiService } from './api.service';
import { PublicContact } from '../models/api.models';
import { DEFAULT_PUBLIC_CONTACT } from '../constants/public-contact.defaults';

@Injectable({ providedIn: 'root' })
export class PublicSettingsService {
  private readonly cache = new Map<string, Observable<PublicContact>>();

  constructor(private readonly api: ApiService) {}

  getPublicContact(language: string): Observable<PublicContact> {
    const normalized = language === 'hi' ? 'hi' : 'en';
    if (!this.cache.has(normalized)) {
      const request$ = this.api.get<PublicContact>(`/api/settings/public-contact?language=${normalized}`).pipe(
        catchError(() => of({ ...DEFAULT_PUBLIC_CONTACT, language: normalized })),
        shareReplay(1)
      );
      this.cache.set(normalized, request$);
    }

    return this.cache.get(normalized)!;
  }

  /** Call when language settings may have changed (e.g., after admin update). */
  invalidateCache(): void {
    this.cache.clear();
  }
}
