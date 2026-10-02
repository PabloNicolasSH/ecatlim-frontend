import {
  AfterViewChecked,
  Component,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import {ConfirmationService, MessageService} from 'primeng/api';
import {filter} from 'rxjs/operators';
import {DatePipe, NgClass} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {UserAvatarComponent} from '../../shared/components/user-avatar/user-avatar.component';
import {Chat} from '../../shared/models/chat.model';
import {ChatError, WebsocketService} from '../../shared/services/websocket.service';
import {ChatService} from '../../shared/services/chat.service';
import {User} from '../../shared/models/user.model';
import {Subscription} from 'rxjs';
import {ChatMessage} from '../../shared/models/chat-message.model';
import {Skeleton} from 'primeng/skeleton';
import {ChatInputComponent} from '../chat-input/chat-input.component';

const MESSAGE_DELETION_WINDOW_MS = 15 * 60 * 1000;

@Component({
  selector: 'app-chat',
  imports: [
    NgClass,
    FormsModule,
    UserAvatarComponent,
    Skeleton,
    DatePipe,
    ChatInputComponent
  ],
  providers: [DatePipe],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss'
})
export class ChatComponent implements OnChanges, AfterViewChecked, OnDestroy {
  @Input() selectedChat!: Chat;
  @Output() chatUnavailable = new EventEmitter<number>();  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLDivElement>;

  private websocketService = inject(WebsocketService);
  private chatService = inject(ChatService);

  userMe: User = JSON.parse(localStorage.getItem('me')!);

  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);

  private wsSub?: Subscription;
  private deletedSub?: Subscription;
  private errorSub?: Subscription;

  private shouldAutoScroll = true;
  showScrollToBottom = false;
  pendingScrollToBottom = false;

  messages: any[] = [];
  newMessage = '';

  pageSize = 30;
  currentPage = 0;
  loadingOlder = false;
  allHistoryLoaded = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedChat'] && this.selectedChat) {
      this.resetState();
      this.loadInitialHistory();
      this.startListeningWs();
    }
  }

  private readonly expiryTick = setInterval(() => {}, 30_000);

  ngOnDestroy(): void {
    clearInterval(this.expiryTick);
    this.wsSub?.unsubscribe();
    this.deletedSub?.unsubscribe();
    this.errorSub?.unsubscribe();
  }

  ngAfterViewChecked(): void {
    if (this.pendingScrollToBottom && !this.loadingOlder && this.scrollContainer) {
      this.scrollToBottom();
      this.pendingScrollToBottom = false;
    }
  }

  resetState() {
    this.messages = [];
    this.currentPage = 0;
    this.loadingOlder = false;
    this.allHistoryLoaded = false;
  }

  loadInitialHistory(): void {
    if (!this.selectedChat.id) return;
    this.chatService.getChatHistory(this.selectedChat.id, 0, this.pageSize)
      .subscribe((msgs: ChatMessage[]) => {
        this.messages = msgs
          .map(m => this.decorateMessage(m))
          .sort((a, b) => a.ts.getTime() - b.ts.getTime());
        this.currentPage = 0;

        this.pendingScrollToBottom = true;
      })
  }

  loadOlderMessages(): void {
    if (this.allHistoryLoaded || this.loadingOlder || !this.selectedChat.id) return;

    this.loadingOlder = true;

    this.chatService.getChatHistory(this.selectedChat.id, this.currentPage + 1, this.pageSize)
      .subscribe((msgs: ChatMessage[]) => {
        if (!msgs.length) {
          this.loadingOlder = false;
          this.allHistoryLoaded = true;
          return;
        }

        const el = this.scrollContainer.nativeElement;
        const previousHeight = el.scrollHeight;

        this.messages = [
          ...msgs
            .map(m => this.decorateMessage(m))
            .sort((a, b) => a.ts.getTime() - b.ts.getTime()),
          ...this.messages
        ];

        setTimeout(() => el.scrollTop = el.scrollHeight - previousHeight);

        this.currentPage++;

        if (msgs.length < this.pageSize) {
          this.allHistoryLoaded = true;
        }

        this.loadingOlder = false;
      });
  }


  startListeningWs(): void {
    this.wsSub?.unsubscribe();
    this.deletedSub?.unsubscribe();
    this.errorSub?.unsubscribe();

    if (!this.selectedChat.id) return;

    const chatId = this.selectedChat.id;

    this.wsSub = this.websocketService
      .getMessagesForChat(chatId)
      .subscribe((raw: ChatMessage) => {
        const msg = this.decorateMessage(raw);

        const pendingIdx = raw.clientId
          ? this.messages.findIndex(m => m.pending && m.clientId === raw.clientId)
          : -1;

        if (pendingIdx >= 0) {
          this.messages[pendingIdx] = msg;
        } else {
          this.messages.push(msg);
        }

        const mine = this.isMine(msg);
        if (mine || this.shouldAutoScroll) {
          this.pendingScrollToBottom = true;
        }
      });

    this.errorSub = this.websocketService
      .getErrors()
      .pipe(filter(error => error.chatId == null || error.chatId === chatId))
      .subscribe((error: ChatError) => this.handleSendError(error));

    this.deletedSub = this.websocketService
      .getDeletedMessagesForChat(chatId)
      .subscribe((messageId: number) => {
        this.messages = this.messages.filter(m => m.id !== messageId);
      });
  }

  private handleSendError(error: ChatError): void {
    this.messages = this.messages.filter(m => !m.pending);

    this.messageService.add({
      severity: 'error',
      summary: error.code === 'UNKNOWN' ? 'Mensaje no enviado' : 'Chat no disponible',
      detail: error.message
    });

    if (error.code !== 'UNKNOWN' && error.chatId != null) {
      this.chatUnavailable.emit(error.chatId);
    }
  }

  deleteMessage(message: any): void {
    if (!message.id || !this.selectedChat.id) return;
    const chatId = this.selectedChat.id;

    this.confirmationService.confirm({
      message: '¿Seguro que quieres eliminar este mensaje? Esta acción no se puede deshacer.',
      header: 'Eliminar mensaje',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger text-sm',
      rejectButtonStyleClass: 'p-button-text text-sm',
      accept: () => {
        this.chatService.deleteMessage(chatId, message.id).subscribe({
          next: () => this.messages = this.messages.filter(m => m.id !== message.id)
        });
      }
    });
  }

  decorateMessage(msg: ChatMessage): any {
    const fromUser = msg.from;

    let ts: Date;

    if (msg.timestamp) {
      ts = new Date(msg.timestamp);
      if (isNaN(ts.getTime())) {
        ts = new Date();
      }
    } else {
      ts = new Date();
    }

    return {
      ...msg,
      ts,
      isMine: this.isMine(msg),
      dayKey: ts.toISOString().substring(0, 10),
      localId: msg.clientId ?? msg.id ?? crypto.randomUUID(),
      fromId: fromUser.id,
      fromName: fromUser.name || fromUser.email,
    };
  }

  send(): void {
    const text = this.newMessage.trim();
    if (!text || !this.selectedChat.id) return;

    this.websocketService.sendMessage(this.selectedChat.id, text);
    this.newMessage = '';
  }

  onScroll(): void {
    const el = this.scrollContainer.nativeElement;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;

    this.shouldAutoScroll = distanceToBottom < 30;
    this.showScrollToBottom = distanceToBottom > 200;

    if(el.scrollTop < 1 && !this.loadingOlder && !this.allHistoryLoaded){
      this.loadOlderMessages();
    }
  }

  scrollToBottom() {
    const el = this.scrollContainer.nativeElement;
    el.scrollTo({
      top: el.scrollHeight,
      behavior: 'smooth'
    });
  }

  trackByMessage(message: any) {
    return message.localId;
  }

  getUserInitial(message: any): string {
    const str: string = message.fromName ?? message.from?.email ?? '';
    if (!str.length) return '?';
    return str.charAt(0).toUpperCase();
  }

  isMine(message: any): boolean {
    return message.fromId === this.userMe.id;
  }

  canDelete(message: any): boolean {
    return this.isMine(message)
      && !message.pending
      && !this.isSystemMessage(message)
      && Date.now() - message.ts.getTime() <= MESSAGE_DELETION_WINDOW_MS;
  }

  isSystemMessage(message: any): boolean {
    return message.type === 'USER_LEFT';
  }

  isFirstOfGroup(index: number, message: any): boolean {
    if (index === 0) return true;
    const prev = this.messages[index - 1];
    return prev.fromId !== message.fromId || this.isSystemMessage(prev);
  }

  isFirstOfDay(index: number, message: any): boolean {
    if (index === 0) return true;
    const prev = this.messages[index - 1];
    return prev.dayKey !== message.dayKey;
  }

  onMessageSent(text: string) {
    if (!text || !this.selectedChat.id) return;

    const clientId = crypto.randomUUID();
    const pending = {
      ...this.decorateMessage({
        from: {id: this.userMe.id, name: this.userMe.profile?.name, email: this.userMe.email,
          avatarUrl: this.userMe.profile?.avatarUrl} as any,
        message: text,
        timestamp: new Date().toISOString(),
        clientId
      } as ChatMessage),
      pending: true
    };
    this.messages.push(pending);
    this.pendingScrollToBottom = true;

    this.websocketService.sendMessage(this.selectedChat.id, text, clientId);
  }
}
