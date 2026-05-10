import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-navbar',
  standalone: true,
  template: `
    <nav class="navbar">
      <div class="container nav-content">
        <h1>RK eMitra</h1>
        <div class="nav-actions">
          @if (userName) {
            <span class="chip">{{ userName }}</span>
            <button class="btn ghost" (click)="logout.emit()">Logout</button>
          }
        </div>
      </div>
    </nav>
  `
})
export class NavbarComponent {
  @Input() userName = '';
  @Output() logout = new EventEmitter<void>();
}
