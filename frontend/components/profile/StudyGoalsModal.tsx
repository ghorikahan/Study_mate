import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X, Target, Clock, Zap, Flame } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Radius, Spacing, FontSize, FontWeight } from '../../constants/theme';
import { UserPreferences } from '../../types/auth';

interface StudyGoalsModalProps {
  visible: boolean;
  preferences: UserPreferences | undefined;
  onClose: () => void;
  onSave: (data: {
    weeklyStudyGoalHours: number;
    dailyStudyGoalMinutes: number;
    defaultFocusMinutes: number;
  }) => Promise<void>;
}

const WEEKLY_GOAL_CHIPS = [10, 15, 20, 25, 30, 40];
const DAILY_GOAL_CHIPS = [30, 60, 90, 120, 180, 240];
const FOCUS_CHIPS = [15, 25, 45, 50, 60];

export const StudyGoalsModal: React.FC<StudyGoalsModalProps> = ({
  visible,
  preferences,
  onClose,
  onSave,
}) => {
  const [weeklyHours, setWeeklyHours] = useState(20);
  const [dailyMinutes, setDailyMinutes] = useState(120);
  const [focusMinutes, setFocusMinutes] = useState(25);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible && preferences) {
      setWeeklyHours(preferences.weeklyStudyGoalHours || 20);
      setDailyMinutes(preferences.dailyStudyGoalMinutes || 120);
      setFocusMinutes(preferences.defaultFocusMinutes || 25);
      setError(null);
      setIsSubmitting(false);
    }
  }, [visible, preferences]);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      await onSave({
        weeklyStudyGoalHours: weeklyHours,
        dailyStudyGoalMinutes: dailyMinutes,
        defaultFocusMinutes: focusMinutes,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to update study goals.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const avgHoursPerDay = (weeklyHours / 7).toFixed(1);

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
              <Text style={styles.headerTitle}>Study Goals</Text>
              <Text style={styles.headerSubtitle}>Set targets that challenge & inspire you</Text>
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
            {/* Calculation summary callout */}
            <View style={styles.summaryCallout}>
              <Flame size={20} color={Colors.warning} style={{ marginRight: 8 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.summaryCalloutTitle}>
                  {weeklyHours} Hours / Week Goal
                </Text>
                <Text style={styles.summaryCalloutSub}>
                  That equals ~{avgHoursPerDay} hrs of focused learning per day.
                </Text>
              </View>
            </View>

            {/* Weekly Target Hours */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Target size={16} color={Colors.primary} style={{ marginRight: 6 }} />
                <Text style={styles.sectionTitle}>Weekly Study Target</Text>
                <Text style={styles.selectedValue}>{weeklyHours} hrs</Text>
              </View>
              <View style={styles.chipsGrid}>
                {WEEKLY_GOAL_CHIPS.map((hrs) => {
                  const isSelected = weeklyHours === hrs;
                  return (
                    <TouchableOpacity
                      key={hrs}
                      style={[styles.chip, isSelected && styles.chipSelected]}
                      onPress={() => setWeeklyHours(hrs)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                        {hrs}h / wk
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Daily Target Minutes */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Clock size={16} color={Colors.secondary} style={{ marginRight: 6 }} />
                <Text style={styles.sectionTitle}>Daily Study Target</Text>
                <Text style={styles.selectedValue}>
                  {dailyMinutes >= 60
                    ? `${(dailyMinutes / 60).toFixed(1)} hrs`
                    : `${dailyMinutes} mins`}
                </Text>
              </View>
              <View style={styles.chipsGrid}>
                {DAILY_GOAL_CHIPS.map((mins) => {
                  const isSelected = dailyMinutes === mins;
                  const label = mins >= 60 ? `${mins / 60}h` : `${mins}m`;
                  return (
                    <TouchableOpacity
                      key={mins}
                      style={[styles.chip, isSelected && styles.chipSelectedSecondary]}
                      onPress={() => setDailyMinutes(mins)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          isSelected && styles.chipTextSelected,
                        ]}
                      >
                        {label} / day
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Default Focus Session Duration */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Zap size={16} color={Colors.warning} style={{ marginRight: 6 }} />
                <Text style={styles.sectionTitle}>Default Focus Session</Text>
                <Text style={styles.selectedValue}>{focusMinutes} mins</Text>
              </View>
              <View style={styles.chipsGrid}>
                {FOCUS_CHIPS.map((mins) => {
                  const isSelected = focusMinutes === mins;
                  return (
                    <TouchableOpacity
                      key={mins}
                      style={[styles.chip, isSelected && styles.chipSelectedWarning]}
                      onPress={() => setFocusMinutes(mins)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          isSelected && styles.chipTextSelected,
                        ]}
                      >
                        {mins} mins
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
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
                <Text style={styles.saveBtnText}>Save Goals</Text>
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
    maxHeight: 400,
  },
  bodyContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  summaryCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  summaryCalloutTitle: {
    color: Colors.warning,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  summaryCalloutSub: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    flex: 1,
  },
  selectedValue: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  chipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipSelected: {
    backgroundColor: Colors.primaryFaded,
    borderColor: Colors.primary,
  },
  chipSelectedSecondary: {
    backgroundColor: 'rgba(34, 211, 238, 0.15)',
    borderColor: Colors.secondary,
  },
  chipSelectedWarning: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: Colors.warning,
  },
  chipText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontWeight: FontWeight.bold,
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
    minWidth: 120,
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

export default StudyGoalsModal;

