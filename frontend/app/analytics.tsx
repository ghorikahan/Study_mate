import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Flame,
  Clock,
  Award,
  Zap,
  TrendingUp,
  Target,
  Play,
  RotateCw,
} from 'lucide-react-native';
import { useAnalytics } from '../hooks/useAnalytics';
import StudyHoursChart from '../components/analytics/StudyHoursChart';
import SubjectDistributionCard from '../components/analytics/SubjectDistributionCard';
import TaskCompletionCard from '../components/analytics/TaskCompletionCard';
import MonthlyProgressCard from '../components/analytics/MonthlyProgressCard';

// ─── Theme ────────────────────────────────────────────────────────────────────
const C = {
  bg: '#0B0D12',
  card: '#151923',
  cardAlt: '#1C2333',
  primary: '#8B5CF6',
  primaryLight: '#A78BFA',
  secondary: '#22D3EE',
  text: '#F9FAFB',
  textMuted: '#6B7280',
  border: '#374151',
  error: '#EF4444',
  warning: '#F59E0B',
  success: '#10B981',
};

const TIME_RANGES: { key: '7d' | '30d' | 'all'; label: string }[] = [
  { key: '7d', label: 'Last 7 Days' },
  { key: '30d', label: '30 Days' },
  { key: 'all', label: 'All Time' },
];

