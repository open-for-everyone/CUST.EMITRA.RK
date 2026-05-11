export interface AuthResponse {
  token?: string | null;
  name?: string | null;
  email?: string | null;
  mfaRequired?: boolean;
  mfaChallengeToken?: string | null;
  availableMfaMethods?: string[] | null;
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

export interface PublicContact {
  language: string;
  phone: string;
  whatsapp: string;
  email: string;
  supportNotice: string;
}

export interface SecurityAlertResponse {
  message: string;
}

export interface PasswordResetResponse {
  message: string;
  resetUrl?: string;
}

export interface PagedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}
