import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SubjectDistributionItem } from '../../types/analytics';

const C = {
  card: '#151923',
  cardAlt: '#1C2333',
  text: '#F9FAFB',
  textMuted: '#6B7280',
  border: '#374151',
  warning: '#F59E0B',
};

interface SubjectDistributionCardProps {
  distribution: SubjectDistributionItem[];
}

export const SubjectDistributionCard: React.FC<SubjectDistributionCardProps> = ({ distribution }) => {
  if (!distribution || distribution.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>🎨 Subject-Wise Study Distribution</Text>
        <Text style={styles.emptyText}>No subject study sessions recorded for this period.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎨 Subject-Wise Study Distribution</Text>
      <Text style={styles.subtitle}>Time allocation across your active curriculum</Text>

      {/* Multi-Segment Stacked Progress Bar */}
      <View style={styles.segmentedBar}>
        {distribution.map((item) => (
          <View
            key={item.subject}
            style={[
              styles.segment,
              {
                flex: Math.max(1, item.percentage),
                backgroundColor: item.color,
              },
            ]}
          />
        ))}
      </View>

      {/* Subject Rows */}
      <View style={styles.list}>
        {distribution.map((item) => (
          <View key={item.subject} style={styles.subjectRow}>
            {/* Left: Color dot & Subject Name */}
            <View style={styles.subjectLeft}>
              <View style={[styles.colorDot, { backgroundColor: item.color }]} />
              <View>
                <Text style={styles.subjectName}>{item.subject}</Text>
                <Text style={styles.sessionsMeta}>
                  {item.sessionsCount} session{item.sessionsCount === 1 ? '' : 's'} · Focus rating:{' '}
                  <Text style={styles.starText}>{'★'.repeat(Math.round(item.avgRating))}</Text>
                </Text>
              </View>
            </View>

            {/* Right: Hours & Percentage */}
            <View style={styles.subjectRight}>
              <Text style={styles.hoursText}>{item.hours}h</Text>
              <Text style={styles.percentageBadge}>{item.percentage}%</Text>
            </View>
          </View>
        ))}
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
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: C.text,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: C.textMuted,
    marginBottom: 14,
  },
  emptyText: {
    color: C.textMuted,
    fontSize: 13,
    marginTop: 8,
    fontStyle: 'italic',
  },
  segmentedBar: {
    height: 10,
    borderRadius: 5,
    flexDirection: 'row',
    overflow: 'hidden',
    backgroundColor: C.cardAlt,
    marginBottom: 18,
  },
  segment: {
    height: '100%',
  },
  list: {
    gap: 14,
  },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subjectLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  subjectName: {
    fontSize: 14,
    fontWeight: '700',
    color: C.text,
  },
  sessionsMeta: {
    fontSize: 11,
    color: C.textMuted,
    marginTop: 1,
  },
  starText: {
    color: C.warning,
    fontSize: 11,
  },
  subjectRight: {
    alignItems: 'flex-end',
  },
  hoursText: {
    fontSize: 14,
    fontWeight: '800',
    color: C.text,
  },
  percentageBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: C.textMuted,
  },
});

export default SubjectDistributionCard;
