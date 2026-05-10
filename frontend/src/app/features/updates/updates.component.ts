import { Component, Input } from '@angular/core';
import { LanguageService } from '../../core/services/language.service';

@Component({
  selector: 'app-updates',
  standalone: true,
  templateUrl: './updates.component.html'
})
export class UpdatesComponent {
  constructor(readonly language: LanguageService) {}
  @Input() updates: string[] = [];
  @Input() loading = false;
}
