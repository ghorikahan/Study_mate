import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit2,
  Trash2,
  Clock,
  Calendar,
  AlertCircle,
  RefreshCw,
  Home,
} from 'lucide-react-native';
import { Colors } from '../constants/colors';
import { Card, Badge, EmptyState } from '../components/ui';
import { FontSize, FontWeight, Spacing, Radius } from '../constants/theme';
import { useTimetable, toDateString, addDays, getMondayOf } from '../hooks/useTimetable';
import ScheduleModal from '../components/ScheduleModal';
import { TimetableEntry, CreateTimetableInput, UpdateTimetableInput } from '../types/timetable';

// ─── Day-of-week labels ────────────────────────────────────────────────────────
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const FULL_DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// ─── Today YYYY-MM-DD ─────────────────────────────────────────────────────────
const getTodayStr = () => new Date().toISOString().split('T')[0];

// ─── Format week label ─────────────────────────────────────────────────────────
const formatWeekLabel = (weekStart: string): string => {
  const start = new Date(weekStart + 'T00:00:00Z');
  const end = addDays(start, 6);
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  return `${start.toLocaleDateString('en-US', opts)} – ${end.toLocaleDateString('en-US', opts)}`;
};

// ─── Format date display ───────────────────────────────────────────────────────
const formatDayHeader = (dateStr: string): string => {
  const d = new Date(dateStr + 'T00:00:00Z');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
};

