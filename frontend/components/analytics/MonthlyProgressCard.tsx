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
};

interface MonthlyProgressCardProps {
  progress: {
    monthMinutes: number;
    monthHours: number;
    monthlyGoalHours: number;
    monthlyProgressPercent: number;
  };
}

export const MonthlyProgressCard: React.FC<MonthlyProgressCardProps> = ({ progress }) => {
  const monthHours = Number(progress?.monthHours) || 0;
  const monthlyGoalHours = Number(progress?.monthlyGoalHours) || 80;
  const monthlyProgressPercent = Math.min(100, Math.max(0, Number(progress?.monthlyProgressPercent) || 0));
  const remainingHours = Math.max(0, Math.round((monthlyGoalHours - monthHours) * 10) / 10);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>🗓️ Monthly Study Target</Text>
          <Text style={styles.subtitle}>
            {monthHours}h studied of {monthlyGoalHours}h monthly goal
          </Text>
        </View>
        <Text style={styles.percentText}>{monthlyProgressPercent}%</Text>
      </View>

      {/* Progress Track */}
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { width: `${monthlyProgressPercent}%` },
          ]}
        />
      </View>

      {/* Footer message */}
      <Text style={styles.footerNote}>
        {remainingHours > 0
          ? `🎯 ${remainingHours} hours remaining to reach your monthly milestone!`
          : '🎉 Amazing! You have reached your monthly target goal!'}
      </Text>
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
  percentText: {
    fontSize: 20,
    fontWeight: '900',
    color: C.secondary,
  },
  track: {
    height: 10,
    backgroundColor: C.cardAlt,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 12,
  },
  fill: {
    height: '100%',
    backgroundColor: C.secondary,
    borderRadius: 5,
  },
  footerNote: {
    fontSize: 12,
    color: C.textMuted,
    lineHeight: 18,
  },
});

export default MonthlyProgressCard;

