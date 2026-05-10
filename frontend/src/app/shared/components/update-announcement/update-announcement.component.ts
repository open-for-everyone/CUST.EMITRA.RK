import { Component, Input, OnChanges, signal } from '@angular/core';

const SESSION_KEY = 'emitra.announcement.dismissed';

@Component({
  selector: 'app-update-announcement',
  standalone: true,
  templateUrl: './update-announcement.component.html'
})
export class UpdateAnnouncementComponent implements OnChanges {
  @Input() updates: string[] = [];

  readonly visible = signal(false);

  ngOnChanges(): void {
    if (this.updates.length && !sessionStorage.getItem(SESSION_KEY)) {
      this.visible.set(true);
    }
  }

  dismiss(): void {
    this.visible.set(false);
    sessionStorage.setItem(SESSION_KEY, '1');
  }
}
