import { Component, inject, OnInit } from '@angular/core';
import { ChatComponent } from '../chat/chat.component';
import { Chat } from '../../shared/models/chat.model';
import { Button } from 'primeng/button';
import { Select, SelectChangeEvent } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { User } from '../../shared/models/user.model';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { UserService } from '../../shared/services/user-and-entity/user.service';
import { ChatService } from '../../shared/services/chat.service';
import { Avatar } from 'primeng/avatar';
import { Badge } from 'primeng/badge';

@Component({
  selector: 'app-chat-list',
  imports: [
    ChatComponent,
    Button,
    Select,
    FormsModule,
    Dialog,
    InputText,
    Avatar,
    Badge
  ],
  templateUrl: './chat-list.component.html',
  styleUrl: './chat-list.component.scss'
})
export class ChatListComponent implements OnInit {

  protected readonly userService = inject(UserService);
  protected readonly chatService = inject(ChatService);

  selectedChat!: Chat;
  chats: Chat[] = [];
  users: User[] = [];

  visible = false;

  ngOnInit(): void {
    this.loadUsers();
    this.loadChats();

    this.chatService.getUnreadMessagesCount().subscribe((count: Record<string, number>) => {
      this.chats = this.chats.map(chat => ({
        ...chat,
        unreadMessagesCount: count[chat.id] ?? 0
      }));
    });
  }

  selectChat(chat: Chat) {
    this.selectedChat = chat;
  }

  private loadUsers() {
    this.userService.getUsers().subscribe({
      next: users => {
        this.users = users;
      }
    });
  }

  private loadChats() {
    this.chatService.getAllChats().subscribe({
      next: chats => {
        this.chats = chats;
      }
    });
  }

  createGroupChat() {
    this.visible = true;
  }

  selectUserToCreateChat($event: SelectChangeEvent) {
    const newChat: Chat = {
      id: 0,
      chatMembers: this.users.filter(user => user.id === $event.value),
      unreadMessagesCount: 0
    };
    this.chatService.createChat(newChat).subscribe(() => {
      this.loadChats();
    });
  }

  getNameToShow(chatMembers: User[]) {
    const userMe = JSON.parse(<string>localStorage.getItem('me'));
    const nameToShow = chatMembers
      .map(user => user.name)
      .filter(name => name !== userMe.name);
    return nameToShow.join(', ');
  }

  userFirstLetter(nameToShow: string) {
    return nameToShow?.at(0);
  }
}
