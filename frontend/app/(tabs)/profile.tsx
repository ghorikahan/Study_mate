import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  User as UserIcon,
  Settings,
  Bell,
  Lock,
  LogOut,
  ChevronRight,
  BookOpen,
  CheckSquare,
  Clock,
  TrendingUp,
  Star,
  Moon,
  BarChart3,
  Target,
  Trash2,
  Edit3,
  GraduationCap,
  Sparkles,
} from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Card, Badge } from '../../components/ui';
import { FontSize, FontWeight, Spacing, Radius } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';
import { UserStats } from '../../types/user';
import {
  EditProfileModal,
  ChangePasswordModal,
  StudyGoalsModal,
  NotificationPreferencesModal,
  DeleteAccountModal,
} from '../../components/profile';

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
const SettingsRow: React.FC<SettingsRowProps> = ({
  icon,
  label,
  value,
  onPress,
  destructive,
}) => (
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
  const { user, logout, updateUser } = useAuth();
  const router = useRouter();

  // Modals Visibility
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showStudyGoals, setShowStudyGoals] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);

  // Profile & Study Stats State
  const [stats, setStats] = useState<UserStats>({
    plansCount: 0,
    tasksCount: 0,
    completedTasksCount: 0,
    examsCount: 0,
    sessionsCount: 0,
    totalStudyHours: 0,
    currentStreak: 0,
    longestStreak: 0,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch fresh profile and stats from backend
  const loadProfileStats = useCallback(async () => {
    try {
      const data = await userService.getProfile();
      if (data?.user) {
        updateUser(data.user);
      }
      if (data?.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      console.warn('[ProfileScreen] Failed to load profile stats:', err);
    }
  }, [updateUser]);

  useEffect(() => {
    loadProfileStats();
  }, [loadProfileStats]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfileStats();
    setRefreshing(false);
  };

  // ─── Handlers ──────────────────────────────────────────────────────────
  const handleSaveProfile = async (data: {
    name: string;
    institution: string;
    bio: string;
    avatar: string | null;
  }) => {
    const updated = await userService.updateProfile(data);
    updateUser(updated);
    Alert.alert('Profile Updated', 'Your profile details have been saved successfully.');
  };

  const handleSavePassword = async (data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword?: string;
  }) => {
    const msg = await userService.changePassword(data);
    Alert.alert('Password Changed', msg || 'Your password has been changed securely.');
  };

  const handleSaveGoals = async (data: {
    weeklyStudyGoalHours: number;
    dailyStudyGoalMinutes: number;
    defaultFocusMinutes: number;
  }) => {
    const updated = await userService.updatePreferences(data);
    updateUser(updated);
    Alert.alert('Study Goals Saved', `Weekly study target updated to ${data.weeklyStudyGoalHours} hours.`);
  };

  const handleSaveNotifications = async (notifications: any) => {
    const updated = await userService.updatePreferences({ notifications });
    updateUser(updated);
    Alert.alert('Preferences Saved', 'Your notification and alert preferences have been updated.');
  };

  const handleDeleteAccount = async (data: {
    password: string;
    confirmationText: string;
  }) => {
    await userService.deleteAccount(data);
    Alert.alert(
      'Account Deleted',
      'Your StudyMate account and all study data have been permanently removed.',
      [
        {
          text: 'OK',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

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

  const handleThemeInfo = () => {
    Alert.alert(
      'Obsidian Pure-Dark Theme 🌙',
      'StudyMate is permanently styled in an obsidian pure-dark UI designed for high-contrast focus and battery conservation on OLED displays.\n\n• Background: #0B0D12\n• Primary Accent: Electric Purple (#8B5CF6)\n• Secondary Accent: Neon Cyan (#22D3EE)',
      [{ text: 'Great' }]
    );
  };

  const displayName = user?.name || 'Student Scholar';
  const displayEmail = user?.email || 'student@studymate.app';
  const roleLabel = user?.role === 'admin' ? 'Administrator' : 'Verified Scholar';
  const streakCount =
    typeof user?.studyStreak === 'number'
      ? user.studyStreak
      : user?.studyStreak?.currentStreak ?? stats.currentStreak ?? 0;
  const weeklyGoal = user?.preferences?.weeklyStudyGoalHours || 20;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.screenTitle}>Profile & Settings</Text>
          <Text style={styles.screenSubtitle}>Manage your account, targets & privacy</Text>
        </View>
        <TouchableOpacity
          style={styles.settingsBtn}
          activeOpacity={0.8}
          onPress={() => setShowEditProfile(true)}
        >
          <Edit3 size={18} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {/* ── Profile Identity Card ── */}
        <Card style={styles.identityCard}>
          <View style={styles.identityRow}>
            {/* Avatar with preset/custom image or initial fallback */}
            <TouchableOpacity
              style={styles.avatarWrapper}
              activeOpacity={0.8}
              onPress={() => setShowEditProfile(true)}
            >
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarFallbackText}>
                    {displayName.slice(0, 2).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.avatarBadge}>
                <Sparkles size={11} color="#FFFFFF" />
              </View>
            </TouchableOpacity>

            {/* User Meta */}
            <View style={styles.identityMeta}>
              <View style={styles.nameRow}>
                <Text style={styles.userName} numberOfLines={1}>
                  {displayName}
                </Text>
              </View>
              <Text style={styles.userEmail} numberOfLines={1}>
                {displayEmail}
              </Text>
              {user?.institution ? (
                <View style={styles.institutionRow}>
                  <GraduationCap size={13} color={Colors.textSecondary} style={{ marginRight: 4 }} />
                  <Text style={styles.institutionText} numberOfLines={1}>
                    {user.institution}
                  </Text>
                </View>
              ) : null}
              <View style={styles.badgeRow}>
                <Badge label={roleLabel} variant="primary" dot />
              </View>
            </View>
          </View>

          {/* Bio Callout if present */}
          {user?.bio ? (
            <View style={styles.bioBox}>
              <Text style={styles.bioText}>"{user.bio}"</Text>
            </View>
          ) : null}
        </Card>

        {/* ── Live Study Stats ── */}
        <Card style={styles.statsCard}>
          <View style={styles.statsRow}>
            <ProfileStat
              value={`${stats.plansCount}`}
              label="Plans"
              icon={<BookOpen size={18} color={Colors.secondary} />}
              color={Colors.secondary}
            />
            <View style={styles.statDivider} />
            <ProfileStat
              value={`${stats.completedTasksCount}`}
              label="Tasks"
              icon={<CheckSquare size={18} color={Colors.success} />}
              color={Colors.success}
            />
            <View style={styles.statDivider} />
            <ProfileStat
              value={`${stats.totalStudyHours}h`}
              label="Studied"
              icon={<Clock size={18} color={Colors.warning} />}
              color={Colors.warning}
            />
            <View style={styles.statDivider} />
            <ProfileStat
              value={`${streakCount}d`}
              label="Streak"
              icon={<TrendingUp size={18} color={Colors.primary} />}
              color={Colors.primary}
            />
          </View>
        </Card>

        {/* ── Study Goals & Performance ── */}
        <Text style={styles.sectionLabel}>ACADEMIC TARGETS & INSIGHTS</Text>
        <Card style={styles.settingsCard}>
          <SettingsRow
            icon={<Target size={18} color={Colors.warning} />}
            label="Study Goals"
            value={`${weeklyGoal}h / week`}
            onPress={() => setShowStudyGoals(true)}
          />
          <View style={styles.separator} />
          <SettingsRow
            icon={<BarChart3 size={18} color={Colors.primary} />}
            label="Analytics & Insights"
            value="View full charts"
            onPress={() => router.push('/analytics' as any)}
          />
        </Card>

        {/* ── Account & Preferences ── */}
        <Text style={styles.sectionLabel}>ACCOUNT & PREFERENCES</Text>
        <Card style={styles.settingsCard}>
          <SettingsRow
            icon={<UserIcon size={18} color={Colors.primary} />}
            label="Edit Profile Details"
            value="Name, bio, avatar"
            onPress={() => setShowEditProfile(true)}
          />
          <View style={styles.separator} />
          <SettingsRow
            icon={<Bell size={18} color={Colors.secondary} />}
            label="Notification Preferences"
            value={user?.preferences?.notifications?.push !== false ? 'Enabled' : 'Muted'}
            onPress={() => setShowNotifications(true)}
          />
          <View style={styles.separator} />
          <SettingsRow
            icon={<Moon size={18} color={Colors.info} />}
            label="App Theme"
            value="Dark Mode"
            onPress={handleThemeInfo}
          />
          <View style={styles.separator} />
          <SettingsRow
            icon={<Lock size={18} color={Colors.success} />}
            label="Change Password"
            value="Security"
            onPress={() => setShowChangePassword(true)}
          />
        </Card>

        {/* ── Account Actions ── */}
        <Text style={styles.sectionLabel}>ACCOUNT ACTIONS</Text>
        <Card style={styles.settingsCard}>
          <SettingsRow
            icon={<LogOut size={18} color={Colors.textSecondary} />}
            label="Sign Out"
            onPress={handleSignOut}
          />
          <View style={styles.separator} />
          <SettingsRow
            icon={<Trash2 size={18} color={Colors.error} />}
            label="Delete Account & Data"
            value="Danger zone"
            onPress={() => setShowDeleteAccount(true)}
            destructive
          />
        </Card>

        {/* ── App Info ── */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>StudyMate • Smart Study Planner v1.0.0</Text>
          <Text style={styles.appInfoSub}>
            Plan Smart. Study Better. Achieve More.
          </Text>
          <Text style={styles.appInfoSub}>Academic Productivity Edition • Fully Verified</Text>
        </View>

        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>

      {/* ── Modals ── */}
      <EditProfileModal
        visible={showEditProfile}
        user={user}
        onClose={() => setShowEditProfile(false)}
        onSave={handleSaveProfile}
      />

      <ChangePasswordModal
        visible={showChangePassword}
        onClose={() => setShowChangePassword(false)}
        onSave={handleSavePassword}
      />

      <StudyGoalsModal
        visible={showStudyGoals}
        preferences={user?.preferences}
        onClose={() => setShowStudyGoals(false)}
        onSave={handleSaveGoals}
      />

      <NotificationPreferencesModal
        visible={showNotifications}
        preferences={user?.preferences?.notifications}
        onClose={() => setShowNotifications(false)}
        onSave={handleSaveNotifications}
      />

      <DeleteAccountModal
        visible={showDeleteAccount}
        onClose={() => setShowDeleteAccount(false)}
        onConfirmDelete={handleDeleteAccount}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.base, paddingTop: Spacing.xs },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  screenTitle: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    letterSpacing: -0.3,
  },
  screenSubtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  settingsBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  identityCard: {
    padding: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: Colors.primary,
    position: 'relative',
    marginRight: Spacing.md,
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarFallback: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primaryFaded,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    color: Colors.primary,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  avatarBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.card,
  },
  identityMeta: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    color: Colors.text,
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },
  userEmail: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    marginTop: 1,
  },
  institutionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  institutionText: {
    color: Colors.textMuted,
    fontSize: 11,
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  bioBox: {
    backgroundColor: Colors.background,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    marginTop: Spacing.sm,
    borderLeftWidth: 2,
    borderLeftColor: Colors.primary,
  },
  bioText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontStyle: 'italic',
  },

  statsCard: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xs,
    marginVertical: Spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  profileStat: {
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statValue: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },
  statLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.border,
  },

  sectionLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.8,
    marginTop: Spacing.base,
    marginBottom: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  settingsCard: {
    padding: 0,
    overflow: 'hidden',
    marginBottom: Spacing.xs,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  settingsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingsIcon: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  settingsIconDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  settingsLabel: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
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
    fontSize: FontSize.xs,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 54,
  },

  appInfo: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: 4,
  },
  appInfoText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  appInfoSub: {
    color: Colors.textMuted,
    fontSize: 10,
  },
});
