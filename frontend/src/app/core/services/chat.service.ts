import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ChatHistoryItem, ChatResponse } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class ChatService {
  constructor(private readonly api: ApiService) {}

  getHistory(token: string): Observable<ChatHistoryItem[]> {
    return this.api.get<ChatHistoryItem[]>('/api/chat/history', token);
  }

  sendMessage(message: string, token: string): Observable<ChatResponse> {
    return this.api.post<ChatResponse>('/api/chat', { message }, token);
  }
}
