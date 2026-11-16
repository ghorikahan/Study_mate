import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  X,
  Bell,
  Calendar,
  AlertCircle,
  Volume2,
  Mail,
  CheckCircle,
} from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Radius, Spacing, FontSize, FontWeight } from '../../constants/theme';
import { NotificationPreferences } from '../../types/auth';

interface NotificationPreferencesModalProps {
  visible: boolean;
  preferences: NotificationPreferences | undefined;
  onClose: () => void;
  onSave: (notifications: NotificationPreferences) => Promise<void>;
}

export const NotificationPreferencesModal: React.FC<NotificationPreferencesModalProps> = ({
  visible,
  preferences,
  onClose,
  onSave,
}) => {
  const [push, setPush] = useState(true);
  const [dailyPlanSummary, setDailyPlanSummary] = useState(true);
  const [examReminders, setExamReminders] = useState(true);
  const [taskReminders, setTaskReminders] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [email, setEmail] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setPush(preferences?.push !== false);
      setDailyPlanSummary(preferences?.dailyPlanSummary !== false);
      setExamReminders(preferences?.examReminders !== false);
      setTaskReminders(preferences?.taskReminders !== false);
      setSoundEnabled(preferences?.soundEnabled !== false);
      setEmail(preferences?.email !== false);
      setError(null);
      setIsSubmitting(false);
    }
  }, [visible, preferences]);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      await onSave({
        push,
        dailyPlanSummary,
        examReminders,
        taskReminders,
        soundEnabled,
        email,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to update notification settings.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Notifications & Alerts</Text>
              <Text style={styles.headerSubtitle}>Manage study reminders and audio alerts</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              activeOpacity={0.7}
              disabled={isSubmitting}
            >
              <X size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Push Notifications */}
            <View style={styles.toggleRow}>
              <View style={[styles.iconWrapper, { backgroundColor: Colors.primaryFaded }]}>
                <Bell size={18} color={Colors.primary} />
              </View>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleTitle}>Push Notifications</Text>
                <Text style={styles.toggleSub}>Receive alerts and study reminders on this device</Text>
              </View>
              <Switch
                value={push}
                onValueChange={setPush}
                thumbColor="#FFFFFF"
                trackColor={{ false: Colors.border, true: Colors.primary }}
              />
            </View>

            <View style={styles.separator} />

            {/* Daily Study Summary */}
            <View style={styles.toggleRow}>
              <View style={[styles.iconWrapper, { backgroundColor: 'rgba(34, 211, 238, 0.15)' }]}>
                <Calendar size={18} color={Colors.secondary} />
              </View>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleTitle}>Daily Study Plan</Text>
                <Text style={styles.toggleSub}>Morning reminder with today&apos;s scheduled tasks and study blocks</Text>
              </View>
              <Switch
                value={dailyPlanSummary}
                onValueChange={setDailyPlanSummary}
                disabled={!push}
                thumbColor="#FFFFFF"
                trackColor={{ false: Colors.border, true: Colors.secondary }}
              />
            </View>

            <View style={styles.separator} />

            {/* Exam Countdown Alerts */}
            <View style={styles.toggleRow}>
              <View style={[styles.iconWrapper, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                <AlertCircle size={18} color={Colors.error} />
              </View>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleTitle}>Exam Countdown Alerts</Text>
                <Text style={styles.toggleSub}>Urgent alerts 3 days, 1 day, and morning before exams</Text>
              </View>
              <Switch
                value={examReminders}
                onValueChange={setExamReminders}
                disabled={!push}
                thumbColor="#FFFFFF"
                trackColor={{ false: Colors.border, true: Colors.error }}
              />
            </View>

            <View style={styles.separator} />

            {/* Task Deadline Alerts */}
            <View style={styles.toggleRow}>
              <View style={[styles.iconWrapper, { backgroundColor: 'rgba(34, 197, 94, 0.15)' }]}>
                <CheckCircle size={18} color={Colors.success} />
              </View>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleTitle}>Task Deadline Alerts</Text>
                <Text style={styles.toggleSub}>Notify before tasks are overdue</Text>
              </View>
              <Switch
                value={taskReminders}
                onValueChange={setTaskReminders}
                disabled={!push}
                thumbColor="#FFFFFF"
                trackColor={{ false: Colors.border, true: Colors.success }}
              />
            </View>

            <View style={styles.separator} />

            {/* Sound & Haptic Alerts */}
            <View style={styles.toggleRow}>
              <View style={[styles.iconWrapper, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                <Volume2 size={18} color={Colors.warning} />
              </View>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleTitle}>Timer Audio & Chimes</Text>
                <Text style={styles.toggleSub}>Play audio chime when focus & break timers end</Text>
              </View>
              <Switch
                value={soundEnabled}
                onValueChange={setSoundEnabled}
                thumbColor="#FFFFFF"
                trackColor={{ false: Colors.border, true: Colors.warning }}
              />
            </View>

            <View style={styles.separator} />

            {/* Email Summaries */}
            <View style={styles.toggleRow}>
              <View style={[styles.iconWrapper, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
                <Mail size={18} color="#A855F7" />
              </View>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleTitle}>Email Digest</Text>
                <Text style={styles.toggleSub}>Weekly performance and streak milestone summaries</Text>
              </View>
              <Switch
                value={email}
                onValueChange={setEmail}
                thumbColor="#FFFFFF"
                trackColor={{ false: Colors.border, true: '#A855F7' }}
              />
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              activeOpacity={0.8}
              disabled={isSubmitting}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveBtn, isSubmitting && styles.btnDisabled]}
              onPress={handleSubmit}
              activeOpacity={0.8}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveBtnText}>Save Preferences</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  sheetContainer: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
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
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderLeftWidth: 3,
    borderLeftColor: Colors.error,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    borderRadius: Radius.xs,
  },
  errorText: {
    color: Colors.error,
    fontSize: FontSize.xs,
  },
  body: {
    maxHeight: 420,
  },
  bodyContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  toggleInfo: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  toggleTitle: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  toggleSub: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: 2,
    lineHeight: 16,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.card,
  },
  cancelBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  saveBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 140,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  btnDisabled: {
    opacity: 0.6,
  },
});

export default NotificationPreferencesModal;

