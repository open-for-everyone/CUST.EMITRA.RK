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
  template: `
    <section class="card wide">
      <h2>AI Assistant</h2>

      @if (!isLoggedIn) {
        <p>Please login to use chatbot.</p>
      } @else {
        <div class="chat-box">
          @for (msg of messages; track $index) {
            <div class="chat-row" [class.user]="msg.role === 'user'">
              <div class="chat-bubble">{{ msg.text }}</div>
            </div>
          }
        </div>

        <form class="chat-form" (ngSubmit)="send()">
          <input [(ngModel)]="text" name="text" type="text" placeholder="Ask your question..." maxlength="500" required />
          <button class="btn" [disabled]="loading || !text.trim()">Send</button>
        </form>
      }
    </section>
  `
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
