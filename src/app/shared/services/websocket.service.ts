import {inject, Injectable} from '@angular/core';
import {Client, IMessage} from '@stomp/stompjs';
import {environment} from '../../../environments/environment';
import {Observable, Subject} from 'rxjs';
import {ChatMessage} from '../models/chat-message.model';
import {Chat} from '../models/chat.model';
import {Notification} from '../models/notification.model';
import {HttpClient} from '@angular/common/http';

interface ChatStreams {
  messages: Subject<ChatMessage>;
  deletedMessages: Subject<number>;
  chatUpdated: Subject<Chat>;
}

export interface ChatError {
  chatId: number | null;
  code: 'CHAT_NOT_FOUND' | 'NOT_A_MEMBER' | 'UNKNOWN';
  message: string;
}

export interface ChatNotification {
  chatId: number;
}

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {

  private stompClient: Client = new Client();

  private isConnected = false;

  private chatStreams = new Map<number, ChatStreams>();
  private errors = new Subject<ChatError>();
  private notifications = new Subject<ChatNotification>();
  private newChats = new Subject<Chat>();
  private newNotifications = new Subject<Notification>();
  private updatedNotifications = new Subject<Notification>();

  protected readonly http = inject(HttpClient);

  initConnection(token: string) {
    this.stompClient = new Client({
      brokerURL: `${environment.webSocketUrl}/ws?token=${token}`,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: () => {},
      onConnect: () => {
        this.isConnected = true;
        this.chatStreams.forEach((_, chatId) => this.subscribeToChat(chatId));
        this.stompClient.subscribe('/user/queue/errors', (msg: IMessage) => {
          this.errors.next(JSON.parse(msg.body) as ChatError);
        });
        this.stompClient.subscribe('/user/queue/chat-notifications', (msg: IMessage) => {
          this.notifications.next(JSON.parse(msg.body) as ChatNotification);
        });
        this.stompClient.subscribe('/user/queue/new-chats', (msg: IMessage) => {
          this.newChats.next(JSON.parse(msg.body) as Chat);
        });
        this.stompClient.subscribe('/user/queue/notifications', (msg: IMessage) => {
          this.newNotifications.next(JSON.parse(msg.body) as Notification);
        });
        this.stompClient.subscribe('/user/queue/notifications-updated', (msg: IMessage) => {
          this.updatedNotifications.next(JSON.parse(msg.body) as Notification);
        });
      },
      onDisconnect: () => {
        this.isConnected = false;
      },
      onStompError: () => {},
    });

    this.stompClient.activate();
  }

  disconnect(): void {
    this.stompClient.deactivate().then(() => {});
  }

  sendMessage(chatId: number, message: string, clientId?: string): void {
    this.stompClient.publish({
      destination: `/app/chat/${chatId}/send`,
      body: JSON.stringify({ message, clientId })
    });
  }

  private ensureStreams(chatId: number): ChatStreams {
    if (!this.chatStreams.has(chatId)) {
      this.chatStreams.set(chatId, {
        messages: new Subject<ChatMessage>(),
        deletedMessages: new Subject<number>(),
        chatUpdated: new Subject<Chat>()
      });
      if (this.isConnected) {
        this.subscribeToChat(chatId);
      }
    }
    return this.chatStreams.get(chatId)!;
  }

  private subscribeToChat(chatId: number): void {
    const streams = this.chatStreams.get(chatId);
    if (!streams) return;

    this.stompClient.subscribe(`/topic/chat/${chatId}`, (msg: IMessage) => {
      streams.messages.next(JSON.parse(msg.body) as ChatMessage);
    });
    this.stompClient.subscribe(`/topic/chat/${chatId}/message-deleted`, (msg: IMessage) => {
      streams.deletedMessages.next(JSON.parse(msg.body) as number);
    });
    this.stompClient.subscribe(`/topic/chat/${chatId}/updated`, (msg: IMessage) => {
      streams.chatUpdated.next(JSON.parse(msg.body) as Chat);
    });
  }

  getMessagesForChat(chatId: number): Observable<ChatMessage> {
    return this.ensureStreams(chatId).messages.asObservable();
  }

  getDeletedMessagesForChat(chatId: number): Observable<number> {
    return this.ensureStreams(chatId).deletedMessages.asObservable();
  }

  getChatUpdates(chatId: number): Observable<Chat> {
    return this.ensureStreams(chatId).chatUpdated.asObservable();
  }

  getNewChats(): Observable<Chat> {
    return this.newChats.asObservable();
  }

  getNewNotifications(): Observable<Notification> {
    return this.newNotifications.asObservable();
  }

  getUpdatedNotifications(): Observable<Notification> {
    return this.updatedNotifications.asObservable();
  }

  getNotifications(): Observable<ChatNotification> {
    return this.notifications.asObservable();
  }

  getErrors(): Observable<ChatError> {
    return this.errors.asObservable();
  }
}
