import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { Radius, FontSize, FontWeight, Spacing } from '../../constants/theme';

export type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'neutral';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  dot?: boolean;
}

const variantConfig: Record<BadgeVariant, { bg: string; text: string; dot: string }> = {
  primary: { bg: Colors.primaryFaded, text: Colors.primaryLight, dot: Colors.primary },
  secondary: { bg: Colors.secondaryFaded, text: Colors.secondary, dot: Colors.secondary },
  success: { bg: Colors.successFaded, text: Colors.success, dot: Colors.success },
  warning: { bg: Colors.warningFaded, text: Colors.warning, dot: Colors.warning },
  error: { bg: Colors.errorFaded, text: Colors.error, dot: Colors.error },
  info: { bg: Colors.infoFaded, text: Colors.info, dot: Colors.info },
  neutral: { bg: Colors.cardSecondary, text: Colors.textSecondary, dot: Colors.textMuted },
};

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'primary', dot = false }) => {
  const cfg = variantConfig[variant];
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      {dot && <View style={[styles.dot, { backgroundColor: cfg.dot }]} />}
      <Text style={[styles.text, { color: cfg.text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: Radius.full,
    gap: 5,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    letterSpacing: 0.2,
  },
});

export default Badge;

