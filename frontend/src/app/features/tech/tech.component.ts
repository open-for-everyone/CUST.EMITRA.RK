import { Component } from '@angular/core';

@Component({
  selector: 'app-tech',
  standalone: true,
  template: `
    <section class="card">
      <h2>Technology</h2>
      <ul>
        @for (item of stack; track item.name) {
          <li><strong>{{ item.name }}</strong> — {{ item.desc }}</li>
        }
      </ul>
    </section>
  `
})
export class TechComponent {
  readonly stack = [
    { name: 'Angular 20', desc: 'Standalone, component-first architecture' },
    { name: '.NET 10 API', desc: 'JWT + social login ready backend' },
    { name: 'SQLite', desc: 'Persistent lightweight storage' },
    { name: 'Google Gemini', desc: 'AI chatbot backend integration' }
  ];
}
