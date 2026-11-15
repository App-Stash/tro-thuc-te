import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PrivacyNoticeBannerProps {
  isUnlocked?: boolean;
  message?: string;
}

export function PrivacyNoticeBanner({ isUnlocked = false, message }: PrivacyNoticeBannerProps) {
  const defaultMessage = isUnlocked
    ? 'Hợp đồng đã kích hoạt: Địa chỉ chính xác và số điện thoại liên hệ đã được mở khóa.'
    : 'Bảo mật 2 lớp: Địa chỉ chính xác và SĐT chủ nhà được ẩn hoàn toàn cho đến khi hợp đồng được kích hoạt.';

  return (
    <View style={[styles.container, isUnlocked ? styles.unlockedBg : styles.lockedBg]}>
      <Ionicons
        name={isUnlocked ? 'lock-open-outline' : 'shield-checkmark-outline'}
        size={20}
        color={isUnlocked ? '#059669' : '#2563EB'}
      />
      <Text style={[styles.text, isUnlocked ? styles.unlockedText : styles.lockedText]}>
        {message || defaultMessage}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    gap: 10,
    borderWidth: 1,
  },
  lockedBg: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  unlockedBg: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  text: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
  },
  lockedText: { color: '#1E40AF' },
  unlockedText: { color: '#065F46' },
});