import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import {ChatComponent} from '../chat/chat.component';
import {Chat, NewChatForm} from '../../shared/models/chat.model';
import {Button} from 'primeng/button';
import {Select} from 'primeng/select';
import {FormsModule} from '@angular/forms';
import {SimpleUser} from '../../shared/models/user.model';
import {Dialog} from 'primeng/dialog';
import {InputText} from 'primeng/inputtext';
import {UserService} from '../../shared/services/user.service';
import {ChatService} from '../../shared/services/chat.service';
import {Avatar} from 'primeng/avatar';
import {Badge} from 'primeng/badge';
import {DatePipe, NgClass} from '@angular/common';
import {MultiSelect} from 'primeng/multiselect';
import {ConfirmationService, MenuItem, MessageService, PrimeTemplate} from 'primeng/api';
import {ConfirmDialog} from 'primeng/confirmdialog';
import {Menu} from 'primeng/menu';
import {UserAvatarComponent} from '../../shared/components/user-avatar/user-avatar.component';
import {SelectButton} from 'primeng/selectbutton';
import {LoggedUserDataService} from '../../core/auth/logged-user-data-service';
import {Subscription, tap} from 'rxjs';
import {WebsocketService} from '../../shared/services/websocket.service';
import {ChatMessage} from '../../shared/models/chat-message.model';

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
    SelectButton,
    ConfirmDialog,
    Menu,
    UserAvatarComponent
  ],
  templateUrl: './chat-list.component.html',
  styleUrl: './chat-list.component.scss'
})
export class ChatListComponent implements OnInit, OnDestroy {

  protected readonly userService = inject(UserService);
  protected readonly chatService = inject(ChatService);
  protected readonly loggedUserDataService = inject(LoggedUserDataService)
  protected readonly confirmationService = inject(ConfirmationService);
  protected readonly websocketService = inject(WebsocketService);
  protected readonly messageService = inject(MessageService);

  private newChatSub?: Subscription;
  private readonly chatSubs = new Map<number, Subscription[]>();

  selectedChat: Chat | undefined;
  chats: Chat[] = [];
  users: SimpleUser[] = [];

  visible = false;
  groupInfoVisible = false;
  uploadingPicture = false;
  pictureMenuItems: MenuItem[] = [];

