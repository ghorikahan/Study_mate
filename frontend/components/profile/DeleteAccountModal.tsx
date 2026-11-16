import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import {
  X,
  AlertTriangle,
  Lock,
  Trash2,
  AlertCircle,
  FileX,
} from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Radius, Spacing, FontSize, FontWeight } from '../../constants/theme';
import { DeleteAccountInput } from '../../types/user';

interface DeleteAccountModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirmDelete: (data: DeleteAccountInput) => Promise<void>;
}

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  visible,
  onClose,
  onConfirmDelete,
}) => {
  const [password, setPassword] = useState('');
  const [confirmationText, setConfirmationText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReset = () => {
    setPassword('');
    setConfirmationText('');
    setError(null);
    setIsSubmitting(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const isDeleteEnabled =
    password.length > 0 && confirmationText.trim().toUpperCase() === 'DELETE';

  const handleSubmit = async () => {
    if (!password) {
      setError('Please enter your account password.');
      return;
    }
    if (confirmationText.trim().toUpperCase() !== 'DELETE') {
      setError('Please type "DELETE" to confirm permanent deletion.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onConfirmDelete({
        password,
        confirmationText: confirmationText.trim().toUpperCase(),
      });
      handleClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete account. Please verify password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.dangerIconBadge}>
                <AlertTriangle size={18} color={Colors.error} />
              </View>
              <View>
                <Text style={styles.headerTitle}>Delete Account</Text>
                <Text style={styles.headerSubtitle}>Danger Zone • Irreversible Action</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeBtn}
              activeOpacity={0.7}
              disabled={isSubmitting}
            >
              <X size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {error && (
            <View style={styles.errorBanner}>
              <AlertCircle size={16} color={Colors.error} style={{ marginRight: 6 }} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Warning Box */}
            <View style={styles.warningBox}>
              <Text style={styles.warningTitle}>
                Are you sure you want to delete your StudyMate account?
              </Text>
              <Text style={styles.warningText}>
                This action is <Text style={styles.boldRed}>permanent and irreversible</Text>.
                All of your personal study data will be immediately and completely deleted:
              </Text>
              <View style={styles.bulletList}>
                <Text style={styles.bulletItem}>• All Study Plans & topic checklists</Text>
                <Text style={styles.bulletItem}>• All pending and completed Tasks</Text>
                <Text style={styles.bulletItem}>• All upcoming Exams & countdown tracking</Text>
                <Text style={styles.bulletItem}>• All Focus Timer logs & Pomodoro statistics</Text>
                <Text style={styles.bulletItem}>• Your entire study streak & historical progress</Text>
              </View>
            </View>

            {/* Password input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>ENTER CURRENT PASSWORD TO CONFIRM *</Text>
              <View style={styles.inputContainer}>
                <Lock size={18} color={Colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Account password"
                  placeholderTextColor={Colors.textMuted}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Type DELETE confirmation */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                TYPE <Text style={{ color: Colors.error }}>DELETE</Text> TO PROCEED *
              </Text>
              <View style={[styles.inputContainer, confirmationText.toUpperCase() === 'DELETE' && styles.inputSuccess]}>
                <FileX size={18} color={Colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={confirmationText}
                  onChangeText={setConfirmationText}
                  placeholder="Type DELETE in capital letters"
                  placeholderTextColor={Colors.textMuted}
                  autoCapitalize="characters"
                  autoCorrect={false}
                />
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={handleClose}
              activeOpacity={0.8}
              disabled={isSubmitting}
            >
              <Text style={styles.cancelBtnText}>Keep Account</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.deleteBtn,
                (!isDeleteEnabled || isSubmitting) && styles.btnDisabled,
              ]}
              onPress={handleSubmit}
              activeOpacity={0.8}
              disabled={!isDeleteEnabled || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Trash2 size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.deleteBtnText}>Delete Everything</Text>
                </>
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
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
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
    borderColor: 'rgba(239, 68, 68, 0.4)',
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
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dangerIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  headerTitle: {
    color: Colors.error,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  headerSubtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    marginTop: 1,
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
    flexDirection: 'row',
    alignItems: 'center',
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
    flex: 1,
  },
  body: {
    maxHeight: 390,
  },
  bodyContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  warningBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  warningTitle: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    marginBottom: 4,
  },
  warningText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    lineHeight: 18,
    marginBottom: 8,
  },
  boldRed: {
    color: Colors.error,
    fontWeight: FontWeight.bold,
  },
  bulletList: {
    gap: 4,
  },
  bulletItem: {
    color: Colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    height: 46,
  },
  inputSuccess: {
    borderColor: Colors.error,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  textInput: {
    flex: 1,
    color: Colors.text,
    fontSize: FontSize.sm,
    height: '100%',
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
  deleteBtn: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    backgroundColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 150,
  },
  deleteBtnText: {
    color: '#FFFFFF',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  btnDisabled: {
    opacity: 0.5,
  },
});

export default DeleteAccountModal;

