import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';

const C = {
  card: Colors.card,
  cardAlt: Colors.cardSecondary,
  primary: Colors.primary,
  secondary: Colors.secondary,
  text: Colors.text,
  textMuted: Colors.textMuted,
  border: Colors.border,
  success: Colors.success,
  warning: Colors.warning,
  error: Colors.error,
};

interface TaskCompletionCardProps {
  metrics: {
    total: number;
    completed: number;
    pending: number;
    overdue: number;
    completionRate: number;
  };
}

export const TaskCompletionCard: React.FC<TaskCompletionCardProps> = ({ metrics }) => {
  const total = Number(metrics?.total) || 0;
  const completed = Number(metrics?.completed) || 0;
  const pending = Number(metrics?.pending) || 0;
  const overdue = Number(metrics?.overdue) || 0;
  const completionRate = Math.min(100, Math.max(0, Number(metrics?.completionRate) || 0));

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>✅ Overall Task Completion</Text>
          <Text style={styles.subtitle}>
            {completed} of {total} tasks achieved
          </Text>
        </View>
        <View style={[styles.rateBadge, { borderColor: completionRate >= 70 ? C.success : C.warning }]}>
          <Text style={[styles.rateText, { color: completionRate >= 70 ? C.success : C.warning }]}>
            {completionRate}%
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            {
              width: `${completionRate}%`,
              backgroundColor: completionRate >= 70 ? C.success : C.primary,
            },
          ]}
        />
      </View>

      {/* Stats Grid */}
      <View style={styles.grid}>
        <View style={styles.gridItem}>
          <Text style={[styles.gridValue, { color: C.success }]}>{completed}</Text>
          <Text style={styles.gridLabel}>Completed</Text>
        </View>
        <View style={styles.gridItem}>
          <Text style={[styles.gridValue, { color: C.primary }]}>{pending}</Text>
          <Text style={styles.gridLabel}>Pending</Text>
        </View>
        <View style={styles.gridItem}>
          <Text style={[styles.gridValue, { color: overdue > 0 ? C.error : C.textMuted }]}>{overdue}</Text>
          <Text style={styles.gridLabel}>Overdue</Text>
        </View>
        <View style={styles.gridItem}>
          <Text style={[styles.gridValue, { color: C.text }]}>{total}</Text>
          <Text style={styles.gridLabel}>Total</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: C.card,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: C.text,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: C.textMuted,
  },
  rateBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1.5,
    backgroundColor: C.cardAlt,
  },
  rateText: {
    fontSize: 16,
    fontWeight: '900',
  },
  track: {
    height: 10,
    backgroundColor: C.cardAlt,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 18,
  },
  fill: {
    height: '100%',
    borderRadius: 5,
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: C.cardAlt,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  gridItem: {
    alignItems: 'center',
  },
  gridValue: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  gridLabel: {
    fontSize: 10,
    color: C.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default TaskCompletionCard;

