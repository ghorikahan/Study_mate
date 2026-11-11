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
  BookOpen,
  Plus,
  Search,
  Clock,
  Calendar,
  CheckCircle2,
  Circle,
  Edit2,
  Trash2,
  Tag,
  AlertCircle,
  Filter,
  Sparkles,
} from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Card, Badge, EmptyState, Button } from '../../components/ui';
import { FontSize, FontWeight, Spacing, Radius } from '../../constants/theme';
import { useStudyPlans } from '../../hooks/useStudyPlans';
import { StudyPlan, StudyPlanPriority, CreateStudyPlanInput } from '../../types/studyPlan';
import StudyPlanModal from '../../components/StudyPlanModal';

type FilterTab = 'All' | 'Active' | 'Completed' | 'Today';
const FILTER_TABS: FilterTab[] = ['All', 'Active', 'Completed', 'Today'];

const getPriorityVariant = (priority: StudyPlanPriority): 'error' | 'warning' | 'primary' | 'neutral' => {
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

const formatDateLabel = (dateString: string): string => {
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

export default function PlannerScreen() {
  const {
    plans,
    subjects,
    loading,
    refreshing,
    error,
    createPlan,
    updatePlan,
    toggleStatus,
    deletePlan,
    refresh,
  } = useStudyPlans();

  const [activeTab, setActiveTab] = useState<FilterTab>('All');
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPlan, setEditingPlan] = useState<StudyPlan | null>(null);

  // Combine unique subjects from plans with defaults
  const allSubjects = useMemo(() => {
    const list = new Set(['All', ...subjects]);
    return Array.from(list);
  }, [subjects]);

  // Client-side filtering
  const filteredPlans = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];

    return plans.filter((plan) => {
      // 1. Tab filter
      if (activeTab === 'Active' && plan.status === 'completed') return false;
      if (activeTab === 'Completed' && plan.status !== 'completed') return false;
      if (activeTab === 'Today') {
        const planDateStr = plan.date
          ? new Date(plan.date).toISOString().split('T')[0]
          : '';
        if (planDateStr !== todayStr) return false;
      }

      // 2. Subject filter
      if (
        selectedSubject !== 'All' &&
        plan.subject.toLowerCase() !== selectedSubject.toLowerCase()
      ) {
        return false;
      }

      // 3. Search query
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchesTopic = (plan.topic || plan.title || '')
          .toLowerCase()
          .includes(query);
        const matchesSubject = plan.subject.toLowerCase().includes(query);
        const matchesDesc = (plan.description || '')
          .toLowerCase()
          .includes(query);
        if (!matchesTopic && !matchesSubject && !matchesDesc) {
          return false;
        }
      }

      return true;
    });
  }, [plans, activeTab, selectedSubject, searchQuery]);

  // Handle open modal for create
  const handleOpenCreate = () => {
    setEditingPlan(null);
    setModalVisible(true);
  };

  // Handle open modal for edit
  const handleOpenEdit = (plan: StudyPlan) => {
    setEditingPlan(plan);
    setModalVisible(true);
  };

  // Handle modal submit (create or update)
  const handleModalSubmit = async (input: CreateStudyPlanInput) => {
    if (editingPlan) {
      await updatePlan(editingPlan._id, input);
    } else {
      await createPlan(input);
    }
  };

  // Handle delete plan with confirmation
  const handleDeletePrompt = (plan: StudyPlan) => {
    Alert.alert(
      'Delete Study Plan',
      `Are you sure you want to delete "${plan.topic || plan.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePlan(plan._id);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Could not delete plan');
            }
          },
        },
      ]
    );
  };

  // Handle toggle status
  const handleTogglePlan = async (plan: StudyPlan) => {
    try {
      await toggleStatus(plan._id);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not update status');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ── Screen Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.screenTitle}>Study Planner</Text>
          <Text style={styles.screenSubtitle}>
            {plans.length} {plans.length === 1 ? 'session' : 'sessions'} scheduled
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
        {/* ── Search Bar ── */}
        <View style={styles.searchBar}>
          <Search size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search plans by topic or subject..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>

        {/* ── Filter Tabs (All, Active, Completed, Today) ── */}
        <View style={styles.filtersRow}>
          {FILTER_TABS.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.filterText,
                    isActive && styles.filterTextActive,
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Subjects Filter Chips ── */}
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

        {/* ── Plans List Header ── */}
        <View style={[styles.sectionHeader, { marginTop: Spacing.xl }]}>
          <Text style={styles.sectionTitle}>
            {activeTab === 'All' ? 'All Study Plans' : `${activeTab} Plans`} (
            {filteredPlans.length})
          </Text>
        </View>

        {/* ── Plans Content: Loading / Empty / List ── */}
        {loading && !refreshing && plans.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading your study plans...</Text>
          </View>
        ) : filteredPlans.length === 0 ? (
          <Card style={styles.emptyCard}>
            <EmptyState
              icon={<BookOpen size={36} color={Colors.primary} />}
              title={
                searchQuery
                  ? 'No matching study plans'
                  : selectedSubject !== 'All'
                  ? `No plans for ${selectedSubject}`
                  : activeFilterEmptyTitle(activeTab)
              }
              description={
                searchQuery
                  ? 'Try searching with different keywords.'
                  : 'Organize your topics, schedule study time, and track your syllabus.'
              }
              actionLabel="Create Study Plan"
              onAction={handleOpenCreate}
            />
          </Card>
        ) : (
          <View style={styles.plansList}>
            {filteredPlans.map((plan) => {
              const isCompleted = plan.status === 'completed';

              return (
                <Card
                  key={plan._id}
                  style={[styles.planCard, isCompleted && styles.planCardCompleted]}
                >
                  {/* Top Bar: Subject, Priority & Actions */}
                  <View style={styles.planCardHeader}>
                    <View style={styles.planBadgeGroup}>
                      <Badge
                        label={plan.subject}
                        variant="primary"
                        dot
                      />
                      <Badge
                        label={plan.priority}
                        variant={getPriorityVariant(plan.priority)}
                      />
                      {isCompleted && (
                        <Badge label="Done" variant="success" />
                      )}
                    </View>

                    {/* Edit and Delete Icon Buttons */}
                    <View style={styles.cardActions}>
                      <TouchableOpacity
                        style={styles.iconBtn}
                        onPress={() => handleOpenEdit(plan)}
                        activeOpacity={0.7}
                      >
                        <Edit2 size={15} color={Colors.textSecondary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.iconBtn}
                        onPress={() => handleDeletePrompt(plan)}
                        activeOpacity={0.7}
                      >
                        <Trash2 size={15} color={Colors.error} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Plan Topic & Completion Checkbox */}
                  <View style={styles.planMainRow}>
                    <TouchableOpacity
                      style={styles.statusToggle}
                      onPress={() => handleTogglePlan(plan)}
                      activeOpacity={0.7}
                    >
                      {isCompleted ? (
                        <CheckCircle2 size={24} color={Colors.success} />
                      ) : (
                        <Circle size={24} color={Colors.textMuted} />
                      )}
                    </TouchableOpacity>

                    <View style={styles.planTextWrap}>
                      <Text
                        style={[
                          styles.planTopic,
                          isCompleted && styles.planTopicCompleted,
                        ]}
                      >
                        {plan.topic || plan.title}
                      </Text>
                      {plan.description ? (
                        <Text
                          style={styles.planDesc}
                          numberOfLines={2}
                        >
                          {plan.description}
                        </Text>
                      ) : null}
                    </View>
                  </View>

                  {/* Plan Meta: Date, Start Time & Duration */}
                  <View style={styles.planMetaFooter}>
                    <View style={styles.metaItem}>
                      <Calendar size={13} color={Colors.textMuted} />
                      <Text style={styles.metaText}>
                        {formatDateLabel(plan.date)}
                      </Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Clock size={13} color={Colors.secondary} />
                      <Text style={styles.metaText}>{plan.startTime}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Sparkles size={13} color={Colors.warning} />
                      <Text style={styles.metaText}>{plan.duration} mins</Text>
                    </View>
                  </View>
                </Card>
              );
            })}
          </View>
        )}

        {/* ── Study Tip Card ── */}
        <View style={styles.tipCard}>
          <View style={styles.tipIconWrap}>
            <Clock size={18} color={Colors.secondary} />
          </View>
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>Spaced Repetition Tip</Text>
            <Text style={styles.tipDesc}>
              Reviewing each topic 24 hours, 3 days, and 1 week after your initial study session dramatically enhances long-term memory retention.
            </Text>
          </View>
        </View>

        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>

      {/* ── Study Plan Modal (Create & Edit) ── */}
      <StudyPlanModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleModalSubmit}
        initialData={editingPlan}
        existingSubjects={subjects}
      />
    </SafeAreaView>
  );
}

const activeFilterEmptyTitle = (filter: FilterTab): string => {
  switch (filter) {
    case 'Active':
      return 'No active study plans';
    case 'Completed':
      return 'No completed study plans yet';
    case 'Today':
      return 'No study plans scheduled for today';
    default:
      return 'No study plans yet';
  }
};

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

  plansList: {
    gap: Spacing.sm,
  },
  planCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.base,
  },
  planCardCompleted: {
    opacity: 0.75,
    backgroundColor: Colors.cardSecondary,
  },
  planCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  planBadgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flexWrap: 'wrap',
    flex: 1,
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

  planMainRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    marginVertical: Spacing.xs,
  },
  statusToggle: {
    paddingTop: 2,
  },
  planTextWrap: {
    flex: 1,
  },
  planTopic: {
    color: Colors.text,
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    lineHeight: 22,
  },
  planTopicCompleted: {
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
  },
  planDesc: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    marginTop: 4,
    lineHeight: 18,
  },

  planMetaFooter: {
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
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.base,
    marginTop: Spacing.xl,
    gap: Spacing.md,
  },
  tipIconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Colors.secondaryFaded,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  tipDesc: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    marginTop: 2,
    lineHeight: 18,
  },
});
