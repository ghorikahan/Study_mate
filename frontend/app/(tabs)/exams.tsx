import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  Calendar,
  Plus,
  Search,
  Tag,
  AlertCircle,
  Clock,
  MapPin,
  Trash2,
  Edit2,
  X,
  Target,
} from 'lucide-react-native';
import { useExams } from '../../hooks/useExams';
import ExamModal from '../../components/ExamModal';
import { EmptyState } from '../../components/ui';
import { Colors } from '../../constants/colors';
import { FontSize, FontWeight, Radius } from '../../constants/theme';
import { Exam, ExamPriority, ExamStatus, CreateExamInput, UpdateExamInput } from '../../types/exam';

// ─── Theme Colors ─────────────────────────────────────────────────────────────
const C = {
  bg: Colors.background,
  card: Colors.card,
  cardAlt: Colors.cardSecondary,
  primary: Colors.primary,
  secondary: Colors.secondary,
  text: Colors.text,
  textMuted: Colors.textMuted,
  border: Colors.border,
  error: Colors.error,
  warning: Colors.warning,
  success: Colors.success,
};

const PRIORITY_COLORS: Record<ExamPriority, string> =   {
  urgent: Colors.error,
  high: Colors.warning,
  medium: Colors.primary,
  low: Colors.success,
};

const STATUS_COLORS: Record<ExamStatus, string> = {
  upcoming: Colors.secondary,
  'in-progress': Colors.warning,
  completed: Colors.success,
  cancelled: Colors.textMuted,
};

// ─── Filter Tabs ──────────────────────────────────────────────────────────────
const FILTER_TABS = [
  { key: '', label: 'All' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'this-week', label: 'This Week' },
  { key: 'past', label: 'Past' },
];

const PRIORITY_TABS: { key: string; label: string; color: string }[] = [
  { key: '', label: 'All Priorities', color: Colors.textSecondary },
  { key: 'urgent', label: 'Urgent', color: Colors.error },
  { key: 'high', label: 'High', color: Colors.warning },
  { key: 'medium', label: 'Medium', color: Colors.primary },
  { key: 'low', label: 'Low', color: Colors.success },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const localDaysRemaining = (examDateStr: string): number => {
  const examMidnight = new Date(examDateStr);
  examMidnight.setHours(0, 0, 0, 0);
  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);
  return Math.ceil((examMidnight.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24));
};

const formatCountdown = (days: number): { label: string; color: string } => {
  if (days < 0) return { label: `${Math.abs(days)}d ago`, color: C.textMuted };
  if (days === 0) return { label: 'Today!', color: C.error };
  if (days === 1) return { label: 'Tomorrow', color: C.warning };
  if (days <= 3) return { label: `${days} days`, color: C.warning };
  if (days <= 7) return { label: `${days} days`, color: C.secondary };
  return { label: `${days} days`, color: C.textMuted };
};

