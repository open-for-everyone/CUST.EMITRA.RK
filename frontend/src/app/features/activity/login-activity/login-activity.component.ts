import { Component, Input, computed, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivityItem } from '../../../core/models/api.models';
import { LanguageService } from '../../../core/services/language.service';

const PAGE_SIZE = 5;

@Component({
  selector: 'app-login-activity',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './login-activity.component.html'
})
export class LoginActivityComponent {
  constructor(readonly language: LanguageService) {}
  @Input() isLoggedIn = false;
  @Input() loading = false;
  @Input() items: ActivityItem[] = [];

  readonly currentPage = signal(1);

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.items.length / PAGE_SIZE)));

  readonly pagedItems = computed(() => {
    const page = this.currentPage();
    const total = this.totalPages();
    const safePage = Math.min(page, total);
    const start = (safePage - 1) * PAGE_SIZE;
    return this.items.slice(start, start + PAGE_SIZE);
  });

  readonly showPagination = computed(() => this.items.length > PAGE_SIZE);

  prevPage(): void {
    this.currentPage.update((p) => Math.max(1, p - 1));
  }

  nextPage(): void {
    this.currentPage.update((p) => Math.min(this.totalPages(), p + 1));
  }
}
