export type NotificationType = 'EMAIL' | 'PUSH' | 'SMS';
export type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  subject: string;
  message: string;
  status: NotificationStatus;
  createdAt: Date;
  sentAt?: Date;
}
