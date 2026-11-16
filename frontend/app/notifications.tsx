import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Bell,
  Calendar,
  CheckCircle,
  Flame,
  Target,
  Trash2,
  CheckCheck,
  Send,
  Sparkles,
} from 'lucide-react-native';
import { Colors } from '../constants/colors';
import { Radius, Spacing, FontSize, FontWeight } from '../constants/theme';
import { Card, Badge, EmptyState } from '../components/ui';
import { useNotifications, NotificationFilter } from '../hooks/useNotifications';
import { NotificationItem, NotificationType } from '../types/notification';

// Helper for relative time
const formatRelativeTime = (dateStr: string) => {
  const now = new Date().getTime();
  const date = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 172800) return 'Yesterday';
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
};

// Helper for category styling
const getNotificationTypeConfig = (type: NotificationType) => {
  switch (type) {
    case 'exam_reminder':
      return {
        label: 'Exam Alert',
        color: Colors.error,
        bg: 'rgba(239, 68, 68, 0.15)',
        icon: <Calendar size={18} color={Colors.error} />,
      };
    case 'task_deadline':
      return {
        label: 'Task Due',
        color: Colors.secondary,
        bg: 'rgba(34, 211, 238, 0.15)',
        icon: <CheckCircle size={18} color={Colors.secondary} />,
      };
    case 'study_streak':
      return {
        label: 'Streak',
        color: Colors.warning,
        bg: 'rgba(245, 158, 11, 0.15)',
        icon: <Flame size={18} color={Colors.warning} />,
      };
    case 'daily_goal':
      return {
        label: 'Daily Goal',
        color: Colors.primary,
        bg: Colors.primaryFaded,
        icon: <Target size={18} color={Colors.primary} />,
      };
    case 'system':
    default:
      return {
        label: 'System',
        color: Colors.textSecondary,
        bg: Colors.background,
        icon: <Sparkles size={18} color={Colors.textSecondary} />,
      };
  }
};

