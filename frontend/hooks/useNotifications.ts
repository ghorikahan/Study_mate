import { useState, useEffect, useCallback } from 'react';
import { NotificationItem, NotificationType } from '../types/notification';
import { notificationService } from '../services/notificationService';

export type NotificationFilter =
  | 'all'
  | 'exam_reminder'
  | 'task_deadline'
  | 'study_streak'
  | 'unread';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [filter, setFilter] = useState<NotificationFilter>('all');
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = useCallback(
    async (isPullToRefresh = false) => {
      try {
        if (isPullToRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
        setError(null);

        // Auto-generate fresh reminders from exams/tasks
        await notificationService.generateReminders().catch(() => {});

        const params: any = {};
        if (filter === 'unread') {
          params.unreadOnly = true;
        } else if (filter !== 'all') {
          params.type = filter;
        }

        const data = await notificationService.getNotifications(params);
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
        setTotal(data.total || 0);
      } catch (err: any) {
        setError(err?.message || 'Failed to load notifications.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [filter]
  );

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const markAsRead = async (id: string) => {
    try {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      const res = await notificationService.markAsRead(id);
      setUnreadCount(res.unreadCount);
    } catch (err) {
      console.warn('[useNotifications] Failed to mark as read:', err);
      loadNotifications();
    }
  };

  const markAllAsRead = async () => {
    try {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      await notificationService.markAllAsRead();
    } catch (err) {
      console.warn('[useNotifications] Failed to mark all as read:', err);
      loadNotifications();
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const target = notifications.find((n) => n._id === id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      if (target && !target.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      await notificationService.deleteNotification(id);
    } catch (err) {
      console.warn('[useNotifications] Failed to delete notification:', err);
      loadNotifications();
    }
  };

  const clearAll = async (readOnly: boolean = false) => {
    try {
      if (readOnly) {
        setNotifications((prev) => prev.filter((n) => !n.isRead));
      } else {
        setNotifications([]);
        setUnreadCount(0);
      }
      await notificationService.clearAll(readOnly);
    } catch (err) {
      console.warn('[useNotifications] Failed to clear notifications:', err);
      loadNotifications();
    }
  };

  const sendTestAlert = async () => {
    return await notificationService.sendTestNotification();
  };

  return {
    notifications,
    unreadCount,
    total,
    loading,
    refreshing,
    filter,
    setFilter,
    error,
    refresh: () => loadNotifications(true),
    refetch: () => loadNotifications(false),
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    sendTestAlert,
  };
};

export default useNotifications;
