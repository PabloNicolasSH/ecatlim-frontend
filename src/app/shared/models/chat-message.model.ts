import {SimpleUser} from './user.model';

export interface ChatMessage {
  id?: number;
  from: SimpleUser;
  to: number;
  message: string;
  timestamp: string;
  isRead?: boolean;
}
