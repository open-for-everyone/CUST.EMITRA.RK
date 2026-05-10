import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SocialProvider, UserProfile } from '../../core/models/api.models';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './auth.component.html'
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
