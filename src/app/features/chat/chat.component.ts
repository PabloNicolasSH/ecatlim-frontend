import {Component, inject, Input, OnChanges, OnInit} from '@angular/core';
import {WebsocketService} from '../../shared/services/websocket.service';
import {NgClass} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Avatar} from 'primeng/avatar';
import {Button} from 'primeng/button';
import {Chat} from '../../shared/models/chat.model';
import {ChatService} from '../../shared/services/chat.service';
import {User} from '../../shared/models/user.model';
import {ChatMessage} from '../../shared/models/chat-message.model';
import {Divider} from 'primeng/divider';

@Component({
  selector: 'app-chat',
  imports: [
    NgClass,
    FormsModule,
    Avatar,
    Button,
    Divider
  ],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss'
})
export class ChatComponent implements OnChanges {
  messages: any[] = [];
  newMessage = '';

  userMe: User = JSON.parse(<string>localStorage.getItem("me"));

  protected readonly websocketService = inject(WebsocketService);
  protected readonly chatService = inject(ChatService);
  @Input() selectedChat!: Chat;

  ngOnChanges(): void {
    this.loadHistory();
    this.listenerMessage();
  }

  loadHistory(): void {
    this.chatService.getChatHistory(this.selectedChat.id).subscribe((msgs) => {
      this.messages = this.createMessageSide(msgs);
    });
  }

  listenerMessage(): void {
    this.websocketService.getMessagesForChat(this.selectedChat.id).subscribe((msgs) => {
      this.messages.push(...this.createMessageSide(msgs));
    });
  }

  createMessageSide(messages: any[]): any[] {
    return messages.map((msg, index) => {
      const isFromOther = msg.from.id !== this.userMe.id;
      return {
        ...msg,
        message_side: isFromOther ? 'from' : 'to',
      };
    });
  }

  send(): void {
    if (this.newMessage.trim()) {
      this.websocketService.sendMessage(this.selectedChat.id, this.newMessage);
      this.newMessage = '';
    }
  }

  userFirstLetter() {
    return JSON.parse(<string>localStorage.getItem("me")).name.at(0);
  }
}
