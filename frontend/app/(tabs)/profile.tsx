import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  User as UserIcon,
  Settings,
  Bell,
  Shield,
  LogOut,
  ChevronRight,
  BookOpen,
  CheckSquare,
  Clock,
  TrendingUp,
  Star,
  Moon,
} from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Card, Badge } from '../../components/ui';
import { FontSize, FontWeight, Spacing, Radius } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';

// ─── Stat Card ─────────────────────────────────────────────────────────
interface ProfileStatProps {
  value: string;
  label: string;
  icon: React.ReactNode;
  color: string;
}
const ProfileStat: React.FC<ProfileStatProps> = ({ value, label, icon, color }) => (
  <View style={styles.profileStat}>
    <View style={[styles.statIcon, { backgroundColor: `${color}18` }]}>{icon}</View>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

// ─── Settings Row ───────────────────────────────────────────────────────
interface SettingsRowProps {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onPress: () => void;
  destructive?: boolean;
}
const SettingsRow: React.FC<SettingsRowProps> = ({ icon, label, value, onPress, destructive }) => (
  <TouchableOpacity style={styles.settingsRow} onPress={onPress} activeOpacity={0.8}>
    <View style={styles.settingsLeft}>
      <View style={[styles.settingsIcon, destructive && styles.settingsIconDanger]}>
        {icon}
      </View>
      <Text style={[styles.settingsLabel, destructive && styles.settingsLabelDanger]}>
        {label}
      </Text>
    </View>
    <View style={styles.settingsRight}>
      {value && <Text style={styles.settingsValue}>{value}</Text>}
      <ChevronRight size={16} color={destructive ? Colors.error : Colors.textMuted} />
    </View>
  </TouchableOpacity>
);

// ─── Main Screen ───────────────────────────────────────────────────────
export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of StudyMate?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (err) {
              console.warn('Logout error:', err);
            }
          },
        },
      ]
    );
  };

  const displayName = user?.name || 'Student';
  const displayEmail = user?.email || 'student@studymate.app';
  const roleLabel = user?.role === 'admin' ? 'Administrator' : 'Student Scholar';
  const streakCount = user?.studyStreak ?? 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Profile</Text>
        <TouchableOpacity style={styles.settingsBtn} activeOpacity={0.8}>
          <Settings size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Avatar & Name ── */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            <UserIcon size={40} color={Colors.primary} />
            <View style={styles.avatarBadge}>
              <Star size={10} color={Colors.background} />
            </View>
          </View>
          <Text style={styles.userName}>{displayName}</Text>
          <Text style={styles.userEmail}>{displayEmail}</Text>
          <Badge label={roleLabel} variant="primary" dot />
        </View>

        {/* ── Stats Row ── */}
        <Card style={styles.statsCard}>
          <View style={styles.statsRow}>
            <ProfileStat
              value="0"
              label="Plans"
              icon={<BookOpen size={18} color={Colors.secondary} />}
              color={Colors.secondary}
            />
            <View style={styles.statDivider} />
            <ProfileStat
              value="0"
              label="Tasks"
              icon={<CheckSquare size={18} color={Colors.success} />}
              color={Colors.success}
            />
            <View style={styles.statDivider} />
            <ProfileStat
              value="0h"
              label="Studied"
              icon={<Clock size={18} color={Colors.warning} />}
              color={Colors.warning}
            />
            <View style={styles.statDivider} />
            <ProfileStat
              value={`${streakCount}`}
              label="Streak"
              icon={<TrendingUp size={18} color={Colors.primary} />}
              color={Colors.primary}
            />
          </View>
        </Card>

        {/* ── Account Settings ── */}
        <Text style={styles.sectionLabel}>Account</Text>
        <Card style={styles.settingsCard}>
          <SettingsRow
            icon={<UserIcon size={18} color={Colors.primary} />}
            label="Edit Profile"
            value="Coming Day 10"
            onPress={() => {}}
          />
          <View style={styles.separator} />
          <SettingsRow
            icon={<Bell size={18} color={Colors.secondary} />}
            label="Notifications"
            value="Off"
            onPress={() => {}}
          />
          <View style={styles.separator} />
          <SettingsRow
            icon={<Shield size={18} color={Colors.success} />}
            label="Privacy & Security"
            onPress={() => {}}
          />
        </Card>

        {/* ── App Settings ── */}
        <Text style={styles.sectionLabel}>Preferences</Text>
        <Card style={styles.settingsCard}>
          <SettingsRow
            icon={<Moon size={18} color={Colors.info} />}
            label="Dark Mode"
            value="Always On"
            onPress={() => {}}
          />
          <View style={styles.separator} />
          <SettingsRow
            icon={<TrendingUp size={18} color={Colors.warning} />}
            label="Weekly Goal"
            value="Not set"
            onPress={() => {}}
          />
        </Card>

        {/* ── Logout ── */}
        <Text style={styles.sectionLabel}>Account Actions</Text>
        <Card style={styles.settingsCard}>
          <SettingsRow
            icon={<LogOut size={18} color={Colors.error} />}
            label="Sign Out"
            onPress={handleSignOut}
            destructive
          />
        </Card>

        {/* ── App info ── */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>StudyMate v1.0.0</Text>
          <Text style={styles.appInfoSub}>
            Plan Smart. Study Better. Achieve More.
          </Text>
          <Text style={styles.appInfoSub}>Day 5 — Auth Integration Active</Text>
        </View>

        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.base },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  screenTitle: {
    color: Colors.text,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    letterSpacing: -0.3,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.sm,
  },
  avatarWrapper: {
    width: 86,
    height: 86,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryFaded,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.warning,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
  },
  userName: {
    color: Colors.text,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
  },
  userEmail: {
    color: Colors.textSecondary,
    fontSize: FontSize.base,
    marginBottom: Spacing.xs,
  },

  statsCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xl,
    padding: Spacing.base,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  profileStat: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  statIcon: {
    width: 38,
    height: 38,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statValue: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  statLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
    alignSelf: 'stretch',
    marginVertical: Spacing.xs,
  },

  sectionLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
    paddingLeft: 2,
  },

  settingsCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xl,
    overflow: 'hidden',
    padding: 0,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  settingsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  settingsIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: Colors.cardSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIconDanger: {
    backgroundColor: Colors.errorFaded,
  },
  settingsLabel: {
    color: Colors.text,
    fontSize: FontSize.base,
    fontWeight: '500',
  },
  settingsLabelDanger: {
    color: Colors.error,
  },
  settingsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  settingsValue: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: Spacing.base + 36 + Spacing.md,
  },

  appInfo: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: 4,
  },
  appInfoText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
  appInfoSub: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
});

