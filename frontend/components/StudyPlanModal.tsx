import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  X,
  BookOpen,
  Calendar,
  Clock,
  AlertCircle,
  Tag,
  CheckCircle2,
  FileText,
} from 'lucide-react-native';
import { Colors } from '../constants/colors';
import { FontSize, FontWeight, Spacing, Radius } from '../constants/theme';
import { Button, Input, Card, Badge } from './ui';
import {
  StudyPlan,
  CreateStudyPlanInput,
  StudyPlanPriority,
} from '../types/studyPlan';

interface StudyPlanModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: CreateStudyPlanInput) => Promise<void>;
  initialData?: StudyPlan | null;
  existingSubjects?: string[];
}

const DEFAULT_SUBJECTS = [
  'Mathematics',
  'Computer Science',
  'Physics',
  'Chemistry',
  'Biology',
  'History',
  'Literature',
];

const PRIORITIES: { label: string; value: StudyPlanPriority; color: string }[] = [
  { label: 'Low', value: 'low', color: Colors.textMuted },
  { label: 'Medium', value: 'medium', color: Colors.primary },
  { label: 'High', value: 'high', color: Colors.warning },
  { label: 'Urgent', value: 'urgent', color: Colors.error },
];

const DURATION_PRESETS = [30, 45, 60, 90, 120];

