import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface ChatMessageVm {
  role: 'user' | 'bot';
  text: string;
  time: Date;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './chat.component.html'
})
export class ChatComponent {
  @Input() isLoggedIn = false;
  @Input() loading = false;
  @Input() messages: ChatMessageVm[] = [];
  @Output() sendMessage = new EventEmitter<string>();

  text = '';

  send(): void {
    const value = this.text.trim();
    if (!value) {
      return;
    }

    this.sendMessage.emit(value);
    this.text = '';
  }
}
