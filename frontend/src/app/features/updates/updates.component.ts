import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-updates',
  standalone: true,
  template: `
    <section class="card">
      <h2>Latest Updates</h2>
      @if (loading) {
        <p>Loading updates...</p>
      } @else {
        <ul>
          @for (item of updates; track item) {
            <li>{{ item }}</li>
          }
        </ul>
      }
    </section>
  `
})
export class UpdatesComponent {
  @Input() updates: string[] = [];
  @Input() loading = false;
}
