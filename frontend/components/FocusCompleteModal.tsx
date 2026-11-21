import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Colors } from '../constants/colors';

const C = {
  bg: Colors.background,
  card: Colors.card,
  cardAlt: Colors.cardSecondary,
  primary: Colors.primary,
  secondary: Colors.secondary,
  text: Colors.text,
  textMuted: Colors.textMuted,
  border: Colors.border,
  error: Colors.error,
  warning: Colors.warning,
  success: Colors.success,
};

interface FocusCompleteModalProps {
  visible: boolean;
  subject: string;
  durationMinutes: number;
  saving: boolean;
  onSave: (rating: number, notes: string) => Promise<void>;
  onDismiss: () => void;
}

export const FocusCompleteModal: React.FC<FocusCompleteModalProps> = ({
  visible,
  subject,
  durationMinutes,
  saving,
  onSave,
  onDismiss,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleSave = async () => {
    try {
      setError('');
      await onSave(rating, notes);
      setNotes('');
      setRating(5);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message ??
            'Failed to save study session'
          : 'Failed to save study session';
      setError(msg);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.sheet}>
          {/* Trophy Header */}
          <View style={styles.celebrationRow}>
            <Text style={styles.trophy}>🏆</Text>
            <Text style={styles.headline}>Session Completed!</Text>
            <Text style={styles.subheadline}>
              You crushed <Text style={styles.highlight}>{durationMinutes} minutes</Text> of focus on{' '}
              <Text style={styles.highlight}>{subject}</Text>!
            </Text>
          </View>

          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          ) : null}

          {/* Rating */}
          <Text style={styles.sectionLabel}>How was your focus?</Text>
          <View style={styles.starRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                style={styles.starBtn}
                activeOpacity={0.7}
              >
                <Text style={[styles.starText, star <= rating ? styles.starFilled : styles.starEmpty]}>
                  ★
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.ratingDescriptor}>
            {rating === 5 ? '🔥 Deep & productive flow'
              : rating === 4 ? '✨ Great focus, few distractions'
              : rating === 3 ? '👌 Decent progress'
              : rating === 2 ? '⚠️ Struggled to focus'
              : '❌ Very distracted'}
          </Text>

          {/* Notes */}
          <Text style={styles.sectionLabel}>Session Notes (optional)</Text>
          <TextInput
            style={styles.textArea}
            placeholder="What topics did you complete? Any reminders for next time?"
            placeholderTextColor={C.textMuted}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            maxLength={300}
          />
          <Text style={styles.charCount}>{notes.length}/300</Text>

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.discardBtn} onPress={onDismiss} disabled={saving}>
              <Text style={styles.discardBtnText}>Discard</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>Save to History</Text>
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
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  sheet: {
    width: '100%',
    backgroundColor: C.card,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: C.primary,
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  celebrationRow: {
    alignItems: 'center',
    marginBottom: 20,
  },
  trophy: {
    fontSize: 48,
    marginBottom: 10,
  },
  headline: {
    fontSize: 22,
    fontWeight: '800',
    color: C.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  subheadline: {
    fontSize: 14,
    color: C.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  highlight: {
    color: C.secondary,
    fontWeight: '700',
  },
  errorBanner: {
    backgroundColor: C.error + '22',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: C.error,
  },
  errorText: {
    color: C.error,
    fontSize: 13,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: C.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  starRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 6,
  },
  starBtn: {
    padding: 4,
  },
  starText: {
    fontSize: 34,
  },
  starFilled: {
    color: C.warning,
  },
  starEmpty: {
    color: C.border,
  },
  ratingDescriptor: {
    textAlign: 'center',
    color: C.textMuted,
    fontSize: 13,
    marginBottom: 16,
  },
  textArea: {
    backgroundColor: C.cardAlt,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    color: C.text,
    padding: 12,
    fontSize: 14,
    height: 72,
    textAlignVertical: 'top',
  },
  charCount: {
    color: C.textMuted,
    fontSize: 11,
    textAlign: 'right',
    marginTop: 4,
    marginBottom: 18,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  discardBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: C.cardAlt,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  discardBtnText: {
    color: C.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: C.primary,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default FocusCompleteModal;

