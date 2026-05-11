import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LanguageService } from '../../core/services/language.service';
import { FooterComponent } from '../../shared/components/footer/footer.component';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [FormsModule, RouterLink, FooterComponent],
  templateUrl: './forgot-password.component.html'
})
export class ForgotPasswordComponent {
  readonly auth = inject(AuthService);
  readonly language = inject(LanguageService);

  email = '';
  readonly loading = signal(false);
  readonly successMessage = signal('');
  readonly errorMessage = signal('');

  submit(): void {
    this.successMessage.set('');
    this.errorMessage.set('');

    if (!this.email.trim()) {
      return;
    }

    this.loading.set(true);
    this.auth.forgotPassword(this.email.trim()).subscribe({
      next: (response) => {
        this.successMessage.set(this.language.t('forgotPasswordSuccess'));
        this.loading.set(false);
        this.email = '';
      },
      error: () => {
        // Still show success to prevent email enumeration
        this.successMessage.set(this.language.t('forgotPasswordSuccess'));
        this.loading.set(false);
      }
    });
  }
}
