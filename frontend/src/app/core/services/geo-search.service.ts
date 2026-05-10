import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface GeoResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

@Injectable({ providedIn: 'root' })
export class GeoSearchService {
  private readonly http = inject(HttpClient);

  search(query: string): Observable<GeoResult[]> {
    if (!query.trim()) return of([]);
    const params = {
      format: 'json',
      q: query.trim(),
      limit: '5',
      addressdetails: '0'
    };
    const headers = { 'User-Agent': 'RKOnlineCentre/1.0 (https://keshavsingh.in)' };
    return this.http
      .get<GeoResult[]>('https://nominatim.openstreetmap.org/search', { params, headers })
      .pipe(catchError(() => of([])));
  }
}
