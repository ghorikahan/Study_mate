import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
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
  Calendar,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Circle,
  Award,
} from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Card, Badge, EmptyState, Button } from '../../components/ui';
import { FontSize, FontWeight, Spacing, Radius } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { useDashboard } from '../../hooks/useDashboard';
import { TodayTask, UpcomingExam, DailyStudyItem } from '../../types/dashboard';

// ─── Greeting Helper ──────────────────────────────────────────────────────────
const getGreeting = (name?: string): string => {
  const hour = new Date().getHours();
  const firstName = name ? name.split(' ')[0] : 'Scholar';
  if (hour < 12) return `Good morning, ${firstName} ☀️`;
  if (hour < 17) return `Good afternoon, ${firstName} 🌤️`;
  return `Good evening, ${firstName} 🌙`;
};

// ─── Format Date Helper ───────────────────────────────────────────────────────
const formatDisplayDate = (): string => {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
};

// ─── Priority Badge Color Helper ──────────────────────────────────────────────
const getPriorityVariant = (priority: string): 'error' | 'warning' | 'primary' | 'neutral' => {
  switch (priority) {
    case 'urgent':
      return 'error';
    case 'high':
      return 'warning';
    case 'medium':
      return 'primary';
    default:
      return 'neutral';
  }
};

// ─── Stat Card Component ──────────────────────────────────────────────────────
interface StatCardProps {
  icon: React.ReactNode;
  value: string;
  label: string;
  accent: string;
  subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, value, label, accent, subtitle }) => (
  <View style={[styles.statCard, { borderLeftColor: accent }]}>
    <View style={[styles.statIcon, { backgroundColor: `${accent}18` }]}>{icon}</View>
    <Text style={[styles.statValue, { color: accent }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
    {subtitle && <Text style={styles.statSub}>{subtitle}</Text>}
  </View>
);

// ─── Quick Action Component ───────────────────────────────────────────────────
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

// ─── Weekly Breakdown Chart Component ─────────────────────────────────────────
interface WeeklyChartProps {
  breakdown: DailyStudyItem[];
  weeklyGoalHours: number;
  weekHours: number;
}

const WeeklyChart: React.FC<WeeklyChartProps> = ({ breakdown, weeklyGoalHours, weekHours }) => {
  // Find max hours for scaling bars
  const maxHours = Math.max(...breakdown.map((b) => b.hours), 3);

  return (
    <Card style={styles.chartCard}>
      <View style={styles.chartHeader}>
        <View>
          <Text style={styles.chartTitle}>Weekly Study Activity</Text>
          <Text style={styles.chartSubtitle}>
            {weekHours}h studied of {weeklyGoalHours}h weekly goal
          </Text>
        </View>
        <Badge
          label={`${Math.min(100, Math.round((weekHours / (weeklyGoalHours || 1)) * 100))}% goal`}
          variant={weekHours >= weeklyGoalHours ? 'success' : 'primary'}
          dot
        />
      </View>

      <View style={styles.barsContainer}>
        {breakdown.map((item, index) => {
          const barHeightPercent = Math.max(10, Math.round((item.hours / maxHours) * 80));
          return (
            <View key={index} style={styles.barColumn}>
              <Text style={styles.barValueText}>
                {item.hours > 0 ? `${item.hours}h` : ''}
              </Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      height: `${barHeightPercent}%`,
                      backgroundColor: item.isToday
                        ? Colors.primary
                        : item.hours > 0
                        ? Colors.secondary
                        : Colors.cardSecondary,
                    },
                  ]}
                />
              </View>
              <Text
                style={[
                  styles.barDayLabel,
                  item.isToday && styles.barDayLabelToday,
                ]}
              >
                {item.day}
              </Text>
            </View>
          );
        })}
      </View>
    </Card>
  );
};

