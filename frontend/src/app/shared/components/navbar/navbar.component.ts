import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SocialProvider } from '../../../core/models/api.models';
import { AppLanguage, LanguageService } from '../../../core/services/language.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './navbar.component.html'
})
export class NavbarComponent implements OnChanges {
  @Input() userName = '';
  @Input() loading = false;
  @Input() providers: SocialProvider[] = [];
  @Input() authError = '';

  @Output() logout = new EventEmitter<void>();
  @Output() login = new EventEmitter<{ email: string; password: string }>();
  @Output() signup = new EventEmitter<{ name: string; email: string; password: string }>();
  @Output() socialLogin = new EventEmitter<string>();
  @Output() clearAuthError = new EventEmitter<void>();

  panelOpen = false;
  mode: 'login' | 'signup' = 'login';
  loginEmail = '';
  loginPassword = '';
  signupName = '';
  signupEmail = '';
  signupPassword = '';
  readonly language = inject(LanguageService);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['userName'] && !changes['userName'].firstChange) {
      this.closePanelAndReset();
    }
  }

  togglePanel(): void {
    if (this.panelOpen) {
      this.closePanelAndReset();
      return;
    }

    this.clearAuthError.emit();
    this.panelOpen = true;
  }

  closePanelAndReset(): void {
    this.panelOpen = false;
    this.mode = 'login';
    this.loginEmail = '';
    this.loginPassword = '';
    this.signupName = '';
    this.signupEmail = '';
    this.signupPassword = '';
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

  onLanguageChange(value: string): void {
    if (value === 'en' || value === 'hi') {
      this.language.setLanguage(value as AppLanguage);
    }
  }

  setMode(mode: 'login' | 'signup'): void {
    this.mode = mode;
    this.clearAuthError.emit();
  }
}