  groupPicture: File | null = null;
  groupPicturePreview: string | null = null;

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
    this.newChatSub = this.websocketService.getNewChats()
      .subscribe(chat => this.onChatCreatedByOther(chat));
  }

  private onChatCreatedByOther(chat: Chat) {
    if (this.chats.some(c => c.id === chat.id)) return;

    this.chats = [{...chat, unreadMessagesCount: 0}, ...this.chats];
    this.listenToChats();
  }

  ngOnDestroy(): void {
    this.chatService.activeChatId = null;
    this.newChatSub?.unsubscribe();
    this.chatSubs.forEach(subs => subs.forEach(sub => sub.unsubscribe()));
    this.chatSubs.clear();
  }

  selectChat(chat: Chat) {
    this.selectedChat = chat;
    this.chatService.activeChatId = chat.id ?? null;
    if (chat.id){
      this.chatService.markChatAsRead(chat.id).subscribe({
        next: () => {
          this.chats = this.chats.map(c =>
            c.id === chat.id ? { ...c, unreadMessagesCount: 0 } : c
          );
          this.publishUnreadChats();
          this.refreshUnreadCounts();
        }
      });
    }
  }

  backToList() {
    this.selectedChat = undefined;
    this.chatService.activeChatId = null;
  }

  isLastMember(chat: Chat): boolean {
    return chat.chatMembers.length <= 1;
  }

  leaveChat(chat: Chat, event: Event) {
    event.stopPropagation();
    if (chat.id == null) return;
    const chatId = chat.id;
    const last = this.isLastMember(chat);

    this.confirmationService.confirm({
      message: last
        ? 'Eres el último miembro: se eliminarán el chat y todos sus mensajes. Esta acción no se puede deshacer.'
        : 'Dejarás de formar parte de este chat y ya no podrás ver sus mensajes.',
      header: last ? 'Eliminar chat' : 'Salir del chat',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: last ? 'Eliminar' : 'Salir',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger text-sm',
      rejectButtonStyleClass: 'p-button-text text-sm',
      accept: () => {
        this.chatService.leaveChat(chatId).subscribe({
          next: () => this.onChatRemoved(chatId)
        });
      }
    });
  }

  onChatRemoved(chatId: number) {
    this.chatSubs.get(chatId)?.forEach(sub => sub.unsubscribe());
    this.chatSubs.delete(chatId);

    this.chats = this.chats.filter(c => c.id !== chatId);
    if (this.selectedChat?.id === chatId) {
      this.selectedChat = undefined;
      this.chatService.activeChatId = null;
    }
    this.publishUnreadChats();
  }

  private loadUsers() {
    this.userService.getSimpleUsersInfo().subscribe({
      next: users => {
        this.users = users.filter(user => user.id !== JSON.parse(<string>localStorage.getItem('me')).id);
      }
    });
  }

  private loadChats() {
    this.chatService.getAllChats().pipe(
      tap(chats => {
        this.chats = chats;
        this.listenToChats();
        this.refreshUnreadCounts();
      })
    ).subscribe();
  }

  private refreshUnreadCounts() {
    this.chatService.getUnreadMessagesCount().subscribe((count: Record<number, number>) => {
      this.chats = this.chats.map(chat => ({
        ...chat,
        unreadMessagesCount: chat.id != null ? (count[chat.id] ?? 0) : 0
      }));
      this.publishUnreadChats();
    });
  }

  private publishUnreadChats() {
    this.chatService.setUnreadChatIds(
      this.chats.filter(c => c.id != null && c.unreadMessagesCount > 0).map(c => c.id!)
    );
  }

  private listenToChats() {
    this.chatSubs.forEach((subs, id) => {
      if (!this.chats.some(c => c.id === id)) {
        subs.forEach(sub => sub.unsubscribe());
        this.chatSubs.delete(id);
      }
    });

    this.chats
      .filter(chat => chat.id != null && !this.chatSubs.has(chat.id))
      .forEach(chat => {
        const chatId = chat.id!;
        this.chatSubs.set(chatId, [
          this.websocketService.getMessagesForChat(chatId)
            .subscribe(msg => this.onMessageReceived(chatId, msg)),
          this.websocketService.getDeletedMessagesForChat(chatId)
            .subscribe(() => this.loadChats()),
          this.websocketService.getChatUpdates(chatId)
            .subscribe(updated => this.onChatUpdated(updated))
        ]);
      });
  }

  private onMessageReceived(chatId: number, msg: ChatMessage) {
    const target = this.chats.find(c => c.id === chatId);
    if (!target) return;

    const mine = msg.from.id === JSON.parse(localStorage.getItem('me')!).id;
    const isOpen = this.selectedChat?.id === chatId;
    const isSystem = msg.type === 'USER_LEFT';

    const raw = msg.message ?? '';
    const preview = raw.length > 40 ? raw.substring(0, 40) + '…' : raw;

    const updated: Chat = {
      ...target,
      chatMembers: isSystem
        ? target.chatMembers.filter(member => member.id !== msg.from.id)
        : target.chatMembers,
      lastMessagePreview: preview,
      lastMessageAt: msg.timestamp,
      lastMessageFrom: msg.from,
      lastMessageType: msg.type ?? 'TEXT',
      unreadMessagesCount: mine || isOpen || isSystem ? target.unreadMessagesCount : target.unreadMessagesCount + 1
    };
    this.chats = [updated, ...this.chats.filter(c => c.id !== chatId)];

    if (!mine && isOpen && !isSystem) {
      this.chatService.markChatAsRead(chatId).subscribe();
    }
    this.publishUnreadChats();
  }

  private get myId(): number | undefined {
    return this.loggedUserDataService.getLoggedUserData()?.id;
  }

  get myIdValue(): number | undefined {
    return this.myId;
  }

  get openChat(): Chat | undefined {
    return this.chats.find(c => c.id === this.selectedChat?.id) ?? this.selectedChat;
  }

  openGroupInfo() {
    this.groupInfoVisible = true;
  }

  memberNames(chat: Chat): string {
    return this.sortedMembers(chat)
      .map(member => member.id === this.myId ? 'Tú' : this.displayName(member))
      .join(', ');
  }

  sortedMembers(chat: Chat): SimpleUser[] {
    return [...chat.chatMembers].sort((a, b) => {
      if (a.id === this.myId) return -1;
      if (b.id === this.myId) return 1;
      return this.displayName(a).localeCompare(this.displayName(b), 'es');
    });
  }

  private displayName(user: SimpleUser): string {
    return user.name || user.email;
  }

  isGroup(chat: Chat): boolean {
    return !!chat.name;
  }

  otherMembers(chat: Chat): SimpleUser[] {
    return chat.chatMembers.filter(member => member.id !== this.myId);
  }

  chatTitle(chat: Chat): string {
    if (chat.name) return chat.name;
    const others = this.otherMembers(chat).map(member => this.displayName(member));
    return others.length ? others.join(', ') : 'Chat sin participantes';
  }

  avatarUser(chat: Chat): SimpleUser | undefined {
    return this.isGroup(chat) ? undefined : this.otherMembers(chat)[0];
  }

  avatarLabel(chat: Chat): string | undefined {
    if (this.isGroup(chat)) return chat.name!.at(0)?.toUpperCase();
    const other = this.avatarUser(chat);
    return other ? this.displayName(other).at(0)?.toUpperCase() : undefined;
  }

  lastMessageText(chat: Chat): string {
    if (!chat.lastMessagePreview) return 'Sin mensajes todavía';

    const sender = chat.lastMessageFrom;
    if (!sender || chat.lastMessageType === 'USER_LEFT') return chat.lastMessagePreview;

    if (sender.id === this.myId) return `Tú: ${chat.lastMessagePreview}`;
    return this.isGroup(chat)
      ? `${this.displayName(sender)}: ${chat.lastMessagePreview}`
      : chat.lastMessagePreview;
  }

  openNewChatDialog() {
    this.newChatMode = 'private';
    this.clearGroupPicture();
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

    const member = this.selectedUserIdForPrivate;
    if (!member) return;

    const newChat: NewChatForm = {
      chatMembers: [member]
    };

    this.chatService.createChat(newChat).subscribe({
      next: () => {
        this.newChatVisible = false;
        this.loadChats();
      }
    });
  }

  private createGroupChat() {
    const members =  this.selectedGroupUserIds;

    const newChat: NewChatForm = {
      chatMembers: members,
      name: this.groupName,
      description: this.groupDescription
    };

    this.chatService.createChat(newChat, this.groupPicture).subscribe({
      next: () => {
        this.newChatVisible = false;
        this.loadChats();
      }
    });
  }

  onGroupPicturePicked(event: Event) {
    const file = this.pickImage(event);
    if (!file) return;

    this.clearGroupPicture();
    this.groupPicture = file;
    this.groupPicturePreview = URL.createObjectURL(file);
  }

  clearGroupPicture() {
    if (this.groupPicturePreview) URL.revokeObjectURL(this.groupPicturePreview);
    this.groupPicture = null;
    this.groupPicturePreview = null;
  }

  onExistingGroupPicturePicked(event: Event, chat: Chat) {
    const file = this.pickImage(event);
    if (!file || chat.id == null) return;

    this.uploadingPicture = true;
    this.chatService.setChatPicture(chat.id, file).subscribe({
      next: updated => {
        this.uploadingPicture = false;
        this.onChatUpdated(updated);
      },
      error: () => this.uploadingPicture = false
    });
  }

  removeGroupPicture(chat: Chat) {
    if (chat.id == null) return;

    this.uploadingPicture = true;
    this.chatService.removeChatPicture(chat.id).subscribe({
      next: updated => {
        this.uploadingPicture = false;
        this.onChatUpdated(updated);
      },
      error: () => this.uploadingPicture = false
    });
  }

  togglePictureMenu(event: Event, chat: Chat, menu: Menu, fileInput: HTMLInputElement) {
    if (this.uploadingPicture) return;

    this.pictureMenuItems = [
      {
        label: chat.pictureUrl ? "Cambiar foto" : "Añadir foto",
        icon: "pi pi-camera",
        command: () => fileInput.click()
      },
      ...(chat.pictureUrl ? [{
        label: "Quitar foto",
        icon: "pi pi-trash",
        styleClass: "text-red-500",
        command: () => this.removeGroupPicture(chat)
      }] : [])
    ];
    menu.toggle(event);
  }

  private pickImage(event: Event): File | null {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    input.value = "";

    if (!file) return null;
    if (!file.type.startsWith("image/")) {
      this.messageService.add({severity: "warn", summary: "Aviso", detail: "El archivo debe ser una imagen."});
      return null;
    }
    if (file.size > 8 * 1024 * 1024) {
      this.messageService.add({severity: "warn", summary: "Aviso", detail: "La imagen no puede superar los 8 MB."});
      return null;
    }
    return file;
  }

  chatAvatarUrl(chat: Chat): string | undefined {
    return this.isGroup(chat) ? chat.pictureUrl : this.avatarUser(chat)?.avatarUrl;
  }

  private onChatUpdated(updated: Chat) {
    this.chats = this.chats.map(chat => chat.id === updated.id
      ? {...chat, name: updated.name, description: updated.description, pictureUrl: updated.pictureUrl}
      : chat);
  }
}
