import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  ShieldCheck,
  CheckSquare,
  Clock,
  Calendar,
  BarChart3,
  Flame,
} from 'lucide-react-native';
import { Colors } from '../constants/colors';

const MODULES = [
  {
    icon: ShieldCheck,
    title: 'Authentication & Security',
    day: 'Day 2',
    desc: 'JWT, bcryptjs, Expo SecureStore token handling',
    color: Colors.primary,
  },
  {
    icon: CheckSquare,
    title: 'Smart Task Management',
    day: 'Upcoming',
    desc: 'Priorities, deadlines, overdue states & tags',
    color: Colors.secondary,
  },
  {
    icon: Calendar,
    title: 'Timetable & Exam Tracker',
    day: 'Upcoming',
    desc: 'Daily study schedules, countdowns & alerts',
    color: '#F472B6',
  },
  {
    icon: Clock,
    title: 'Focus Study Timer',
    day: 'Upcoming',
    desc: 'Deep work sessions, intervals & history',
    color: '#FBBF24',
  },
  {
    icon: BarChart3,
    title: 'Productivity Analytics',
    day: 'Upcoming',
    desc: 'Study hours, completion rates & charts',
    color: '#34D399',
  },
];

export const RoadmapCard: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Flame size={18} color={Colors.secondary} />
        <Text style={styles.sectionTitle}>18-Day Modular Architecture</Text>
      </View>
      <Text style={styles.sectionSubtitle}>
        Core features structured for incremental delivery and clean separation
      </Text>

      <View style={styles.list}>
        {MODULES.map((item, index) => {
          const Icon = item.icon;
          return (
            <View key={index} style={styles.moduleItem}>
              <View style={[styles.iconWrap, { backgroundColor: `${item.color}15` }]}>
                <Icon size={18} color={item.color} />
              </View>
              <View style={styles.infoWrap}>
                <View style={styles.headerWrap}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <Text style={[styles.dayBadge, { color: item.color }]}>
                    {item.day}
                  </Text>
                </View>
                <Text style={styles.itemDesc}>{item.desc}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    marginVertical: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  sectionSubtitle: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginBottom: 16,
  },
  list: {
    gap: 12,
  },
  moduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    backgroundColor: Colors.cardSecondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoWrap: {
    flex: 1,
  },
  headerWrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  itemTitle: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  dayBadge: {
    fontSize: 11,
    fontWeight: '600',
  },
  itemDesc: {
    color: Colors.textSecondary,
    fontSize: 11,
  },
});

export default RoadmapCard;

