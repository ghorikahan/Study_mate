import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  X,
  User as UserIcon,
  GraduationCap,
  FileText,
  Check,
  Sparkles,
} from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Radius, Spacing, FontSize, FontWeight } from '../../constants/theme';
import { User } from '../../types/auth';

interface EditProfileModalProps {
  visible: boolean;
  user: User | null;
  onClose: () => void;
  onSave: (data: {
    name: string;
    institution: string;
    bio: string;
    avatar: string | null;
  }) => Promise<void>;
}

// 8 curated, reliable student & scholar avatar presets (DiceBear Avataaars)
export const AVATAR_PRESETS = [
  { id: '1', name: 'Scholar', url: 'https://api.dicebear.com/7.x/avataaars/png?seed=Alex&backgroundColor=b6e3f4' },
  { id: '2', name: 'Engineer', url: 'https://api.dicebear.com/7.x/avataaars/png?seed=Sam&backgroundColor=c0aede' },
  { id: '3', name: 'Scientist', url: 'https://api.dicebear.com/7.x/avataaars/png?seed=Jordan&backgroundColor=d1d4f9' },
  { id: '4', name: 'Designer', url: 'https://api.dicebear.com/7.x/avataaars/png?seed=Taylor&backgroundColor=ffd5dc' },
  { id: '5', name: 'Coder', url: 'https://api.dicebear.com/7.x/avataaars/png?seed=Morgan&backgroundColor=ffdfbf' },
  { id: '6', name: 'Explorer', url: 'https://api.dicebear.com/7.x/avataaars/png?seed=Casey&backgroundColor=c0e8d5' },
  { id: '7', name: 'Reader', url: 'https://api.dicebear.com/7.x/avataaars/png?seed=Riley&backgroundColor=d6d6d6' },
  { id: '8', name: 'Innovator', url: 'https://api.dicebear.com/7.x/avataaars/png?seed=Jamie&backgroundColor=ffe0e9' },
];

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  visible,
  user,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [institution, setInstitution] = useState('');
  const [bio, setBio] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [showCustomUrlInput, setShowCustomUrlInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible && user) {
      setName(user.name || '');
      setInstitution(user.institution || '');
      setBio(user.bio || '');
      setSelectedAvatar(user.avatar || null);
      setCustomAvatarUrl(
        user.avatar && !AVATAR_PRESETS.some((p) => p.url === user.avatar)
          ? user.avatar
          : ''
      );
      setError(null);
      setIsSubmitting(false);
    }
  }, [visible, user]);

  const handleSelectPreset = (url: string) => {
    if (selectedAvatar === url) {
      setSelectedAvatar(null); // Deselect to fallback
    } else {
      setSelectedAvatar(url);
    }
  };

  const handleApplyCustomUrl = () => {
    const trimmed = customAvatarUrl.trim();
    if (trimmed) {
      setSelectedAvatar(trimmed);
      setShowCustomUrlInput(false);
    }
  };

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      setError('Name must be at least 2 characters long.');
      return;
    }
    if (trimmedName.length > 60) {
      setError('Name cannot exceed 60 characters.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSave({
        name: trimmedName,
        institution: institution.trim(),
        bio: bio.trim(),
        avatar: selectedAvatar,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to update profile. Please try again.');
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
              <Text style={styles.headerTitle}>Edit Profile</Text>
              <Text style={styles.headerSubtitle}>Customize your scholar identity</Text>
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
            {/* Live Preview Avatar */}
            <View style={styles.previewSection}>
              <View style={styles.avatarPreviewWrapper}>
                {selectedAvatar ? (
                  <Image source={{ uri: selectedAvatar }} style={styles.avatarPreviewImage} />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarFallbackText}>
                      {(name || user?.name || 'S').slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={styles.sparkleBadge}>
                  <Sparkles size={12} color={Colors.primary} />
                </View>
              </View>
              <Text style={styles.previewName}>{name.trim() || 'Your Name'}</Text>
              <Text style={styles.previewSub}>
                {institution.trim() || 'College / Institution'}
              </Text>
            </View>

            {/* Avatar Presets Selection */}
            <View style={styles.inputGroup}>
              <View style={styles.groupHeaderRow}>
                <Text style={styles.inputLabel}>CHOOSE AVATAR PRESET</Text>
                <TouchableOpacity
                  onPress={() => setShowCustomUrlInput(!showCustomUrlInput)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.customUrlToggle}>
                    {showCustomUrlInput ? 'Hide URL input' : 'Or paste URL'}
                  </Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.presetsRow}
              >
                {/* Fallback Initials Option */}
                <TouchableOpacity
                  style={[
                    styles.presetItem,
                    selectedAvatar === null && styles.presetItemSelected,
                  ]}
                  onPress={() => setSelectedAvatar(null)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.presetImage, styles.presetInitials]}>
                    <Text style={styles.presetInitialsText}>
                      {(name || 'SM').slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.presetName}>Initials</Text>
                  {selectedAvatar === null && (
                    <View style={styles.checkPill}>
                      <Check size={10} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>

                {AVATAR_PRESETS.map((preset) => {
                  const isSelected = selectedAvatar === preset.url;
                  return (
                    <TouchableOpacity
                      key={preset.id}
                      style={[
                        styles.presetItem,
                        isSelected && styles.presetItemSelected,
                      ]}
                      onPress={() => handleSelectPreset(preset.url)}
                      activeOpacity={0.8}
                    >
                      <Image source={{ uri: preset.url }} style={styles.presetImage} />
                      <Text style={styles.presetName} numberOfLines={1}>
                        {preset.name}
                      </Text>
                      {isSelected && (
                        <View style={styles.checkPill}>
                          <Check size={10} color="#FFFFFF" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {showCustomUrlInput && (
                <View style={styles.customUrlBox}>
                  <TextInput
                    style={styles.customUrlInput}
                    placeholder="https://example.com/avatar.png"
                    placeholderTextColor={Colors.textMuted}
                    value={customAvatarUrl}
                    onChangeText={setCustomAvatarUrl}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={styles.applyUrlBtn}
                    onPress={handleApplyCustomUrl}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.applyUrlBtnText}>Apply</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Full Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>FULL NAME *</Text>
              <View style={styles.inputContainer}>
                <UserIcon size={18} color={Colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your name"
                  placeholderTextColor={Colors.textMuted}
                  maxLength={60}
                />
              </View>
            </View>

            {/* Institution / College */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>INSTITUTION / UNIVERSITY</Text>
              <View style={styles.inputContainer}>
                <GraduationCap size={18} color={Colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={institution}
                  onChangeText={setInstitution}
                  placeholder="e.g. Stanford University / Tech Institute"
                  placeholderTextColor={Colors.textMuted}
                  maxLength={100}
                />
              </View>
            </View>

            {/* Bio / Learning Motto */}
            <View style={styles.inputGroup}>
              <View style={styles.groupHeaderRow}>
                <Text style={styles.inputLabel}>BIO & STUDY MOTTO</Text>
                <Text style={styles.charCount}>{bio.length}/250</Text>
              </View>
              <View style={[styles.inputContainer, styles.multilineContainer]}>
                <FileText size={18} color={Colors.textMuted} style={[styles.inputIcon, { marginTop: 10 }]} />
                <TextInput
                  style={[styles.textInput, styles.multilineInput]}
                  value={bio}
                  onChangeText={setBio}
                  placeholder="Share your academic goal or study motto..."
                  placeholderTextColor={Colors.textMuted}
                  multiline
                  numberOfLines={3}
                  maxLength={250}
                  textAlignVertical="top"
                />
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
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
                <Text style={styles.saveBtnText}>Save Changes</Text>
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
    maxHeight: '90%',
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
    maxHeight: 460,
  },
  bodyContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  previewSection: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  avatarPreviewWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryFaded,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: Spacing.sm,
  },
  avatarPreviewImage: {
    width: 76,
    height: 76,
    borderRadius: 38,
  },
  avatarFallback: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: Colors.primaryFaded,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    color: Colors.primary,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  sparkleBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewName: {
    color: Colors.text,
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },
  previewSub: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  groupHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  inputLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.5,
  },
  customUrlToggle: {
    color: Colors.primary,
    fontSize: FontSize.xs,
  },
  charCount: {
    color: Colors.textMuted,
    fontSize: 10,
  },
  presetsRow: {
    flexDirection: 'row',
    paddingVertical: Spacing.xs,
    gap: Spacing.sm,
  },
  presetItem: {
    alignItems: 'center',
    padding: 6,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: 'transparent',
    backgroundColor: Colors.background,
    position: 'relative',
  },
  presetItemSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryFaded,
  },
  presetImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.card,
  },
  presetInitials: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
  },
  presetInitialsText: {
    color: Colors.text,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  presetName: {
    color: Colors.textSecondary,
    fontSize: 10,
    marginTop: 4,
  },
  checkPill: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customUrlBox: {
    flexDirection: 'row',
    marginTop: Spacing.xs,
    gap: Spacing.xs,
  },
  customUrlInput: {
    flex: 1,
    height: 38,
    backgroundColor: Colors.background,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.sm,
    color: Colors.text,
    fontSize: FontSize.xs,
  },
  applyUrlBtn: {
    paddingHorizontal: Spacing.md,
    height: 38,
    borderRadius: Radius.sm,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyUrlBtnText: {
    color: '#FFFFFF',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
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
  multilineContainer: {
    height: 80,
    alignItems: 'flex-start',
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
  multilineInput: {
    height: 70,
    paddingTop: 8,
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

export default EditProfileModal;