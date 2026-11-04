import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GraduationCap, Sparkles } from 'lucide-react-native';
import { Colors } from '../constants/colors';

export const DashboardHeader: React.FC = () => {
  return (
    <View style={styles.header}>
      <View style={styles.badgeRow}>
        <View style={styles.milestoneBadge}>
          <Sparkles size={12} color={Colors.primary} />
          <Text style={styles.milestoneText}>Day 1 • Initialization</Text>
        </View>
        <View style={styles.liveBadge}>
          <Text style={styles.liveText}>Ready for Day 2</Text>
        </View>
      </View>

      <View style={styles.brandRow}>
        <View style={styles.iconContainer}>
          <GraduationCap size={28} color={Colors.secondary} />
        </View>
        <View style={styles.titleContainer}>
          <View style={styles.logoTitleRow}>
            <Text style={styles.brandName}>Study</Text>
            <Text style={styles.brandNameAccent}>Mate</Text>
          </View>
          <Text style={styles.tagline}>Plan Smart. Study Better. Achieve More.</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingVertical: 16,
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  milestoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  milestoneText: {
    color: Colors.primaryLight,
    fontSize: 12,
    fontWeight: '600',
  },
  liveBadge: {
    backgroundColor: Colors.cardSecondary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  liveText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: Colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  titleContainer: {
    flex: 1,
  },
  logoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandName: {
    color: Colors.text,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  brandNameAccent: {
    color: Colors.primary,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  tagline: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
    fontWeight: '400',
  },
});

export default DashboardHeader;

