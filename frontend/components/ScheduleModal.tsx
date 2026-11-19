import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { X, Clock, BookOpen, AlignLeft, Calendar, AlertCircle } from 'lucide-react-native';
import { Colors } from '../constants/colors';
import { FontSize, FontWeight, Spacing, Radius } from '../constants/theme';
import { TimetableEntry, CreateTimetableInput, UpdateTimetableInput } from '../types/timetable';

// ─── Subject Suggestions ────────────────────────────────────────────────────
const SUBJECT_SUGGESTIONS = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science',
  'English', 'History', 'Geography', 'Economics', 'Psychology',
];

// ─── Subject Colors ──────────────────────────────────────────────────────────
const SUBJECT_COLORS = [
  '#8B5CF6', '#22D3EE', '#10B981', '#F59E0B', '#EF4444',
  '#3B82F6', '#EC4899', '#F97316', '#14B8A6', '#6366F1',
];

// ─── Time Presets ────────────────────────────────────────────────────────────
const TIME_SLOTS = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30',
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30',
  '21:00', '21:30', '22:00',
];

// ─── Duration Chips ───────────────────────────────────────────────────────────
const DURATION_CHIPS = [
  { label: '30m', minutes: 30 },
  { label: '1h', minutes: 60 },
  { label: '1.5h', minutes: 90 },
  { label: '2h', minutes: 120 },
  { label: '2.5h', minutes: 150 },
  { label: '3h', minutes: 180 },
];

// ─── Helper: add minutes to HH:MM ────────────────────────────────────────────
const addMinutesToTime = (hhmm: string, minutes: number): string => {
  const [h, m] = hhmm.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
};

const toMinutes = (hhmm: string): number => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

// ─── Props ───────────────────────────────────────────────────────────────────
interface ScheduleModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTimetableInput | UpdateTimetableInput) => Promise<void>;
  editEntry?: TimetableEntry | null;
  initialDate?: string; // YYYY-MM-DD
  existingSubjects?: string[];
}

