import { Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';
import { ApiService } from './api.service';

const FALLBACK_UPDATES = [
  'AEPS cash withdrawal window extended to 8:00 PM.',
  'Aadhaar demographic correction requests now available daily.',
  'New POP pension enrollment guidance desk active this week.',
  'Digital receipt download enabled for all utility transactions.',
  'Secure login and AI chatbot support are now available.'
];

@Injectable({ providedIn: 'root' })
export class UpdatesService {
  constructor(private readonly api: ApiService) {}

  getUpdates(): Observable<string[]> {
    return this.api.get<string[]>('/api/updates').pipe(
      map((updates) => (updates?.length ? updates : FALLBACK_UPDATES)),
      catchError(() => of(FALLBACK_UPDATES))
    );
  }
}
