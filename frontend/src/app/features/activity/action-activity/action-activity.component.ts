import { Component, Input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivityItem } from '../../../core/models/api.models';
import { LanguageService } from '../../../core/services/language.service';

@Component({
  selector: 'app-action-activity',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './action-activity.component.html'
})
export class ActionActivityComponent {
  constructor(readonly language: LanguageService) {}
  @Input() isLoggedIn = false;
  @Input() loading = false;
  @Input() items: ActivityItem[] = [];
}
