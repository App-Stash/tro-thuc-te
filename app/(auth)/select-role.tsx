import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function SelectRoleScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>🏠 Trọ Thực Tế</Text>
        <Text style={styles.subtitle}>Lựa chọn vai trò của bạn để bắt đầu</Text>

        <TouchableOpacity
          style={styles.roleCard}
          onPress={() => router.push('/(auth)/login')}
        >
          <Ionicons name="business-outline" size={36} color="#10B981" />
          <View style={styles.roleInfo}>
            <Text style={styles.roleTitle}>Tôi là Chủ nhà / Quản lý trọ</Text>
            <Text style={styles.roleDesc}>Đăng phòng xác thực GPS, nhận tiền và thu phí tự động 1%</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.roleCard}
          onPress={() => router.push('/(auth)/login')}
        >
          <Ionicons name="search-outline" size={36} color="#3B82F6" />
          <View style={styles.roleInfo}>
            <Text style={styles.roleTitle}>Tôi đi tìm phòng trọ</Text>
            <Text style={styles.roleDesc}>Xem video thực tế 4 khu vực, ẩn địa chỉ cho đến khi ký hợp đồng</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  content: { flex: 1, padding: 20, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#111827', textAlign: 'center', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 32 },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 2,
  },
  roleInfo: { flex: 1, marginHorizontal: 16 },
  roleTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  roleDesc: { fontSize: 12, color: '#6B7280', lineHeight: 16 },
});