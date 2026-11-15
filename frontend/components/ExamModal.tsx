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
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Exam, ExamPriority, CreateExamInput, UpdateExamInput, SyllabusTopic } from '../types/exam';

// ─── Theme ────────────────────────────────────────────────────────────────────
const C = {
  bg: '#0B0D12',
  card: '#151923',
  cardAlt: '#1C2333',
  primary: '#8B5CF6',
  secondary: '#22D3EE',
  text: '#F9FAFB',
  textMuted: '#6B7280',
  border: '#374151',
  error: '#EF4444',
  warning: '#F59E0B',
  success: '#10B981',
};

const PRIORITY_COLORS: Record<ExamPriority, string> = {
  urgent: '#EF4444',
  high: '#F59E0B',
  medium: '#8B5CF6',
  low: '#10B981',
};

const PRIORITY_LABELS: Record<ExamPriority, string> = {
  urgent: '🔴 Urgent',
  high: '🟠 High',
  medium: '🟣 Medium',
  low: '🟢 Low',
};

const SUBJECT_SUGGESTIONS = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English',
  'History', 'Geography', 'Computer Science', 'Economics', 'Statistics',
];

const DURATION_PRESETS = [
  { label: '1h', minutes: 60 },
  { label: '2h', minutes: 120 },
  { label: '3h', minutes: 180 },
  { label: '4h', minutes: 240 },
];

// ─── Props ────────────────────────────────────────────────────────────────────
interface ExamModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: CreateExamInput | UpdateExamInput) => Promise<void>;
  editExam?: Exam | null;
}

