import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ChatHistoryItem, ChatResponse, PagedResponse } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class ChatService {
  constructor(private readonly api: ApiService) {}

  getHistory(token: string): Observable<ChatHistoryItem[]> {
    return this.api.get<PagedResponse<ChatHistoryItem> | ChatHistoryItem[]>('/api/chat/history?page=1&pageSize=20', token).pipe(
      map((payload) => Array.isArray(payload) ? payload : payload.items)
    );
  }

  sendMessage(message: string, token: string): Observable<ChatResponse> {
    return this.api.post<ChatResponse>('/api/chat', { message }, token);
  }
}
