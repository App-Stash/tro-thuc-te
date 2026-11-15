import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  iconName?: keyof typeof Ionicons.glyphMap;
  variant?: 'primary' | 'secondary' | 'danger';
  style?: ViewStyle;
}

export function PrimaryButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  iconName,
  variant = 'primary',
  style,
}: PrimaryButtonProps) {
  const getBgColor = () => {
    if (disabled) return '#9CA3AF';
    if (variant === 'secondary') return '#3B82F6';
    if (variant === 'danger') return '#EF4444';
    return '#10B981';
  };

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: getBgColor() }, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color="#FFF" />
      ) : (
        <>
          {iconName && <Ionicons name={iconName} size={18} color="#FFF" />}
          <Text style={styles.text}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  text: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
});