export const StudyPlanModal: React.FC<StudyPlanModalProps> = ({
  visible,
  onClose,
  onSubmit,
  initialData,
  existingSubjects = [],
}) => {
  const isEditing = Boolean(initialData);

  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00 AM');
  const [duration, setDuration] = useState<number>(60);
  const [priority, setPriority] = useState<StudyPlanPriority>('medium');
  const [description, setDescription] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Initialize form when modal opens or initialData changes
  useEffect(() => {
    if (initialData) {
      setSubject(initialData.subject || '');
      setTopic(initialData.topic || initialData.title || '');
      setDate(
        initialData.date
          ? new Date(initialData.date).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0]
      );
      setStartTime(initialData.startTime || '09:00 AM');
      setDuration(initialData.duration || 60);
      setPriority(initialData.priority || 'medium');
      setDescription(initialData.description || '');
    } else {
      // Default new plan values
      setSubject('');
      setTopic('');
      setDate(new Date().toISOString().split('T')[0]);
      setStartTime('09:00 AM');
      setDuration(60);
      setPriority('medium');
      setDescription('');
    }
    setErrors({});
    setFormError(null);
  }, [initialData, visible]);

  // Combine default and existing subjects without duplicates
  const subjectList = Array.from(
    new Set([...existingSubjects, ...DEFAULT_SUBJECTS])
  ).filter(Boolean);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    setFormError(null);

    if (!subject.trim()) {
      newErrors.subject = 'Subject is required';
    }
    if (!topic.trim()) {
      newErrors.topic = 'Topic or title is required';
    } else if (topic.trim().length < 2) {
      newErrors.topic = 'Topic must be at least 2 characters';
    }
    if (!date.trim()) {
      newErrors.date = 'Date is required (YYYY-MM-DD)';
    } else if (isNaN(new Date(date).getTime())) {
      newErrors.date = 'Please enter a valid date (YYYY-MM-DD)';
    }
    if (!startTime.trim()) {
      newErrors.startTime = 'Start time is required';
    }
    if (!duration || duration < 5) {
      newErrors.duration = 'Duration must be at least 5 minutes';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    try {
      setSubmitting(true);
      setFormError(null);

      await onSubmit({
        subject: subject.trim(),
        topic: topic.trim(),
        title: topic.trim(),
        date: new Date(date).toISOString(),
        startTime: startTime.trim(),
        duration,
        priority,
        description: description.trim(),
      });

      onClose();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save study plan');
    } finally {
      setSubmitting(false);
    }
  };

  // Quick date pickers
  const handleSetQuickDate = (daysFromNow: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    setDate(d.toISOString().split('T')[0]);
    if (errors.date) {
      setErrors((prev) => ({ ...prev, date: '' }));
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={onClose}
            activeOpacity={1}
          />

          <View style={styles.modalContainer}>
            {/* ── Modal Header ── */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {isEditing ? 'Edit Study Plan' : 'New Study Plan'}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {isEditing
                    ? 'Update your session details and schedule'
                    : 'Schedule a focused study session'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <X size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* ── Form Error Banner ── */}
              {formError && (
                <View style={styles.errorBanner}>
                  <AlertCircle size={18} color={Colors.error} />
                  <Text style={styles.errorBannerText}>{formError}</Text>
                </View>
              )}

              {/* ── Subject Field ── */}
              <Input
                label="Subject"
                required
                placeholder="e.g. Mathematics, Operating Systems"
                value={subject}
                onChangeText={(text) => {
                  setSubject(text);
                  if (errors.subject) setErrors((prev) => ({ ...prev, subject: '' }));
                }}
                leftIcon={<BookOpen size={18} color={Colors.textMuted} />}
                error={errors.subject}
              />

              {/* ── Subject Quick Suggestions ── */}
              <View style={styles.quickSuggestionsRow}>
                <Text style={styles.quickSuggestionsLabel}>Suggestions:</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.suggestionsScroll}
                >
                  {subjectList.slice(0, 6).map((s) => (
                    <TouchableOpacity
                      key={s}
                      style={[
                        styles.suggestionPill,
                        subject.toLowerCase() === s.toLowerCase() &&
                          styles.suggestionPillActive,
                      ]}
                      onPress={() => {
                        setSubject(s);
                        if (errors.subject) {
                          setErrors((prev) => ({ ...prev, subject: '' }));
                        }
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.suggestionText,
                          subject.toLowerCase() === s.toLowerCase() &&
                            styles.suggestionTextActive,
                        ]}
                      >
                        {s}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* ── Topic / Title Field ── */}
              <Input
                label="Topic / Chapter"
                required
                placeholder="e.g. Dynamic Programming & Memoization"
                value={topic}
                onChangeText={(text) => {
                  setTopic(text);
                  if (errors.topic) setErrors((prev) => ({ ...prev, topic: '' }));
                }}
                leftIcon={<Tag size={18} color={Colors.textMuted} />}
                error={errors.topic}
              />

              {/* ── Date Field ── */}
              <Input
                label="Date (YYYY-MM-DD)"
                required
                placeholder="YYYY-MM-DD"
                value={date}
                onChangeText={(text) => {
                  setDate(text);
                  if (errors.date) setErrors((prev) => ({ ...prev, date: '' }));
                }}
                leftIcon={<Calendar size={18} color={Colors.textMuted} />}
                error={errors.date}
              />

              {/* ── Quick Date Buttons ── */}
              <View style={styles.quickDatesRow}>
                <TouchableOpacity
                  style={styles.quickDateBtn}
                  onPress={() => handleSetQuickDate(0)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.quickDateText}>Today</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickDateBtn}
                  onPress={() => handleSetQuickDate(1)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.quickDateText}>Tomorrow</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickDateBtn}
                  onPress={() => handleSetQuickDate(3)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.quickDateText}>+3 Days</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickDateBtn}
                  onPress={() => handleSetQuickDate(7)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.quickDateText}>Next Week</Text>
                </TouchableOpacity>
              </View>

              {/* ── Start Time & Duration ── */}
              <View style={styles.row}>
                <View style={styles.col}>
                  <Input
                    label="Start Time"
                    required
                    placeholder="e.g. 10:00 AM"
                    value={startTime}
                    onChangeText={(text) => {
                      setStartTime(text);
                      if (errors.startTime) {
                        setErrors((prev) => ({ ...prev, startTime: '' }));
                      }
                    }}
                    leftIcon={<Clock size={18} color={Colors.textMuted} />}
                    error={errors.startTime}
                  />
                </View>
                <View style={styles.col}>
                  <Input
                    label="Duration (mins)"
                    required
                    placeholder="60"
                    keyboardType="number-pad"
                    value={String(duration)}
                    onChangeText={(text) => {
                      const num = parseInt(text, 10);
                      setDuration(isNaN(num) ? 0 : num);
                      if (errors.duration) {
                        setErrors((prev) => ({ ...prev, duration: '' }));
                      }
                    }}
                    leftIcon={<Clock size={18} color={Colors.secondary} />}
                    error={errors.duration}
                  />
                </View>
              </View>

              {/* ── Duration Presets ── */}
              <View style={styles.durationPresetsRow}>
                <Text style={styles.presetsLabel}>Quick duration:</Text>
                <View style={styles.presetsGroup}>
                  {DURATION_PRESETS.map((mins) => (
                    <TouchableOpacity
                      key={mins}
                      style={[
                        styles.presetChip,
                        duration === mins && styles.presetChipActive,
                      ]}
                      onPress={() => {
                        setDuration(mins);
                        if (errors.duration) {
                          setErrors((prev) => ({ ...prev, duration: '' }));
                        }
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.presetChipText,
                          duration === mins && styles.presetChipTextActive,
                        ]}
                      >
                        {mins}m
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* ── Priority Selector ── */}
              <View style={styles.prioritySection}>
                <Text style={styles.fieldLabel}>
                  Priority <Text style={styles.requiredStar}>*</Text>
                </Text>
                <View style={styles.priorityGrid}>
                  {PRIORITIES.map((p) => {
                    const isSelected = priority === p.value;
                    return (
                      <TouchableOpacity
                        key={p.value}
                        style={[
                          styles.priorityOption,
                          isSelected && {
                            borderColor: p.color,
                            backgroundColor: `${p.color}18`,
                          },
                        ]}
                        onPress={() => setPriority(p.value)}
                        activeOpacity={0.8}
                      >
                        <View
                          style={[
                            styles.priorityDot,
                            { backgroundColor: p.color },
                          ]}
                        />
                        <Text
                          style={[
                            styles.priorityLabel,
                            isSelected && { color: p.color, fontWeight: 'bold' },
                          ]}
                        >
                          {p.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* ── Description / Notes Field ── */}
              <Input
                label="Notes / Instructions (Optional)"
                placeholder="e.g. Read chapters 4-5 and solve practice problem set"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                inputStyle={styles.textArea}
                leftIcon={<FileText size={18} color={Colors.textMuted} />}
              />

              {/* ── Action Buttons ── */}
              <View style={styles.actionsRow}>
                <Button
                  title="Cancel"
                  variant="outline"
                  onPress={onClose}
                  style={styles.cancelBtn}
                />
                <Button
                  title={isEditing ? 'Save Changes' : 'Create Plan'}
                  variant="primary"
                  loading={submitting}
                  onPress={handleSave}
                  style={styles.saveBtn}
                  rightIcon={<CheckCircle2 size={18} color={Colors.white} />}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: Colors.border,
    paddingTop: Spacing.base,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  modalSubtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: Colors.cardSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScroll: {
    maxHeight: 520,
  },
  modalContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.xxl,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.errorFaded,
    borderWidth: 1,
    borderColor: Colors.error,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.base,
    gap: Spacing.sm,
  },
  errorBannerText: {
    color: Colors.error,
    fontSize: FontSize.sm,
    flex: 1,
  },
  quickSuggestionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.base,
    marginTop: -Spacing.xs,
  },
  quickSuggestionsLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginRight: Spacing.xs,
  },
  suggestionsScroll: {
    gap: Spacing.xs,
  },
  suggestionPill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    backgroundColor: Colors.cardSecondary,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  suggestionPillActive: {
    backgroundColor: Colors.primaryFaded,
    borderColor: Colors.primary,
  },
  suggestionText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
  },
  suggestionTextActive: {
    color: Colors.primary,
    fontWeight: FontWeight.semibold,
  },
  quickDatesRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.base,
    marginTop: -Spacing.xs,
  },
  quickDateBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    backgroundColor: Colors.cardSecondary,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickDateText: {
    color: Colors.secondary,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  col: {
    flex: 1,
  },
  durationPresetsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.base,
    marginTop: -Spacing.xs,
    gap: Spacing.sm,
  },
  presetsLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
  presetsGroup: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  presetChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    backgroundColor: Colors.cardSecondary,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  presetChipActive: {
    backgroundColor: Colors.secondaryFaded,
    borderColor: Colors.secondary,
  },
  presetChipText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
  },
  presetChipTextActive: {
    color: Colors.secondary,
    fontWeight: FontWeight.bold,
  },
  prioritySection: {
    marginBottom: Spacing.base,
  },
  fieldLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '500',
    marginBottom: Spacing.xs,
  },
  requiredStar: {
    color: Colors.error,
  },
  priorityGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  priorityOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.cardSecondary,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingVertical: Spacing.sm,
    gap: 6,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  priorityLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: 'top',
    paddingTop: Spacing.sm,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.base,
  },
  cancelBtn: {
    flex: 1,
  },
  saveBtn: {
    flex: 2,
  },
});

export default StudyPlanModal;
