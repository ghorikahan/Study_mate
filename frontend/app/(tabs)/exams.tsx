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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useExams } from '../../hooks/useExams';
import ExamModal from '../../components/ExamModal';
import { Exam, ExamPriority, ExamStatus, CreateExamInput, UpdateExamInput } from '../../types/exam';

// ─── Theme ────────────────────────────────────────────────────────────────────
const C = {
  bg: '#0B0D12',
  card: '#151923',
  cardAlt: '#1C2333',
  primary: '#8B5CF6',
  secondary: '#22D3EE',
  text: '#F9FAFB',
  textMuted: '#6B7280',
  border: '#374151',
  error: '#EF4444',
  warning: '#F59E0B',
  success: '#10B981',
};

const PRIORITY_COLORS: Record<ExamPriority, string> = {
  urgent: '#EF4444',
  high: '#F59E0B',
  medium: '#8B5CF6',
  low: '#10B981',
};

const STATUS_COLORS: Record<ExamStatus, string> = {
  upcoming: '#22D3EE',
  'in-progress': '#F59E0B',
  completed: '#10B981',
  cancelled: '#6B7280',
};

// ─── Filter tabs ──────────────────────────────────────────────────────────────
const FILTER_TABS = [
  { key: '', label: 'All' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'this-week', label: 'This Week' },
  { key: 'past', label: 'Past' },
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
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
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
          <Text style={[styles.cardSubject, isPast && styles.textFaded]}>{exam.subject}</Text>
          <Text style={[styles.cardTitle, isPast && styles.textFaded]} numberOfLines={2}>
            {exam.examTitle}
          </Text>
        </View>
        <View style={styles.cardHeaderRight}>
          <Text style={[styles.countdown, { color: countdown.color }]}>{countdown.label}</Text>
          <Text style={[styles.countdownLabel, { color: countdown.color }]}>remaining</Text>
        </View>
      </View>

      {/* Meta row */}
      <View style={styles.metaRow}>
        <Text style={styles.metaItem}>📅 {formatDate(exam.examDate)}</Text>
        <Text style={styles.metaItem}>🕐 {exam.startTime}</Text>
        <Text style={styles.metaItem}>⏱ {formatDuration(exam.durationMinutes)}</Text>
      </View>

      {exam.location ? (
        <Text style={styles.location}>📍 {exam.location}</Text>
      ) : null}

      {/* Badges row */}
      <View style={styles.badgeRow}>
        <View
          style={[
            styles.badge,
            { backgroundColor: PRIORITY_COLORS[exam.priority] + '22', borderColor: PRIORITY_COLORS[exam.priority] },
          ]}
        >
          <Text style={[styles.badgeText, { color: PRIORITY_COLORS[exam.priority] }]}>
            {exam.priority.toUpperCase()}
          </Text>
        </View>
        <View
          style={[
            styles.badge,
            { backgroundColor: STATUS_COLORS[exam.status] + '22', borderColor: STATUS_COLORS[exam.status] },
          ]}
        >
          <Text style={[styles.badgeText, { color: STATUS_COLORS[exam.status] }]}>
            {exam.status.toUpperCase()}
          </Text>
        </View>
        {exam.targetScore != null && (
          <View style={[styles.badge, { backgroundColor: C.cardAlt, borderColor: C.border }]}>
            <Text style={[styles.badgeText, { color: C.textMuted }]}>🎯 {exam.targetScore}%</Text>
          </View>
        )}
      </View>

      {/* Syllabus progress */}
      {exam.syllabusTopics.length > 0 && (
        <View style={styles.progressSection}>
          <View style={styles.progressLabelRow}>
            <Text style={styles.progressLabel}>Syllabus</Text>
            <Text style={styles.progressPercent}>{exam.syllabusProgressPercent}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${exam.syllabusProgressPercent}%` as `${number}%`,
                  backgroundColor:
                    exam.syllabusProgressPercent >= 80
                      ? C.success
                      : exam.syllabusProgressPercent >= 50
                      ? C.warning
                      : C.primary,
                },
              ]}
            />
          </View>
          <Text style={styles.progressDetail}>
            {exam.syllabusTopics.filter((t) => t.isCovered).length}/{exam.syllabusTopics.length} topics covered
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
        <TouchableOpacity style={styles.editBtn} onPress={() => onEdit(exam)}>
          <Text style={styles.editBtnText}>✏️ Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete(exam)}>
          <Text style={styles.deleteBtnText}>🗑 Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── Empty State ─────────────────────────────────────────────────────────────
const EmptyState: React.FC<{ filter: string }> = ({ filter }) => {
  const messages: Record<string, { icon: string; title: string; sub: string }> = {
    '': { icon: '📚', title: 'No Exams Yet', sub: 'Tap + to track your first exam' },
    upcoming: { icon: '📅', title: 'No Upcoming Exams', sub: 'All clear! Add exams to stay prepared.' },
    'this-week': { icon: '🗓', title: 'Nothing This Week', sub: 'No exams scheduled for the next 7 days.' },
    past: { icon: '✅', title: 'No Past Exams', sub: 'Your exam history will appear here.' },
  };
  const m = messages[filter] ?? messages[''];
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>{m.icon}</Text>
      <Text style={styles.emptyTitle}>{m.title}</Text>
      <Text style={styles.emptySub}>{m.sub}</Text>
    </View>
  );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function ExamsScreen() {
  const [activeTab, setActiveTab] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);

  const { exams, counts, subjects, loading, refreshing, error, createExam, updateExam, deleteExam, refresh, setFilters } =
    useExams({
      status: activeTab,
      subject: subjectFilter,
      search: searchQuery,
    });

  // Sync filters when tabs/search change
  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setFilters({ status: key, subject: subjectFilter, search: searchQuery });
  };

  const handleSubjectFilter = (s: string) => {
    const next = subjectFilter === s ? '' : s;
    setSubjectFilter(next);
    setFilters({ status: activeTab, subject: next, search: searchQuery });
  };

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    setFilters({ status: activeTab, subject: subjectFilter, search: q });
  };

  const handleOpenCreate = () => {
    setEditingExam(null);
    setModalVisible(true);
  };

  const handleOpenEdit = (exam: Exam) => {
    setEditingExam(exam);
    setModalVisible(true);
  };

  const handleDelete = (exam: Exam) => {
    Alert.alert(
      'Delete Exam',
      `Delete "${exam.examTitle}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteExam(exam._id);
            } catch {
              Alert.alert('Error', 'Failed to delete exam. Please try again.');
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={styles.loadingText}>Loading exams...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>📚 Exam Tracker</Text>
          <Text style={styles.headerSub}>
            {counts.upcoming} upcoming · {counts.thisWeek} this week
          </Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={handleOpenCreate}>
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Row */}
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

      {/* Search */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Search exams..."
          placeholderTextColor={C.textMuted}
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>

      {/* Filter Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabRow} contentContainerStyle={{ paddingHorizontal: 16 }}>
        {FILTER_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => handleTabChange(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Subject Filter Chips */}
      {subjects.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow} contentContainerStyle={{ paddingHorizontal: 16 }}>
          {subjects.map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.chip, subjectFilter === s && styles.chipActive]}
              onPress={() => handleSubjectFilter(s)}
            >
              <Text style={[styles.chipText, subjectFilter === s && styles.chipTextActive]}>
                {s}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Error */}
      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
          <TouchableOpacity onPress={() => refresh()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Exam List */}
      <FlatList
        data={exams}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <ExamCard exam={item} onEdit={handleOpenEdit} onDelete={handleDelete} />
        )}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        ListEmptyComponent={<EmptyState filter={activeTab} />}
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

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={handleOpenCreate}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Modal */}
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
  loadingText: { color: C.textMuted, marginTop: 12, fontSize: 14 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: C.text },
  headerSub: { fontSize: 13, color: C.textMuted, marginTop: 2 },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnText: { color: '#fff', fontSize: 24, fontWeight: '300', lineHeight: 28 },

  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 10,
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 10, color: C.textMuted, marginTop: 2, textTransform: 'uppercase' },

  searchRow: { paddingHorizontal: 16, marginBottom: 8 },
  searchInput: {
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    color: C.text,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },

  tabRow: { flexGrow: 0, marginBottom: 8 },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    marginRight: 8,
  },
  tabActive: { backgroundColor: C.primary + '22', borderColor: C.primary },
  tabText: { color: C.textMuted, fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: C.primary },

  chipRow: { flexGrow: 0, marginBottom: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    marginRight: 8,
  },
  chipActive: { backgroundColor: C.secondary + '22', borderColor: C.secondary },
  chipText: { color: C.textMuted, fontSize: 12 },
  chipTextActive: { color: C.secondary, fontWeight: '600' },

  errorBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: C.error + '22',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: C.error,
  },
  errorText: { color: C.error, fontSize: 13, flex: 1 },
  retryText: { color: C.primary, fontWeight: '700', fontSize: 13 },

  // ─── Card ──────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  cardPast: { opacity: 0.65 },

  urgentBanner: {
    backgroundColor: C.error + '22',
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: C.error,
  },
  urgentBannerText: { color: C.error, fontSize: 13, fontWeight: '700' },

  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  cardHeaderLeft: { flex: 1, marginRight: 12 },
  cardHeaderRight: { alignItems: 'flex-end' },
  cardSubject: { fontSize: 12, color: C.secondary, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: C.text },
  countdown: { fontSize: 20, fontWeight: '800' },
  countdownLabel: { fontSize: 10, textTransform: 'uppercase' },
  textFaded: { color: C.textMuted },

  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 6 },
  metaItem: { fontSize: 12, color: C.textMuted },
  location: { fontSize: 12, color: C.textMuted, marginBottom: 8 },

  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  badgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },

  progressSection: { marginBottom: 10 },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  progressLabel: { fontSize: 12, color: C.textMuted, fontWeight: '600' },
  progressPercent: { fontSize: 12, color: C.text, fontWeight: '700' },
  progressBar: { height: 6, backgroundColor: C.cardAlt, borderRadius: 3, overflow: 'hidden', marginBottom: 3 },
  progressFill: { height: '100%', borderRadius: 3 },
  progressDetail: { fontSize: 11, color: C.textMuted },

  notesPreview: { fontSize: 12, color: C.textMuted, marginBottom: 10, fontStyle: 'italic' },

  cardActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  editBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: C.primary + '22',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.primary,
  },
  editBtnText: { color: C.primary, fontWeight: '700', fontSize: 13 },
  deleteBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: C.error + '15',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.error,
  },
  deleteBtnText: { color: C.error, fontWeight: '700', fontSize: 13 },

  // ─── Empty State ───────────────────────────────────────────────────────────
  emptyState: { paddingTop: 60, alignItems: 'center' },
  emptyIcon: { fontSize: 52, marginBottom: 14 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: C.text, marginBottom: 6 },
  emptySub: { fontSize: 14, color: C.textMuted, textAlign: 'center', paddingHorizontal: 24 },

  // ─── FAB ──────────────────────────────────────────────────────────────────
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 28,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: C.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: C.primary,
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '300', lineHeight: 32 },
});
