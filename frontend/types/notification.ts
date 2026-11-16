export type NotificationType =
  | 'exam_reminder'
  | 'task_deadline'
  | 'study_streak'
  | 'daily_goal'
  | 'system';

export type NotificationPriority = 'low' | 'medium' | 'high';

export interface NotificationItem {
  _id: string;
  id?: string;
  user: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  relatedModel?: 'Exam' | 'Task' | 'StudyPlan' | null;
  relatedId?: string | null;
  dedupKey?: string | null;
  isRead: boolean;
  readAt?: string | null;
  scheduledFor?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationsResponse {
  success: boolean;
  message: string;
  data: {
    notifications: NotificationItem[];
    total: number;
    unreadCount: number;
    page: number;
    totalPages: number;
  };
}

export interface SingleNotificationResponse {
  success: boolean;
  message: string;
  data: {
    notification: NotificationItem;
    unreadCount: number;
  };
}

export interface GenerateRemindersResponse {
  success: boolean;
  message: string;
  data: {
    generatedCount: number;
    unreadCount: number;
  };
}
