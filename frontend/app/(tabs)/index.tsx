import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Clock,
  Flame,
  CheckCircle2,
  Calendar,
  Bell,
  Sparkles,
  BookOpen,
  ArrowRight,
  TrendingUp,
} from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';

// ─── Theme Colors Reference ──────────────────────────────────────────────────
const COLORS = Colors;

// ─── Circular Progress Component (75% Ring in Pure React Native) ──────────────
interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
}

const CircularProgress: React.FC<CircularProgressProps> = ({
  percentage,
  size = 84,
  strokeWidth = 7,
}) => {
  const innerSize = size - strokeWidth * 2;

  return (
    <View style={[styles.progressRingContainer, { width: size, height: size }]}>
      {/* Inactive Track Ring */}
      <View
        style={[
          styles.progressTrackRing,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: COLORS.progressTrack,
          },
        ]}
      />

      {/* Active 75% Arc Ring (3 of 4 borders colored in cobalt/light cobalt) */}
      <View
        style={[
          styles.progressActiveRing,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderTopColor: COLORS.secondary,
            borderRightColor: COLORS.secondary,
            borderBottomColor: COLORS.primary,
            borderLeftColor: 'transparent',
            transform: [{ rotate: '-45deg' }],
          },
        ]}
      />

      {/* Inner Center Content with Platinum Percentage */}
      <View
        style={[
          styles.progressRingCenter,
          {
            width: innerSize,
            height: innerSize,
            borderRadius: innerSize / 2,
            backgroundColor: COLORS.card,
          },
        ]}
      >
        <Text style={styles.progressPercentText}>{percentage}%</Text>
      </View>
    </View>
  );
};

// ─── Formatted Date Helper ───────────────────────────────────────────────────
const getFormattedDate = (): string => {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).toUpperCase();
};

