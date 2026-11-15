import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';

export default function TenantProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    loadTenantProfile();
  }, []);

  const loadTenantProfile = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) {
        setFullName(data.full_name || '');
        setPhone(data.phone || '');
      }
    }
    setLoading(false);
  };

  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập họ và tên để hiển thị trên hợp đồng thuê trọ.');
      return;
    }

    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase
        .from('users')
        .update({ full_name: fullName.trim() })
        .eq('id', user.id);

      if (error) {
        Alert.alert('Lỗi', 'Không thể cập nhật thông tin cá nhân.');
      } else {
        Alert.alert('Thành công ✅', 'Đã cập nhật hồ sơ cá nhân của bạn.');
      }
    }
    setSaving(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/(auth)/login');
  };

  if (loading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.headerTitle}>👤 Hồ Sơ Người Thuê</Text>
        <Text style={styles.headerSubtitle}>
          Thông tin của bạn được bảo mật 2 lớp và chỉ chia sẻ cho chủ nhà khi bạn kích hoạt hợp đồng
        </Text>

        <View style={styles.card}>
          <Text style={styles.label}>Họ và tên (Hiển thị trên hợp đồng)</Text>
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Nhập họ tên đầy đủ"
          />

          <Text style={styles.label}>Số điện thoại đăng ký</Text>
          <TextInput style={[styles.input, styles.disabledInput]} value={phone} editable={false} />

          <View style={styles.privacyBanner}>
            <Ionicons name="shield-checkmark-outline" size={22} color="#059669" />
            <Text style={styles.privacyText}>
              Số điện thoại của bạn được ẩn hoàn toàn khi lướt xem phòng. Chỉ chủ nhà của phòng bạn chốt thuê mới thấy được thông tin này.
            </Text>
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile} disabled={saving}>
            {saving ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={18} color="#FFF" />
                <Text style={styles.saveBtnText}>Lưu thay đổi</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color="#EF4444" />
          <Text style={styles.logoutText}>Đăng xuất tài khoản</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  headerSubtitle: { fontSize: 12, color: '#6B7280', marginBottom: 20, lineHeight: 18 },
  card: { backgroundColor: '#FFF', padding: 16, borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB' },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 10 },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: '#111827',
  },
  disabledInput: { backgroundColor: '#F3F4F6', color: '#6B7280' },
  privacyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    padding: 12,
    borderRadius: 10,
    marginTop: 16,
    gap: 10,
  },
  privacyText: { flex: 1, fontSize: 12, color: '#065F46', lineHeight: 17 },
  saveBtn: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginTop: 20,
  },
  saveBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
  logoutBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 20,
    gap: 6,
  },
  logoutText: { color: '#EF4444', fontWeight: '600', fontSize: 14 },
});