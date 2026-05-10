import { Component, HostListener, Input, OnChanges, signal } from '@angular/core';

@Component({
  selector: 'app-update-announcement',
  standalone: true,
  templateUrl: './update-announcement.component.html'
})
export class UpdateAnnouncementComponent implements OnChanges {
  @Input() updates: string[] = [];

  readonly panelOpen = signal(false);
  readonly selectedUpdate = signal<string | null>(null);

  ngOnChanges(): void {
    if (!this.updates.length) {
      this.panelOpen.set(false);
      this.selectedUpdate.set(null);
    }
  }

  togglePanel(): void {
    this.panelOpen.update((open) => !open);
    this.selectedUpdate.set(null);
  }

  openUpdate(update: string): void {
    this.selectedUpdate.set(update);
  }

  closeModal(): void {
    this.selectedUpdate.set(null);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.selectedUpdate()) {
      this.closeModal();
    } else if (this.panelOpen()) {
      this.panelOpen.set(false);
    }
  }
}
