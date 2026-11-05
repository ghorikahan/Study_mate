import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  BookOpen,
  Plus,
  Search,
  ChevronRight,
  Clock,
  Calendar,
} from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Card, Badge, Button, EmptyState } from '../../components/ui';
import { FontSize, FontWeight, Spacing, Radius } from '../../constants/theme';

type PlanFilter = 'All' | 'Active' | 'Completed';
const FILTERS: PlanFilter[] = ['All', 'Active', 'Completed'];

// ─── Subject Chip ───────────────────────────────────────────────────────
const SUBJECTS = [
  { label: 'Mathematics', color: Colors.primary },
  { label: 'Physics', color: Colors.secondary },
  { label: 'Chemistry', color: Colors.warning },
  { label: 'English', color: Colors.success },
  { label: 'History', color: '#F472B6' },
];

interface SubjectChipProps {
  label: string;
  color: string;
}
const SubjectChip: React.FC<SubjectChipProps> = ({ label, color }) => (
  <TouchableOpacity
    style={[styles.subjectChip, { borderColor: `${color}40`, backgroundColor: `${color}10` }]}
    activeOpacity={0.8}
  >
    <View style={[styles.subjectDot, { backgroundColor: color }]} />
    <Text style={[styles.subjectLabel, { color }]}>{label}</Text>
    <ChevronRight size={12} color={color} />
  </TouchableOpacity>
);

export default function PlannerScreen() {
  const [activeFilter, setActiveFilter] = useState<PlanFilter>('All');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.screenTitle}>Study Planner</Text>
          <Text style={styles.screenSubtitle}>Organise your study sessions</Text>
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
        {/* ── Search ── */}
        <TouchableOpacity style={styles.searchBar} activeOpacity={0.8}>
          <Search size={18} color={Colors.textMuted} />
          <Text style={styles.searchPlaceholder}>Search plans, subjects...</Text>
        </TouchableOpacity>

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

        {/* ── Subjects ── */}
        <Text style={styles.sectionTitle}>Your Subjects</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.subjectsRow}
        >
          {SUBJECTS.map((s) => (
            <SubjectChip key={s.label} {...s} />
          ))}
          <TouchableOpacity style={styles.addSubjectChip} activeOpacity={0.8}>
            <Plus size={16} color={Colors.textMuted} />
            <Text style={styles.addSubjectText}>Add</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* ── Plans (Empty State) ── */}
        <Text style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>
          Study Plans
        </Text>

        <Card style={styles.emptyCard}>
          <EmptyState
            icon={<BookOpen size={32} color={Colors.textMuted} />}
            title="No study plans yet"
            description={
              activeFilter === 'All'
                ? "Create your first study plan to start organising your sessions and tracking progress."
                : `You have no ${activeFilter.toLowerCase()} plans.`
            }
            actionLabel="Create First Plan"
            onAction={() => { }}
          />
        </Card>

        {/* ── Tip Card ── */}
        <View style={styles.tipCard}>
          <View style={styles.tipIconWrap}>
            <Clock size={18} color={Colors.secondary} />
          </View>
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>Study Tip</Text>
            <Text style={styles.tipDesc}>
              Break your study sessions into 25-minute focused intervals with 5-minute breaks for maximum retention.
            </Text>
          </View>
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
  filterTextActive: {
    color: Colors.primary,
  },

  sectionTitle: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },

  subjectsRow: {
    gap: Spacing.sm,
    paddingRight: Spacing.base,
  },
  subjectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  subjectDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  subjectLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  addSubjectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  addSubjectText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
  },

  emptyCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },

  tipCard: {
    flexDirection: 'row',
    backgroundColor: Colors.secondaryFaded,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: `${Colors.secondary}30`,
    padding: Spacing.base,
    marginTop: Spacing.xl,
    gap: Spacing.md,
    alignItems: 'flex-start',
  },
  tipIconWrap: {
    width: 38,
    height: 38,
    borderRadius: Radius.sm,
    backgroundColor: `${Colors.secondary}20`,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  tipContent: { flex: 1 },
  tipTitle: {
    color: Colors.secondary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    marginBottom: 4,
  },
  tipDesc: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    lineHeight: 18,
  },
});