// ─── Component ────────────────────────────────────────────────────────────────
const ExamModal: React.FC<ExamModalProps> = ({ visible, onClose, onSubmit, editExam }) => {
  const isEdit = Boolean(editExam);

  // Form state
  const [examTitle, setExamTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [examDate, setExamDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [durationMinutes, setDurationMinutes] = useState(180);
  const [location, setLocation] = useState('');
  const [targetScore, setTargetScore] = useState('');
  const [priority, setPriority] = useState<ExamPriority>('medium');
  const [notes, setNotes] = useState('');
  const [topics, setTopics] = useState<{ topicName: string; isCovered: boolean }[]>([]);
  const [newTopic, setNewTopic] = useState('');

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [showSubjectSuggestions, setShowSubjectSuggestions] = useState(false);

  // Populate form for edit mode
  useEffect(() => {
    if (editExam) {
      setExamTitle(editExam.examTitle);
      setSubject(editExam.subject);
      setExamDate(editExam.examDate.split('T')[0]);
      setStartTime(editExam.startTime || '09:00');
      setDurationMinutes(editExam.durationMinutes || 180);
      setLocation(editExam.location || '');
      setTargetScore(editExam.targetScore != null ? String(editExam.targetScore) : '');
      setPriority(editExam.priority || 'medium');
      setNotes(editExam.notes || '');
      setTopics(
        (editExam.syllabusTopics || []).map((t: SyllabusTopic) => ({
          topicName: t.topicName,
          isCovered: t.isCovered,
        }))
      );
    } else {
      resetForm();
    }
  }, [editExam, visible]);

  const resetForm = () => {
    setExamTitle('');
    setSubject('');
    setExamDate('');
    setStartTime('09:00');
    setDurationMinutes(180);
    setLocation('');
    setTargetScore('');
    setPriority('medium');
    setNotes('');
    setTopics([]);
    setNewTopic('');
    setFormError('');
  };

  const validate = (): boolean => {
    if (!examTitle.trim()) { setFormError('Exam title is required.'); return false; }
    if (!subject.trim()) { setFormError('Subject is required.'); return false; }
    if (!examDate.trim()) { setFormError('Exam date is required.'); return false; }
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(examDate)) { setFormError('Date must be in YYYY-MM-DD format.'); return false; }
    if (isNaN(new Date(examDate).getTime())) { setFormError('Invalid date.'); return false; }
    const timeRegex = /^([0-1]?\d|2[0-3]):[0-5]\d$/;
    if (!timeRegex.test(startTime)) { setFormError('Start time must be in HH:MM format.'); return false; }
    if (targetScore !== '' && (isNaN(Number(targetScore)) || Number(targetScore) < 0 || Number(targetScore) > 100)) {
      setFormError('Target score must be between 0 and 100.');
      return false;
    }
    setFormError('');
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload: CreateExamInput = {
        examTitle: examTitle.trim(),
        subject: subject.trim(),
        examDate,
        startTime,
        durationMinutes,
        priority,
        notes: notes.trim(),
        syllabusTopics: topics,
      };
      if (location.trim()) payload.location = location.trim();
      if (targetScore !== '') payload.targetScore = Number(targetScore);

      await onSubmit(payload);
      resetForm();
      onClose();
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message ??
            'Failed to save exam'
          : 'Failed to save exam';
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitting) return;
    resetForm();
    onClose();
  };

  const addTopic = () => {
    const name = newTopic.trim();
    if (!name) return;
    setTopics((prev) => [...prev, { topicName: name, isCovered: false }]);
    setNewTopic('');
  };

  const removeTopic = (idx: number) => {
    setTopics((prev) => prev.filter((_, i) => i !== idx));
  };

  const toggleTopic = (idx: number) => {
    setTopics((prev) =>
      prev.map((t, i) => (i === idx ? { ...t, isCovered: !t.isCovered } : t))
    );
  };

  const filteredSuggestions = SUBJECT_SUGGESTIONS.filter((s) =>
    s.toLowerCase().includes(subject.toLowerCase()) && s !== subject
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{isEdit ? '✏️ Edit Exam' : '📚 New Exam'}</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.body}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Error Banner */}
            {formError ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>⚠️ {formError}</Text>
              </View>
            ) : null}

            {/* Subject */}
            <Text style={styles.label}>Subject *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Mathematics"
              placeholderTextColor={C.textMuted}
              value={subject}
              onChangeText={(t) => { setSubject(t); setShowSubjectSuggestions(true); }}
              onBlur={() => setTimeout(() => setShowSubjectSuggestions(false), 150)}
            />
            {showSubjectSuggestions && filteredSuggestions.length > 0 && (
              <View style={styles.suggestions}>
                {filteredSuggestions.slice(0, 5).map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={styles.suggestionItem}
                    onPress={() => { setSubject(s); setShowSubjectSuggestions(false); }}
                  >
                    <Text style={styles.suggestionText}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Subject chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {SUBJECT_SUGGESTIONS.slice(0, 6).map((s) => (
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

            {/* Exam Title */}
            <Text style={styles.label}>Exam Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Midterm, Final Exam, Unit Test"
              placeholderTextColor={C.textMuted}
              value={examTitle}
              onChangeText={setExamTitle}
            />

            {/* Date */}
            <Text style={styles.label}>Exam Date * (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              placeholder="2026-12-25"
              placeholderTextColor={C.textMuted}
              value={examDate}
              onChangeText={setExamDate}
              keyboardType="numeric"
              maxLength={10}
            />

            {/* Start Time */}
            <Text style={styles.label}>Start Time (HH:MM)</Text>
            <TextInput
              style={styles.input}
              placeholder="09:00"
              placeholderTextColor={C.textMuted}
              value={startTime}
              onChangeText={setStartTime}
              keyboardType="numeric"
              maxLength={5}
            />

            {/* Duration */}
            <Text style={styles.label}>Duration</Text>
            <View style={styles.row}>
              {DURATION_PRESETS.map((p) => (
                <TouchableOpacity
                  key={p.minutes}
                  style={[styles.presetBtn, durationMinutes === p.minutes && styles.presetBtnActive]}
                  onPress={() => setDurationMinutes(p.minutes)}
                >
                  <Text
                    style={[
                      styles.presetBtnText,
                      durationMinutes === p.minutes && styles.presetBtnTextActive,
                    ]}
                  >
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Priority */}
            <Text style={styles.label}>Priority</Text>
            <View style={styles.row}>
              {(Object.keys(PRIORITY_LABELS) as ExamPriority[]).map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.priorityBtn,
                    priority === p && { backgroundColor: PRIORITY_COLORS[p] + '33', borderColor: PRIORITY_COLORS[p] },
                  ]}
                  onPress={() => setPriority(p)}
                >
                  <Text
                    style={[
                      styles.priorityBtnText,
                      priority === p && { color: PRIORITY_COLORS[p] },
                    ]}
                  >
                    {PRIORITY_LABELS[p]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Target Score */}
            <Text style={styles.label}>Target Score (0–100)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 85"
              placeholderTextColor={C.textMuted}
              value={targetScore}
              onChangeText={setTargetScore}
              keyboardType="numeric"
              maxLength={3}
            />

            {/* Location */}
            <Text style={styles.label}>Location (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Hall A, Room 201"
              placeholderTextColor={C.textMuted}
              value={location}
              onChangeText={setLocation}
            />

            {/* Syllabus Topics */}
            <Text style={styles.label}>Syllabus Topics</Text>
            <View style={styles.topicInputRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                placeholder="Add a topic..."
                placeholderTextColor={C.textMuted}
                value={newTopic}
                onChangeText={setNewTopic}
                onSubmitEditing={addTopic}
                returnKeyType="done"
              />
              <TouchableOpacity style={styles.addTopicBtn} onPress={addTopic}>
                <Text style={styles.addTopicBtnText}>+</Text>
              </TouchableOpacity>
            </View>

            {topics.map((t, idx) => (
              <View key={idx} style={styles.topicItem}>
                <TouchableOpacity onPress={() => toggleTopic(idx)} style={styles.topicCheck}>
                  <Text style={styles.topicCheckText}>{t.isCovered ? '✅' : '⬜'}</Text>
                </TouchableOpacity>
                <Text style={[styles.topicName, t.isCovered && styles.topicNameDone]}>
                  {t.topicName}
                </Text>
                <TouchableOpacity onPress={() => removeTopic(idx)} style={styles.topicRemove}>
                  <Text style={styles.topicRemoveText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}

            {/* Notes */}
            <Text style={styles.label}>Preparation Notes (optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Study tips, resources, reminders..."
              placeholderTextColor={C.textMuted}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              maxLength={500}
            />
            <Text style={styles.charCount}>{notes.length}/500</Text>

            <View style={{ height: 24 }} />
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleClose} disabled={submitting}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>{isEdit ? 'Update Exam' : 'Create Exam'}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: C.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: C.text },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.cardAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: { color: C.textMuted, fontSize: 14 },
  body: { paddingHorizontal: 20, paddingTop: 12 },
  errorBanner: {
    backgroundColor: C.error + '22',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    borderLeftWidth: 3,
    borderLeftColor: C.error,
  },
  errorText: { color: C.error, fontSize: 13 },
  label: { color: C.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 6, marginTop: 14, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    backgroundColor: C.cardAlt,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    color: C.text,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    marginBottom: 4,
  },
  textArea: { height: 80, textAlignVertical: 'top', paddingTop: 11 },
  charCount: { color: C.textMuted, fontSize: 11, textAlign: 'right', marginBottom: 4 },
  suggestions: {
    backgroundColor: C.cardAlt,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    marginTop: -4,
    marginBottom: 4,
  },
  suggestionItem: { paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  suggestionText: { color: C.text, fontSize: 14 },
  chipRow: { marginTop: 8, marginBottom: 4 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: C.cardAlt,
    borderWidth: 1,
    borderColor: C.border,
    marginRight: 8,
  },
  chipActive: { backgroundColor: C.primary + '22', borderColor: C.primary },
  chipText: { color: C.textMuted, fontSize: 12 },
  chipTextActive: { color: C.primary, fontWeight: '600' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  presetBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: C.cardAlt,
    borderWidth: 1,
    borderColor: C.border,
  },
  presetBtnActive: { backgroundColor: C.primary + '22', borderColor: C.primary },
  presetBtnText: { color: C.textMuted, fontSize: 13, fontWeight: '600' },
  presetBtnTextActive: { color: C.primary },
  priorityBtn: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: C.cardAlt,
    borderWidth: 1,
    borderColor: C.border,
  },
  priorityBtnText: { color: C.textMuted, fontSize: 12, fontWeight: '600' },
  topicInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  addTopicBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: C.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addTopicBtnText: { color: '#fff', fontSize: 22, fontWeight: '300' },
  topicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.cardAlt,
    borderRadius: 10,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: C.border,
  },
  topicCheck: { marginRight: 10 },
  topicCheckText: { fontSize: 16 },
  topicName: { flex: 1, color: C.text, fontSize: 14 },
  topicNameDone: { textDecorationLine: 'line-through', color: C.textMuted },
  topicRemove: { paddingLeft: 8 },
  topicRemoveText: { color: C.error, fontSize: 14 },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: C.cardAlt,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  cancelBtnText: { color: C.textMuted, fontWeight: '600', fontSize: 15 },
  submitBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: C.primary,
    alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});

export default ExamModal;

