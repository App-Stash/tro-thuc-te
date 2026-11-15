import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StatusBadgeProps {
  label: string;
  type: 'success' | 'warning' | 'danger' | 'neutral';
}

export function StatusBadge({ label, type }: StatusBadgeProps) {
  const colorMap = {
    success: { bg: '#ECFDF5', text: '#059669' },
    warning: { bg: '#FEF3C7', text: '#D97706' },
    danger: { bg: '#FEE2E2', text: '#DC2626' },
    neutral: { bg: '#F3F4F6', text: '#4B5563' },
  };

  const currentColors = colorMap[type];

  return (
    <View style={[styles.badge, { backgroundColor: currentColors.bg }]}>
      <Text style={[styles.text, { color: currentColors.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: 'bold',
  },
});