import { Component } from '@angular/core';

@Component({
  selector: 'app-services',
  standalone: true,
  template: `
    <section class="card">
      <h2>Popular Services</h2>
      <ul>
        @for (item of services; track item) {
          <li>{{ item }}</li>
        }
      </ul>
    </section>
  `
})
export class ServicesComponent {
  readonly services = [
    'Money Withdrawal (AEPS)',
    'Aadhaar Update & Authentication',
    'Electricity, Water & Mobile Recharge',
    'PAN, Insurance & Certificate Support',
    'POP Pension Assistance',
    'Government Form Assistance'
  ];
}
