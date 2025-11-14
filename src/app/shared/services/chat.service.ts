import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {ChatMessage} from '../models/chat-message.model';
import {environment} from '../../../environments/environment';
import {Chat} from '../models/chat.model';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  protected readonly http = inject(HttpClient);

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

  createChat(chat: Chat){
    return this.http.post<Chat>(`${environment.apiUrl}/chat/add`, chat);
  }

  getAllChats() {
    return this.http.get<Chat[]>(`${environment.apiUrl}/chat/allMyChats`);
  }

  getUnreadMessagesCount() {
    return this.http.get<Record<string, number>>(`${environment.apiUrl}/chat/unread-chats`);
  }
}
