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
  CheckSquare,
  Plus,
  Search,
  AlertCircle,
  Clock,
  CheckCircle2,
  Circle,
} from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Card, Badge, EmptyState } from '../../components/ui';
import { FontSize, FontWeight, Spacing, Radius } from '../../constants/theme';

type TaskFilter = 'All' | 'Today' | 'Overdue' | 'Done';
const FILTERS: TaskFilter[] = ['All', 'Today', 'Overdue', 'Done'];

type Priority = 'High' | 'Medium' | 'Low';

const priorityConfig: Record<Priority, { color: string; badge: 'error' | 'warning' | 'success' }> = {
  High: { color: Colors.error, badge: 'error' },
  Medium: { color: Colors.warning, badge: 'warning' },
  Low: { color: Colors.success, badge: 'success' },
};

// ─── Task summary numbers ───────────────────────────────────────────────
interface SummaryBoxProps {
  value: string;
  label: string;
  color: string;
}
const SummaryBox: React.FC<SummaryBoxProps> = ({ value, label, color }) => (
  <View style={[styles.summaryBox, { borderTopColor: color }]}>
    <Text style={[styles.summaryValue, { color }]}>{value}</Text>
    <Text style={styles.summaryLabel}>{label}</Text>
  </View>
);

export default function TasksScreen() {
  const [activeFilter, setActiveFilter] = useState<TaskFilter>('All');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.screenTitle}>Task Manager</Text>
          <Text style={styles.screenSubtitle}>Track and complete your work</Text>
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
        {/* ── Summary ── */}
        <View style={styles.summaryRow}>
          <SummaryBox value="0" label="Total" color={Colors.primary} />
          <SummaryBox value="0" label="Today" color={Colors.secondary} />
          <SummaryBox value="0" label="Overdue" color={Colors.error} />
          <SummaryBox value="0" label="Completed" color={Colors.success} />
        </View>

        {/* ── Search ── */}
        <TouchableOpacity style={styles.searchBar} activeOpacity={0.8}>
          <Search size={18} color={Colors.textMuted} />
          <Text style={styles.searchPlaceholder}>Search tasks...</Text>
        </TouchableOpacity>

        {/* ── Filters ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
        >
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
              onPress={() => setActiveFilter(f)}
              activeOpacity={0.8}
            >
              {f === 'Overdue' && (
                <AlertCircle size={12} color={activeFilter === f ? Colors.error : Colors.textMuted} />
              )}
              {f === 'Done' && (
                <CheckCircle2 size={12} color={activeFilter === f ? Colors.success : Colors.textMuted} />
              )}
              <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Priority legend ── */}
        <View style={styles.priorityLegend}>
          {(['High', 'Medium', 'Low'] as Priority[]).map((p) => (
            <View key={p} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: priorityConfig[p].color }]} />
              <Text style={styles.legendText}>{p} Priority</Text>
            </View>
          ))}
        </View>

        {/* ── Empty State ── */}
        <Card style={styles.emptyCard}>
          <EmptyState
            icon={<CheckSquare size={32} color={Colors.textMuted} />}
            title={
              activeFilter === 'All'
                ? 'No tasks yet'
                : activeFilter === 'Overdue'
                ? 'No overdue tasks 🎉'
                : activeFilter === 'Done'
                ? 'No completed tasks'
                : "No tasks for today"
            }
            description={
              activeFilter === 'All'
                ? 'Press the + button to create your first task. Set priorities and deadlines to stay on track.'
                : activeFilter === 'Overdue'
                ? "Great work! You have no overdue tasks. Keep it up!"
                : activeFilter === 'Done'
                ? "Complete some tasks and they'll appear here."
                : "You have no tasks scheduled for today. Add some to get started!"
            }
            actionLabel={activeFilter === 'All' || activeFilter === 'Today' ? 'Add First Task' : undefined}
            onAction={() => {}}
          />
        </Card>

        {/* ── Tip ── */}
        <View style={styles.tipCard}>
          <View style={styles.tipRow}>
            <Clock size={16} color={Colors.warning} />
            <Text style={styles.tipTitle}>Task Tip</Text>
          </View>
          <Text style={styles.tipDesc}>
            Tag tasks with subjects and set realistic deadlines. High-priority tasks are sorted first automatically.
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
    padding: Spacing.sm,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  summaryLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    marginTop: 2,
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
    paddingVertical: Spacing.md,
    marginTop: Spacing.base,
  },
  searchPlaceholder: {
    color: Colors.textMuted,
    fontSize: FontSize.base,
  },

  filtersRow: {
    gap: Spacing.sm,
    paddingRight: Spacing.base,
    marginTop: Spacing.base,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
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

  priorityLegend: {
    flexDirection: 'row',
    gap: Spacing.base,
    marginTop: Spacing.base,
    marginBottom: Spacing.sm,
    paddingHorizontal: 2,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: Colors.textSecondary, fontSize: FontSize.xs },

  emptyCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginTop: Spacing.sm,
  },

  tipCard: {
    backgroundColor: Colors.warningFaded,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: `${Colors.warning}30`,
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
    color: Colors.warning,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  tipDesc: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    lineHeight: 18,
  },
});

