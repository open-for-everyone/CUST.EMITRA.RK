import { Injectable } from '@angular/core';
import { Observable, catchError, of } from 'rxjs';
import { ApiService } from './api.service';
import { PublicContact } from '../models/api.models';
import { DEFAULT_PUBLIC_CONTACT } from '../constants/public-contact.defaults';

@Injectable({ providedIn: 'root' })
export class PublicSettingsService {
  constructor(private readonly api: ApiService) {}

  getPublicContact(language: string): Observable<PublicContact> {
    const normalized = language === 'hi' ? 'hi' : 'en';
    return this.api.get<PublicContact>(`/api/settings/public-contact?language=${normalized}`).pipe(
      catchError(() => of({ ...DEFAULT_PUBLIC_CONTACT, language: normalized }))
    );
  }
}
