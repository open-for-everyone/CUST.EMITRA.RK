export interface AuthResponse {
  token: string;
  name: string;
  email: string;
}

export interface UserProfile {
  name: string;
  email: string;
  createdAtUtc: string;
}

export interface ChatResponse {
  reply: string;
  createdAtUtc: string;
}

export interface ChatHistoryItem {
  message: string;
  reply: string;
  createdAtUtc: string;
}

export interface ActivityItem {
  action: string;
  metadata?: string;
  createdAtUtc: string;
}

export interface SocialProvider {
  key: string;
  displayName: string;
}


export interface PagedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}
