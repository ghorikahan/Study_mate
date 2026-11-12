import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  CheckSquare,
  Plus,
  Search,
  AlertCircle,
  Clock,
  CheckCircle2,
  Circle,
  Edit2,
  Trash2,
  Calendar,
  Tag,
  AlertTriangle,
  Sparkles,
} from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Card, Badge, EmptyState } from '../../components/ui';
import { FontSize, FontWeight, Spacing, Radius } from '../../constants/theme';
import { useTasks } from '../../hooks/useTasks';
import { Task, TaskPriority, CreateTaskInput } from '../../types/task';
import TaskModal from '../../components/TaskModal';

type FilterTab = 'All' | 'Pending' | 'Completed' | 'Overdue';
const FILTER_TABS: FilterTab[] = ['All', 'Pending', 'Completed', 'Overdue'];

const getPriorityVariant = (priority: TaskPriority): 'error' | 'warning' | 'primary' | 'neutral' => {
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

const formatDueDateLabel = (dateString: string): string => {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
};

interface SummaryBoxProps {
  value: number;
  label: string;
  color: string;
  active?: boolean;
  onPress: () => void;
}

const SummaryBox: React.FC<SummaryBoxProps> = ({ value, label, color, active, onPress }) => (
  <TouchableOpacity
    style={[
      styles.summaryBox,
      { borderTopColor: color },
      active && { backgroundColor: `${color}18`, borderColor: color },
    ]}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <Text style={[styles.summaryValue, { color }]}>{value}</Text>
    <Text style={styles.summaryLabel}>{label}</Text>
  </TouchableOpacity>
);

export default function TasksScreen() {
  const {
    tasks,
    counts,
    subjects,
    loading,
    refreshing,
    error,
    createTask,
    updateTask,
    toggleStatus,
    deleteTask,
    refresh,
  } = useTasks();

  const [activeTab, setActiveTab] = useState<FilterTab>('All');
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Combine subjects list with 'All'
  const allSubjects = useMemo(() => {
    const list = new Set(['All', ...subjects]);
    return Array.from(list);
  }, [subjects]);

  // Client-side filtering & search
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // 1. Status Filter
      if (activeTab === 'Pending' && (task.status === 'completed' || task.status === 'cancelled')) {
        return false;
      }
      if (activeTab === 'Completed' && task.status !== 'completed') {
        return false;
      }
      if (activeTab === 'Overdue') {
        const isPast = task.dueDate ? new Date(task.dueDate) < new Date() : false;
        const isUncompleted = task.status !== 'completed' && task.status !== 'cancelled';
        if (!isPast || !isUncompleted) return false;
      }

      // 2. Subject Filter
      if (
        selectedSubject !== 'All' &&
        task.subject.toLowerCase() !== selectedSubject.toLowerCase()
      ) {
        return false;
      }

      // 3. Search Filter
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(q);
        const matchesSubject = task.subject.toLowerCase().includes(q);
        const matchesDesc = (task.description || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesSubject && !matchesDesc) {
          return false;
        }
      }

      return true;
    });
  }, [tasks, activeTab, selectedSubject, searchQuery]);

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingTask(null);
    setModalVisible(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (task: Task) => {
    setEditingTask(task);
    setModalVisible(true);
  };

  // Modal Submit
  const handleModalSubmit = async (input: CreateTaskInput) => {
    if (editingTask) {
      await updateTask(editingTask._id, input);
    } else {
      await createTask(input);
    }
  };

  // Delete Confirmation Alert
  const handleDeletePrompt = (task: Task) => {
    Alert.alert(
      'Delete Task',
      `Are you sure you want to delete "${task.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTask(task._id);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Could not delete task');
            }
          },
        },
      ]
    );
  };

  // Toggle Task Completion
  const handleToggleTask = async (task: Task) => {
    try {
      await toggleStatus(task._id);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not update task status');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ── Screen Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.screenTitle}>Task Manager</Text>
          <Text style={styles.screenSubtitle}>
            {counts.pending} pending • {counts.completed} completed
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={handleOpenCreate}
          activeOpacity={0.8}
        >
          <Plus size={22} color={Colors.white} />
        </TouchableOpacity>
      </View>

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
        {/* ── Summary Metrics Row ── */}
        <View style={styles.summaryRow}>
          <SummaryBox
            value={counts.total}
            label="Total"
            color={Colors.primary}
            active={activeTab === 'All'}
            onPress={() => setActiveTab('All')}
          />
          <SummaryBox
            value={counts.pending}
            label="Pending"
            color={Colors.secondary}
            active={activeTab === 'Pending'}
            onPress={() => setActiveTab('Pending')}
          />
          <SummaryBox
            value={counts.overdue}
            label="Overdue"
            color={Colors.error}
            active={activeTab === 'Overdue'}
            onPress={() => setActiveTab('Overdue')}
          />
          <SummaryBox
            value={counts.completed}
            label="Completed"
            color={Colors.success}
            active={activeTab === 'Completed'}
            onPress={() => setActiveTab('Completed')}
          />
        </View>

        {/* ── Search Bar ── */}
        <View style={styles.searchBar}>
          <Search size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search tasks by title, subject..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>

        {/* ── Status Filter Tabs ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
        >
          {FILTER_TABS.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.8}
              >
                {tab === 'Overdue' && (
                  <AlertCircle
                    size={12}
                    color={isActive ? Colors.error : Colors.error}
                  />
                )}
                {tab === 'Completed' && (
                  <CheckCircle2
                    size={12}
                    color={isActive ? Colors.success : Colors.textMuted}
                  />
                )}
                <Text
                  style={[
                    styles.filterText,
                    isActive && styles.filterTextActive,
                    tab === 'Overdue' && isActive && { color: Colors.error },
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Subject Filter Chips ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Filter by Subject</Text>
          {selectedSubject !== 'All' && (
            <TouchableOpacity onPress={() => setSelectedSubject('All')}>
              <Text style={styles.resetFilterText}>Reset</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.subjectsRow}
        >
          {allSubjects.map((subj) => {
            const isSelected = selectedSubject.toLowerCase() === subj.toLowerCase();
            return (
              <TouchableOpacity
                key={subj}
                style={[
                  styles.subjectChip,
                  isSelected && styles.subjectChipActive,
                ]}
                onPress={() => setSelectedSubject(subj)}
                activeOpacity={0.8}
              >
                <Tag
                  size={12}
                  color={isSelected ? Colors.primary : Colors.textMuted}
                />
                <Text
                  style={[
                    styles.subjectLabel,
                    isSelected && styles.subjectLabelActive,
                  ]}
                >
                  {subj}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Error Banner ── */}
        {error && (
          <Card style={styles.errorCard}>
            <View style={styles.errorInner}>
              <AlertCircle size={20} color={Colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          </Card>
        )}

        {/* ── Tasks List Header ── */}
        <View style={[styles.sectionHeader, { marginTop: Spacing.xl }]}>
          <Text style={styles.sectionTitle}>
            {activeTab === 'All' ? 'All Tasks' : `${activeTab} Tasks`} (
            {filteredTasks.length})
          </Text>
        </View>

        {/* ── Tasks Content: Loading / Empty / List ── */}
        {loading && !refreshing && tasks.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading your tasks...</Text>
          </View>
        ) : filteredTasks.length === 0 ? (
          <Card style={styles.emptyCard}>
            <EmptyState
              icon={<CheckSquare size={36} color={Colors.primary} />}
              title={
                searchQuery
                  ? 'No matching tasks found'
                  : selectedSubject !== 'All'
                  ? `No tasks for ${selectedSubject}`
                  : activeTab === 'Overdue'
                  ? 'No overdue tasks 🎉'
                  : activeTab === 'Completed'
                  ? 'No completed tasks yet'
                  : 'No tasks yet'
              }
              description={
                searchQuery
                  ? 'Try searching with different keywords.'
                  : activeTab === 'Overdue'
                  ? 'Great job keeping up with all your deadlines!'
                  : activeTab === 'Completed'
                  ? 'Check off tasks as you finish them to track your productivity.'
                  : 'Add a new task to organize your study schedule and beat deadlines.'
              }
              actionLabel={activeTab !== 'Overdue' ? 'Add First Task' : undefined}
              onAction={handleOpenCreate}
            />
          </Card>
        ) : (
          <View style={styles.tasksList}>
            {filteredTasks.map((task) => {
              const isCompleted = task.status === 'completed';
              const isOverdue =
                !isCompleted &&
                task.dueDate &&
                new Date(task.dueDate) < new Date();

              return (
                <Card
                  key={task._id}
                  style={[
                    styles.taskCard,
                    isCompleted && styles.taskCardCompleted,
                    isOverdue && styles.taskCardOverdue,
                  ]}
                >
                  {/* Top Bar: Subject, Priority, Overdue Pill & Actions */}
                  <View style={styles.taskCardHeader}>
                    <View style={styles.taskBadgeGroup}>
                      <Badge
                        label={task.subject}
                        variant="primary"
                        dot
                      />
                      <Badge
                        label={task.priority}
                        variant={getPriorityVariant(task.priority)}
                      />
                      {isOverdue && (
                        <View style={styles.overdueBadge}>
                          <AlertTriangle size={10} color={Colors.error} />
                          <Text style={styles.overdueBadgeText}>Overdue</Text>
                        </View>
                      )}
                      {isCompleted && (
                        <Badge label="Done" variant="success" />
                      )}
                    </View>

                    {/* Actions: Edit & Delete */}
                    <View style={styles.cardActions}>
                      <TouchableOpacity
                        style={styles.iconBtn}
                        onPress={() => handleOpenEdit(task)}
                        activeOpacity={0.7}
                      >
                        <Edit2 size={15} color={Colors.textSecondary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.iconBtn}
                        onPress={() => handleDeletePrompt(task)}
                        activeOpacity={0.7}
                      >
                        <Trash2 size={15} color={Colors.error} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Task Main Content: Checkbox & Title */}
                  <View style={styles.taskMainRow}>
                    <TouchableOpacity
                      style={styles.statusToggle}
                      onPress={() => handleToggleTask(task)}
                      activeOpacity={0.7}
                    >
                      {isCompleted ? (
                        <CheckCircle2 size={24} color={Colors.success} />
                      ) : (
                        <Circle size={24} color={isOverdue ? Colors.error : Colors.textMuted} />
                      )}
                    </TouchableOpacity>

                    <View style={styles.taskTextWrap}>
                      <Text
                        style={[
                          styles.taskTitle,
                          isCompleted && styles.taskTitleCompleted,
                        ]}
                      >
                        {task.title}
                      </Text>
                      {task.description ? (
                        <Text style={styles.taskDesc} numberOfLines={2}>
                          {task.description}
                        </Text>
                      ) : null}
                    </View>
                  </View>

                  {/* Meta Footer: Due Date & Estimated Duration */}
                  <View style={styles.taskMetaFooter}>
                    <View style={styles.metaItem}>
                      <Calendar
                        size={13}
                        color={isOverdue ? Colors.error : Colors.textMuted}
                      />
                      <Text
                        style={[
                          styles.metaText,
                          isOverdue && { color: Colors.error, fontWeight: 'bold' },
                        ]}
                      >
                        {formatDueDateLabel(task.dueDate)}
                      </Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Clock size={13} color={Colors.secondary} />
                      <Text style={styles.metaText}>
                        {task.estimatedMinutes} mins
                      </Text>
                    </View>
                  </View>
                </Card>
              );
            })}
          </View>
        )}

        {/* ── Task Tip Card ── */}
        <View style={styles.tipCard}>
          <View style={styles.tipRow}>
            <Sparkles size={16} color={Colors.warning} />
            <Text style={styles.tipTitle}>Smart Prioritization Tip</Text>
          </View>
          <Text style={styles.tipDesc}>
            Focus on your urgent & high-priority tasks first each morning. Breaking complex assignments into 30–45 minute tasks prevents burnout.
          </Text>
        </View>

        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>

      {/* ── Task Modal (Create & Edit) ── */}
      <TaskModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleModalSubmit}
        initialData={editingTask}
        existingSubjects={subjects}
      />
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
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },

  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.base,
  },
  summaryBox: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderTopWidth: 3,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryValue: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  summaryLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    marginTop: 2,
    fontWeight: '500',
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.base,
  },
  searchInput: {
    flex: 1,
    color: Colors.text,
    fontSize: FontSize.sm,
    paddingVertical: 4,
  },

  filtersRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
    fontSize: FontSize.xs,
    fontWeight: '500',
  },
  filterTextActive: {
    color: Colors.primary,
    fontWeight: 'bold',
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },
  resetFilterText: {
    color: Colors.primary,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },

  subjectsRow: {
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
  },
  subjectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  subjectChipActive: {
    backgroundColor: Colors.primaryFaded,
    borderColor: Colors.primary,
  },
  subjectLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: '500',
  },
  subjectLabelActive: {
    color: Colors.primary,
    fontWeight: 'bold',
  },

  errorCard: {
    backgroundColor: Colors.errorFaded,
    borderColor: Colors.error,
    borderWidth: 1,
    marginTop: Spacing.base,
    padding: Spacing.md,
  },
  errorInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  errorText: {
    color: Colors.error,
    fontSize: FontSize.sm,
    flex: 1,
  },

  loadingContainer: {
    paddingVertical: Spacing.xxxl,
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },

  emptyCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginTop: Spacing.xs,
  },

  tasksList: {
    gap: Spacing.sm,
  },
  taskCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.base,
  },
  taskCardCompleted: {
    opacity: 0.7,
    backgroundColor: Colors.cardSecondary,
  },
  taskCardOverdue: {
    borderColor: `${Colors.error}80`,
    borderLeftWidth: 4,
    borderLeftColor: Colors.error,
  },
  taskCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  taskBadgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flexWrap: 'wrap',
    flex: 1,
  },
  overdueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.errorFaded,
    borderWidth: 1,
    borderColor: Colors.error,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.xs + 2,
    paddingVertical: 1,
  },
  overdueBadgeText: {
    color: Colors.error,
    fontSize: 10,
    fontWeight: 'bold',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  iconBtn: {
    width: 30,
    height: 30,
    borderRadius: Radius.sm,
    backgroundColor: Colors.cardSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  taskMainRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    marginVertical: Spacing.xs,
  },
  statusToggle: {
    paddingTop: 2,
  },
  taskTextWrap: {
    flex: 1,
  },
  taskTitle: {
    color: Colors.text,
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    lineHeight: 22,
  },
  taskTitleCompleted: {
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
  },
  taskDesc: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    marginTop: 4,
    lineHeight: 18,
  },

  taskMetaFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
  },

  tipCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.base,
    marginTop: Spacing.xl,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  tipTitle: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  tipDesc: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    lineHeight: 18,
  },
});
