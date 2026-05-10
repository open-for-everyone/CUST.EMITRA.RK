import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SocialProvider, UserProfile } from '../../core/models/api.models';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="card">
      <h2>Account Access</h2>

      @if (user) {
        <p><strong>{{ user.name }}</strong></p>
        <p>{{ user.email }}</p>
      } @else {
        <div class="tabs">
          <button class="btn ghost" [class.active]="mode === 'login'" (click)="mode = 'login'">Login</button>
          <button class="btn ghost" [class.active]="mode === 'signup'" (click)="mode = 'signup'">Sign Up</button>
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

        <div class="social">
          <p>Or continue with</p>
          <div class="social-buttons">
            @for (provider of providers; track provider.key) {
              <button class="btn social-btn" (click)="socialLogin.emit(provider.key)">{{ provider.displayName }}</button>
            }
          </div>
        </div>
      }
    </section>
  `
})
export class AuthComponent {
  @Input() user: UserProfile | null = null;
  @Input() loading = false;
  @Input() providers: SocialProvider[] = [];
  @Output() login = new EventEmitter<{ email: string; password: string }>();
  @Output() signup = new EventEmitter<{ name: string; email: string; password: string }>();
  @Output() socialLogin = new EventEmitter<string>();

  mode: 'login' | 'signup' = 'login';
  loginEmail = '';
  loginPassword = '';
  signupName = '';
  signupEmail = '';
  signupPassword = '';

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
