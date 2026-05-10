import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  template: `
    <footer class="site-footer">
      <div class="container footer-grid">
        <section>
          <h3>RK eMitra</h3>
          <p>Trusted digital services centre for payments, citizen forms, and account support.</p>
        </section>

        <section>
          <h3>Quick Links</h3>
          <ul class="footer-list">
            <li><a routerLink="/">Home</a></li>
            <li><a routerLink="/contact">Contact Us</a></li>
          </ul>
        </section>

        <section>
          <h3>Contact Info</h3>
          <ul class="footer-list">
            <li>Phone: +91-141-555-0199</li>
            <li>Email: support@rkemitra.in</li>
            <li>Hours: Mon-Sat, 9:00 AM - 7:00 PM</li>
          </ul>
        </section>
      </div>
    </footer>
  `
})
export class FooterComponent {}
