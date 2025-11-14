import {
  AfterViewChecked,
  Component,
  ElementRef,
  inject,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import {DatePipe, NgClass} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Avatar} from 'primeng/avatar';
import {Button} from 'primeng/button';
import {Chat} from '../../shared/models/chat.model';
import {WebsocketService} from '../../shared/services/websocket.service';
import {ChatService} from '../../shared/services/chat.service';
import {User} from '../../shared/models/user.model';
import {Subscription} from 'rxjs';
import {ChatMessage} from '../../shared/models/chat-message.model';

@Component({
  selector: 'app-chat',
  imports: [
    NgClass,
    FormsModule,
    Avatar,
    Button
  ],
  providers: [DatePipe],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss'
})
export class ChatComponent implements OnChanges, AfterViewChecked {
  @Input() selectedChat!: Chat;
  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLDivElement>;

  private websocketService = inject(WebsocketService);
  private chatService = inject(ChatService);
  private datePipe = inject(DatePipe);

  userMe: User = JSON.parse(localStorage.getItem('me')!);

  private wsSub?: Subscription;

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

  ngAfterViewChecked(): void {
    if (this.pendingScrollToBottom) {
      this.scrollToBottomSmooth();
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
    if (this.allHistoryLoaded || this.loadingOlder) return;

    this.loadingOlder = true;

    const el = this.scrollContainer.nativeElement;
    const prevScrollHeight = el.scrollHeight;

    this.chatService.getChatHistory(this.selectedChat.id, this.currentPage + 1, this.pageSize)
      .subscribe((msgs: ChatMessage[]) => {
        if (msgs.length === 0) {
          this.loadingOlder = false;
          this.allHistoryLoaded = true;
          return;
        }

        this.messages = [
          ...msgs
            .map(m => this.decorateMessage(m))
            .sort((a, b) => a.ts.getTime() - b.ts.getTime()),
          ...this.messages
        ];

        this.currentPage++;

        queueMicrotask(() => {
          const newScrollHeight = el.scrollHeight;
          el.scrollTop += newScrollHeight - prevScrollHeight;
        });

        if (msgs.length < this.pageSize) {
          this.allHistoryLoaded = true;
        }

        this.loadingOlder = false;
      });
  }


  startListeningWs(): void {
    if (this.wsSub) {
      this.wsSub.unsubscribe();
    }

    this.wsSub = this.websocketService
      .getMessagesForChat(this.selectedChat.id)
      .subscribe((raw: ChatMessage) => {
        const msg = this.decorateMessage(raw);
        this.messages.push(msg);

        const mine = this.isMine(msg);
        if (mine || this.shouldAutoScroll) {
          this.pendingScrollToBottom = true;
        }
      });
  }

  decorateMessage(msg: ChatMessage): any {
    const fromUser = msg.from;

    const ts = new Date(msg.timestamp);

    return {
      ...msg,
      ts,
      dayKey: ts.toISOString().substring(0, 10),
      localId: msg.id ?? crypto.randomUUID(),
      fromId: fromUser.id,
      fromName: fromUser.name || fromUser.email,
    };
  }

  send(): void {
    const text = this.newMessage.trim();
    if (!text) return;

    this.websocketService.sendMessage(this.selectedChat.id, text);
    this.newMessage = '';
  }

  onScroll(): void {
    const el = this.scrollContainer.nativeElement;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;

    this.shouldAutoScroll = distanceToBottom < 30;
    this.showScrollToBottom = distanceToBottom > 200;

    if(el.scrollTop === 0 && !this.loadingOlder && !this.allHistoryLoaded){
      this.loadOlderMessages();
    }
  }

  scrollToBottomSmooth() {
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

  isFirstOfGroup(index: number, message: any): boolean {
    if (index === 0) return true;
    const prev = this.messages[index - 1];
    return prev.fromId !== message.fromId;
  }

  isFirstOfDay(index: number, message: any): boolean {
    if (index === 0) return true;
    const prev = this.messages[index - 1];
    return prev.dayKey !== message.dayKey;
  }

  formatTime(message: any): string {
    return this.datePipe.transform(message.ts, 'HH:mm') ?? '';
  }

  formatDate(message: any): string {
    return this.datePipe.transform(message.ts,
      "EEEE, d 'de' MMMM", 'es-ES') ?? '';
  }
}
