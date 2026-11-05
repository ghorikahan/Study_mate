import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Calendar,
  Plus,
  BookOpen,
  Clock,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Card, Badge, EmptyState } from '../../components/ui';
import { FontSize, FontWeight, Spacing, Radius } from '../../constants/theme';

type ExamFilter = 'Upcoming' | 'This Week' | 'Past';
const FILTERS: ExamFilter[] = ['Upcoming', 'This Week', 'Past'];

// ─── Countdown card ────────────────────────────────────────────────────
interface CountdownCardProps {
  label: string;
  value: number;
}
const CountdownUnit: React.FC<CountdownCardProps> = ({ label, value }) => (
  <View style={styles.countUnit}>
    <Text style={styles.countValue}>{String(value).padStart(2, '0')}</Text>
    <Text style={styles.countLabel}>{label}</Text>
  </View>
);

export default function ExamsScreen() {
  const [activeFilter, setActiveFilter] = useState<ExamFilter>('Upcoming');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.screenTitle}>Exam Tracker</Text>
          <Text style={styles.screenSubtitle}>Stay ahead of your exam schedule</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} activeOpacity={0.8}>
          <Plus size={22} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Next Exam Countdown Banner ── */}
        <View style={styles.countdownBanner}>
          <View style={styles.bannerRow}>
            <AlertTriangle size={18} color={Colors.warning} />
            <Text style={styles.bannerTitle}>Next Exam Countdown</Text>
          </View>
          <Text style={styles.bannerSubtitle}>No upcoming exam — add one to start tracking!</Text>
          <View style={styles.countdownRow}>
            <CountdownUnit label="Days" value={0} />
            <Text style={styles.countSep}>:</Text>
            <CountdownUnit label="Hours" value={0} />
            <Text style={styles.countSep}>:</Text>
            <CountdownUnit label="Mins" value={0} />
          </View>
        </View>

        {/* ── Summary Stats ── */}
        <View style={styles.statsRow}>
          <View style={[styles.statBox, { borderTopColor: Colors.error }]}>
            <Text style={[styles.statValue, { color: Colors.error }]}>0</Text>
            <Text style={styles.statLabel}>This Month</Text>
          </View>
          <View style={[styles.statBox, { borderTopColor: Colors.warning }]}>
            <Text style={[styles.statValue, { color: Colors.warning }]}>0</Text>
            <Text style={styles.statLabel}>This Week</Text>
          </View>
          <View style={[styles.statBox, { borderTopColor: Colors.success }]}>
            <Text style={[styles.statValue, { color: Colors.success }]}>0</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>

        {/* ── Filters ── */}
        <View style={styles.filtersRow}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
              onPress={() => setActiveFilter(f)}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Exams Empty State ── */}
        <Card style={styles.emptyCard}>
          <EmptyState
            icon={<Calendar size={32} color={Colors.textMuted} />}
            title={
              activeFilter === 'Past'
                ? 'No past exams'
                : activeFilter === 'This Week'
                  ? 'No exams this week 🎉'
                  : 'No upcoming exams'
            }
            description={
              activeFilter === 'Past'
                ? "Your completed exams will be recorded here for review."
                : activeFilter === 'This Week'
                  ? "You have no exams scheduled for this week. Enjoy the break!"
                  : "Add your upcoming exams to get countdown timers, study reminders, and syllabus tracking."
            }
            actionLabel={activeFilter !== 'Past' ? 'Add Exam' : undefined}
            onAction={() => { }}
          />
        </Card>

        {/* ── Subject Coverage Teaser ── */}
        <Text style={styles.sectionTitle}>Subjects to Prepare</Text>
        <View style={styles.subjectsGrid}>
          {['Mathematics', 'Physics', 'Chemistry', 'English'].map((sub, idx) => {
            const colors = [Colors.primary, Colors.secondary, Colors.warning, Colors.success];
            const c = colors[idx % colors.length];
            return (
              <TouchableOpacity key={sub} style={[styles.subjectCard, { borderTopColor: c }]} activeOpacity={0.8}>
                <BookOpen size={18} color={c} />
                <Text style={styles.subjectName}>{sub}</Text>
                <Badge label="0 Exams" variant="neutral" />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Exam Prep Tip ── */}
        <View style={styles.tipCard}>
          <View style={styles.tipRow}>
            <TrendingUp size={16} color={Colors.primary} />
            <Text style={styles.tipTitle}>Exam Prep Tip</Text>
          </View>
          <Text style={styles.tipDesc}>
            Start preparing at least 2 weeks before each exam. Use the study planner to allocate specific daily slots per subject.
          </Text>
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
  screenSubtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  countdownBanner: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.base,
    marginTop: Spacing.base,
    borderLeftWidth: 3,
    borderLeftColor: Colors.warning,
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: 4,
  },
  bannerTitle: {
    color: Colors.warning,
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },
  bannerSubtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginBottom: Spacing.base,
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  countUnit: {
    backgroundColor: Colors.cardSecondary,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    alignItems: 'center',
    minWidth: 60,
  },
  countValue: {
    color: Colors.text,
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.bold,
    letterSpacing: 2,
  },
  countLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  countSep: {
    color: Colors.textMuted,
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.bold,
    marginBottom: 14,
  },

  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.base,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderTopWidth: 3,
    padding: Spacing.sm,
    alignItems: 'center',
  },
  statValue: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  statLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    marginTop: 2,
    textAlign: 'center',
  },

  filtersRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.base,
  },
  filterChip: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primaryFaded,
    borderColor: Colors.primary,
  },
  filterText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
  filterTextActive: { color: Colors.primary },

  emptyCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginTop: Spacing.base,
  },

  sectionTitle: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },

  subjectsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  subjectCard: {
    width: '48%',
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderTopWidth: 3,
    padding: Spacing.base,
    gap: Spacing.xs,
  },
  subjectName: {
    color: Colors.text,
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
  },

  tipCard: {
    backgroundColor: Colors.primaryFaded,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: `${Colors.primary}30`,
    padding: Spacing.base,
    marginTop: Spacing.xl,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: 6,
  },
  tipTitle: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  tipDesc: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    lineHeight: 18,
  },
});