import {SimpleUser} from './user.model';

export interface Chat {
  id?: number;
  name?: string ;
  description?: string;
  creationDate?: string;
  pictureUrl?: string;
  chatMembers: SimpleUser[];
  unreadMessagesCount: number;

  lastMessagePreview?: string;
  lastMessageAt?: string;
  lastMessageFrom?: SimpleUser;
  lastMessageType?: 'TEXT' | 'USER_LEFT';
}

export interface NewChatForm {
  name?: string;
  description?: string;
  chatMembers: number[];
}
