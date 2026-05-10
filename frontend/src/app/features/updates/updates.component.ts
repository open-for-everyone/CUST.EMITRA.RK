import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-updates',
  standalone: true,
  templateUrl: './updates.component.html'
})
export class UpdatesComponent {
  @Input() updates: string[] = [];
  @Input() loading = false;
}
