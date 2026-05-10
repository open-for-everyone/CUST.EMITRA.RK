import { Component, Input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivityItem } from '../../../core/models/api.models';
import { LanguageService } from '../../../core/services/language.service';

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
}
