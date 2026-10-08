export type NotificationType =
  | 'ACTIVITY_ASSIGNED'
  | 'EVENT_PUBLISHED'
  | 'STAGE_CERTIFICATE_SENT'
  | 'RECOGNITION_COMMISSION_NEEDED'
  | 'RECOGNITION_REVIEW_NEEDED'
  | 'RECOGNITION_DOCUMENTATION_REQUESTED'
  | 'RECOGNITION_ANSWERED';

export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  description?: string;
  link?: string;
  requiresAction: boolean;
  read: boolean;
  pending: boolean;
  createdAt: string;
}

export interface NotificationPreferences {
  emailReminders: boolean;
}
