import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ActivityItem, PagedResponse } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class ActivityService {
  constructor(private readonly api: ApiService) {}

  getActivity(token: string): Observable<ActivityItem[]> {
    return this.api.get<PagedResponse<ActivityItem> | ActivityItem[]>('/api/activity?page=1&pageSize=30', token).pipe(
      map((payload) => Array.isArray(payload) ? payload : payload.items)
    );
  }
}
