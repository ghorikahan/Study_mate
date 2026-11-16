import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import apiClient from './api';
import {
  NotificationsResponse,
  SingleNotificationResponse,
  GenerateRemindersResponse,
} from '../types/notification';
import { extractErrorMessage } from './authService';

// Configure foreground notification presentation handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const notificationService = {
  // ───────────────────────────────────────────────────────────────────────────
  // REST API Endpoints
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Fetch in-app notifications
   */
  getNotifications: async (params?: {
    unreadOnly?: boolean;
    type?: string;
    page?: number;
    limit?: number;
  }): Promise<NotificationsResponse['data']> => {
    try {
      const response = await apiClient.get<NotificationsResponse>('/api/notifications', {
        params,
      });
      return response.data.data;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  /**
   * Automatically scan user's upcoming exams (≤ 3 days), tasks due today/overdue,
   * and study streak to generate in-app notification records (with duplicate prevention).
   */
  generateReminders: async (): Promise<GenerateRemindersResponse['data']> => {
    try {
      const response = await apiClient.post<GenerateRemindersResponse>(
        '/api/notifications/generate-reminders'
      );
      return response.data.data;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  /**
   * Mark single notification as read
   */
  markAsRead: async (id: string): Promise<SingleNotificationResponse['data']> => {
    try {
      const response = await apiClient.patch<SingleNotificationResponse>(
        `/api/notifications/${id}/read`
      );
      return response.data.data;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async (): Promise<void> => {
    try {
      await apiClient.patch('/api/notifications/read-all');
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  /**
   * Delete a notification
   */
  deleteNotification: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/api/notifications/${id}`);
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  /**
   * Clear all or read-only notifications
   */
  clearAll: async (readOnly: boolean = false): Promise<void> => {
    try {
      await apiClient.delete('/api/notifications', {
        params: { readOnly },
      });
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  // ───────────────────────────────────────────────────────────────────────────
  // Expo Local Notifications & Device Channels
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Setup Android Notification Channel & Request User Permissions
   */
  initLocalNotifications: async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('studymate-reminders', {
          name: 'StudyMate Reminders',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#8B5CF6',
          sound: 'default',
        });
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      return finalStatus === 'granted';
    } catch (err) {
      console.warn('[NotificationService] Failed to init local notifications:', err);
      return false;
    }
  },

  /**
   * Schedule an instant local test notification (fires in 2 seconds)
   * Perfect for testing on physical Android devices!
   */
  sendTestNotification: async (title?: string, body?: string): Promise<string | null> => {
    try {
      const hasPermission = await notificationService.initLocalNotifications();
      if (!hasPermission) {
        throw new Error('Notification permissions not granted.');
      }

      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: title || 'StudyMate Alert 🔔',
          body:
            body ||
            'Local notifications are active and working on your Android device!',
          sound: true,
          data: { type: 'test' },
        },
        trigger: {
          seconds: 2,
        } as any,
      });

      return identifier;
    } catch (err: any) {
      console.warn('[NotificationService] Test notification failed:', err);
      throw err;
    }
  },

  /**
   * Schedule a local notification for an exam
   * Uses identifier to automatically prevent duplicate schedules for the same exam.
   */
  scheduleExamReminder: async (
    examId: string,
    examTitle: string,
    subject: string,
    triggerDate: Date
  ): Promise<string | null> => {
    try {
      // Don't schedule past dates
      if (triggerDate.getTime() <= Date.now()) {
        return null;
      }

      const identifier = `exam_reminder_${examId}`;

      // Cancel any prior scheduled reminder for this exam to prevent duplicate alerts
      await Notifications.cancelScheduledNotificationAsync(identifier).catch(() => {});

      return await Notifications.scheduleNotificationAsync({
        identifier,
        content: {
          title: `Upcoming Exam: ${examTitle}`,
          body: `Your ${subject} exam is scheduled soon. Review your syllabus now!`,
          sound: true,
          data: { type: 'exam', examId },
        },
        trigger: {
          date: triggerDate,
        } as any,
      });
    } catch (err) {
      console.warn('[NotificationService] Failed to schedule exam reminder:', err);
      return null;
    }
  },

  /**
   * Schedule a local notification for a task deadline
   */
  scheduleTaskReminder: async (
    taskId: string,
    taskTitle: string,
    subject: string,
    dueDate: Date
  ): Promise<string | null> => {
    try {
      if (dueDate.getTime() <= Date.now()) {
        return null;
      }

      const identifier = `task_deadline_${taskId}`;

      // Cancel prior scheduled reminder to prevent duplicates
      await Notifications.cancelScheduledNotificationAsync(identifier).catch(() => {});

      return await Notifications.scheduleNotificationAsync({
        identifier,
        content: {
          title: `Task Due Today: ${taskTitle}`,
          body: `Don't forget to complete your task for ${subject}.`,
          sound: true,
          data: { type: 'task', taskId },
        },
        trigger: {
          date: dueDate,
        } as any,
      });
    } catch (err) {
      console.warn('[NotificationService] Failed to schedule task reminder:', err);
      return null;
    }
  },

  /**
   * Cancel a scheduled local notification by ID
   */
  cancelReminder: async (identifier: string): Promise<void> => {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
    } catch (err) {
      console.warn('[NotificationService] Failed to cancel notification:', err);
    }
  },
};

export default notificationService;