export default function NotificationsScreen() {
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    total,
    loading,
    refreshing,
    filter,
    setFilter,
    refresh,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    sendTestAlert,
  } = useNotifications();

  const [testingAlert, setTestingAlert] = useState(false);

  const handleTestNotification = async () => {
    try {
      setTestingAlert(true);
      await sendTestAlert();
      Alert.alert(
        'Test Notification Sent! 🔔',
        'Check your Android notification bar in 2 seconds to see the StudyMate alert with sound and vibration.'
      );
    } catch (err: any) {
      Alert.alert('Notification Notice', err?.message || 'Please grant notification permissions.');
    } finally {
      setTestingAlert(false);
    }
  };

  const handleNotificationPress = async (item: NotificationItem) => {
    if (!item.isRead) {
      await markAsRead(item._id);
    }

    if (item.relatedModel === 'Exam') {
      router.push('/(tabs)/exams' as any);
    } else if (item.relatedModel === 'Task') {
      router.push('/(tabs)/tasks' as any);
    }
  };

  const handleConfirmClearAll = () => {
    Alert.alert(
      'Clear Notifications',
      'Choose an option:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Read Only',
          onPress: () => clearAll(true),
        },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => clearAll(false),
        },
      ]
    );
  };

  const filters: { key: NotificationFilter; label: string }[] = [
    { key: 'all', label: `All (${total})` },
    { key: 'unread', label: `Unread (${unreadCount})` },
    { key: 'exam_reminder', label: 'Exams' },
    { key: 'task_deadline', label: 'Tasks' },
    { key: 'study_streak', label: 'Streaks' },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ArrowLeft size={20} color={Colors.text} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Notifications</Text>
            <Text style={styles.headerSubtitle}>
              {unreadCount > 0
                ? `${unreadCount} unread alert${unreadCount > 1 ? 's' : ''}`
                : 'All caught up!'}
            </Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          {unreadCount > 0 && (
            <TouchableOpacity
              style={styles.headerActionBtn}
              onPress={markAllAsRead}
              activeOpacity={0.8}
            >
              <CheckCheck size={18} color={Colors.primary} />
            </TouchableOpacity>
          )}
          {notifications.length > 0 && (
            <TouchableOpacity
              style={styles.headerActionBtn}
              onPress={handleConfirmClearAll}
              activeOpacity={0.8}
            >
              <Trash2 size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Test Device Notification Banner ── */}
      <View style={styles.testBannerContainer}>
        <TouchableOpacity
          style={styles.testBanner}
          onPress={handleTestNotification}
          activeOpacity={0.8}
          disabled={testingAlert}
        >
          <View style={styles.testBannerLeft}>
            <View style={styles.testIconBadge}>
              <Send size={15} color={Colors.primary} />
            </View>
            <View>
              <Text style={styles.testBannerTitle}>Test Device Notification</Text>
              <Text style={styles.testBannerSub}>
                Triggers an instant local Android alert with chime & vibration
              </Text>
            </View>
          </View>
          {testingAlert ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Badge label="Trigger" variant="primary" />
          )}
        </TouchableOpacity>
      </View>

      {/* ── Filter Tabs ── */}
      <View style={styles.filterScrollWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterBar}
        >
          {filters.map((f) => {
            const isSelected = filter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                style={[styles.filterChip, isSelected && styles.filterChipActive]}
                onPress={() => setFilter(f.key)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isSelected && styles.filterChipTextActive,
                  ]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Notification List ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Fetching reminders...</Text>
          </View>
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={<Bell size={44} color={Colors.primary} />}
            title="No Notifications"
            description={
              filter === 'unread'
                ? 'You have read all your alerts.'
                : 'No reminders in this category yet. You will be notified before exams and task deadlines.'
            }
          />
        ) : (
          notifications.map((item) => {
            const config = getNotificationTypeConfig(item.type);
            return (
              <TouchableOpacity
                key={item._id}
                onPress={() => handleNotificationPress(item)}
                activeOpacity={0.85}
              >
                <Card
                  style={[
                    styles.notificationCard,
                    !item.isRead && styles.notificationCardUnread,
                  ]}
                >
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.categoryRow}>
                      <View style={[styles.typeIconBox, { backgroundColor: config.bg }]}>
                        {config.icon}
                      </View>
                      <View>
                        <View style={styles.labelWithDot}>
                          <Text style={[styles.categoryLabel, { color: config.color }]}>
                            {config.label}
                          </Text>
                          {item.priority === 'high' && (
                            <View style={styles.priorityPill}>
                              <Text style={styles.priorityPillText}>URGENT</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.timeAgo}>{formatRelativeTime(item.createdAt)}</Text>
                      </View>
                    </View>

                    <View style={styles.actionSlot}>
                      {!item.isRead && <View style={styles.unreadDot} />}
                      <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => deleteNotification(item._id)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Trash2 size={15} color={Colors.textMuted} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <Text
                    style={[
                      styles.notifTitle,
                      !item.isRead && styles.notifTitleUnread,
                    ]}
                  >
                    {item.title}
                  </Text>
                  <Text style={styles.notifMessage}>{item.message}</Text>
                </Card>
              </TouchableOpacity>
            );
          })
        )}

        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  headerSubtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  headerActionBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  testBannerContainer: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  testBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  testBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: Spacing.sm,
  },
  testIconBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.primaryFaded,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  testBannerTitle: {
    color: Colors.text,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  testBannerSub: {
    color: Colors.textMuted,
    fontSize: 10,
    marginTop: 1,
  },

  filterScrollWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: Spacing.xs,
  },
  filterBar: {
    paddingHorizontal: Spacing.base,
    gap: Spacing.xs,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primaryFaded,
    borderColor: Colors.primary,
  },
  filterChipText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: FontWeight.bold,
  },

  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
  },
  loadingContainer: {
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  loadingText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },

  notificationCard: {
    marginBottom: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.md,
  },
  notificationCardUnread: {
    borderColor: 'rgba(139, 92, 246, 0.4)',
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  typeIconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelWithDot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  categoryLabel: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  priorityPill: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  priorityPillText: {
    color: Colors.error,
    fontSize: 9,
    fontWeight: FontWeight.bold,
  },
  timeAgo: {
    color: Colors.textMuted,
    fontSize: 10,
    marginTop: 1,
  },
  actionSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  deleteBtn: {
    padding: 4,
  },

  notifTitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    marginBottom: 4,
    marginTop: 2,
  },
  notifTitleUnread: {
    color: Colors.text,
    fontWeight: FontWeight.bold,
  },
  notifMessage: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    lineHeight: 18,
  },
});
