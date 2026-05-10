import { Component, Input } from '@angular/core';
import { ActivityItem } from '../../core/models/api.models';
import { DatePipe } from '@angular/common';
import { LanguageService } from '../../core/services/language.service';

@Component({
  selector: 'app-activity',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './activity.component.html'
})
export class ActivityComponent {
  constructor(readonly language: LanguageService) {}
  @Input() isLoggedIn = false;
  @Input() loading = false;
  @Input() items: ActivityItem[] = [];
}
