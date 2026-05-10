import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api-base-url.token';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(
    private readonly http: HttpClient,
    @Inject(API_BASE_URL) private readonly baseUrl: string
  ) {}

  get<T>(path: string, token?: string): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}${path}`, { headers: this.headers(token) });
  }

  post<T>(path: string, body: unknown, token?: string): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${path}`, body, { headers: this.headers(token) });
  }

  getApiBaseUrl(): string {
    return this.baseUrl;
  }

  private headers(token?: string): HttpHeaders {
    let headers = new HttpHeaders({ Accept: 'application/json' });
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }
}
