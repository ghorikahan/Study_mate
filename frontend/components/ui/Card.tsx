import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Colors } from '../../constants/colors';
import { Radius, Spacing } from '../../constants/theme';

export type CardVariant = 'default' | 'elevated' | 'outlined' | 'flat';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  style?: StyleProp<ViewStyle>;
  padding?: number;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  style,
  padding = Spacing.base,
}) => {
  return (
    <View style={[styles.base, styles[`variant_${variant}`], { padding }, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  variant_default: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  variant_elevated: {
    backgroundColor: Colors.cardElevated,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  variant_outlined: {
    backgroundColor: Colors.transparent,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  variant_flat: {
    backgroundColor: Colors.cardSecondary,
  },
});

export default Card;

