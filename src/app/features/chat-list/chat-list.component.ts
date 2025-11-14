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
import {DatePipe, NgClass} from '@angular/common';
import {MultiSelect} from 'primeng/multiselect';
import {PrimeTemplate} from 'primeng/api';
import {SelectButton} from 'primeng/selectbutton';

@Component({
  selector: 'app-chat-list',
  standalone: true,
  imports: [
    ChatComponent,
    FormsModule,
    Avatar,
    Badge,
    NgClass,
    DatePipe,
    Select,
    InputText,
    Button,
    Dialog,
    MultiSelect,
    PrimeTemplate,
    SelectButton
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

  newChatVisible = false;
  newChatMode: 'private' | 'group' = 'private';

  modeOptions = [
    { label: 'Individual', value: 'private' },
    { label: 'Grupo', value: 'group' }
  ];

  selectedUserIdForPrivate: number | null = null;

  groupName = '';
  groupDescription = '';
  selectedGroupUserIds: number[] = [];

  ngOnInit(): void {
    this.loadUsers();
    this.loadChats();
  }

  selectChat(chat: Chat) {
    this.selectedChat = chat;
    if (chat.id){
      this.chatService.markChatAsRead(chat.id).subscribe({
        next: () => {
          this.chats = this.chats.map(c =>
            c.id === chat.id ? { ...c, unreadMessagesCount: 0 } : c
          );
          this.refreshUnreadCounts();
        }
      });
    }
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
        this.refreshUnreadCounts();
      }
    });
  }

  private refreshUnreadCounts() {
    this.chatService.getUnreadMessagesCount().subscribe((count: Record<number, number>) => {
      this.chats = this.chats.map(chat => ({
        ...chat,
        unreadMessagesCount: chat.id != null ? (count[chat.id] ?? 0) : 0
      }));
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

  openNewChatDialog() {
    this.newChatMode = 'private';
    this.selectedUserIdForPrivate = null;
    this.groupName = '';
    this.groupDescription = '';
    this.selectedGroupUserIds = [];
    this.newChatVisible = true;
  }

  closeNewChatDialog() {
    this.newChatVisible = false;
  }

  canCreateNewChat(): boolean {
    if (this.newChatMode === 'private') {
      return this.selectedUserIdForPrivate != null;
    }
    return !!this.groupName?.trim() && this.selectedGroupUserIds.length >= 1;
  }

  createNewChat() {
    if (this.newChatMode === 'private') {
      this.createPrivateChat();
    } else {
      this.createGroupChat();
    }
  }

  private createPrivateChat() {
    if (this.selectedUserIdForPrivate == null) return;

    const member = this.users.find(u => u.id === this.selectedUserIdForPrivate);
    if (!member) return;

    const newChat: Chat = {
      chatMembers: [member],
      unreadMessagesCount: 0
    };

    this.chatService.createChat(newChat).subscribe({
      next: () => {
        this.newChatVisible = false;
        this.loadChats();
      }
    });
  }

  private createGroupChat() {
    const members = this.users.filter(u => {
      if (u.id){
        this.selectedGroupUserIds.includes(u.id)
      }
    });

    const newChat: Chat = {
      id: 0,
      chatMembers: members,
      unreadMessagesCount: 0,
      name: this.groupName,
      description: this.groupDescription
    };

    this.chatService.createChat(newChat).subscribe({
      next: () => {
        this.newChatVisible = false;
        this.loadChats();
      }
    });
  }
}
