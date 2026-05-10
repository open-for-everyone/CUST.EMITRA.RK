import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { ServicesComponent } from '../services/services.component';
import { UpdatesComponent } from '../updates/updates.component';
import { ChatComponent, ChatMessageVm } from '../chat/chat.component';
import { ActivityComponent } from '../activity/activity.component';
import { AuthService } from '../../core/services/auth.service';
import { UpdatesService } from '../../core/services/updates.service';
import { ChatService } from '../../core/services/chat.service';
import { ActivityService } from '../../core/services/activity.service';
import { ActivityItem, ChatHistoryItem, SocialProvider } from '../../core/models/api.models';
import { LanguageService } from '../../core/services/language.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, NavbarComponent, ServicesComponent, UpdatesComponent, ChatComponent, ActivityComponent],
  templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly updatesService = inject(UpdatesService);
  private readonly chatService = inject(ChatService);
  private readonly activityService = inject(ActivityService);

  readonly updates = signal<string[]>([]);
  readonly updatesLoading = signal(false);
  readonly providers = signal<SocialProvider[]>([]);
  readonly providersLoading = signal(false);
  readonly chatMessages = signal<ChatMessageVm[]>([]);
  readonly chatLoading = signal(false);
  readonly chatHistoryLoading = signal(false);
  readonly activity = signal<ActivityItem[]>([]);
  readonly activityLoading = signal(false);
  readonly chatOpen = signal(false);
  readonly authError = signal('');
  readonly language = inject(LanguageService);

  readonly isBusy = computed(
    () =>
      this.auth.authLoading() ||
      this.updatesLoading() ||
      this.providersLoading() ||
      this.chatLoading() ||
      this.chatHistoryLoading() ||
      this.activityLoading()
  );

  ngOnInit(): void {
    this.loadUpdates();
    this.loadProviders();

    this.auth.initialize().subscribe(() => {
      this.loadAuthorizedData();
    });
  }

  onLogin(email: string, password: string): void {
    this.authError.set('');
    this.auth.login(email, password).subscribe({
      next: () => this.loadAuthorizedData(),
      error: () => this.authError.set(this.language.t('authLoginFailed'))
    });
  }

  onSignup(name: string, email: string, password: string): void {
    this.authError.set('');
    this.auth.signup(name, email, password).subscribe({
      next: () => this.loadAuthorizedData(),
      error: () => this.authError.set(this.language.t('authSignupFailed'))
    });
  }

  onLogout(): void {
    this.auth.logout();
    this.authError.set('');
    this.chatMessages.set([]);
    this.activity.set([]);
    this.chatOpen.set(false);
  }

  onSocialLogin(provider: string): void {
    this.auth.startSocialLogin(provider);
  }

  onSendChat(message: string): void {
    const token = this.auth.getToken();
    if (!token) {
      return;
    }

    this.chatMessages.update((items) => [...items, { role: 'user', text: message, time: new Date() }]);
    this.chatLoading.set(true);

    this.chatService
      .sendMessage(message, token)
      .pipe(finalize(() => this.chatLoading.set(false)))
      .subscribe({
        next: (response) => {
          this.chatMessages.update((items) => [...items, { role: 'bot', text: response.reply, time: new Date() }]);
          this.loadActivity();
        },
        error: () => {
          this.chatMessages.update((items) => [
            ...items,
            { role: 'bot', text: 'Chat failed. Please try again.', time: new Date() }
          ]);
        }
      });
  }

  toggleChat(): void {
    this.chatOpen.update((open) => !open);
  }

  private loadUpdates(): void {
    this.updatesLoading.set(true);
    this.updatesService
      .getUpdates()
      .pipe(finalize(() => this.updatesLoading.set(false)))
      .subscribe((data) => this.updates.set(data));
  }

  private loadProviders(): void {
    this.providersLoading.set(true);
    this.auth
      .getSocialProviders()
      .pipe(finalize(() => this.providersLoading.set(false)))
      .subscribe((providers) => this.providers.set(providers));
  }

  private loadAuthorizedData(): void {
    this.loadChatHistory();
    this.loadActivity();
  }

  private loadChatHistory(): void {
    const token = this.auth.getToken();
    if (!token) {
      this.chatMessages.set([]);
      return;
    }

    this.chatHistoryLoading.set(true);
    this.chatService
      .getHistory(token)
      .pipe(finalize(() => this.chatHistoryLoading.set(false)))
      .subscribe({
        next: (items) => this.chatMessages.set(this.mapHistory(items)),
        error: () => this.chatMessages.set([])
      });
  }

  private loadActivity(): void {
    const token = this.auth.getToken();
    if (!token) {
      this.activity.set([]);
      return;
    }

    this.activityLoading.set(true);
    this.activityService
      .getActivity(token)
      .pipe(finalize(() => this.activityLoading.set(false)))
      .subscribe({
        next: (items) => this.activity.set(items),
        error: () => this.activity.set([])
      });
  }

  private mapHistory(items: ChatHistoryItem[]): ChatMessageVm[] {
    return [...items]
      .reverse()
      .flatMap((item) => {
        const createdAt = new Date(item.createdAtUtc);
        return [
          { role: 'user' as const, text: item.message, time: createdAt },
          { role: 'bot' as const, text: item.reply, time: new Date(createdAt.getTime() + 1000) }
        ];
      });
  }
}
