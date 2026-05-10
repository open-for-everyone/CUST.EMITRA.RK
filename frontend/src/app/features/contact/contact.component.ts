import { Component, OnInit, inject, signal } from '@angular/core';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { AuthService } from '../../core/services/auth.service';
import { SocialProvider } from '../../core/models/api.models';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [NavbarComponent],
  template: `
    <app-navbar
      [userName]="auth.user()?.name ?? ''"
      [loading]="auth.authLoading()"
      [providers]="providers()"
      (logout)="onLogout()"
      (login)="onLogin($event.email, $event.password)"
      (signup)="onSignup($event.name, $event.email, $event.password)"
      (socialLogin)="onSocialLogin($event)"
    />

    <main class="container page contact-page">
      <section class="card wide">
        <h2>Contact RK eMitra</h2>
        <p>We are here to help with online services, payments, forms, and account support.</p>
      </section>

      <section class="card">
        <h2>Support Details</h2>
        <ul>
          @for (item of contactDetails; track item.label) {
            <li><strong>{{ item.label }}:</strong> {{ item.value }}</li>
          }
        </ul>
      </section>

      <section class="card">
        <h2>Visit Centre</h2>
        <ul>
          <li><strong>Centre Name:</strong> RK eMitra</li>
          <li><strong>Address:</strong> Vaishali Nagar, Jaipur, Rajasthan</li>
          <li><strong>Business Days:</strong> Monday to Saturday</li>
          <li><strong>Business Hours:</strong> 9:00 AM - 7:00 PM</li>
        </ul>
      </section>
    </main>
  `
})
export class ContactComponent implements OnInit {
  readonly auth = inject(AuthService);
  readonly providers = signal<SocialProvider[]>([]);

  readonly contactDetails = [
    { label: 'Phone', value: '+91-141-555-0199' },
    { label: 'Email', value: 'support@rkemitra.in' },
    { label: 'WhatsApp', value: '+91-141-555-0101' }
  ];

  ngOnInit(): void {
    this.loadProviders();
    this.auth.initialize().subscribe();
  }

  onLogin(email: string, password: string): void {
    this.auth.login(email, password).subscribe();
  }

  onSignup(name: string, email: string, password: string): void {
    this.auth.signup(name, email, password).subscribe();
  }

  onLogout(): void {
    this.auth.logout();
  }

  onSocialLogin(provider: string): void {
    this.auth.startSocialLogin(provider);
  }

  private loadProviders(): void {
    this.auth.getSocialProviders().subscribe((providers) => this.providers.set(providers));
  }
}
