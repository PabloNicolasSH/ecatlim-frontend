import { inject, Injectable } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import { environment } from '../../../environments/environment';
import { Observable, Subject } from 'rxjs';
import { ChatMessage } from '../models/chat-message.model';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {

  private stompClient: Client = new Client();

  private isConnected = false;
  private pendingSubscriptions: number[] = [];

  private chatStreams = new Map<number, Subject<ChatMessage>>();

  protected readonly http = inject(HttpClient);

  constructor() {
    this.initConnection();
  }

  initConnection() {
    const token = localStorage.getItem('token');

    this.stompClient = new Client({
      brokerURL: `${environment.webSocketUrl}/ws?token=${token}`,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: () => {},
      onConnect: () => {
        this.isConnected = true;
        this.pendingSubscriptions.forEach(chatId => this.subscribeToChat(chatId));
        this.pendingSubscriptions = [];
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

  sendMessage(chatId: number, message: string): void {
    this.stompClient.publish({
      destination: `/app/chat/${chatId}/send`,
      body: JSON.stringify({ message })
    });
  }

  private ensureStream(chatId: number): Subject<ChatMessage> {
    if (!this.chatStreams.has(chatId)) {
      this.chatStreams.set(chatId, new Subject<ChatMessage>());
      if (this.isConnected) {
        this.subscribeToChat(chatId);
      } else {
        this.pendingSubscriptions.push(chatId);
      }
    }
    return this.chatStreams.get(chatId)!;
  }

  private subscribeToChat(chatId: number): void {
    const stream = this.chatStreams.get(chatId);
    if (!stream) return;

    this.stompClient.subscribe(`/topic/chat/${chatId}`, (msg: IMessage) => {
      const message = JSON.parse(msg.body) as ChatMessage;
      stream.next(message);
    });
  }

  getMessagesForChat(chatId: number): Observable<ChatMessage> {
    return this.ensureStream(chatId).asObservable();
  }
}
