import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LanguageService } from '../../core/services/language.service';
import { FooterComponent } from '../../shared/components/footer/footer.component';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [FormsModule, RouterLink, FooterComponent],
  templateUrl: './reset-password.component.html'
})
export class ResetPasswordComponent implements OnInit {
  readonly auth = inject(AuthService);
  readonly language = inject(LanguageService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  token = '';
  newPassword = '';
  confirmPassword = '';
  readonly loading = signal(false);
  readonly successMessage = signal('');
  readonly errorMessage = signal('');

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
    if (!this.token) {
      this.errorMessage.set(this.language.t('resetPasswordInvalidToken'));
    }
  }

  submit(): void {
    this.successMessage.set('');
    this.errorMessage.set('');

    if (!this.token) {
      this.errorMessage.set(this.language.t('resetPasswordInvalidToken'));
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage.set(this.language.t('changePasswordMismatch'));
      return;
    }

    if (this.newPassword.length < 6) {
      this.errorMessage.set('Password must be at least 6 characters.');
      return;
    }

    this.loading.set(true);
    this.auth.resetPassword(this.token, this.newPassword).subscribe({
      next: () => {
        this.successMessage.set(this.language.t('resetPasswordSuccess'));
        this.loading.set(false);
        this.newPassword = '';
        this.confirmPassword = '';
        setTimeout(() => this.router.navigateByUrl('/'), 3000);
      },
      error: () => {
        this.errorMessage.set(this.language.t('resetPasswordInvalidToken'));
        this.loading.set(false);
      }
    });
  }
}
