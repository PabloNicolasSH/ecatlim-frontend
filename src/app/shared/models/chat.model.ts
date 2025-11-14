import {User} from './user.model';

export interface Chat {
  id?: number;
  name?: string ;
  description?: string;
  chatMembers: User[];
  unreadMessagesCount: number;

  lastMessagePreview?: string;
  lastMessageAt?: string;
}
