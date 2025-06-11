export interface ChatMessage {
  id?: number;
  from: { email: string };
  to: { email: string };
  message: string;
  timestamp: string;
  isRead?: boolean;
}
