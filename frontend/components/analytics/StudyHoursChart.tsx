import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DailyBreakdownItem } from '../../types/analytics';

const C = {
  card: '#151923',
  cardAlt: '#1C2333',
  primary: '#8B5CF6',
  secondary: '#22D3EE',
  text: '#F9FAFB',
  textMuted: '#6B7280',
  border: '#374151',
  success: '#10B981',
};

interface StudyHoursChartProps {
  data: DailyBreakdownItem[];
  goalHours?: number;
}

const CHART_HEIGHT = 160;

export const StudyHoursChart: React.FC<StudyHoursChartProps> = ({ data, goalHours }) => {
  // Take last 7 items if data is longer (for clean bar spacing)
  const displayItems = data.length > 7 ? data.slice(-7) : data;
  const maxHours = Math.max(...displayItems.map((d) => d.hours), 4);
  const totalHours = displayItems.reduce((acc, curr) => acc + curr.hours, 0);
  const avgHours = Math.round((totalHours / displayItems.length) * 10) / 10;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>📈 Daily Study Hours</Text>
          <Text style={styles.subtitle}>
            Avg <Text style={styles.highlight}>{avgHours}h / day</Text> · Total{' '}
            <Text style={styles.highlight}>{Math.round(totalHours * 10) / 10}h</Text>
          </Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{displayItems.length} Days</Text>
        </View>
      </View>

      {/* Chart Canvas */}
      <View style={styles.chartCanvas}>
        {/* Horizontal grid lines */}
        <View style={[styles.gridLine, { top: 0 }]} />
        <View style={[styles.gridLine, { top: CHART_HEIGHT * 0.5 }]} />
        <View style={[styles.gridLine, { top: CHART_HEIGHT }]} />

        {/* Bars Container */}
        <View style={styles.barsContainer}>
          {displayItems.map((item, idx) => {
            const heightPercent = Math.min(100, Math.round((item.hours / maxHours) * 100));
            const barHeight = Math.max(8, (heightPercent / 100) * (CHART_HEIGHT - 30));
            const isToday = idx === displayItems.length - 1;

            return (
              <View key={item.date} style={styles.barColumn}>
                {/* Value tooltip */}
                <Text style={[styles.barValueText, item.hours > 0 && { color: isToday ? C.secondary : C.text }]}>
                  {item.hours > 0 ? `${item.hours}h` : ''}
                </Text>

                {/* Bar */}
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        height: barHeight,
                        backgroundColor: isToday ? C.secondary : item.hours > 0 ? C.primary : C.cardAlt,
                      },
                    ]}
                  />
                </View>

                {/* Label */}
                <Text style={[styles.dayLabel, isToday && styles.dayLabelActive]}>
                  {item.dayName}
                </Text>
                <Text style={styles.dateLabel}>{item.shortDate}</Text>
              </View>
            );
          })}
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
    alignItems: 'flex-start',
    marginBottom: 16,
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
  highlight: {
    color: C.secondary,
    fontWeight: '700',
  },
  badge: {
    backgroundColor: C.cardAlt,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  badgeText: {
    color: C.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  chartCanvas: {
    height: CHART_HEIGHT + 36,
    position: 'relative',
    justifyContent: 'flex-end',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: C.border + '33',
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: CHART_HEIGHT,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  barValueText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'transparent',
    marginBottom: 4,
    height: 14,
  },
  barTrack: {
    width: 22,
    height: CHART_HEIGHT - 30,
    backgroundColor: C.cardAlt,
    borderRadius: 8,
    justifyContent: 'flex-end',
    alignItems: 'center',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 8,
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: C.textMuted,
    marginTop: 8,
  },
  dayLabelActive: {
    color: C.secondary,
    fontWeight: '800',
  },
  dateLabel: {
    fontSize: 9,
    color: C.textMuted + '99',
    marginTop: 1,
  },
});

export default StudyHoursChart;

