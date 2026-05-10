import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  template: `
    <main class="container callback">
      <section class="card">
        <h2>Signing you in...</h2>
        <p>If this takes too long, return to home page.</p>
      </section>
    </main>
  `
})
export class AuthCallbackComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token') ?? '';
    this.auth.completeSocialLogin(token);
    this.auth.initialize().subscribe(() => {
      this.router.navigateByUrl('/');
    });
  }
}
