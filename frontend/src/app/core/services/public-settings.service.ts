import { Injectable } from '@angular/core';
import { Observable, catchError, of } from 'rxjs';
import { ApiService } from './api.service';
import { PublicContact } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class PublicSettingsService {
  constructor(private readonly api: ApiService) {}

  getPublicContact(language: string): Observable<PublicContact> {
    const normalized = language === 'hi' ? 'hi' : 'en';
    return this.api.get<PublicContact>(`/api/settings/public-contact?language=${normalized}`).pipe(
      catchError(() => of({
        language: normalized,
        phone: '+91 9982761929',
        whatsapp: '+91 9982761929',
        email: 'support@rkemitra.in',
        supportNotice: 'If this login was not performed by you, please reset your password and contact support immediately.'
      }))
    );
  }
}
