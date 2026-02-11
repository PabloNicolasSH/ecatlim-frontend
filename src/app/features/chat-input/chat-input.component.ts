import {Component, ElementRef, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {Button} from 'primeng/button';

@Component({
  selector: 'app-chat-input',
  imports: [
    FormsModule,
    Button
  ],
  templateUrl: './chat-input.component.html',
  styleUrl: './chat-input.component.scss'
})
export class ChatInputComponent {
  @Input() disabled = false;
  @Output() sendMessage = new EventEmitter<string>();

  @ViewChild('messageArea') messageArea!: ElementRef<HTMLTextAreaElement>;

  messageContent = '';
  showEmojiPicker = false;

  onSend() {
    const trimmed = this.messageContent.trim();
    if (!trimmed || this.disabled) return;

    this.sendMessage.emit(trimmed);
    this.messageContent = '';
    this.showEmojiPicker = false;
  }
}
