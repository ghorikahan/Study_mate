import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  BookOpen,
  CheckSquare,
  Clock,
  TrendingUp,
  Flame,
  Target,
  ArrowRight,
  GraduationCap,
  Plus,
} from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Card, Badge } from '../../components/ui';
import { FontSize, FontWeight, Spacing, Radius } from '../../constants/theme';

// ─── Today's date helper ──────────────────────────────────────────────
const formatDate = () => {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
};

// ─── Stat Card ────────────────────────────────────────────────────────
interface StatCardProps {
  icon: React.ReactNode;
  value: string;
  label: string;
  accent: string;
}
const StatCard: React.FC<StatCardProps> = ({ icon, value, label, accent }) => (
  <View style={[styles.statCard, { borderLeftColor: accent }]}>
    <View style={[styles.statIcon, { backgroundColor: `${accent}18` }]}>{icon}</View>
    <Text style={[styles.statValue, { color: accent }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

// ─── Quick Action Button ───────────────────────────────────────────────
interface QuickActionProps {
  icon: React.ReactNode;
  label: string;
  color: string;
  onPress: () => void;
}
const QuickAction: React.FC<QuickActionProps> = ({ icon, label, color, onPress }) => (
  <TouchableOpacity style={styles.quickAction} onPress={onPress} activeOpacity={0.8}>
    <View style={[styles.quickActionIcon, { backgroundColor: `${color}18` }]}>{icon}</View>
    <Text style={styles.quickActionLabel}>{label}</Text>
  </TouchableOpacity>
);

// ─── Main Screen ───────────────────────────────────────────────────────
export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Greeting ── */}
        <View style={styles.greetingSection}>
          <View style={styles.greetingLeft}>
            <Text style={styles.dateText}>{formatDate()}</Text>
            <Text style={styles.greetingText}>Good day, Student 👋</Text>
            <Text style={styles.greetingSubtext}>Let's make today count!</Text>
          </View>
          <View style={styles.avatarWrapper}>
            <GraduationCap size={26} color={Colors.primary} />
          </View>
        </View>

        {/* ── Stats Row ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statsRow}
        >
          <StatCard
            icon={<Flame size={18} color={Colors.warning} />}
            value="0"
            label="Study Streak"
            accent={Colors.warning}
          />
          <StatCard
            icon={<Clock size={18} color={Colors.secondary} />}
            value="0h"
            label="Today's Hours"
            accent={Colors.secondary}
          />
          <StatCard
            icon={<CheckSquare size={18} color={Colors.success} />}
            value="0 / 0"
            label="Tasks Done"
            accent={Colors.success}
          />
          <StatCard
            icon={<Target size={18} color={Colors.primary} />}
            value="0%"
            label="Weekly Goal"
            accent={Colors.primary}
          />
        </ScrollView>

        {/* ── Quick Actions ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
        </View>
        <View style={styles.quickActionsGrid}>
          <QuickAction
            icon={<Plus size={20} color={Colors.primary} />}
            label="Add Task"
            color={Colors.primary}
            onPress={() => {}}
          />
          <QuickAction
            icon={<BookOpen size={20} color={Colors.secondary} />}
            label="New Plan"
            color={Colors.secondary}
          onPress={() => {}}
          />
          <QuickAction
            icon={<Clock size={20} color={Colors.warning} />}
            label="Start Timer"
            color={Colors.warning}
            onPress={() => {}}
          />
          <QuickAction
            icon={<TrendingUp size={20} color={Colors.success} />}
            label="Analytics"
            color={Colors.success}
            onPress={() => {}}
          />
        </View>

        {/* ── Today's Tasks ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Tasks</Text>
          <TouchableOpacity style={styles.seeAll} activeOpacity={0.7}>
            <Text style={styles.seeAllText}>See all</Text>
            <ArrowRight size={14} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <Card style={styles.emptyCard}>
          <View style={styles.emptyInner}>
            <CheckSquare size={36} color={Colors.border} />
            <Text style={styles.emptyTitle}>No tasks for today</Text>
            <Text style={styles.emptyDesc}>
              Tap the Tasks tab or Quick Action above to add your first task.
            </Text>
            <Badge label="Tasks await you!" variant="neutral" />
          </View>
        </Card>

        {/* ── Upcoming Exams ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Exams</Text>
          <TouchableOpacity style={styles.seeAll} activeOpacity={0.7}>
            <Text style={styles.seeAllText}>See all</Text>
            <ArrowRight size={14} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <Card style={styles.emptyCard}>
          <View style={styles.emptyInner}>
            <BookOpen size={36} color={Colors.border} />
            <Text style={styles.emptyTitle}>No upcoming exams</Text>
            <Text style={styles.emptyDesc}>
              Head over to the Exams tab to track your upcoming exams and countdowns.
            </Text>
            <Badge label="Stay prepared!" variant="neutral" />
          </View>
        </Card>

        <View style={styles.bottomPad} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.base },

  greetingSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: Spacing.base,
    paddingBottom: Spacing.lg,
  },
  greetingLeft: { flex: 1 },
  dateText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginBottom: 4,
  },
  greetingText: {
    color: Colors.text,
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.bold,
    letterSpacing: -0.4,
  },
  greetingSubtext: {
    color: Colors.primary,
    fontSize: FontSize.base,
    marginTop: 4,
  },
  avatarWrapper: {
    width: 50,
    height: 50,
    borderRadius: Radius.md,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.base,
  },

  statsRow: {
    gap: Spacing.sm,
    paddingRight: Spacing.base,
    paddingBottom: Spacing.sm,
  },
  statCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 3,
    minWidth: 110,
    gap: 4,
  },
  statIcon: {
    width: 34,
    height: 34,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statValue: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
  },
  statLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: '500',
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: '500',
  },

  quickActionsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  quickAction: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.base,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  quickActionIcon: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: '500',
    textAlign: 'center',
  },

  emptyCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyInner: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  emptyTitle: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    marginTop: Spacing.sm,
  },
  emptyDesc: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },

  bottomPad: { height: Spacing.xxxl },
});

