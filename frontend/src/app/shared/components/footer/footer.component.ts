import { Component, OnInit, computed, effect, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LanguageService } from '../../../core/services/language.service';
import { PublicContact } from '../../../core/models/api.models';
import { PublicSettingsService } from '../../../core/services/public-settings.service';
import { DEFAULT_PUBLIC_CONTACT } from '../../../core/constants/public-contact.defaults';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './footer.component.html'
})
export class FooterComponent implements OnInit {
  readonly contactInfo = signal<PublicContact>(DEFAULT_PUBLIC_CONTACT);
  readonly phoneDisplay = computed(() => this.contactInfo().phone);
  readonly emailDisplay = computed(() => this.contactInfo().email);

  constructor(
    readonly language: LanguageService,
    private readonly publicSettings: PublicSettingsService
  ) {}

  private readonly contactByLanguageEffect = effect(() => {
    const language = this.language.language();
    this.publicSettings.getPublicContact(language).subscribe((contact) => {
      this.contactInfo.set(contact);
    });
  });

  ngOnInit(): void {
    // Data loading is handled by the language effect.
  }
}
