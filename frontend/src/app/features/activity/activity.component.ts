import { Component, Input } from '@angular/core';
import { ActivityItem } from '../../core/models/api.models';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-activity',
  standalone: true,
  imports: [DatePipe],
  template: `
    <section class="card wide">
      <h2>Your Activity</h2>
      @if (!isLoggedIn) {
        <p>Login to view activity.</p>
      } @else if (loading) {
        <p>Loading activity...</p>
      } @else {
        <ul>
          @for (item of items; track item.createdAtUtc) {
            <li>{{ item.action }} - {{ item.metadata || '-' }} - {{ item.createdAtUtc | date:'medium' }}</li>
          }
        </ul>
      }
    </section>
  `
})
export class ActivityComponent {
  @Input() isLoggedIn = false;
  @Input() loading = false;
  @Input() items: ActivityItem[] = [];
}
