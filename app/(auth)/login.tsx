import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../services/supabase';

export default function LoginScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'tenant' | 'landlord'>('tenant');
  const [loading, setLoading] = useState(false);

  // Đăng nhập / Đăng ký nhanh qua SĐT & lưu hồ sơ vào bảng public.users
  const handleQuickAuth = async () => {
    if (!phone || !fullName) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập đầy đủ Họ tên và Số điện thoại.');
      return;
    }

    setLoading(true);
    try {
      // Tạo email định danh nội bộ từ SĐT để dùng Supabase Auth mượt mà không tốn phí SMS OTP giai đoạn đầu
      const dummyEmail = `${phone.replace(/\s+/g, '')}@trothucte.vn`;
      const defaultPassword = `Pass_${phone}_2026!`;

      // Thử đăng nhập trước
      let { data: authData, error: signInErr } = await supabase.auth.signInWithPassword({
        email: dummyEmail,
        password: defaultPassword,
      });

      // Nếu chưa có tài khoản thì tự động đăng ký mới
      if (signInErr) {
        const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
          email: dummyEmail,
          password: defaultPassword,
        });
        if (signUpErr) throw signUpErr;
        authData = signUpData;
      }

      const userId = authData.user?.id;
      if (!userId) throw new Error('Không lấy được ID người dùng');

      // Cập nhật hoặc tạo mới thông tin trong bảng public.users
      await supabase.from('users').upsert({
        id: userId,
        phone,
        full_name: fullName,
        role,
      });

      // Điều hướng sang đúng giao diện theo vai trò
      if (role === 'landlord') {
        router.replace('/(landlord)/dashboard');
      } else {
        router.replace('/(tenant)/feed');
      }
    } catch (error: any) {
      Alert.alert('Lỗi đăng nhập', error.message || 'Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>🏠 Trọ Thực Tế</Text>
        <Text style={styles.subtitle}>Tìm phòng thật 100% qua video khóa GPS</Text>

        {/* Chọn vai trò */}
        <View style={styles.roleSwitch}>
          <TouchableOpacity
            style={[styles.roleBtn, role === 'tenant' && styles.roleBtnActive]}
            onPress={() => setRole('tenant')}
          >
            <Text style={[styles.roleText, role === 'tenant' && styles.roleTextActive]}>
              Tôi đi tìm phòng
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.roleBtn, role === 'landlord' && styles.roleBtnActive]}
            onPress={() => setRole('landlord')}
          >
            <Text style={[styles.roleText, role === 'landlord' && styles.roleTextActive]}>
              Tôi là Chủ nhà
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Họ và tên (Dùng cho hợp đồng điện tử)</Text>
        <TextInput
          style={styles.input}
          placeholder="VD: Nguyễn Văn A"
          value={fullName}
          onChangeText={setFullName}
        />

        <Text style={styles.label}>Số điện thoại</Text>
        <TextInput
          style={styles.input}
          placeholder="VD: 0912345678"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />

        <TouchableOpacity style={styles.submitBtn} onPress={handleQuickAuth} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.submitBtnText}>Tiếp tục vào ứng dụng ➔</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6', justifyContent: 'center', padding: 20 },
  card: { backgroundColor: '#FFF', padding: 24, borderRadius: 16, elevation: 3 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#111827', textAlign: 'center' },
  subtitle: { fontSize: 13, color: '#6B7280', textAlign: 'center', marginTop: 4, marginBottom: 24 },
  roleSwitch: { flexDirection: 'row', backgroundColor: '#F3F4F6', padding: 4, borderRadius: 12, marginBottom: 20 },
  roleBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  roleBtnActive: { backgroundColor: '#10B981' },
  roleText: { fontSize: 13, fontWeight: '600', color: '#4B5563' },
  roleTextActive: { color: '#FFF' },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 16,
  },
  submitBtn: {
    backgroundColor: '#111827',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
});