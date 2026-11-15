import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';

interface RoomDashboardItem {
  id: string;
  title: string;
  public_location_text: string;
  price_monthly: number;
  status: 'available' | 'occupied' | 'expired';
  contracts?: {
    id: string;
    tenant_id: string;
    invoices?: {
      id: string;
      billing_month: string;
      total_amount: number;
      platform_fee: number; // 1% phí nền tảng
      status: 'pending' | 'paid' | 'overdue';
    }[];
  }[];
}

export default function LandlordDashboardScreen() {
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState<RoomDashboardItem[]>([]);

  // ID giả lập chủ nhà (Khớp với ID lúc đăng tin)
  const MOCK_LANDLORD_ID = 'a0000000-0000-0000-0000-000000000001';

  useEffect(() => {
    fetchLandlordRooms();
  }, []);

  const fetchLandlordRooms = async () => {
    setLoading(true);
    // Lấy danh sách phòng của chủ nhà kèm hợp đồng và hóa đơn mới nhất
    const { data, error } = await supabase
      .from('rooms')
      .select(`
        id,
        title,
        public_location_text,
        price_monthly,
        status,
        contracts (
          id,
          tenant_id,
          invoices (
            id,
            billing_month,
            total_amount,
            platform_fee,
            status
          )
        )
      `)
      .eq('landlord_id', MOCK_LANDLORD_ID);

    if (error) {
      console.error('Lỗi tải phòng của chủ nhà:', error);
    } else if (data) {
      setRooms(data as any);
    }
    setLoading(false);
  };

  const handleCreateNewInvoice = async (contractId: string, monthlyRent: number) => {
    const platformFee = monthlyRent * 0.01; // Tự động tính đúng 1% phí nền tảng
    const totalAmount = monthlyRent + 200000; // Giả lập tiền điện nước tạm tính 200k
    const paymentCode = `TRO${contractId.slice(0, 4).toUpperCase()}T${new Date().getMonth() + 2}`;

    const { error } = await supabase.from('invoices').insert({
      contract_id: contractId,
      billing_month: `2026-${String(new Date().getMonth() + 2).padStart(2, '0')}`,
      room_fee: monthlyRent,
      utility_fee: 200000,
      platform_fee: platformFee, // 1% phí nền tảng
      total_amount: totalAmount,
      payment_code: paymentCode,
      status: 'pending',
      due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    });

    if (error) {
      Alert.alert('Lỗi', 'Không thể tạo hóa đơn mới.');
    } else {
      Alert.alert('Thành công! 🚀', 'Đã chốt số điện nước và gửi mã VietQR tự động cho khách thuê.');
      fetchLandlordRooms();
    }
  };

  if (loading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Đang tải quản lý phòng...</Text>
      </View>
    );
  }

  // Thống kê tổng quan
  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter((r) => r.status === 'occupied').length;
  const availableRooms = totalRooms - occupiedRooms;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>📊 Quản Lý Dãy Trọ</Text>
          <Text style={styles.headerSubtitle}>Theo dõi trạng thái phòng và thu tiền tự động</Text>
        </View>

        {/* THẺ THỐNG KÊ NHANH */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{totalRooms}</Text>
            <Text style={styles.statLabel}>Tổng số phòng</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: '#ECFDF5' }]}>
            <Text style={[styles.statNum, { color: '#059669' }]}>{occupiedRooms}</Text>
            <Text style={styles.statLabel}>Đang có khách (30k/tháng)</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: '#FEF3C7' }]}>
            <Text style={[styles.statNum, { color: '#D97706' }]}>{availableRooms}</Text>
            <Text style={styles.statLabel}>Phòng trống (Miễn phí)</Text>
          </View>
        </View>

        {/* DANH SÁCH PHÒNG */}
        <Text style={styles.sectionTitle}>Danh Sách Phòng Trọ ({totalRooms})</Text>

        {rooms.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="home-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyText}>Bạn chưa đăng phòng trọ nào.</Text>
          </View>
        ) : (
          rooms.map((room) => {
            const isOccupied = room.status === 'occupied';
            const activeContract = room.contracts?.[0];
            const latestInvoice = activeContract?.invoices?.[0];

            return (
              <View key={room.id} style={styles.roomCard}>
                <View style={styles.roomHeader}>
                  <Text style={styles.roomName}>{room.title}</Text>
                  <View style={[styles.statusBadge, isOccupied ? styles.badgeOccupied : styles.badgeAvailable]}>
                    <Text style={[styles.statusText, isOccupied ? styles.textOccupied : styles.textAvailable]}>
                      {isOccupied ? '🟢 Đang thuê' : '🟡 Phòng trống'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.roomLocation}>📍 {room.public_location_text}</Text>
                <Text style={styles.roomPrice}>Giá thuê: {room.price_monthly.toLocaleString('vi-VN')} đ/tháng</Text>

                {/* Nếu phòng đang có khách, hiển thị thông tin hóa đơn & phí 1% */}
                {isOccupied && activeContract && (
                  <View style={styles.invoiceSection}>
                    <Text style={styles.invoiceSecTitle}>Hóa đơn gần nhất:</Text>
                    {latestInvoice ? (
                      <View style={styles.invInfoRow}>
                        <View>
                          <Text style={styles.invMonth}>Tháng: {latestInvoice.billing_month}</Text>
                          <Text style={styles.invFee}>
                            Phí nền tảng (1%): <Text style={styles.boldGreen}>{latestInvoice.platform_fee.toLocaleString('vi-VN')} đ</Text>
                          </Text>
                        </View>
                        <View style={styles.invStatusBox}>
                          <Text
                            style={[
                              styles.invStatusText,
                              latestInvoice.status === 'paid' ? styles.textPaid : styles.textPending,
                            ]}
                          >
                            {latestInvoice.status === 'paid' ? '✅ Đã đóng' : '⏳ Chờ đóng'}
                          </Text>
                        </View>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.createInvBtn}
                        onPress={() => handleCreateNewInvoice(activeContract.id, room.price_monthly)}
                      >
                        <Text style={styles.createInvText}>+ Tạo hóa đơn & Mã QR tháng mới</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
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
  scrollContent: { padding: 16, paddingBottom: 40 },
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#4B5563', fontSize: 14 },
  header: { marginBottom: 16 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  headerSubtitle: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statBox: { flex: 1, backgroundColor: '#FFF', padding: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  statNum: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 2 },
  statLabel: { fontSize: 11, color: '#6B7280', textAlign: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 12 },
  emptyBox: { alignItems: 'center', justifyContent: 'center', marginTop: 40 },
  emptyText: { color: '#6B7280', marginTop: 8, fontSize: 14 },
  roomCard: { backgroundColor: '#FFF', borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E5E7EB', elevation: 2 },
  roomHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  roomName: { fontSize: 16, fontWeight: 'bold', color: '#111827', flex: 1, marginRight: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  badgeAvailable: { backgroundColor: '#FEF3C7' },
  badgeOccupied: { backgroundColor: '#ECFDF5' },
  statusText: { fontSize: 11, fontWeight: 'bold' },
  textAvailable: { color: '#D97706' },
  textOccupied: { color: '#059669' },
  roomLocation: { fontSize: 13, color: '#4B5563', marginBottom: 4 },
  roomPrice: { fontSize: 13, fontWeight: '600', color: '#10B981', marginBottom: 12 },
  invoiceSection: { borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 12, marginTop: 4 },
  invoiceSecTitle: { fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 8 },
  invInfoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F9FAFB', padding: 10, borderRadius: 8 },
  invMonth: { fontSize: 13, color: '#111827', fontWeight: '500' },
  invFee: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  boldGreen: { fontWeight: 'bold', color: '#10B981' },
  invStatusBox: { paddingHorizontal: 8, paddingVertical: 4 },
  invStatusText: { fontSize: 12, fontWeight: 'bold' },
  textPaid: { color: '#10B981' },
  textPending: { color: '#D97706' },
  createInvBtn: { backgroundColor: '#3B82F6', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  createInvText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
});