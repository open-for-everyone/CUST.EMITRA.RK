import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ActivityItem } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class ActivityService {
  constructor(private readonly api: ApiService) {}

  getActivity(token: string): Observable<ActivityItem[]> {
    return this.api.get<ActivityItem[]>('/api/activity', token);
  }
}
