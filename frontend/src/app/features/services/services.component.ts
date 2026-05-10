import { Component } from '@angular/core';

@Component({
  selector: 'app-services',
  standalone: true,
  templateUrl: './services.component.html'
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
