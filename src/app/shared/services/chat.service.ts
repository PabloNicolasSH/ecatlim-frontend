import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {ChatMessage} from '../models/chat-message.model';
import {environment} from '../../../environments/environment';
import {Chat, NewChatForm} from '../models/chat.model';
import {BehaviorSubject, Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  protected readonly http = inject(HttpClient);

  private unreadChatIds = new Set<number>();
  private readonly unreadChatsSubject = new BehaviorSubject<number>(0);
  readonly unreadChats$ = this.unreadChatsSubject.asObservable();

  activeChatId: number | null = null;

  setUnreadChatIds(ids: number[]): void {
    this.unreadChatIds = new Set(ids);
    this.emitUnreadChats();
  }

  markChatUnread(chatId: number): void {
    if (chatId === this.activeChatId || this.unreadChatIds.has(chatId)) return;
    this.unreadChatIds.add(chatId);
    this.emitUnreadChats();
  }

  refreshUnreadChats(): void {
    this.getUnreadMessagesCount().subscribe(count =>
      this.setUnreadChatIds(Object.entries(count).filter(([, n]) => n > 0).map(([id]) => Number(id)))
    );
  }

  private emitUnreadChats(): void {
    this.unreadChatsSubject.next(this.unreadChatIds.size);
  }

  getChatHistory(chatId: number, page = 0, size = 30): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(
      `${environment.apiUrl}/chat/${chatId}/messages`,
      {
        params: {
          page,
          size
        }
      }
    );
  }

  createChat(chat: NewChatForm, picture?: File | null){
    const formData = new FormData();
    formData.append("chat", new Blob([JSON.stringify(chat)], {type: "application/json"}));
    if (picture) {
      formData.append("picture", picture);
    }
    return this.http.post<void>(`${environment.apiUrl}/chat/add`, formData);
  }

  setChatPicture(chatId: number, picture: File): Observable<Chat> {
    const formData = new FormData();
    formData.append("picture", picture);
    return this.http.post<Chat>(`${environment.apiUrl}/chat/${chatId}/picture`, formData);
  }

  removeChatPicture(chatId: number): Observable<Chat> {
    return this.http.delete<Chat>(`${environment.apiUrl}/chat/${chatId}/picture`);
  }

  getAllChats() {
    return this.http.get<Chat[]>(`${environment.apiUrl}/chat/allMyChats`);
  }

  deleteMessage(chatId: number, messageId: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/chat/${chatId}/messages/${messageId}`);
  }

  leaveChat(chatId: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/chat/${chatId}`);
  }

  markChatAsRead(chatId: number): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/chat/${chatId}/mark-read`, {});
  }

  getUnreadMessagesCount() {
    return this.http.get<Record<string, number>>(`${environment.apiUrl}/chat/unread-chats`);
  }
}