const formatDate = (dateStr: string): string => {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

const formatDuration = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

// ─── Exam Card ────────────────────────────────────────────────────────────────
interface ExamCardProps {
  exam: Exam;
  onEdit: (exam: Exam) => void;
  onDelete: (exam: Exam) => void;
}

const ExamCard: React.FC<ExamCardProps> = ({ exam, onEdit, onDelete }) => {
  const days = localDaysRemaining(exam.examDate);
  const countdown = formatCountdown(days);
  const isPast = days < 0 || exam.status === 'completed' || exam.status === 'cancelled';
  const isUrgent = days >= 0 && days <= 3;

  return (
    <View style={[styles.card, isPast && styles.cardPast]}>
      {/* Urgent banner */}
      {isUrgent && days >= 0 && (
        <View style={styles.urgentBanner}>
          <Text style={styles.urgentBannerText}>
            🚨 {days === 0 ? 'Exam is TODAY!' : days === 1 ? 'Exam is TOMORROW!' : `Only ${days} days left!`}
          </Text>
        </View>
      )}

      {/* Card header */}
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={styles.subjectBadgeRow}>
            <Text style={[styles.cardSubject, isPast && styles.textFaded]}>{exam.subject}</Text>
          </View>
          <Text style={[styles.cardTitle, isPast && styles.textFaded]} numberOfLines={2}>
            {exam.examTitle || (exam as any).title || 'Untitled Exam'}
          </Text>
        </View>
        <View style={styles.cardHeaderRight}>
          <Text style={[styles.countdown, { color: countdown.color }]}>{countdown.label}</Text>
          <Text style={[styles.countdownLabel, { color: countdown.color }]}>remaining</Text>
        </View>
      </View>

      {/* Meta row */}
      <View style={styles.metaRow}>
        <View style={styles.metaItemRow}>
          <Calendar size={13} color={C.textMuted} />
          <Text style={styles.metaItem}>{formatDate(exam.examDate)}</Text>
        </View>
        {exam.startTime ? (
          <View style={styles.metaItemRow}>
            <Clock size={13} color={C.textMuted} />
            <Text style={styles.metaItem}>{exam.startTime}</Text>
          </View>
        ) : null}
        <View style={styles.metaItemRow}>
          <Target size={13} color={C.textMuted} />
          <Text style={styles.metaItem}>{formatDuration(exam.durationMinutes)}</Text>
        </View>
      </View>

      {exam.location ? (
        <View style={styles.locationRow}>
          <MapPin size={13} color={C.textMuted} />
          <Text style={styles.location}>{exam.location}{exam.seatNumber ? ` • Seat ${exam.seatNumber}` : ''}</Text>
        </View>
      ) : null}

      {/* Badges row */}
      <View style={styles.badgeRow}>
        <View
          style={[
            styles.badge,
            {
              backgroundColor: (PRIORITY_COLORS[exam.priority] || '#3B82F6') + '22',
              borderColor: PRIORITY_COLORS[exam.priority] || '#3B82F6',
            },
          ]}
        >
          <Text style={[styles.badgeText, { color: PRIORITY_COLORS[exam.priority] || '#3B82F6' }]}>
            {(exam.priority || 'medium').toUpperCase()}
          </Text>
        </View>
        <View
          style={[
            styles.badge,
            {
              backgroundColor: (STATUS_COLORS[exam.status] || '#10B981') + '22',
              borderColor: STATUS_COLORS[exam.status] || '#10B981',
            },
          ]}
        >
          <Text style={[styles.badgeText, { color: STATUS_COLORS[exam.status] || '#10B981' }]}>
            {(exam.status || 'upcoming').toUpperCase()}
          </Text>
        </View>
        {exam.targetScore != null && (
          <View style={[styles.badge, { backgroundColor: C.cardAlt, borderColor: C.border }]}>
            <Text style={[styles.badgeText, { color: C.textMuted }]}>🎯 Target: {exam.targetScore}%</Text>
          </View>
        )}
      </View>

      {/* Syllabus progress */}
      {exam.syllabusTopics && exam.syllabusTopics.length > 0 && (
        <View style={styles.progressSection}>
          <View style={styles.progressLabelRow}>
            <Text style={styles.progressLabel}>Syllabus Coverage</Text>
            <Text style={styles.progressPercent}>{exam.syllabusProgressPercent ?? 0}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(100, Math.max(0, exam.syllabusProgressPercent ?? 0))}%`,
                  backgroundColor:
                    (exam.syllabusProgressPercent ?? 0) >= 80
                      ? C.success
                      : (exam.syllabusProgressPercent ?? 0) >= 50
                      ? C.warning
                      : C.primary,
                },
              ]}
            />
          </View>
          <Text style={styles.progressDetail}>
            {exam.syllabusTopics.filter((t) => t.isCovered).length}/{exam.syllabusTopics.length} topics prepared
          </Text>
        </View>
      )}

      {/* Notes preview */}
      {exam.notes ? (
        <Text style={styles.notesPreview} numberOfLines={2}>
          📝 {exam.notes}
        </Text>
      ) : null}

      {/* Actions */}
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.editBtn} onPress={() => onEdit(exam)} activeOpacity={0.8}>
          <Edit2 size={13} color={C.secondary} />
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete(exam)} activeOpacity={0.8}>
          <Trash2 size={13} color={C.error} />
          <Text style={styles.deleteBtnText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function ExamsScreen() {
  const [activeTab, setActiveTab] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);

  const {
    exams,
    counts,
    subjects,
    loading,
    refreshing,
    error,
    createExam,
    updateExam,
    deleteExam,
    refresh,
    setFilters,
  } = useExams({
    status: activeTab,
    subject: subjectFilter,
    priority: priorityFilter,
    search: searchQuery,
  });

  // Filter change handlers
  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setFilters({ status: key, subject: subjectFilter, priority: priorityFilter, search: searchQuery });
  };

  const handleSubjectFilter = (s: string) => {
    const next = (subjectFilter || '').toLowerCase() === (s || '').toLowerCase() ? '' : s;
    setSubjectFilter(next);
    setFilters({ status: activeTab, subject: next, priority: priorityFilter, search: searchQuery });
  };

  const handlePriorityFilter = (p: string) => {
    const next = priorityFilter === p ? '' : p;
    setPriorityFilter(next);
    setFilters({ status: activeTab, subject: subjectFilter, priority: next, search: searchQuery });
  };

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    setFilters({ status: activeTab, subject: subjectFilter, priority: priorityFilter, search: q });
  };

  const handleResetFilters = () => {
    setActiveTab('');
    setSubjectFilter('');
    setPriorityFilter('');
    setSearchQuery('');
    setFilters({ status: '', subject: '', priority: '', search: '' });
  };

  const hasActiveFilters = Boolean(activeTab || subjectFilter || priorityFilter || searchQuery.trim());

  const handleOpenCreate = () => {
    setEditingExam(null);
    setModalVisible(true);
  };

  const handleOpenEdit = (exam: Exam) => {
    setEditingExam(exam);
    setModalVisible(true);
  };

  const handleDelete = (exam: Exam) => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(`Are you sure you want to delete "${exam.examTitle || (exam as any).title || 'this exam'}"? This action cannot be undone.`)) {
        deleteExam(exam._id).catch((err: any) => {
          if (typeof window !== 'undefined') window.alert(err?.message || 'Failed to delete exam. Please try again.');
        });
      }
      return;
    }

    Alert.alert(
      'Delete Exam',
      `Are you sure you want to delete "${exam.examTitle || (exam as any).title || 'this exam'}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteExam(exam._id);
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to delete exam. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleSubmit = async (data: CreateExamInput | UpdateExamInput) => {
    if (editingExam) {
      await updateExam(editingExam._id, data as UpdateExamInput);
    } else {
      await createExam(data as CreateExamInput);
    }
  };

  // Distinct subjects list with 'All'
  const allSubjects = ['All', ...subjects.filter((s) => s && s.toLowerCase() !== 'all')];

  if (loading && !refreshing && exams.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar style="light" />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={styles.loadingText}>Loading exam countdowns...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />

      {/* Screen Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Exam Countdown</Text>
          <Text style={styles.headerSub}>
            {counts.upcoming} upcoming · {counts.thisWeek} this week
          </Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={handleOpenCreate} activeOpacity={0.8}>
          <Plus size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Stats Metric Boxes */}
      <View style={styles.statsRow}>
        {[
          { label: 'Total', value: counts.total, color: C.text },
          { label: 'Upcoming', value: counts.upcoming, color: C.secondary },
          { label: 'This Week', value: counts.thisWeek, color: C.warning },
          { label: 'Past', value: counts.past, color: C.textMuted },
        ].map((s) => (
          <View key={s.label} style={styles.statBox}>
            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchRow}>
        <Search size={16} color={C.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search exams by title, subject or notes..."
          placeholderTextColor={C.textMuted}
          value={searchQuery}
          onChangeText={handleSearch}
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')} style={styles.clearSearchBtn}>
            <X size={15} color={C.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Status Filter Tabs */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabContent}>
          {FILTER_TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, isActive && styles.tabActive]}
                onPress={() => handleTabChange(tab.key)}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Priority Filter Chips */}
      <View style={styles.priorityContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.priorityContent}>
          {PRIORITY_TABS.map((p) => {
            const isSelected = priorityFilter === p.key;
            return (
              <TouchableOpacity
                key={p.key}
                style={[styles.priorityChip, isSelected && styles.priorityChipActive]}
                onPress={() => handlePriorityFilter(p.key)}
                activeOpacity={0.8}
              >
                {p.key ? (
                  <View style={[styles.priorityDot, { backgroundColor: p.color }]} />
                ) : null}
                <Text style={[styles.priorityChipText, isSelected && styles.priorityChipTextActive]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Subject Filter Chips */}
      {subjects.length > 0 && (
        <View style={styles.subjectSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipContent}>
            {allSubjects.map((s) => {
              const isSelected =
                (s === 'All' && !subjectFilter) ||
                (subjectFilter || '').toLowerCase() === (s || '').toLowerCase();

              return (
                <TouchableOpacity
                  key={s}
                  style={[styles.chip, isSelected && styles.chipActive]}
                  onPress={() => handleSubjectFilter(s === 'All' ? '' : s)}
                  activeOpacity={0.8}
                >
                  <Tag size={11} color={isSelected ? C.primary : C.textMuted} style={{ marginRight: 4 }} />
                  <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                    {s}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Error Banner */}
      {error ? (
        <View style={styles.errorBanner}>
          <AlertCircle size={16} color={C.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => refresh()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Exam FlatList */}
      <FlatList
        data={exams}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <ExamCard exam={item} onEdit={handleOpenEdit} onDelete={handleDelete} />
        )}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <EmptyState
              icon={<Calendar size={36} color={C.primary} />}
              title={
                hasActiveFilters
                  ? 'No matching exams found'
                  : 'No upcoming exams scheduled'
              }
              description={
                hasActiveFilters
                  ? 'Try clearing your active filters or searching for different keywords.'
                  : 'Add your test dates, syllabus topics and targets to track countdowns.'
              }
              actionLabel={hasActiveFilters ? 'Reset Filters' : 'Add First Exam'}
              onAction={hasActiveFilters ? handleResetFilters : handleOpenCreate}
            />
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={C.primary}
            colors={[C.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Exam Modal (Create / Edit) */}
      <ExamModal
        visible={modalVisible}
        onClose={() => { setModalVisible(false); setEditingExam(null); }}
        onSubmit={handleSubmit}
        editExam={editingExam}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: C.textMuted, marginTop: 12, fontSize: FontSize.sm },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: C.text,
  },
  headerSub: {
    fontSize: FontSize.xs,
    color: C.textMuted,
    marginTop: 2,
  },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    backgroundColor: C.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginVertical: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: Radius.md,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  statValue: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: C.textMuted,
    marginTop: 2,
  },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    marginHorizontal: 16,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 8,
    height: 42,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: C.text,
    fontSize: FontSize.sm,
    paddingVertical: 6,
  },
  clearSearchBtn: {
    padding: 4,
  },

  tabContainer: {
    marginBottom: 6,
  },
  tabContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.full,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
  },
  tabActive: {
    backgroundColor: C.primary + '22',
    borderColor: C.primary,
  },
  tabText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    color: C.textMuted,
  },
  tabTextActive: {
    color: C.primary,
    fontWeight: FontWeight.bold,
  },

  priorityContainer: {
    marginBottom: 6,
  },
  priorityContent: {
    paddingHorizontal: 16,
    gap: 6,
  },
  priorityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.sm,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
  },
  priorityChipActive: {
    borderColor: C.primary,
    backgroundColor: C.cardAlt,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  priorityChipText: {
    fontSize: 11,
    color: C.textMuted,
    fontWeight: FontWeight.medium,
  },
  priorityChipTextActive: {
    color: C.text,
    fontWeight: FontWeight.bold,
  },

  subjectSection: {
    marginBottom: 8,
  },
  chipContent: {
    paddingHorizontal: 16,
    gap: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.sm,
    backgroundColor: C.cardAlt,
    borderWidth: 1,
    borderColor: C.border,
  },
  chipActive: {
    backgroundColor: C.primary + '22',
    borderColor: C.primary,
  },
  chipText: {
    fontSize: 11,
    color: C.textMuted,
  },
  chipTextActive: {
    color: C.primary,
    fontWeight: FontWeight.bold,
  },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.error + '18',
    marginHorizontal: 16,
    borderRadius: Radius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: C.error + '44',
    marginBottom: 8,
    gap: 8,
  },
  errorText: {
    flex: 1,
    color: C.error,
    fontSize: FontSize.xs,
  },
  retryText: {
    color: C.secondary,
    fontWeight: FontWeight.bold,
    fontSize: FontSize.xs,
  },

  card: {
    backgroundColor: C.card,
    borderRadius: Radius.lg,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  cardPast: {
    opacity: 0.72,
  },
  textFaded: {
    color: C.textMuted,
  },

  urgentBanner: {
    backgroundColor: C.error + '22',
    borderRadius: Radius.sm,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.error + '55',
  },
  urgentBannerText: {
    color: C.error,
    fontSize: 11,
    fontWeight: FontWeight.bold,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardHeaderLeft: {
    flex: 1,
    marginRight: 12,
  },
  subjectBadgeRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  cardSubject: {
    fontSize: 11,
    color: C.secondary,
    fontWeight: FontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: C.text,
    lineHeight: 20,
  },
  cardHeaderRight: {
    alignItems: 'flex-end',
  },
  countdown: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  countdownLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
  },

  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  metaItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaItem: {
    fontSize: FontSize.xs,
    color: C.textMuted,
  },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  location: {
    fontSize: FontSize.xs,
    color: C.textMuted,
  },

  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.xs,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.3,
  },

  progressSection: {
    backgroundColor: C.cardAlt,
    borderRadius: Radius.md,
    padding: 10,
    marginBottom: 10,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 11,
    color: C.textMuted,
  },
  progressPercent: {
    fontSize: 11,
    color: C.text,
    fontWeight: FontWeight.bold,
  },
  progressBar: {
    height: 5,
    backgroundColor: C.border,
    borderRadius: Radius.full,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: Radius.full,
  },
  progressDetail: {
    fontSize: 10,
    color: C.textMuted,
  },

  notesPreview: {
    fontSize: FontSize.xs,
    color: C.textMuted,
    fontStyle: 'italic',
    marginBottom: 10,
  },

  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 8,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.sm,
    backgroundColor: C.cardAlt,
    borderWidth: 1,
    borderColor: C.border,
  },
  editBtnText: {
    fontSize: FontSize.xs,
    color: C.secondary,
    fontWeight: FontWeight.medium,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.sm,
    backgroundColor: C.error + '15',
    borderWidth: 1,
    borderColor: C.error + '44',
  },
  deleteBtnText: {
    fontSize: FontSize.xs,
    color: C.error,
    fontWeight: FontWeight.medium,
  },

  emptyContainer: {
    paddingVertical: 24,
  },
});
