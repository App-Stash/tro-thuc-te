import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';
import { generateVietQRUrl } from '../../features/billing/services/billingService';

interface ContractDetail {
  id: string;
  start_date: string;
  deposit_status: string;
  rooms: {
    id: string;
    title: string;
    exact_address: string;
    is_address_hidden: boolean;
    price_monthly: number;
    deposit_amount: number;
  };
  landlord: {
    full_name: string;
    phone: string;
    bank_bin: string;
    bank_account: string;
  };
}

interface InvoiceItem {
  id: string;
  billing_month: string;
  room_fee: number;
  utility_fee: number;
  platform_fee: number;
  total_amount: number;
  payment_code: string;
  status: 'pending' | 'paid' | 'overdue';
}

export default function TenantContractScreen() {
  const [loading, setLoading] = useState(true);
  const [contract, setContract] = useState<ContractDetail | null>(null);
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);

  // ID giả lập người thuê (Khớp với ID lúc test đặt phòng)
  const MOCK_TENANT_ID = 'b0000000-0000-0000-0000-000000000002';

  useEffect(() => {
    fetchTenantActiveContract();
  }, []);

  const fetchTenantActiveContract = async () => {
    setLoading(true);
    // 1. Lấy hợp đồng đang hoạt động của người thuê kèm thông tin phòng & chủ nhà
    const { data: contractData, error: contractErr } = await supabase
      .from('contracts')
      .select(`
        id,
        start_date,
        deposit_status,
        rooms (
          id,
          title,
          exact_address,
          is_address_hidden,
          price_monthly,
          deposit_amount
        ),
        landlord:landlord_id (
          full_name,
          phone,
          bank_bin,
          bank_account
        )
      `)
      .eq('tenant_id', MOCK_TENANT_ID)
      .single();

    if (contractErr || !contractData) {
      setLoading(false);
      return;
    }

    setContract(contractData as any);

    // 2. Lấy danh sách hóa đơn của hợp đồng này
    const { data: invoiceData, error: invoiceErr } = await supabase
      .from('invoices')
      .select('*')
      .eq('contract_id', contractData.id)
      .order('created_at', { ascending: false });

    if (invoiceData) {
      setInvoices(invoiceData as any);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Đang tải thông tin hợp đồng...</Text>
      </View>
    );
  }

  if (!contract) {
    return (
      <SafeAreaView style={styles.centerBox}>
        <Ionicons name="document-text-outline" size={60} color="#9CA3AF" />
        <Text style={styles.emptyTitle}>Chưa có hợp đồng hoạt động</Text>
        <Text style={styles.emptySubtitle}>Bạn chưa kích hoạt thuê phòng nào. Hãy khám phá và bấm yêu cầu thuê trên Feed.</Text>
      </SafeAreaView>
    );
  }

  const landlordInfo: any = contract.landlord;
  const roomInfo: any = contract.rooms;
  const pendingInvoice = invoices.find((inv) => inv.status === 'pending');

  // Tạo URL VietQR nếu có hóa đơn chờ thanh toán và chủ nhà đã cấu hình ngân hàng
  const qrUrl =
    pendingInvoice && landlordInfo?.bank_bin && landlordInfo?.bank_account
      ? generateVietQRUrl(
          landlordInfo.bank_bin,
          landlordInfo.bank_account,
          pendingInvoice.total_amount,
          pendingInvoice.payment_code
        )
      : null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>📄 Phòng & Hợp Đồng Của Tôi</Text>
          <Text style={styles.headerSubtitle}>Quản lý thuê trọ và thanh toán tự động qua VietQR</Text>
        </View>

        {/* THẺ 1: ĐỊA CHỈ & SỐ ĐIỆN THOẠI ĐÃ ĐƯỢC MỞ KHÓA */}
        <View style={styles.unlockedCard}>
          <View style={styles.unlockedHeader}>
            <Ionicons name="lock-open-outline" size={20} color="#10B981" />
            <Text style={styles.unlockedTitle}>🔓 Thông Tin Đã Mở Khóa (Hợp đồng hiệu lực)</Text>
          </View>

          <Text style={styles.roomName}>{roomInfo.title}</Text>
          <Text style={styles.detailLine}>
            📍 <Text style={styles.boldText}>Địa chỉ chính xác:</Text> {roomInfo.exact_address}
          </Text>
          <Text style={styles.detailLine}>
            👤 <Text style={styles.boldText}>Chủ nhà:</Text> {landlordInfo?.full_name || 'Chủ trọ'}
          </Text>
          <Text style={styles.detailLine}>
            📞 <Text style={styles.boldText}>Số điện thoại:</Text> {landlordInfo?.phone || 'Cập nhật sau'}
          </Text>
        </View>

        {/* THẺ 2: HÓA ĐƠN & MÃ VIETQR ĐỘNG */}
        {pendingInvoice ? (
          <View style={styles.invoiceCard}>
            <View style={styles.invoiceHeader}>
              <Text style={styles.invoiceTitle}>💳 Hóa Đơn Tháng {pendingInvoice.billing_month}</Text>
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingBadgeText}>Chờ thanh toán</Text>
              </View>
            </View>

            <View style={styles.invoiceSummary}>
              <View style={styles.sumRow}>
                <Text style={styles.sumLabel}>Tiền phòng:</Text>
                <Text style={styles.sumVal}>{pendingInvoice.room_fee.toLocaleString('vi-VN')} đ</Text>
              </View>
              <View style={styles.sumRow}>
                <Text style={styles.sumLabel}>Tiền điện/nước:</Text>
                <Text style={styles.sumVal}>{pendingInvoice.utility_fee.toLocaleString('vi-VN')} đ</Text>
              </View>
              <View style={styles.sumRow}>
                <Text style={styles.sumLabel}>Phí nền tảng (1%):</Text>
                <Text style={styles.sumVal}>{pendingInvoice.platform_fee.toLocaleString('vi-VN')} đ</Text>
              </View>
              <View style={[styles.sumRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Tổng thanh toán:</Text>
                <Text style={styles.totalVal}>{pendingInvoice.total_amount.toLocaleString('vi-VN')} đ</Text>
              </View>
            </View>

            {/* Hiển thị QR Code chuyển khoản */}
            {qrUrl ? (
              <View style={styles.qrBox}>
                <Text style={styles.qrInstruction}>Quét mã QR qua App Ngân hàng để thanh toán tự động:</Text>
                <Image source={{ uri: qrUrl }} style={styles.qrImage} />
                <Text style={styles.transferContent}>
                  Nội dung CK bắt buộc: <Text style={styles.boldCode}>{pendingInvoice.payment_code}</Text>
                </Text>
                <Text style={styles.qrNote}>Hệ thống tự động gạch nợ sau 30 giây khi chuyển khoản thành công.</Text>
              </View>
            ) : (
              <View style={styles.noBankBox}>
                <Ionicons name="alert-circle-outline" size={20} color="#F59E0B" />
                <Text style={styles.noBankText}>Chủ nhà đang cập nhật tài khoản nhận tiền. Vui lòng liên hệ trực tiếp SĐT trên.</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.paidAllBox}>
            <Ionicons name="checkmark-circle" size={40} color="#10B981" />
            <Text style={styles.paidAllText}>Tuyệt vời! Bạn đã hoàn thành tất cả hóa đơn trong kỳ.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 10, color: '#4B5563', fontSize: 14 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginTop: 12 },
  emptySubtitle: { fontSize: 13, color: '#6B7280', textAlign: 'center', marginTop: 6, lineHeight: 18 },
  header: { marginBottom: 16 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  headerSubtitle: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  unlockedCard: { backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#A7F3D0', borderRadius: 14, padding: 16, marginBottom: 16 },
  unlockedHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  unlockedTitle: { color: '#065F46', fontWeight: 'bold', fontSize: 13 },
  roomName: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 8 },
  detailLine: { fontSize: 14, color: '#374151', marginBottom: 6, lineHeight: 20 },
  boldText: { fontWeight: '600', color: '#111827' },
  invoiceCard: { backgroundColor: '#FFF', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#E5E7EB', elevation: 2 },
  invoiceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  invoiceTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  pendingBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  pendingBadgeText: { color: '#D97706', fontSize: 11, fontWeight: 'bold' },
  invoiceSummary: { backgroundColor: '#F9FAFB', padding: 12, borderRadius: 10, marginBottom: 16 },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  sumLabel: { fontSize: 13, color: '#6B7280' },
  sumVal: { fontSize: 13, fontWeight: '500', color: '#111827' },
  totalRow: { borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 8, marginTop: 4 },
  totalLabel: { fontSize: 14, fontWeight: 'bold', color: '#111827' },
  totalVal: { fontSize: 15, fontWeight: 'bold', color: '#10B981' },
  qrBox: { alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 16 },
  qrInstruction: { fontSize: 13, color: '#374151', textAlign: 'center', marginBottom: 12, fontWeight: '500' },
  qrImage: { width: 220, height: 220, resizeMode: 'contain', marginBottom: 12 },
  transferContent: { fontSize: 13, color: '#111827', textAlign: 'center', marginBottom: 6 },
  boldCode: { fontWeight: 'bold', color: '#EF4444', backgroundColor: '#FEE2E2', paddingHorizontal: 6, paddingVertical: 2 },
  qrNote: { fontSize: 11, color: '#9CA3AF', textAlign: 'center', fontStyle: 'italic' },
  noBankBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', padding: 12, borderRadius: 10, gap: 8 },
  noBankText: { flex: 1, fontSize: 12, color: '#92400E', lineHeight: 18 },
  paidAllBox: { backgroundColor: '#FFF', padding: 24, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  paidAllText: { fontSize: 14, color: '#065F46', fontWeight: '600', textAlign: 'center', marginTop: 10 },
});