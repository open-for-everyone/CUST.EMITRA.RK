import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SocialProvider } from '../../../core/models/api.models';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <nav class="navbar">
      <div class="container nav-content">
        <div class="nav-left">
          <h1><a class="brand-link" routerLink="/">RK eMitra</a></h1>
          <div class="nav-links">
            <a class="nav-link" routerLink="/">Home</a>
            <a class="nav-link" routerLink="/contact">Contact Us</a>
          </div>
        </div>

        <div class="nav-actions">
          @if (userName) {
            <span class="chip">{{ userName }}</span>
            <button class="btn ghost" type="button" (click)="logout.emit()">Logout</button>
          } @else {
            <button class="btn ghost" type="button" (click)="togglePanel()">Login</button>
          }
        </div>
      </div>

      @if (!userName && panelOpen) {
        <div class="container nav-auth-panel card">
          <div class="tabs">
            <button class="btn ghost" type="button" [class.active]="mode === 'login'" (click)="mode = 'login'">Login</button>
            <button class="btn ghost" type="button" [class.active]="mode === 'signup'" (click)="mode = 'signup'">Sign Up</button>
          </div>

          @if (mode === 'login') {
            <form (ngSubmit)="submitLogin()" class="form">
              <input [(ngModel)]="loginEmail" name="loginEmail" type="email" required placeholder="Email" />
              <input [(ngModel)]="loginPassword" name="loginPassword" type="password" required placeholder="Password" />
              <button class="btn" [disabled]="loading">Login</button>
            </form>
          } @else {
            <form (ngSubmit)="submitSignup()" class="form">
              <input [(ngModel)]="signupName" name="signupName" type="text" required placeholder="Full Name" />
              <input [(ngModel)]="signupEmail" name="signupEmail" type="email" required placeholder="Email" />
              <input [(ngModel)]="signupPassword" name="signupPassword" type="password" minlength="6" required placeholder="Password" />
              <button class="btn" [disabled]="loading">Create Account</button>
            </form>
          }

          @if (providers.length) {
            <div class="social">
              <p>Or continue with</p>
              <div class="social-buttons">
                @for (provider of providers; track provider.key) {
                  <button class="btn social-btn" type="button" (click)="socialLogin.emit(provider.key)">
                    {{ provider.displayName }}
                  </button>
                }
              </div>
            </div>
          }
        </div>
      }
    </nav>
  `
})
export class NavbarComponent {
  @Input() userName = '';
  @Input() loading = false;
  @Input() providers: SocialProvider[] = [];

  @Output() logout = new EventEmitter<void>();
  @Output() login = new EventEmitter<{ email: string; password: string }>();
  @Output() signup = new EventEmitter<{ name: string; email: string; password: string }>();
  @Output() socialLogin = new EventEmitter<string>();

  panelOpen = false;
  mode: 'login' | 'signup' = 'login';
  loginEmail = '';
  loginPassword = '';
  signupName = '';
  signupEmail = '';
  signupPassword = '';

  togglePanel(): void {
    this.panelOpen = !this.panelOpen;
  }

  submitLogin(): void {
    this.login.emit({ email: this.loginEmail, password: this.loginPassword });
  }

  submitSignup(): void {
    this.signup.emit({
      name: this.signupName,
      email: this.signupEmail,
      password: this.signupPassword
    });
  }
}
