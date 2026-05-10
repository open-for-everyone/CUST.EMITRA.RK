import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { AuthService } from '../../core/services/auth.service';
import { SocialProvider } from '../../core/models/api.models';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [FormsModule, NavbarComponent],
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

    @if (isBusy()) {
      <div class="progress-track" role="status" aria-label="Loading">
        <div class="progress-indicator"></div>
      </div>
    }

    <main class="container page contact-page">
      @if (authError()) {
        <section class="card wide auth-error-card">
          <p>{{ authError() }}</p>
        </section>
      }

      <section class="card wide contact-intro">
        <div>
          <h2>Get in touch - RK eMitra Online Centre</h2>
          <p>Reach out for bill payments, certificates, forms, account help, and online citizen services.</p>
        </div>
        <img
          class="contact-intro-image"
          src="https://github.com/user-attachments/assets/d7d2b46b-fbbd-449a-97b1-04a9b79e4488"
          alt="RK eMitra online centre contact section preview"
          loading="lazy"
        />
      </section>

      <section class="card wide contact-workspace">
        <div class="contact-grid">
          <div class="contact-map-column">
            <h3>Find our centre</h3>
            <div class="search-row">
              <input
                type="text"
                placeholder="Add a location note"
                [(ngModel)]="searchNote"
                name="searchNote"
                aria-label="Search location note"
              />
            </div>

            <iframe
              class="contact-map"
              [src]="mapEmbedUrl()"
              title="RK eMitra location map"
              loading="lazy"
              referrerpolicy="no-referrer-when-downgrade"
            ></iframe>

            <div class="map-actions">
              <button class="btn ghost" type="button" (click)="pinCenter()">Pin centre</button>
              <button class="btn ghost" type="button" (click)="useMyLocation()">Use my location</button>
              <button class="btn ghost" type="button" (click)="clearLocation()">Clear</button>
            </div>

            <p class="location-text">
              <strong>Current location:</strong>
              {{ locationLabel() }}
              @if (locationAccuracy() !== null) {
                <span> ± {{ locationAccuracy() }} m</span>
              }
            </p>

            @if (locationError()) {
              <p class="location-error">{{ locationError() }}</p>
            }

            <div class="map-links">
              <a [href]="mapPageUrl()" target="_blank" rel="noopener noreferrer">Open map</a>
              <a [href]="directionsUrl()" target="_blank" rel="noopener noreferrer">Directions</a>
            </div>
          </div>

          <div class="contact-form-column">
            <h3>Send a message</h3>
            <form class="contact-form" #contactForm="ngForm" (ngSubmit)="sendMessage(!!contactForm.valid)">
              <input
                type="text"
                [(ngModel)]="name"
                name="name"
                autocomplete="name"
                required
                placeholder="Name*"
              />
              <input
                type="email"
                [(ngModel)]="email"
                name="email"
                autocomplete="email"
                required
                placeholder="Email*"
              />
              <textarea
                [(ngModel)]="message"
                name="message"
                required
                rows="6"
                placeholder="Message*"
              ></textarea>
              <p class="contact-note">
                By contacting us, your details are used to respond for RK eMitra Online Centre support.
              </p>
              <div class="contact-form-actions">
                <button class="btn" type="submit">Send Message</button>
                <a class="direct-email" [href]="getDirectEmailLink()">Email directly</a>
              </div>
            </form>
          </div>
        </div>
      </section>

      <section class="card">
        <h3>Support Details</h3>
        <ul>
          @for (item of contactDetails; track item.label) {
            <li><strong>{{ item.label }}:</strong> {{ item.value }}</li>
          }
        </ul>
      </section>

      <section class="card">
        <h3>Visit Centre</h3>
        <ul>
          <li><strong>Centre Name:</strong> RK eMitra Online Centre</li>
          <li><strong>Address:</strong> Vaishali Nagar, Jaipur, Rajasthan</li>
          <li><strong>Business Days:</strong> Monday to Saturday</li>
          <li><strong>Business Hours:</strong> 9:00 AM - 7:00 PM</li>
        </ul>
      </section>
    </main>
  `
})
export class ContactComponent implements OnInit {
  private readonly GEOLOCATION_TIMEOUT_MS = 10000;
  readonly auth = inject(AuthService);
  readonly providers = signal<SocialProvider[]>([]);
  readonly providersLoading = signal(false);
  readonly authError = signal('');
  readonly locationError = signal('');
  readonly locationAccuracy = signal<number | null>(null);

  readonly centerLat = 26.9124;
  readonly centerLng = 75.7873;
  readonly mapLat = signal(this.centerLat);
  readonly mapLng = signal(this.centerLng);

  name = '';
  email = '';
  message = '';
  searchNote = '';

  readonly isBusy = computed(() => this.auth.authLoading() || this.providersLoading());

  readonly locationLabel = computed(() => `${this.mapLat().toFixed(5)}, ${this.mapLng().toFixed(5)}`);

  readonly mapEmbedUrl = computed(() => {
    const lat = this.mapLat();
    const lng = this.mapLng();
    const delta = 0.02;
    const bbox = `${lng - delta}%2C${lat - delta}%2C${lng + delta}%2C${lat + delta}`;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;
  });

  readonly mapPageUrl = computed(() => {
    const lat = this.mapLat();
    const lng = this.mapLng();
    return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=14/${lat}/${lng}`;
  });

  readonly directionsUrl = computed(() => {
    const lat = this.mapLat();
    const lng = this.mapLng();
    return `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${lat}%2C${lng}%3B${this.centerLat}%2C${this.centerLng}`;
  });

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
    this.authError.set('');
    this.auth.login(email, password).subscribe({
      error: () => this.authError.set('Login failed. Please check your credentials and try again.')
    });
  }

  onSignup(name: string, email: string, password: string): void {
    this.authError.set('');
    this.auth.signup(name, email, password).subscribe({
      error: () => this.authError.set('Signup failed. Please verify details and try again.')
    });
  }

  onLogout(): void {
    this.auth.logout();
  }

  onSocialLogin(provider: string): void {
    this.authError.set('');
    this.auth.startSocialLogin(provider);
  }

  pinCenter(): void {
    this.locationError.set('');
    this.locationAccuracy.set(null);
    this.mapLat.set(this.centerLat);
    this.mapLng.set(this.centerLng);
  }

  useMyLocation(): void {
    this.locationError.set('');

    if (!('geolocation' in navigator)) {
      this.locationError.set('Geolocation is not supported in this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.mapLat.set(position.coords.latitude);
        this.mapLng.set(position.coords.longitude);
        this.locationAccuracy.set(Math.round(position.coords.accuracy));
      },
      () => {
        this.locationError.set('Unable to access your current location. Please allow location permissions.');
      },
      { enableHighAccuracy: true, timeout: this.GEOLOCATION_TIMEOUT_MS }
    );
  }

  clearLocation(): void {
    this.pinCenter();
    this.searchNote = '';
  }

  sendMessage(isValid: boolean): void {
    if (!isValid || !this.name.trim() || !this.email.trim() || !this.message.trim()) {
      return;
    }

    window.location.href = this.getDirectEmailLink();
  }

  getDirectEmailLink(): string {
    const subject = encodeURIComponent('Support request - RK eMitra Online Centre');
    const body = encodeURIComponent(this.buildEmailBody());
    return `mailto:support@rkemitra.in?subject=${subject}&body=${body}`;
  }

  private buildEmailBody(): string {
    return `Name: ${this.name}\nEmail: ${this.email}\nLocation: ${this.locationLabel()}\n\nMessage:\n${this.message}`;
  }

  private loadProviders(): void {
    this.providersLoading.set(true);
    this.auth
      .getSocialProviders()
      .pipe(finalize(() => this.providersLoading.set(false)))
      .subscribe({
        next: (providers) => this.providers.set(providers),
        error: () => this.providers.set([])
      });
  }
}
