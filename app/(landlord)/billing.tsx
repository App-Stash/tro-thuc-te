import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';

interface LandlordInvoice {
  id: string;
  billing_month: string;
  room_fee: number;
  utility_fee: number;
  platform_fee: number; // 1% phí nền tảng
  total_amount: number;
  payment_code: string;
  status: 'pending' | 'paid' | 'overdue';
  paid_at: string | null;
  contracts: {
    rooms: {
      title: string;
    };
  };
}

export default function LandlordBillingScreen() {
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<LandlordInvoice[]>([]);
  const [filter, setFilter] = useState<'all' | 'paid' | 'pending'>('all');

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    // Lấy toàn bộ hóa đơn thuộc các hợp đồng của chủ nhà này
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        id,
        billing_month,
        room_fee,
        utility_fee,
        platform_fee,
        total_amount,
        payment_code,
        status,
        paid_at,
        contracts!inner (
          landlord_id,
          rooms (
            title
          )
        )
      `)
      .eq('contracts.landlord_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Lỗi tải dữ liệu hóa đơn:', error);
    } else if (data) {
      setInvoices(data as any);
    }
    setLoading(false);
  };

  // Tính toán tổng hợp tài chính
  const paidInvoices = invoices.filter((inv) => inv.status === 'paid');
  const totalCollected = paidInvoices.reduce((sum, inv) => sum + inv.total_amount, 0);
  const totalPlatformFee = paidInvoices.reduce((sum, inv) => sum + inv.platform_fee, 0);
  const netLandlordIncome = totalCollected - totalPlatformFee;

  const filteredInvoices = invoices.filter((inv) => {
    if (filter === 'all') return true;
    return inv.status === filter;
  });

  if (loading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Đang tổng hợp dữ liệu dòng tiền...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>💰 Đối Soát & Hóa Đơn Thu Tiền</Text>
          <Text style={styles.headerSubtitle}>Tự động gạch nợ VietQR/SePay • Minh bạch phí 1%</Text>
        </View>

        {/* THẺ TỔNG QUAN DOANH THU */}
        <View style={styles.summaryCard}>
          <View style={styles.mainMetric}>
            <Text style={styles.metricLabel}>Thực nhận về tài khoản (Đã trừ phí 1%)</Text>
            <Text style={styles.metricValue}>{netLandlordIncome.toLocaleString('vi-VN')} đ</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.subMetricsRow}>
            <View style={styles.subMetric}>
              <Text style={styles.subLabel}>Tổng khách đã chuyển</Text>
              <Text style={styles.subVal}>{totalCollected.toLocaleString('vi-VN')} đ</Text>
            </View>
            <View style={styles.subMetric}>
              <Text style={styles.subLabel}>Phí nền tảng (1%)</Text>
              <Text style={[styles.subVal, { color: '#F59E0B' }]}>
                -{totalPlatformFee.toLocaleString('vi-VN')} đ
              </Text>
            </View>
          </View>
        </View>

        {/* BỘ LỌC TRẠNG THÁI */}
        <View style={styles.filterRow}>
          {[
            { key: 'all', label: `Tất cả (${invoices.length})` },
            { key: 'paid', label: `Đã thu (${paidInvoices.length})` },
            { key: 'pending', label: `Chờ đóng (${invoices.length - paidInvoices.length})` },
          ].map((item) => (
            <TouchableOpacity
              key={item.key}
              style={[styles.filterBtn, filter === item.key && styles.filterBtnActive]}
              onPress={() => setFilter(item.key as any)}
            >
              <Text style={[styles.filterText, filter === item.key && styles.filterTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* DANH SÁCH CHI TIẾT HÓA ĐƠN */}
        {filteredInvoices.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="receipt-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyText}>Chưa có hóa đơn nào trong mục này.</Text>
          </View>
        ) : (
          filteredInvoices.map((inv) => {
            const isPaid = inv.status === 'paid';
            return (
              <View key={inv.id} style={styles.invoiceCard}>
                <View style={styles.invHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.roomName}>{inv.contracts?.rooms?.title || 'Phòng trọ'}</Text>
                    <Text style={styles.billingMonth}>Kỳ thanh toán: Tháng {inv.billing_month}</Text>
                  </View>
                  <View style={[styles.badge, isPaid ? styles.badgePaid : styles.badgePending]}>
                    <Text style={[styles.badgeText, isPaid ? styles.textPaid : styles.textPending]}>
                      {isPaid ? '✅ Đã gạch nợ' : '⏳ Chờ thanh toán'}
                    </Text>
                  </View>
                </View>

                <View style={styles.breakdownBox}>
                  <View style={styles.row}>
                    <Text style={styles.label}>Tiền phòng + Điện/Nước:</Text>
                    <Text style={styles.val}>
                      {(inv.room_fee + inv.utility_fee).toLocaleString('vi-VN')} đ
                    </Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.label}>Phí nền tảng (1%):</Text>
                    <Text style={styles.val}>-{inv.platform_fee.toLocaleString('vi-VN')} đ</Text>
                  </View>
                  <View style={[styles.row, styles.totalRow]}>
                    <Text style={styles.totalLabel}>Tổng hóa đơn khách quét QR:</Text>
                    <Text style={styles.totalVal}>{inv.total_amount.toLocaleString('vi-VN')} đ</Text>
                  </View>
                </View>

                <View style={styles.footerRow}>
                  <Text style={styles.codeText}>Mã CK: {inv.payment_code}</Text>
                  {isPaid && inv.paid_at && (
                    <Text style={styles.dateText}>
                      Thu lúc: {new Date(inv.paid_at).toLocaleDateString('vi-VN')}
                    </Text>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#4B5563', fontSize: 14 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  header: { marginBottom: 16 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  headerSubtitle: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  summaryCard: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
  },
  mainMetric: { marginBottom: 14 },
  metricLabel: { color: '#9CA3AF', fontSize: 12, marginBottom: 4 },
  metricValue: { color: '#10B981', fontSize: 26, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#374151', marginBottom: 14 },
  subMetricsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  subMetric: { flex: 1 },
  subLabel: { color: '#9CA3AF', fontSize: 11, marginBottom: 2 },
  subVal: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  filterBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
  },
  filterBtnActive: { backgroundColor: '#10B981' },
  filterText: { fontSize: 12, fontWeight: '600', color: '#4B5563' },
  filterTextActive: { color: '#FFF' },
  emptyBox: { alignItems: 'center', justifyContent: 'center', marginTop: 40 },
  emptyText: { color: '#6B7280', marginTop: 8, fontSize: 14 },
  invoiceCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  invHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  roomName: { fontSize: 15, fontWeight: 'bold', color: '#111827' },
  billingMonth: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  badgePaid: { backgroundColor: '#ECFDF5' },
  badgePending: { backgroundColor: '#FEF3C7' },
  badgeText: { fontSize: 11, fontWeight: 'bold' },
  textPaid: { color: '#059669' },
  textPending: { color: '#D97706' },
  breakdownBox: { backgroundColor: '#F9FAFB', padding: 12, borderRadius: 10, marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  label: { fontSize: 12, color: '#6B7280' },
  val: { fontSize: 12, fontWeight: '500', color: '#111827' },
  totalRow: { borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 6, marginTop: 4 },
  totalLabel: { fontSize: 13, fontWeight: 'bold', color: '#111827' },
  totalVal: { fontSize: 13, fontWeight: 'bold', color: '#10B981' },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  codeText: { fontSize: 11, fontFamily: 'monospace', color: '#4B5563', fontWeight: '600' },
  dateText: { fontSize: 11, color: '#6B7280' },
});