// ─── Main Screen Component ────────────────────────────────────────────────────
export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { summary, loading, refreshing, error, refresh, refetch } = useDashboard();

  const streak = summary?.user.studyStreak ?? user?.studyStreak ?? 0;
  const userName = summary?.user.name || user?.name || 'Student';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={Colors.primary}
            colors={[Colors.primary, Colors.secondary]}
          />
        }
      >
        {/* ── Greeting Header ── */}
        <View style={styles.greetingSection}>
          <View style={styles.greetingLeft}>
            <Text style={styles.dateText}>{formatDisplayDate()}</Text>
            <Text style={styles.greetingText}>{getGreeting(userName)}</Text>
            <Text style={styles.greetingSubtext}>
              Plan Smart. Study Better. Achieve More.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.avatarWrapper}
            onPress={() => router.push('/(tabs)/profile' as any)}
            activeOpacity={0.8}
          >
            <GraduationCap size={24} color={Colors.primary} />
            {streak > 0 && (
              <View style={styles.avatarStreakPill}>
                <Flame size={10} color={Colors.warning} />
                <Text style={styles.avatarStreakText}>{streak}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Error Banner (if fetch failed) ── */}
        {error && (
          <Card style={styles.errorCard}>
            <View style={styles.errorInner}>
              <AlertCircle size={20} color={Colors.error} />
              <View style={styles.errorTextCol}>
                <Text style={styles.errorTitle}>Could not load live dashboard</Text>
                <Text style={styles.errorDesc}>{error}</Text>
              </View>
              <TouchableOpacity style={styles.retryBtn} onPress={refetch}>
                <RefreshCw size={16} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          </Card>
        )}

        {/* ── Loading Skeleton / State ── */}
        {loading && !refreshing && !summary ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Calculating your study statistics...</Text>
          </View>
        ) : (
          <>
            {/* ── Streak Highlight Banner ── */}
            <View style={styles.streakBanner}>
              <View style={styles.streakLeft}>
                <View style={styles.streakFlameIcon}>
                  <Flame size={20} color={Colors.warning} />
                </View>
                <View>
                  <Text style={styles.streakTitle}>
                    {streak > 0 ? `${streak} Day Study Streak!` : 'Start Your Study Streak!'}
                  </Text>
                  <Text style={styles.streakSub}>
                    {streak > 0
                      ? 'Consistency is the key to academic mastery.'
                      : 'Complete a study session or task today to ignite your streak.'}
                  </Text>
                </View>
              </View>
              <Badge
                label={streak > 0 ? 'Active' : 'Get Started'}
                variant={streak > 0 ? 'warning' : 'primary'}
                dot={streak > 0}
              />
            </View>

            {/* ── Statistics Row ── */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.statsRow}
            >
              <StatCard
                icon={<Clock size={18} color={Colors.secondary} />}
                value={`${summary?.studyTime.todayHours ?? 0}h`}
                label="Today's Study"
                accent={Colors.secondary}
                subtitle={`${summary?.studyTime.todayMinutes ?? 0} mins`}
              />
              <StatCard
                icon={<CheckSquare size={18} color={Colors.success} />}
                value={`${summary?.tasks.completed ?? 0} / ${summary?.tasks.total ?? 0}`}
                label="Tasks Done"
                accent={Colors.success}
                subtitle={`${summary?.tasks.pending ?? 0} pending`}
              />
              <StatCard
                icon={<Target size={18} color={Colors.primary} />}
                value={`${summary?.studyTime.weeklyProgressPercent ?? 0}%`}
                label="Weekly Goal"
                accent={Colors.primary}
                subtitle={`${summary?.studyTime.weekHours ?? 0}h / ${summary?.studyTime.weeklyGoalHours ?? 20}h`}
              />
              <StatCard
                icon={<Calendar size={18} color={Colors.warning} />}
                value={`${summary?.exams.totalUpcoming ?? 0}`}
                label="Upcoming Exams"
                accent={Colors.warning}
                subtitle={
                  summary?.exams.nextExam
                    ? `${summary.exams.nextExam.daysRemaining}d to ${summary.exams.nextExam.subject}`
                    : 'None scheduled'
                }
              />
            </ScrollView>

            {/* ── Weekly Breakdown Visualizer ── */}
            {summary?.studyTime.weeklyBreakdown && (
              <WeeklyChart
                breakdown={summary.studyTime.weeklyBreakdown}
                weeklyGoalHours={summary.studyTime.weeklyGoalHours}
                weekHours={summary.studyTime.weekHours}
              />
            )}

            {/* ── Quick Actions Grid ── */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
            </View>
            <View style={styles.quickActionsGrid}>
              <QuickAction
                icon={<Plus size={20} color={Colors.primary} />}
                label="Add Task"
                color={Colors.primary}
                onPress={() => router.push('/(tabs)/tasks' as any)}
              />
              <QuickAction
                icon={<BookOpen size={20} color={Colors.secondary} />}
                label="Planner"
                color={Colors.secondary}
                onPress={() => router.push('/(tabs)/planner' as any)}
              />
              <QuickAction
                icon={<Calendar size={20} color={Colors.warning} />}
                label="Exams"
                color={Colors.warning}
                onPress={() => router.push('/(tabs)/exams' as any)}
              />
              <QuickAction
                icon={<TrendingUp size={20} color={Colors.success} />}
                label="Profile"
                color={Colors.success}
                onPress={() => router.push('/(tabs)/profile' as any)}
              />
            </View>

            {/* ── Today's Tasks Section ── */}
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitle}>Today's Tasks</Text>
                {summary?.tasks.todayTasks && summary.tasks.todayTasks.length > 0 && (
                  <Badge
                    label={`${summary.tasks.todayTasks.length}`}
                    variant="primary"
                  />
                )}
              </View>
              <TouchableOpacity
                style={styles.seeAll}
                onPress={() => router.push('/(tabs)/tasks' as any)}
                activeOpacity={0.7}
              >
                <Text style={styles.seeAllText}>View all</Text>
                <ArrowRight size={14} color={Colors.primary} />
              </TouchableOpacity>
            </View>

            {summary?.tasks.todayTasks && summary.tasks.todayTasks.length > 0 ? (
              <View style={styles.tasksList}>
                {summary.tasks.todayTasks.map((task: TodayTask) => (
                  <Card key={task._id} style={styles.taskCard}>
                    <View style={styles.taskRow}>
                      <View style={styles.taskCheckIcon}>
                        {task.status === 'completed' ? (
                          <CheckCircle2 size={20} color={Colors.success} />
                        ) : (
                          <Circle size={20} color={Colors.textMuted} />
                        )}
                      </View>
                      <View style={styles.taskInfo}>
                        <Text
                          style={[
                            styles.taskTitle,
                            task.status === 'completed' && styles.taskTitleCompleted,
                          ]}
                          numberOfLines={1}
                        >
                          {task.title}
                        </Text>
                        <View style={styles.taskMeta}>
                          <Text style={styles.taskSubject}>{task.subject}</Text>
                          <Text style={styles.taskBullet}>•</Text>
                          <Text style={styles.taskDuration}>
                            {task.estimatedMinutes} mins
                          </Text>
                        </View>
                      </View>
                      <Badge
                        label={task.priority}
                        variant={getPriorityVariant(task.priority)}
                      />
                    </View>
                  </Card>
                ))}
              </View>
            ) : (
              <Card style={styles.emptyCard}>
                <EmptyState
                  icon={<CheckSquare size={38} color={Colors.primary} />}
                  title="No tasks scheduled for today"
                  description="You are all caught up! Add a new task to organize your study agenda."
                  actionLabel="Add Task"
                  onAction={() => router.push('/(tabs)/tasks' as any)}
                />
              </Card>
            )}

            {/* ── Upcoming Exams Section ── */}
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitle}>Upcoming Exams</Text>
                {summary?.exams.upcoming && summary.exams.upcoming.length > 0 && (
                  <Badge
                    label={`${summary.exams.upcoming.length}`}
                    variant="warning"
                  />
                )}
              </View>
              <TouchableOpacity
                style={styles.seeAll}
                onPress={() => router.push('/(tabs)/exams' as any)}
                activeOpacity={0.7}
              >
                <Text style={styles.seeAllText}>View all</Text>
                <ArrowRight size={14} color={Colors.primary} />
              </TouchableOpacity>
            </View>

            {summary?.exams.upcoming && summary.exams.upcoming.length > 0 ? (
              <View style={styles.examsList}>
                {summary.exams.upcoming.map((exam: UpcomingExam) => (
                  <Card key={exam._id} style={styles.examCard}>
                    <View style={styles.examRow}>
                      <View style={styles.examIconWrapper}>
                        <BookOpen size={20} color={Colors.warning} />
                      </View>
                      <View style={styles.examInfo}>
                        <Text style={styles.examTitle} numberOfLines={1}>
                          {exam.examTitle}
                        </Text>
                        <Text style={styles.examSubject}>
                          {exam.subject} • {new Date(exam.examDate).toLocaleDateString()}
                        </Text>
                        {/* Syllabus progress bar */}
                        <View style={styles.syllabusProgressTrack}>
                          <View
                            style={[
                              styles.syllabusProgressBar,
                              { width: `${exam.syllabusProgressPercent}%` },
                            ]}
                          />
                        </View>
                        <Text style={styles.syllabusProgressText}>
                          {exam.syllabusProgressPercent}% syllabus covered
                        </Text>
                      </View>
                      <View style={styles.countdownPill}>
                        <Text style={styles.countdownNumber}>
                          {exam.daysRemaining}
                        </Text>
                        <Text style={styles.countdownUnit}>
                          {exam.daysRemaining === 1 ? 'day' : 'days'}
                        </Text>
                      </View>
                    </View>
                  </Card>
                ))}
              </View>
            ) : (
              <Card style={styles.emptyCard}>
                <EmptyState
                  icon={<BookOpen size={38} color={Colors.warning} />}
                  title="No upcoming exams"
                  description="Stay prepared and eliminate exam surprises by scheduling your upcoming midterms and finals."
                  actionLabel="Schedule Exam"
                  onAction={() => router.push('/(tabs)/exams' as any)}
                />
              </Card>
            )}

            <View style={styles.bottomPad} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.base },

  // Greeting
  greetingSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: Spacing.base,
    paddingBottom: Spacing.md,
  },
  greetingLeft: { flex: 1 },
  dateText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  greetingText: {
    color: Colors.text,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    letterSpacing: -0.4,
  },
  greetingSubtext: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    marginTop: 2,
  },
  avatarWrapper: {
    width: 52,
    height: 52,
    borderRadius: Radius.lg,
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.base,
  },
  avatarStreakPill: {
    position: 'absolute',
    bottom: -6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardSecondary,
    borderWidth: 1,
    borderColor: Colors.warning,
    borderRadius: Radius.full,
    paddingHorizontal: 4,
    paddingVertical: 1,
    gap: 2,
  },
  avatarStreakText: {
    color: Colors.warning,
    fontSize: 9,
    fontWeight: FontWeight.bold,
  },

  // Loading
  loadingContainer: {
    paddingVertical: Spacing.xxxl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },

  // Error Card
  errorCard: {
    backgroundColor: Colors.errorFaded,
    borderColor: Colors.error,
    borderWidth: 1,
    marginBottom: Spacing.base,
    padding: Spacing.md,
  },
  errorInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  errorTextCol: {
    flex: 1,
  },
  errorTitle: {
    color: Colors.error,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  errorDesc: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  retryBtn: {
    padding: Spacing.xs,
  },

  // Streak Banner
  streakBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.base,
    marginBottom: Spacing.base,
  },
  streakLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
    marginRight: Spacing.sm,
  },
  streakFlameIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: `${Colors.warning}18`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakTitle: {
    color: Colors.text,
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },
  streakSub: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    marginTop: 2,
  },

  // Stats Row
  statsRow: {
    gap: Spacing.sm,
    paddingRight: Spacing.base,
    paddingBottom: Spacing.base,
  },
  statCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.md,
    minWidth: 140,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statIcon: {
    width: 34,
    height: 34,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  statValue: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    letterSpacing: -0.3,
  },
  statLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    marginTop: 2,
  },
  statSub: {
    color: Colors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },

  // Chart Card
  chartCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.base,
    marginBottom: Spacing.base,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.base,
  },
  chartTitle: {
    color: Colors.text,
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },
  chartSubtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    paddingTop: Spacing.sm,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  barValueText: {
    color: Colors.textSecondary,
    fontSize: 9,
    marginBottom: 4,
    height: 12,
  },
  barTrack: {
    width: 14,
    height: 80,
    backgroundColor: Colors.cardSecondary,
    borderRadius: 7,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 7,
  },
  barDayLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: 6,
    fontWeight: FontWeight.medium,
  },
  barDayLabelToday: {
    color: Colors.primary,
    fontWeight: FontWeight.bold,
  },

  // Quick Actions
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
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
    fontWeight: FontWeight.semibold,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.base,
  },
  quickAction: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  quickActionIcon: {
    width: 42,
    height: 42,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    color: Colors.text,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },

  // Tasks List
  tasksList: {
    gap: Spacing.xs,
    marginBottom: Spacing.base,
  },
  taskCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.xs,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  taskCheckIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    color: Colors.text,
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
  },
  taskTitleCompleted: {
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: 2,
  },
  taskSubject: {
    color: Colors.secondary,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  taskBullet: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
  taskDuration: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },

  // Exams List
  examsList: {
    gap: Spacing.xs,
    marginBottom: Spacing.base,
  },
  examCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.xs,
  },
  examRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  examIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    backgroundColor: `${Colors.warning}18`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  examInfo: {
    flex: 1,
  },
  examTitle: {
    color: Colors.text,
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
  },
  examSubject: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    marginTop: 2,
    marginBottom: 4,
  },
  syllabusProgressTrack: {
    height: 4,
    backgroundColor: Colors.cardSecondary,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 4,
    marginBottom: 2,
  },
  syllabusProgressBar: {
    height: '100%',
    backgroundColor: Colors.warning,
    borderRadius: 2,
  },
  syllabusProgressText: {
    color: Colors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  countdownPill: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.cardSecondary,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    minWidth: 54,
  },
  countdownNumber: {
    color: Colors.warning,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  countdownUnit: {
    color: Colors.textMuted,
    fontSize: 9,
    textTransform: 'uppercase',
  },

  // Empty state container
  emptyCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.base,
  },

  bottomPad: { height: Spacing.xxxl },
});