// ─── Main Graphite + Platinum + Cobalt Dashboard Screen ───────────────────────
export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const displayName = user?.name ? user.name.split(' ')[0] : 'Alex';
  const initial = (displayName[0] || 'A').toUpperCase();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 1. Welcome Header ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerDate}>{getFormattedDate()}</Text>
            <Text style={styles.headerGreeting}>Good evening, {displayName}</Text>
            <Text style={styles.headerSubtitle}>Ready to make today productive?</Text>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.bellButton}
              activeOpacity={0.7}
              onPress={() => router.push('/notifications' as any)}
            >
              <Bell size={19} color={COLORS.secondaryText} />
              <View style={styles.bellNotificationDot} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.avatarButton}
              activeOpacity={0.8}
              onPress={() => router.push('/(tabs)/profile' as any)}
            >
              <View style={styles.avatarInner}>
                <Text style={styles.avatarText}>{initial}</Text>
              </View>
              <View style={styles.avatarStatusDot} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── 2. Daily Learning Progress ── */}
        <View style={styles.dailyProgressCard}>
          <View style={styles.dailyProgressLeft}>
            <View style={styles.progressPillBadge}>
              <Sparkles size={12} color={COLORS.secondary} />
              <Text style={styles.progressPillText}>YOUR DAILY PROGRESS</Text>
            </View>

            <Text style={styles.dailyProgressTitle}>3 of 4 tasks completed</Text>
            <Text style={styles.dailyProgressSubtitle}>
              You&apos;re making great progress!
            </Text>

            {/* Horizontal Progress Track */}
            <View style={styles.linearTrack}>
              <View style={[styles.linearFill, { width: '75%' }]} />
            </View>
          </View>

          <View style={styles.dailyProgressRight}>
            <CircularProgress percentage={75} size={84} strokeWidth={7} />
          </View>
        </View>

        {/* ── 3. Study Statistics ── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Study Statistics</Text>
          <View style={styles.realtimePill}>
            <TrendingUp size={12} color={COLORS.secondary} />
            <Text style={styles.realtimePillText}>Today</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          {/* Stat 1: Study Time */}
          <View style={styles.statCard}>
            <View style={[styles.statIconWrapper, { backgroundColor: `${COLORS.secondary}16` }]}>
              <Clock size={18} color={COLORS.secondary} />
            </View>
            <Text style={styles.statValue}>4h 25m</Text>
            <Text style={styles.statLabel}>Study Time</Text>
          </View>

          {/* Stat 2: Tasks Completed */}
          <View style={styles.statCard}>
            <View style={[styles.statIconWrapper, { backgroundColor: `${COLORS.success}16` }]}>
              <CheckCircle2 size={18} color={COLORS.success} />
            </View>
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>Tasks Done</Text>
          </View>

          {/* Stat 3: Current Streak */}
          <View style={styles.statCard}>
            <View style={[styles.statIconWrapper, { backgroundColor: `${COLORS.warning}16` }]}>
              <Flame size={18} color={COLORS.warning} />
            </View>
            <Text style={styles.statValue}>7 days</Text>
            <Text style={styles.statLabel}>Current Streak</Text>
          </View>
        </View>

        {/* ── 4. Today's Study Schedule ── */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleWithCount}>
            <Text style={styles.sectionTitle}>Today&apos;s Schedule</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>4 sessions</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.viewAllBtn}
            activeOpacity={0.7}
            onPress={() => router.push('/(tabs)/planner' as any)}
          >
            <Text style={styles.viewAllText}>View All</Text>
            <ArrowRight size={13} color={COLORS.secondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.scheduleList}>
          {/* Session 1: Mathematics */}
          <TouchableOpacity
            style={[styles.scheduleCard, { borderLeftColor: COLORS.primary }]}
            activeOpacity={0.8}
            onPress={() => router.push('/timetable' as any)}
          >
            <View style={styles.scheduleTimeCol}>
              <Text style={[styles.scheduleTimeText, { color: COLORS.secondary }]}>09:00 AM</Text>
              <Text style={styles.scheduleDurationText}>90 min</Text>
            </View>
            <View style={styles.scheduleDivider} />
            <View style={styles.scheduleDetailsCol}>
              <View style={styles.scheduleSubjectRow}>
                <Text style={styles.scheduleSubjectTitle}>Mathematics</Text>
                <View style={[styles.statusBadge, { backgroundColor: `${COLORS.success}16` }]}>
                  <Text style={[styles.statusBadgeText, { color: COLORS.success }]}>Completed</Text>
                </View>
              </View>
              <Text style={styles.scheduleTopicText}>Calculus: Integration & Vector Fields</Text>
            </View>
          </TouchableOpacity>

          {/* Session 2: Data Structures */}
          <TouchableOpacity
            style={[styles.scheduleCard, { borderLeftColor: COLORS.secondary }]}
            activeOpacity={0.8}
            onPress={() => router.push('/timetable' as any)}
          >
            <View style={styles.scheduleTimeCol}>
              <Text style={[styles.scheduleTimeText, { color: COLORS.secondary }]}>11:00 AM</Text>
              <Text style={styles.scheduleDurationText}>75 min</Text>
            </View>
            <View style={styles.scheduleDivider} />
            <View style={styles.scheduleDetailsCol}>
              <View style={styles.scheduleSubjectRow}>
                <Text style={styles.scheduleSubjectTitle}>Data Structures</Text>
                <View style={[styles.statusBadge, { backgroundColor: `${COLORS.success}16` }]}>
                  <Text style={[styles.statusBadgeText, { color: COLORS.success }]}>Completed</Text>
                </View>
              </View>
              <Text style={styles.scheduleTopicText}>Binary Search Trees & Traversal</Text>
            </View>
          </TouchableOpacity>

          {/* Session 3: Database Management */}
          <TouchableOpacity
            style={[styles.scheduleCard, { borderLeftColor: COLORS.primary }]}
            activeOpacity={0.8}
            onPress={() => router.push('/timetable' as any)}
          >
            <View style={styles.scheduleTimeCol}>
              <Text style={[styles.scheduleTimeText, { color: COLORS.primary }]}>02:00 PM</Text>
              <Text style={styles.scheduleDurationText}>60 min</Text>
            </View>
            <View style={styles.scheduleDivider} />
            <View style={styles.scheduleDetailsCol}>
              <View style={styles.scheduleSubjectRow}>
                <Text style={styles.scheduleSubjectTitle}>Database Management</Text>
                <View style={[styles.statusBadge, { backgroundColor: `${COLORS.success}16` }]}>
                  <Text style={[styles.statusBadgeText, { color: COLORS.success }]}>Completed</Text>
                </View>
              </View>
              <Text style={styles.scheduleTopicText}>Relational Algebra & Normalization</Text>
            </View>
          </TouchableOpacity>

          {/* Session 4: React Native */}
          <TouchableOpacity
            style={[styles.scheduleCard, { borderLeftColor: COLORS.accent }]}
            activeOpacity={0.8}
            onPress={() => router.push('/timetable' as any)}
          >
            <View style={styles.scheduleTimeCol}>
              <Text style={[styles.scheduleTimeText, { color: COLORS.accent }]}>04:00 PM</Text>
              <Text style={styles.scheduleDurationText}>60 min</Text>
            </View>
            <View style={styles.scheduleDivider} />
            <View style={styles.scheduleDetailsCol}>
              <View style={styles.scheduleSubjectRow}>
                <Text style={styles.scheduleSubjectTitle}>React Native</Text>
                <View style={[styles.statusBadge, { backgroundColor: `${COLORS.secondary}16` }]}>
                  <Text style={[styles.statusBadgeText, { color: COLORS.secondary }]}>Upcoming</Text>
                </View>
              </View>
              <Text style={styles.scheduleTopicText}>Component Architecture & Hooks</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ── 5. Upcoming Examinations ── */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleWithCount}>
            <Text style={styles.sectionTitle}>Upcoming Examinations</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>2 scheduled</Text>
            </View>
          </View>
        </View>

        <View style={styles.examsList}>
          {/* Exam 1: Data Structures */}
          <TouchableOpacity
            style={styles.examCard}
            activeOpacity={0.8}
            onPress={() => router.push('/(tabs)/exams' as any)}
          >
            <View style={styles.examHeaderRow}>
              <View style={styles.examIconAndInfo}>
                <View style={[styles.examIconBox, { backgroundColor: `${COLORS.secondary}16` }]}>
                  <BookOpen size={18} color={COLORS.secondary} />
                </View>
                <View style={styles.examTitleWrap}>
                  <Text style={styles.examSubjectTitle}>Data Structures</Text>
                  <Text style={styles.examSubtitle}>Midterm Examination • Theory & Algorithms</Text>
                </View>
              </View>

              <View style={[styles.countdownPill, { borderColor: `${COLORS.accent}40` }]}>
                <Text style={[styles.countdownValue, { color: COLORS.accent }]}>5</Text>
                <Text style={styles.countdownLabel}>days left</Text>
              </View>
            </View>

            <View style={styles.examFooterRow}>
              <View style={styles.examDateTag}>
                <Calendar size={13} color={COLORS.secondaryText} />
                <Text style={styles.examDateText}>Nov 24 • 10:00 AM</Text>
              </View>
              <View style={styles.examSyllabusRow}>
                <Text style={styles.examSyllabusPercent}>80% syllabus prepared</Text>
                <ArrowRight size={14} color={COLORS.secondary} />
              </View>
            </View>
          </TouchableOpacity>

          {/* Exam 2: Database Management */}
          <TouchableOpacity
            style={styles.examCard}
            activeOpacity={0.8}
            onPress={() => router.push('/(tabs)/exams' as any)}
          >
            <View style={styles.examHeaderRow}>
              <View style={styles.examIconAndInfo}>
                <View style={[styles.examIconBox, { backgroundColor: `${COLORS.primary}16` }]}>
                  <BookOpen size={18} color={COLORS.secondary} />
                </View>
                <View style={styles.examTitleWrap}>
                  <Text style={styles.examSubjectTitle}>Database Management</Text>
                  <Text style={styles.examSubtitle}>Comprehensive Practical • SQL & Design</Text>
                </View>
              </View>

              <View style={[styles.countdownPill, { borderColor: `${COLORS.accent}40` }]}>
                <Text style={[styles.countdownValue, { color: COLORS.accent }]}>12</Text>
                <Text style={styles.countdownLabel}>days left</Text>
              </View>
            </View>

            <View style={styles.examFooterRow}>
              <View style={styles.examDateTag}>
                <Calendar size={13} color={COLORS.secondaryText} />
                <Text style={styles.examDateText}>Dec 01 • 02:00 PM</Text>
              </View>
              <View style={styles.examSyllabusRow}>
                <Text style={styles.examSyllabusPercent}>55% syllabus prepared</Text>
                <ArrowRight size={14} color={COLORS.secondary} />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Bottom space padding to accommodate bottom tab bar comfortably */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Stylesheet ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerLeft: {
    flex: 1,
    paddingRight: 12,
  },
  headerDate: {
    color: COLORS.secondaryText,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  headerGreeting: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
    lineHeight: 30,
  },
  headerSubtitle: {
    color: COLORS.secondaryText,
    fontSize: 13,
    fontWeight: '400',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 2,
  },
  bellButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bellNotificationDot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.secondary,
  },
  avatarButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    borderWidth: 1.5,
    borderColor: `${COLORS.primary}80`,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarInner: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: COLORS.accent,
    fontSize: 16,
    fontWeight: '700',
  },
  avatarStatusDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: COLORS.success,
    borderWidth: 1.5,
    borderColor: COLORS.background,
  },

  // Daily Progress Card
  dailyProgressCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  dailyProgressLeft: {
    flex: 1,
    paddingRight: 14,
  },
  progressPillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.secondary}14`,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 5,
    marginBottom: 8,
  },
  progressPillText: {
    color: COLORS.secondary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  dailyProgressTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  dailyProgressSubtitle: {
    color: COLORS.secondaryText,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 12,
  },
  linearTrack: {
    height: 6,
    backgroundColor: COLORS.progressTrack,
    borderRadius: 3,
    overflow: 'hidden',
  },
  linearFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  dailyProgressRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRingContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrackRing: {
    position: 'absolute',
  },
  progressActiveRing: {
    position: 'absolute',
  },
  progressRingCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressPercentText: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.4,
  },

  // Section Headers
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleWithCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  countBadge: {
    backgroundColor: COLORS.elevatedCard,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  countBadgeText: {
    color: COLORS.secondaryText,
    fontSize: 11,
    fontWeight: '600',
  },
  realtimePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.secondary}14`,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  realtimePillText: {
    color: COLORS.secondary,
    fontSize: 11,
    fontWeight: '600',
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    color: COLORS.secondary,
    fontSize: 12,
    fontWeight: '600',
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    alignItems: 'flex-start',
  },
  statIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statValue: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  statLabel: {
    color: COLORS.secondaryText,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },

  // Today's Schedule List
  scheduleList: {
    gap: 10,
    marginBottom: 24,
  },
  scheduleCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 3.5,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  scheduleTimeCol: {
    minWidth: 70,
  },
  scheduleTimeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  scheduleDurationText: {
    color: COLORS.mutedText,
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
  scheduleDivider: {
    width: 1,
    height: 28,
    backgroundColor: COLORS.border,
    marginHorizontal: 10,
  },
  scheduleDetailsCol: {
    flex: 1,
  },
  scheduleSubjectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scheduleSubjectTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  scheduleTopicText: {
    color: COLORS.secondaryText,
    fontSize: 11,
    marginTop: 3,
  },

  // Upcoming Exams List
  examsList: {
    gap: 10,
    marginBottom: 16,
  },
  examCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
  },
  examHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  examIconAndInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    paddingRight: 8,
  },
  examIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  examTitleWrap: {
    flex: 1,
  },
  examSubjectTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },
  examSubtitle: {
    color: COLORS.secondaryText,
    fontSize: 11,
    marginTop: 2,
  },
  countdownPill: {
    backgroundColor: COLORS.elevatedCard,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
    minWidth: 54,
  },
  countdownValue: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  countdownLabel: {
    color: COLORS.secondaryText,
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  examFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: `${COLORS.border}80`,
    paddingTop: 10,
  },
  examDateTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  examDateText: {
    color: COLORS.secondaryText,
    fontSize: 11,
    fontWeight: '500',
  },
  examSyllabusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  examSyllabusPercent: {
    color: COLORS.secondary,
    fontSize: 11,
    fontWeight: '600',
  },

  bottomSpacer: {
    height: 40,
  },
});
