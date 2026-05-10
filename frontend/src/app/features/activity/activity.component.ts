import { Component, Input } from '@angular/core';
import { ActivityItem } from '../../core/models/api.models';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-activity',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './activity.component.html'
})
export class ActivityComponent {
  @Input() isLoggedIn = false;
  @Input() loading = false;
  @Input() items: ActivityItem[] = [];
}
