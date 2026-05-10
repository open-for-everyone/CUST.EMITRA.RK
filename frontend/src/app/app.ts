import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FooterComponent } from './shared/components/footer/footer.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, FooterComponent],
  template: `
    <div class="app-shell">
      <div class="app-content">
        <router-outlet />
      </div>
      <app-footer />
    </div>
  `
})
export class App {}