// ─── Duration label ────────────────────────────────────────────────────────────
const formatDuration = (minutes?: number, startTime?: string, endTime?: string): string => {
  let mins = typeof minutes === 'number' && !isNaN(minutes) && minutes > 0 ? minutes : undefined;
  if (mins === undefined && startTime && endTime) {
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    if (!isNaN(sh) && !isNaN(sm) && !isNaN(eh) && !isNaN(em)) {
      mins = Math.max(0, (eh * 60 + em) - (sh * 60 + sm));
    }
  }
  if (!mins || isNaN(mins) || mins <= 0) return '60m';
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

// ─── Session Card ──────────────────────────────────────────────────────────────
interface SessionCardProps {
  entry: TimetableEntry;
  isToday: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

const SessionCard: React.FC<SessionCardProps> = ({ entry, isToday, onEdit, onDelete }) => {
  const isCompleted = entry.status === 'completed';
  const isSkipped = entry.status === 'skipped';

  return (
    <View style={[styles.sessionCard, { borderLeftColor: entry.color || Colors.primary }]}>
      <View style={styles.sessionTimeCol}>
        <Text style={[styles.sessionTime, (isCompleted || isSkipped) && styles.sessionTimeFaded]}>
          {entry.startTime}
        </Text>
        <View style={styles.sessionTimeLine} />
        <Text style={[styles.sessionTime, styles.sessionTimeEnd, (isCompleted || isSkipped) && styles.sessionTimeFaded]}>
          {entry.endTime}
        </Text>
      </View>

      <View style={styles.sessionBody}>
        <View style={styles.sessionTopRow}>
          <Text
            style={[
              styles.sessionSubject,
              isCompleted && styles.sessionSubjectCompleted,
              isSkipped && styles.sessionSubjectSkipped,
            ]}
            numberOfLines={1}
          >
            {entry.subject}
          </Text>
          <Badge
            label={entry.status}
            variant={entry.status === 'completed' ? 'success' : entry.status === 'skipped' ? 'neutral' : 'primary'}
          />
        </View>
        {entry.topic ? (
          <Text style={styles.sessionTopic} numberOfLines={1}>{entry.topic}</Text>
        ) : null}
        <View style={styles.sessionMeta}>
          <Clock size={12} color={Colors.textMuted} />
          <Text style={styles.sessionMetaText}>{formatDuration(entry.durationMinutes, entry.startTime, entry.endTime)}</Text>
          {isToday && entry.status === 'scheduled' && (
            <>
              <Text style={styles.sessionDot}>•</Text>
              <Text style={[styles.sessionMetaText, { color: Colors.primary }]}>Today</Text>
            </>
          )}
        </View>
        {entry.notes ? (
          <Text style={styles.sessionNotes} numberOfLines={1}>{entry.notes}</Text>
        ) : null}
      </View>

      <View style={styles.sessionActions}>
        <TouchableOpacity onPress={onEdit} style={styles.actionBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Edit2 size={16} color={Colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onDelete} style={styles.actionBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Trash2 size={16} color={Colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── Main Timetable Screen ─────────────────────────────────────────────────────
export default function TimetableScreen() {
  const router = useRouter();
  const today = getTodayStr();

  const {
    weekData,
    days,
    subjects,
    selectedDate,
    weekStart,
    loading,
    refreshing,
    error,
    setSelectedDate,
    goToPrevWeek,
    goToNextWeek,
    goToCurrentWeek,
    createEntry,
    updateEntry,
    deleteEntry,
    refresh,
  } = useTimetable();

  const [modalVisible, setModalVisible] = useState(false);
  const [editEntry, setEditEntry] = useState<TimetableEntry | null>(null);

  // Build 7-day strip (Mon–Sun) from weekStart
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(new Date(weekStart + 'T00:00:00Z'), i);
    return toDateString(d);
  });

  // Find current selected day's data
  const selectedDayData = days.find((d) => d.date === selectedDate);
  const selectedDayEntries = selectedDayData?.entries ?? [];

  // ─── Handlers ───────────────────────────────────────────────────────────────
  const handleOpenCreate = () => {
    setEditEntry(null);
    setModalVisible(true);
  };

  const handleOpenEdit = (entry: TimetableEntry) => {
    setEditEntry(entry);
    setModalVisible(true);
  };

  const handleDelete = (entry: TimetableEntry) => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(`Remove "${entry.subject}" (${entry.startTime}–${entry.endTime}) from your timetable?`)) {
        deleteEntry(entry._id).catch((err: any) => {
          if (typeof window !== 'undefined') window.alert(err?.response?.data?.message || 'Could not delete session');
        });
      }
      return;
    }

    Alert.alert(
      'Delete Session',
      `Remove "${entry.subject}" (${entry.startTime}–${entry.endTime}) from your timetable?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEntry(entry._id);
            } catch (err: any) {
              Alert.alert('Error', err?.response?.data?.message || 'Could not delete session');
            }
          },
        },
      ]
    );
  };

  const handleSubmit = async (data: CreateTimetableInput | UpdateTimetableInput) => {
    if (editEntry) {
      await updateEntry(editEntry._id, data as UpdateTimetableInput);
    } else {
      await createEntry({ ...data, date: selectedDate } as CreateTimetableInput);
    }
  };

  // ─── Weekly summary stats ────────────────────────────────────────────────────
  const totalWeekHours = weekData?.totalWeekHours ?? 0;
  const totalWeekSessions = weekData?.total ?? 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ── Top Nav ── */}
      <View style={styles.topNav}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={22} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.topNavCenter}>
          <Text style={styles.screenTitle}>Weekly Timetable</Text>
          <Text style={styles.screenSubtitle}>{formatWeekLabel(weekStart)}</Text>
        </View>
        <TouchableOpacity
          onPress={handleOpenCreate}
          style={styles.addBtn}
          accessibilityLabel="Add Session"
        >
          <Plus size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* ── Week Navigation ── */}
      <View style={styles.weekNav}>
        <TouchableOpacity onPress={goToPrevWeek} style={styles.weekNavBtn}>
          <ChevronLeft size={20} color={Colors.textSecondary} />
        </TouchableOpacity>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dayStrip}
        >
          {weekDays.map((dateStr, idx) => {
            const isSelected = dateStr === selectedDate;
            const isToday = dateStr === today;
            const dayData = days.find((d) => d.date === dateStr);
            const hasEntries = (dayData?.entryCount ?? 0) > 0;

            return (
              <TouchableOpacity
                key={dateStr}
                style={[styles.dayPill, isSelected && styles.dayPillActive, isToday && !isSelected && styles.dayPillToday]}
                onPress={() => setSelectedDate(dateStr)}
                activeOpacity={0.8}
              >
                <Text style={[styles.dayLabel, isSelected && styles.dayLabelActive]}>
                  {DAY_LABELS[idx]}
                </Text>
                <Text style={[styles.dayNum, isSelected && styles.dayNumActive]}>
                  {new Date(dateStr + 'T00:00:00Z').getUTCDate()}
                </Text>
                {hasEntries && (
                  <View style={[styles.dayDot, isSelected && styles.dayDotActive]} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <TouchableOpacity onPress={goToNextWeek} style={styles.weekNavBtn}>
          <ChevronRight size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* ── Jump to Today ── */}
      {weekStart !== toDateString(getMondayOf(new Date())) && (
        <TouchableOpacity style={styles.todayJump} onPress={goToCurrentWeek}>
          <Home size={13} color={Colors.primary} />
          <Text style={styles.todayJumpText}>Back to current week</Text>
        </TouchableOpacity>
      )}

      {/* ── Weekly Summary ── */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{totalWeekSessions}</Text>
          <Text style={styles.summaryLabel}>Sessions</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{totalWeekHours}h</Text>
          <Text style={styles.summaryLabel}>Planned</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{subjects.length}</Text>
          <Text style={styles.summaryLabel}>Subjects</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: Colors.primary }]}>
            {days.filter((d) => d.entryCount > 0).length}/7
          </Text>
          <Text style={styles.summaryLabel}>Days Active</Text>
        </View>
      </View>

      {/* ── Error Banner ── */}
      {error && (
        <View style={styles.errorBanner}>
          <AlertCircle size={16} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={refresh}>
            <RefreshCw size={16} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      )}

      {/* ── Day Schedule ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {/* Day header */}
        <View style={styles.dayHeader}>
          <View>
            <Text style={styles.dayHeaderName}>{formatDayHeader(selectedDate)}</Text>
            {selectedDate === today && (
              <Badge label="Today" variant="primary" dot />
            )}
          </View>
          {selectedDayData && selectedDayData.totalMinutes > 0 && (
            <Text style={styles.dayHeaderTime}>
              {formatDuration(selectedDayData.totalMinutes)} planned
            </Text>
          )}
        </View>

        {/* Loading */}
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading timetable...</Text>
          </View>
        ) : selectedDayEntries.length > 0 ? (
          <View style={styles.sessionsList}>
            {selectedDayEntries.map((entry) => (
              <SessionCard
                key={entry._id}
                entry={entry}
                isToday={selectedDate === today}
                onEdit={() => handleOpenEdit(entry)}
                onDelete={() => handleDelete(entry)}
              />
            ))}
          </View>
        ) : (
          <Card style={styles.emptyCard}>
            <EmptyState
              icon={<Calendar size={40} color={Colors.primary} />}
              title="No sessions scheduled"
              description={`No study sessions planned for ${FULL_DAY_NAMES[new Date(selectedDate + 'T00:00:00Z').getUTCDay() === 0 ? 6 : new Date(selectedDate + 'T00:00:00Z').getUTCDay() - 1]}. Tap + to add one.`}
              actionLabel="Add Session"
              onAction={handleOpenCreate}
            />
          </Card>
        )}

        {/* Weekly overview bar chart */}
        {!loading && days.length > 0 && (
          <View style={styles.weekChart}>
            <Text style={styles.weekChartTitle}>Week Overview</Text>
            <View style={styles.bars}>
              {days.map((day, idx) => {
                const maxMins = Math.max(...days.map((d) => d.totalMinutes), 60);
                const pct = Math.max(4, Math.round((day.totalMinutes / maxMins) * 72));
                const isActive = day.date === selectedDate;
                return (
                  <TouchableOpacity
                    key={day.date}
                    style={styles.barCol}
                    onPress={() => setSelectedDate(day.date)}
                  >
                    <Text style={styles.barHours}>
                      {day.totalMinutes > 0 ? `${Math.round(day.totalMinutes / 60 * 10) / 10}h` : ''}
                    </Text>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          { height: pct, backgroundColor: isActive ? Colors.primary : day.date === today ? Colors.secondary : Colors.border },
                        ]}
                      />
                    </View>
                    <Text style={[styles.barLabel, isActive && { color: Colors.primary }]}>
                      {DAY_LABELS[idx]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── Schedule Modal ── */}
      <ScheduleModal
        visible={modalVisible}
        onClose={() => { setModalVisible(false); setEditEntry(null); }}
        onSubmit={handleSubmit}
        editEntry={editEntry}
        initialDate={selectedDate}
        existingSubjects={subjects}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    padding: Spacing.xs,
    marginRight: Spacing.sm,
  },
  topNavCenter: {
    flex: 1,
  },
  screenTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold as any,
    color: Colors.text,
  },
  screenSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  addBtn: {
    backgroundColor: Colors.primary,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekNav: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  weekNavBtn: {
    padding: Spacing.xs,
  },
  dayStrip: {
    paddingHorizontal: Spacing.xs,
    gap: Spacing.xs,
    alignItems: 'center',
  },
  dayPill: {
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.lg,
    minWidth: 44,
  },
  dayPillActive: {
    backgroundColor: Colors.primary,
  },
  dayPillToday: {
    backgroundColor: `${Colors.primary}22`,
  },
  dayLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: FontWeight.medium as any,
  },
  dayLabelActive: {
    color: '#fff',
  },
  dayNum: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold as any,
    color: Colors.text,
    marginTop: 1,
  },
  dayNumActive: {
    color: '#fff',
  },
  dayDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.secondary,
    marginTop: 3,
  },
  dayDotActive: {
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  todayJump: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
    backgroundColor: `${Colors.primary}18`,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  todayJumpText: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontWeight: FontWeight.medium as any,
  },
  summaryRow: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold as any,
    color: Colors.text,
  },
  summaryLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 1,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.xs,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: `${Colors.error}18`,
    padding: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: `${Colors.error}30`,
    paddingHorizontal: Spacing.md,
  },
  errorText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.error,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  dayHeaderName: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold as any,
    color: Colors.text,
    marginBottom: 4,
  },
  dayHeaderTime: {
    fontSize: FontSize.sm,
    color: Colors.secondary,
    fontWeight: FontWeight.medium as any,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.md,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  sessionsList: {
    gap: Spacing.md,
  },
  sessionCard: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderLeftWidth: 4,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  sessionTimeCol: {
    alignItems: 'center',
    minWidth: 44,
  },
  sessionTime: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold as any,
    color: Colors.text,
  },
  sessionTimeEnd: {
    color: Colors.textMuted,
  },
  sessionTimeFaded: {
    opacity: 0.4,
  },
  sessionTimeLine: {
    width: 1,
    flex: 1,
    backgroundColor: Colors.border,
    marginVertical: 3,
    minHeight: 10,
  },
  sessionBody: {
    flex: 1,
    gap: 4,
  },
  sessionTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sessionSubject: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold as any,
    color: Colors.text,
    flex: 1,
  },
  sessionSubjectCompleted: {
    textDecorationLine: 'line-through',
    color: Colors.textMuted,
  },
  sessionSubjectSkipped: {
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  sessionTopic: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  sessionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sessionMetaText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  sessionDot: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
  sessionNotes: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  sessionActions: {
    gap: Spacing.sm,
    justifyContent: 'center',
  },
  actionBtn: {
    padding: Spacing.xs,
  },
  emptyCard: {
    padding: Spacing.xl,
  },
  weekChart: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  weekChartTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold as any,
    color: Colors.textSecondary,
  },
  bars: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 100,
  },
  barCol: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  barHours: {
    fontSize: 9,
    color: Colors.textMuted,
    textAlign: 'center',
    minHeight: 12,
  },
  barTrack: {
    width: 24,
    height: 72,
    backgroundColor: `${Colors.border}80`,
    borderRadius: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 4,
  },
  barLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
