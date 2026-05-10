import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { AuthService } from '../../core/services/auth.service';
import { SocialProvider } from '../../core/models/api.models';
import { LanguageService } from '../../core/services/language.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [FormsModule, NavbarComponent],
  templateUrl: './contact.component.html'
})
export class ContactComponent implements OnInit {
  private readonly GEOLOCATION_TIMEOUT_MS = 10000;
  readonly auth = inject(AuthService);
  readonly language = inject(LanguageService);
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
      error: () => this.authError.set(this.language.t('authLoginFailed'))
    });
  }

  onSignup(name: string, email: string, password: string): void {
    this.authError.set('');
    this.auth.signup(name, email, password).subscribe({
      error: () => this.authError.set(this.language.t('authSignupFailed'))
    });
  }

  onLogout(): void {
    this.auth.logout();
  }

  onSocialLogin(provider: string): void {
    this.authError.set('');
    this.auth.startSocialLogin(provider);
  }

  clearAuthError(): void {
    this.authError.set('');
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
    const subject = encodeURIComponent('Support request - RK Online Centre');
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
