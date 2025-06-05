import {Injectable} from '@angular/core';
import {Client} from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import {environment} from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {

  private stompClient: Client = new Client();

  connect() {
    const token = localStorage.getItem('token');
    const socket = new SockJS(`${environment.apiUrl}/websocket?token=${token}`);

    this.stompClient = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      debug: (str) => console.log('STOMP DEBUG', str)
    });

    this.stompClient.onConnect = () => {
      this.stompClient.subscribe('/user/queue/messages', () => {});
    }

    this.stompClient.onStompError = (frame) => {
      console.error('STOMP ERROR:', frame);
    }

    this.stompClient.activate();
  }

  sendMessage(to: string, message: string){
    this.stompClient.publish({
      destination: '/chat.send',
      body: JSON.stringify({to, message})
    });
  }
}
