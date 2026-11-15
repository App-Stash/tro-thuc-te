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

// Danh sách mã BIN ngân hàng phổ biến tại Việt Nam (chuẩn VietQR)
const POPULAR_BANKS = [
  { name: 'MB Bank', bin: '970422' },
  { name: 'Vietcombank', bin: '970436' },
  { name: 'Techcombank', bin: '970407' },
  { name: 'ACB', bin: '970416' },
  { name: 'BIDV', bin: '970418' },
  { name: 'VPBank', bin: '970432' },
];

export default function LandlordProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedBankBin, setSelectedBankBin] = useState('970422');
  const [bankAccount, setBankAccount] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
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
        if (data.bank_bin) setSelectedBankBin(data.bank_bin);
        if (data.bank_account) setBankAccount(data.bank_account);
      }
    }
    setLoading(false);
  };

  const handleSaveBankInfo = async () => {
    if (!bankAccount.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập số tài khoản ngân hàng nhận tiền thuê phòng.');
      return;
    }

    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: fullName,
          bank_bin: selectedBankBin,
          bank_account: bankAccount.trim(),
        })
        .eq('id', user.id);

      if (error) {
        Alert.alert('Lỗi', 'Không thể lưu thông tin ngân hàng.');
      } else {
        Alert.alert(
          'Đã lưu thành công! ✅',
          'Từ nay khi khách thuê thanh toán qua VietQR, tiền sẽ chuyển thẳng về tài khoản của bạn và hệ thống tự động gạch nợ.'
        );
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
        <Text style={styles.headerTitle}>⚙️ Cài Đặt Tài Khoản Nhận Tiền</Text>
        <Text style={styles.headerSubtitle}>
          Thiết lập tài khoản ngân hàng để hệ thống tự động tạo mã VietQR thu tiền trọ hàng tháng
        </Text>

        <View style={styles.card}>
          <Text style={styles.label}>Họ và tên Chủ nhà</Text>
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Nhập họ tên đầy đủ"
          />

          <Text style={styles.label}>Số điện thoại liên hệ (Mở khóa khi khách ký hợp đồng)</Text>
          <TextInput style={[styles.input, styles.disabledInput]} value={phone} editable={false} />

          <Text style={styles.label}>Chọn Ngân hàng nhận tiền</Text>
          <View style={styles.bankGrid}>
            {POPULAR_BANKS.map((bank) => {
              const isSelected = selectedBankBin === bank.bin;
              return (
                <TouchableOpacity
                  key={bank.bin}
                  style={[styles.bankChip, isSelected && styles.bankChipActive]}
                  onPress={() => setSelectedBankBin(bank.bin)}
                >
                  <Text style={[styles.bankChipText, isSelected && styles.bankChipTextActive]}>
                    {bank.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.label}>Số tài khoản ngân hàng</Text>
          <TextInput
            style={styles.input}
            value={bankAccount}
            onChangeText={setBankAccount}
            keyboardType="numeric"
            placeholder="VD: 0912345678 hoặc số tài khoản"
          />

          <TouchableOpacity style={styles.saveBtn} onPress={handleSaveBankInfo} disabled={saving}>
            {saving ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Ionicons name="save-outline" size={18} color="#FFF" />
                <Text style={styles.saveBtnText}>Lưu cấu hình VietQR</Text>
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
  bankGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4, marginBottom: 8 },
  bankChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
  },
  bankChipActive: { backgroundColor: '#10B981', borderColor: '#10B981' },
  bankChipText: { fontSize: 12, fontWeight: '600', color: '#374151' },
  bankChipTextActive: { color: '#FFF' },
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