export default function AnalyticsScreen() {
  const router = useRouter();
  const { data, loading, refreshing, error, timeRange, setTimeRange, refresh } = useAnalytics('7d');

  if (loading && !data) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={styles.loadingText}>Synthesizing your study analytics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const score = data?.productivityScore || 50;
  const scoreLabel =
    score >= 80 ? '🔥 High Momentum'
    : score >= 60 ? '✨ Solid Progress'
    : score >= 40 ? '⚡ Building Habits'
    : '🌱 Starting Out';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ArrowLeft size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analytics & Insights</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={refresh}>
          <RotateCw size={18} color={C.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Time Range Filter Tabs */}
      <View style={styles.rangeRow}>
        {TIME_RANGES.map((tab) => {
          const active = timeRange === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.rangeTab, active && styles.rangeTabActive]}
              onPress={() => setTimeRange(tab.key)}
            >
              <Text style={[styles.rangeTabText, active && styles.rangeTabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={C.primary}
            colors={[C.primary]}
          />
        }
      >
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
            <TouchableOpacity onPress={refresh}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Composite Productivity Score Card ── */}
        <View style={styles.scoreCard}>
          <View style={styles.scoreLeft}>
            <Text style={styles.scoreTitle}>Productivity Score</Text>
            <Text style={styles.scoreDescriptor}>{scoreLabel}</Text>
            <Text style={styles.scoreSub}>
              Based on study goal adherence, task completions & focus ratings.
            </Text>
          </View>
          <View style={styles.scoreBadge}>
            <Text style={styles.scoreValue}>{score}</Text>
            <Text style={styles.scoreTotal}>/100</Text>
          </View>
        </View>

        {/* ── Key Metrics Grid (4 tiles) ── */}
        <View style={styles.metricsGrid}>
          {/* Tile 1: Total Study Hours */}
          <View style={styles.metricTile}>
            <View style={[styles.metricIconWrap, { backgroundColor: C.secondary + '18' }]}>
              <Clock size={18} color={C.secondary} />
            </View>
            <Text style={styles.metricVal}>{data?.studyTime.totalHours ?? 0}h</Text>
            <Text style={styles.metricLbl}>Total Focus Time</Text>
          </View>

          {/* Tile 2: Focus Sessions */}
          <View style={styles.metricTile}>
            <View style={[styles.metricIconWrap, { backgroundColor: C.primary + '18' }]}>
              <Award size={18} color={C.primary} />
            </View>
            <Text style={styles.metricVal}>{data?.focusMetrics.totalSessions ?? 0}</Text>
            <Text style={styles.metricLbl}>Sessions Done</Text>
          </View>

          {/* Tile 3: Streak */}
          <View style={styles.metricTile}>
            <View style={[styles.metricIconWrap, { backgroundColor: C.warning + '18' }]}>
              <Flame size={18} color={C.warning} />
            </View>
            <Text style={styles.metricVal}>{data?.streak.currentStreak ?? 0}d</Text>
            <Text style={styles.metricLbl}>Current Streak</Text>
          </View>

          {/* Tile 4: Daily Average */}
          <View style={styles.metricTile}>
            <View style={[styles.metricIconWrap, { backgroundColor: C.success + '18' }]}>
              <Zap size={18} color={C.success} />
            </View>
            <Text style={styles.metricVal}>{data?.studyTime.dailyAverageHours ?? 0}h</Text>
            <Text style={styles.metricLbl}>Daily Average</Text>
          </View>
        </View>

        {/* ── Daily Study Hours Chart ── */}
        {data?.studyTime.dailyBreakdown && data.studyTime.dailyBreakdown.length > 0 ? (
          <StudyHoursChart
            data={data.studyTime.dailyBreakdown}
            goalHours={data.studyTime.weeklyGoalHours}
          />
        ) : null}

        {/* ── Subject-Wise Study Distribution ── */}
        <SubjectDistributionCard
          distribution={data?.subjectDistribution ?? []}
        />

        {/* ── Overall Task Completion Card ── */}
        {data?.taskMetrics ? (
          <TaskCompletionCard metrics={data.taskMetrics} />
        ) : null}

        {/* ── Monthly Progress vs Goal ── */}
        {data?.monthlyProgress ? (
          <MonthlyProgressCard progress={data.monthlyProgress} />
        ) : null}

        {/* ── Action CTA to Focus Timer ── */}
        <TouchableOpacity
          style={styles.focusCta}
          onPress={() => router.push('/focus' as any)}
          activeOpacity={0.85}
        >
          <View style={styles.focusCtaLeft}>
            <Play size={22} color="#fff" fill="#fff" />
            <View>
              <Text style={styles.focusCtaTitle}>Ready to boost your stats?</Text>
              <Text style={styles.focusCtaSub}>Start a 25-minute Pomodoro focus block</Text>
            </View>
          </View>
          <Text style={styles.focusCtaArrow}>→</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: C.textMuted,
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: C.text,
  },
  rangeRow: {
    flexDirection: 'row',
    backgroundColor: C.card,
    borderRadius: 14,
    marginHorizontal: 20,
    marginTop: 14,
    marginBottom: 8,
    padding: 4,
    borderWidth: 1,
    borderColor: C.border,
  },
  rangeTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  rangeTabActive: {
    backgroundColor: C.primary,
  },
  rangeTabText: {
    color: C.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  rangeTabTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  errorBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: C.error + '20',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderLeftWidth: 3,
    borderLeftColor: C.error,
  },
  errorText: {
    color: C.error,
    fontSize: 13,
    flex: 1,
  },
  retryText: {
    color: C.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  scoreCard: {
    backgroundColor: C.card,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: `${C.primary}50`,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  scoreLeft: {
    flex: 1,
    marginRight: 14,
  },
  scoreTitle: {
    fontSize: 12,
    color: C.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '700',
  },
  scoreDescriptor: {
    fontSize: 18,
    fontWeight: '800',
    color: C.text,
    marginTop: 2,
  },
  scoreSub: {
    fontSize: 11,
    color: C.textMuted,
    marginTop: 4,
    lineHeight: 16,
  },
  scoreBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: C.primary + '20',
    borderWidth: 2,
    borderColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: '900',
    color: C.primaryLight,
    lineHeight: 28,
  },
  scoreTotal: {
    fontSize: 10,
    color: C.textMuted,
    fontWeight: '600',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  metricTile: {
    width: '48%',
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  metricIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  metricVal: {
    fontSize: 22,
    fontWeight: '800',
    color: C.text,
    marginBottom: 2,
  },
  metricLbl: {
    fontSize: 11,
    color: C.textMuted,
    fontWeight: '500',
  },
  focusCta: {
    backgroundColor: C.primary,
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    shadowColor: C.primary,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  focusCtaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  focusCtaTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  focusCtaSub: {
    color: '#fff' + 'CC',
    fontSize: 12,
    marginTop: 2,
  },
  focusCtaArrow: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
});

