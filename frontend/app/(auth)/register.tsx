import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  GraduationCap,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { FontSize, FontWeight, Spacing, Radius } from '../../constants/theme';
import { Button, Input, Card } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { extractErrorMessage } from '../../services/authService';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [nameError, setNameError] = useState<string | undefined>(undefined);
  const [emailError, setEmailError] = useState<string | undefined>(undefined);
  const [passwordError, setPasswordError] = useState<string | undefined>(undefined);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | undefined>(undefined);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Compute simple password strength score (0 to 3)
  const getPasswordStrength = (pwd: string): { score: number; label: string; color: string } => {
    if (!pwd) return { score: 0, label: '', color: Colors.border };
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 8 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) score++;
    if (pwd.length >= 10 && /[^A-Za-z0-9]/.test(pwd)) score++;

    if (score === 1) return { score: 1, label: 'Weak', color: Colors.error };
    if (score === 2) return { score: 2, label: 'Medium', color: Colors.warning };
    return { score: 3, label: 'Strong', color: Colors.success };
  };

  const strength = getPasswordStrength(password);

  const validateForm = (): boolean => {
    let isValid = true;
    setNameError(undefined);
    setEmailError(undefined);
    setPasswordError(undefined);
    setConfirmPasswordError(undefined);
    setApiError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError('Full name is required');
      isValid = false;
    } else if (trimmedName.length < 2) {
      setNameError('Name must be at least 2 characters');
      isValid = false;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setEmailError('Email address is required');
      isValid = false;
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    }

    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    }

    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password');
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      isValid = false;
    }

    return isValid;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      setApiError(null);

      await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      // Route guard automatically redirects authenticated user to (tabs)
    } catch (error) {
      const msg = extractErrorMessage(error);
      setApiError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Brand Header ── */}
          <View style={styles.header}>
            <View style={styles.logoBadge}>
              <GraduationCap size={32} color={Colors.primary} />
            </View>
            <Text style={styles.brandTitle}>StudyMate</Text>
            <Text style={styles.brandTagline}>Plan Smart. Study Better. Achieve More.</Text>
          </View>

          {/* ── Card Container ── */}
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.welcomeTitle}>Create Account</Text>
              <Text style={styles.welcomeSubtitle}>
                Join StudyMate and build your personalized study routine
              </Text>
            </View>

            {/* ── API Error Banner ── */}
            {apiError && (
              <View style={styles.errorBanner}>
                <AlertCircle size={18} color={Colors.error} />
                <Text style={styles.errorBannerText}>{apiError}</Text>
              </View>
            )}

            {/* ── Full Name Input ── */}
            <Input
              label="Full Name"
              required
              placeholder="e.g. Alex Johnson"
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (nameError) setNameError(undefined);
                if (apiError) setApiError(null);
              }}
              autoCapitalize="words"
              leftIcon={<User size={18} color={Colors.textMuted} />}
              error={nameError}
            />

            {/* ── Email Address Input ── */}
            <Input
              label="Email Address"
              required
              placeholder="you@university.edu"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (emailError) setEmailError(undefined);
                if (apiError) setApiError(null);
              }}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              leftIcon={<Mail size={18} color={Colors.textMuted} />}
              error={emailError}
            />

            {/* ── Password Input ── */}
            <Input
              label="Password"
              required
              placeholder="At least 6 characters"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (passwordError) setPasswordError(undefined);
                if (apiError) setApiError(null);
              }}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              leftIcon={<Lock size={18} color={Colors.textMuted} />}
              rightIcon={
                showPassword ? (
                  <EyeOff size={18} color={Colors.textMuted} />
                ) : (
                  <Eye size={18} color={Colors.textMuted} />
                )
              }
              onRightIconPress={() => setShowPassword((prev) => !prev)}
              error={passwordError}
            />

            {/* ── Password Strength Bar ── */}
            {password.length > 0 && (
              <View style={styles.strengthContainer}>
                <View style={styles.strengthBars}>
                  <View
                    style={[
                      styles.strengthBar,
                      {
                        backgroundColor:
                          strength.score >= 1 ? strength.color : Colors.border,
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.strengthBar,
                      {
                        backgroundColor:
                          strength.score >= 2 ? strength.color : Colors.border,
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.strengthBar,
                      {
                        backgroundColor:
                          strength.score >= 3 ? strength.color : Colors.border,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.strengthLabel, { color: strength.color }]}>
                  {strength.label}
                </Text>
              </View>
            )}

            {/* ── Confirm Password Input ── */}
            <Input
              label="Confirm Password"
              required
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (confirmPasswordError) setConfirmPasswordError(undefined);
                if (apiError) setApiError(null);
              }}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              leftIcon={<CheckCircle2 size={18} color={Colors.textMuted} />}
              rightIcon={
                showConfirmPassword ? (
                  <EyeOff size={18} color={Colors.textMuted} />
                ) : (
                  <Eye size={18} color={Colors.textMuted} />
                )
              }
              onRightIconPress={() => setShowConfirmPassword((prev) => !prev)}
              error={confirmPasswordError}
            />

            {/* ── Submit Button ── */}
            <Button
              title="Create Account"
              onPress={handleRegister}
              loading={isSubmitting}
              fullWidth
              size="lg"
              rightIcon={<ArrowRight size={18} color={Colors.white} />}
              style={styles.submitButton}
            />
          </Card>

          {/* ── Security Badge ── */}
          <View style={styles.securityBadge}>
            <ShieldCheck size={14} color={Colors.success} />
            <Text style={styles.securityText}>
              Encrypted password hashing with bcryptjs & JWT
            </Text>
          </View>

          {/* ── Footer Link to Login ── */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <TouchableOpacity
              onPress={() => router.push('/(auth)/login' as any)}
              activeOpacity={0.7}
            >
              <Text style={styles.footerLink}> Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: Radius.xl,
    backgroundColor: Colors.primaryFaded,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  brandTitle: {
    color: Colors.text,
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.bold,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  brandTagline: {
    color: Colors.secondary,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    marginBottom: Spacing.lg,
  },
  welcomeTitle: {
    color: Colors.text,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    marginBottom: 4,
  },
  welcomeSubtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    lineHeight: 20,
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
    fontWeight: '500',
    flex: 1,
    lineHeight: 18,
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.base,
    marginTop: -Spacing.xs,
  },
  strengthBars: {
    flexDirection: 'row',
    flex: 1,
    gap: 4,
    marginRight: Spacing.md,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  submitButton: {
    marginTop: Spacing.sm,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.lg,
  },
  securityText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  footerText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  footerLink: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
});