// ─── Component ───────────────────────────────────────────────────────────────
const ScheduleModal: React.FC<ScheduleModalProps> = ({
  visible,
  onClose,
  onSubmit,
  editEntry,
  initialDate,
  existingSubjects = [],
}) => {
  const isEdit = !!editEntry;

  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [date, setDate] = useState(initialDate || new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [selectedColor, setSelectedColor] = useState('#8B5CF6');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Populate fields when editing
  useEffect(() => {
    if (editEntry) {
      setSubject(editEntry.subject || '');
      setTopic(editEntry.topic || '');
      setDate(
        editEntry.date
          ? (typeof editEntry.date === 'string'
              ? editEntry.date.split('T')[0]
              : new Date(editEntry.date).toISOString().split('T')[0])
          : (initialDate || new Date().toISOString().split('T')[0])
      );
      setStartTime(editEntry.startTime || '09:00');
      setEndTime(editEntry.endTime || '10:00');
      setSelectedColor(editEntry.color || '#8B5CF6');
      setNotes(editEntry.notes || '');
    } else {
      setSubject('');
      setTopic('');
      setDate(initialDate || new Date().toISOString().split('T')[0]);
      setStartTime('09:00');
      setEndTime('10:00');
      setSelectedColor('#8B5CF6');
      setNotes('');
    }
    setError(null);
  }, [editEntry, initialDate, visible]);

  // Auto-set color based on subject
  useEffect(() => {
    if (!isEdit && subject) {
      const idx = SUBJECT_SUGGESTIONS.indexOf(subject);
      if (idx !== -1) setSelectedColor(SUBJECT_COLORS[idx % SUBJECT_COLORS.length]);
    }
  }, [subject, isEdit]);

  const handleDurationChip = (minutes: number) => {
    setEndTime(addMinutesToTime(startTime, minutes));
  };

  const handleStartTimeChange = (time: string) => {
    setStartTime(time);
    // Keep duration if possible
    const dur = toMinutes(endTime) - toMinutes(startTime);
    if (dur > 0) {
      setEndTime(addMinutesToTime(time, dur));
    }
  };

  const validate = (): string | null => {
    if (!subject.trim()) return 'Subject is required';
    if (!date) return 'Date is required';
    const timeRegex = /^\d{2}:\d{2}$/;
    if (!timeRegex.test(startTime)) return 'Start time must be in HH:MM format';
    if (!timeRegex.test(endTime)) return 'End time must be in HH:MM format';
    if (toMinutes(startTime) >= toMinutes(endTime)) return 'End time must be after start time';
    if (toMinutes(endTime) - toMinutes(startTime) < 15) return 'Session must be at least 15 minutes';
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await onSubmit({
        subject: subject.trim(),
        topic: topic.trim(),
        date,
        startTime,
        endTime,
        color: selectedColor,
        notes: notes.trim(),
      });
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to save session';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const allSubjects = [...new Set([...existingSubjects, ...SUBJECT_SUGGESTIONS])];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{isEdit ? 'Edit Session' : 'Add Study Session'}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Error Banner */}
            {error && (
              <View style={styles.errorBanner}>
                <AlertCircle size={16} color={Colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Subject */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                <BookOpen size={13} color={Colors.primary} /> {'  '}Subject *
              </Text>
              <TextInput
                style={styles.input}
                value={subject}
                onChangeText={setSubject}
                placeholder="e.g. Mathematics"
                placeholderTextColor={Colors.textMuted}
              />
              {/* Subject chips */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                {allSubjects.slice(0, 10).map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.chip, subject === s && styles.chipActive]}
                    onPress={() => setSubject(s)}
                  >
                    <Text style={[styles.chipText, subject === s && styles.chipTextActive]}>
                      {s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Topic */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                <AlignLeft size={13} color={Colors.primary} /> {'  '}Topic / Chapter (optional)
              </Text>
              <TextInput
                style={styles.input}
                value={topic}
                onChangeText={setTopic}
                placeholder="e.g. Integration by Parts"
                placeholderTextColor={Colors.textMuted}
              />
            </View>

            {/* Date */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                <Calendar size={13} color={Colors.primary} /> {'  '}Date *
              </Text>
              <TextInput
                style={styles.input}
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numbers-and-punctuation"
              />
            </View>

            {/* Time pickers */}
            <View style={styles.timeRow}>
              {/* Start Time */}
              <View style={styles.timeField}>
                <Text style={styles.label}>Start Time *</Text>
                <ScrollView
                  style={styles.timeScroll}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled
                >
                  {TIME_SLOTS.map((t) => (
                    <TouchableOpacity
                      key={`s-${t}`}
                      style={[styles.timeOption, startTime === t && styles.timeOptionActive]}
                      onPress={() => handleStartTimeChange(t)}
                    >
                      <Text style={[styles.timeOptionText, startTime === t && styles.timeOptionTextActive]}>
                        {t}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* End Time */}
              <View style={styles.timeField}>
                <Text style={styles.label}>End Time *</Text>
                <ScrollView
                  style={styles.timeScroll}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled
                >
                  {TIME_SLOTS.map((t) => {
                    const isInvalid = toMinutes(t) <= toMinutes(startTime);
                    return (
                      <TouchableOpacity
                        key={`e-${t}`}
                        style={[
                          styles.timeOption,
                          endTime === t && styles.timeOptionActive,
                          isInvalid && styles.timeOptionDisabled,
                        ]}
                        onPress={() => !isInvalid && setEndTime(t)}
                        disabled={isInvalid}
                      >
                        <Text style={[
                          styles.timeOptionText,
                          endTime === t && styles.timeOptionTextActive,
                          isInvalid && styles.timeOptionTextDisabled,
                        ]}>
                          {t}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </View>

            {/* Duration chips */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                <Clock size={13} color={Colors.primary} /> {'  '}Quick Duration
              </Text>
              <View style={styles.durationRow}>
                {DURATION_CHIPS.map((d) => {
                  const computedEnd = addMinutesToTime(startTime, d.minutes);
                  const isSelected = endTime === computedEnd;
                  return (
                    <TouchableOpacity
                      key={d.label}
                      style={[styles.durationChip, isSelected && styles.durationChipActive]}
                      onPress={() => handleDurationChip(d.minutes)}
                    >
                      <Text style={[styles.durationText, isSelected && styles.durationTextActive]}>
                        {d.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Color picker */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Session Color</Text>
              <View style={styles.colorRow}>
                {SUBJECT_COLORS.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[
                      styles.colorDot,
                      { backgroundColor: c },
                      selectedColor === c && styles.colorDotSelected,
                    ]}
                    onPress={() => setSelectedColor(c)}
                  />
                ))}
              </View>
            </View>

            {/* Notes */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Notes (optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                placeholder="e.g. Focus on chapters 3–5, review past papers"
                placeholderTextColor={Colors.textMuted}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={loading}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitText}>{isEdit ? 'Save Changes' : 'Add Session'}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    maxHeight: '92%',
    paddingBottom: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold as any,
    color: Colors.text,
  },
  closeBtn: {
    padding: Spacing.xs,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: Spacing.lg,
    gap: Spacing.base,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.error}18`,
    borderWidth: 1,
    borderColor: `${Colors.error}40`,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    gap: Spacing.xs,
  },
  errorText: {
    color: Colors.error,
    fontSize: FontSize.sm,
    flex: 1,
  },
  fieldGroup: {
    gap: Spacing.xs,
  },
  label: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium as any,
    marginBottom: 2,
  },
  input: {
    backgroundColor: Colors.cardSecondary,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.text,
    fontSize: FontSize.base,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  textArea: {
    minHeight: 72,
    paddingTop: Spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    marginTop: Spacing.xs,
  },
  chip: {
    backgroundColor: Colors.cardSecondary,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    marginRight: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: FontWeight.semibold as any,
  },
  timeRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  timeField: {
    flex: 1,
    gap: Spacing.xs,
  },
  timeScroll: {
    maxHeight: 160,
    backgroundColor: Colors.cardSecondary,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  timeOption: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  timeOptionActive: {
    backgroundColor: Colors.primary,
  },
  timeOptionDisabled: {
    opacity: 0.3,
  },
  timeOptionText: {
    color: Colors.text,
    fontSize: FontSize.sm,
    textAlign: 'center',
  },
  timeOptionTextActive: {
    color: '#fff',
    fontWeight: FontWeight.bold as any,
  },
  timeOptionTextDisabled: {
    color: Colors.textMuted,
  },
  durationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  durationChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    backgroundColor: Colors.cardSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  durationChipActive: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  durationText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  durationTextActive: {
    color: '#fff',
    fontWeight: FontWeight.semibold as any,
  },
  colorRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  colorDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  colorDotSelected: {
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  footer: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  cancelText: {
    color: Colors.textSecondary,
    fontSize: FontSize.base,
    fontWeight: FontWeight.medium as any,
  },
  submitBtn: {
    flex: 2,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: '#fff',
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold as any,
  },
});

export default ScheduleModal;

