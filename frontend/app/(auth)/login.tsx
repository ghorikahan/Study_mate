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
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  GraduationCap,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { FontSize, FontWeight, Spacing, Radius } from '../../constants/theme';
import { Button, Input, Card } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { extractErrorMessage } from '../../services/authService';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [emailError, setEmailError] = useState<string | undefined>(undefined);
  const [passwordError, setPasswordError] = useState<string | undefined>(undefined);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate form fields on the client
  const validateForm = (): boolean => {
    let isValid = true;
    setEmailError(undefined);
    setPasswordError(undefined);
    setApiError(null);

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

    return isValid;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      setApiError(null);

      await login({
        email: email.trim().toLowerCase(),
        password,
      });

      // Navigation is automatically handled by the route guard in _layout.tsx
    } catch (error) {
      const msg = extractErrorMessage(error);
      setApiError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick-fill credentials helper for testing
  const handleQuickFill = () => {
    setEmail('student@studymate.dev');
    setPassword('SecurePass123');
    setEmailError(undefined);
    setPasswordError(undefined);
    setApiError(null);
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
              <Text style={styles.welcomeTitle}>Welcome Back</Text>
              <Text style={styles.welcomeSubtitle}>
                Sign in to sync your study plans, tasks & countdowns
              </Text>
            </View>

            {/* ── API Error Banner ── */}
            {apiError && (
              <View style={styles.errorBanner}>
                <AlertCircle size={18} color={Colors.error} />
                <Text style={styles.errorBannerText}>{apiError}</Text>
              </View>
            )}

            {/* ── Form Inputs ── */}
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

            <Input
              label="Password"
              required
              placeholder="Enter your password"
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

            {/* ── Sign In Button ── */}
            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={isSubmitting}
              fullWidth
              size="lg"
              rightIcon={<ArrowRight size={18} color={Colors.white} />}
              style={styles.submitButton}
            />

            {/* ── Quick Fill Demo Option ── */}
            <TouchableOpacity
              style={styles.quickFillBtn}
              onPress={handleQuickFill}
              activeOpacity={0.7}
            >
              <Sparkles size={14} color={Colors.secondary} />
              <Text style={styles.quickFillText}>Fill Demo Credentials</Text>
            </TouchableOpacity>
          </Card>

          {/* ── Security Badge ── */}
          <View style={styles.securityBadge}>
            <ShieldCheck size={14} color={Colors.success} />
            <Text style={styles.securityText}>
              256-bit encrypted JWT & SecureStore protected
            </Text>
          </View>

          {/* ── Footer Link to Register ── */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account?</Text>
            <TouchableOpacity
              onPress={() => router.push('/(auth)/register' as any)}
              activeOpacity={0.7}
            >
              <Text style={styles.footerLink}> Create Account</Text>
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
    minHeight: '100%',
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
  submitButton: {
    marginTop: Spacing.sm,
  },
  quickFillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    marginTop: Spacing.xs,
  },
  quickFillText: {
    color: Colors.secondary,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
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
