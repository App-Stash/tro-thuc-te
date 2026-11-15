import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { supabase } from '../../services/supabase';
import { activateContractAndUnlockInfo } from '../../features/contract/services/contractService';

const { width } = Dimensions.get('window');

interface RoomVideo {
  id: string;
  section_name: 'bedroom' | 'kitchen' | 'bathroom' | 'living_area';
  video_url: string;
  latitude: number;
  longitude: number;
  recorded_at: string;
}

interface RoomItem {
  id: string;
  title: string;
  public_location_text: string;
  price_monthly: number;
  deposit_amount: number;
  electricity_price: number;
  water_price: number;
  is_address_hidden: boolean;
  exact_address?: string;
  landlord_id: string;
  room_videos: RoomVideo[];
  users?: { phone: string; full_name: string };
}

export default function TenantFeedScreen() {
  const [rooms, setRooms] = useState<RoomItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTabMap, setActiveTabMap] = useState<Record<string, 'bedroom' | 'kitchen' | 'bathroom' | 'living_area'>>({});
  
  // ID giả lập người thuê (Sau khi làm auth sẽ lấy từ Supabase Auth session)
  const MOCK_TENANT_ID = 'b0000000-0000-0000-0000-000000000002';

  useEffect(() => {
    fetchAvailableRooms();
  }, []);

  const fetchAvailableRooms = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('rooms')
      .select(`
        *,
        room_videos (*),
        users:landlord_id (full_name, phone)
      `)
      .eq('status', 'available');

    if (error) {
      console.error('Lỗi tải danh sách phòng:', error);
    } else if (data) {
      setRooms(data as any);
      // Đặt tab mặc định cho mỗi phòng là 'bedroom'
      const initialTabs: Record<string, any> = {};
      data.forEach((r: any) => {
        initialTabs[r.id] = 'bedroom';
      });
      setActiveTabMap(initialTabs);
    }
    setLoading(false);
  };

  const handleSelectTab = (roomId: string, section: 'bedroom' | 'kitchen' | 'bathroom' | 'living_area') => {
    setActiveTabMap((prev) => ({ ...prev, [roomId]: section }));
  };

  const handleRequestRent = async (room: RoomItem) => {
    Alert.alert(
      'Xác nhận thuê phòng',
      `Bạn có chắc chắn muốn thuê phòng "${room.title}" với giá ${room.price_monthly.toLocaleString('vi-VN')}đ/tháng? Hệ thống sẽ tạo hợp đồng điện tử và mở khóa số điện thoại, địa chỉ chính xác của chủ nhà.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đồng ý & Ký hợp đồng',
          onPress: async () => {
            const res = await activateContractAndUnlockInfo(room.id, MOCK_TENANT_ID, room.landlord_id, room.price_monthly);
            if (res.success) {
              Alert.alert('Thành công! 🎉', 'Hợp đồng đã kích hoạt. Thông tin liên hệ và địa chỉ chi tiết của chủ nhà đã được mở khóa trong mục "Phòng của tôi".');
              fetchAvailableRooms(); // Tải lại danh sách
            } else {
              Alert.alert('Lỗi', 'Không thể kích hoạt hợp đồng. Vui lòng thử lại.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Đang tải danh sách phòng xác thực GPS...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🏠 Khám Phá Trọ Thực Tế</Text>
        <Text style={styles.headerSubtitle}>Cam kết video thực tế 100% kèm GPS • Không môi giới ảo</Text>
      </View>

      <ScrollView contentContainerStyle={styles.feedScroll}>
        {rooms.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="home-outline-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyText}>Hiện chưa có phòng trọ nào được đăng.</Text>
          </View>
        ) : (
          rooms.map((room) => {
            const currentTab = activeTabMap[room.id] || 'bedroom';
            const matchedVideo = room.room_videos?.find((v) => v.section_name === currentTab);

            return (
              <RoomCard
                key={room.id}
                room={room}
                currentTab={currentTab}
                matchedVideo={matchedVideo}
                onSelectTab={(section) => handleSelectTab(room.id, section)}
                onRequestRent={() => handleRequestRent(room)}
              />
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// Component con hiển thị từng phòng trọ & trình phát video theo tab
function RoomCard({ room, currentTab, matchedVideo, onSelectTab, onRequestRent }: any) {
  const player = useVideoPlayer(matchedVideo?.video_url ?? '', (p) => {
    p.loop = true;
    if (matchedVideo?.video_url) p.play();
  });

  const sections = [
    { key: 'bedroom', label: '🛏️ Phòng ngủ' },
    { key: 'kitchen', label: '🍳 Bếp' },
    { key: 'bathroom', label: '🚿 Vệ sinh' },
    { key: 'living_area', label: '🛋️ Sinh hoạt' },
  ];

  return (
    <View style={styles.card}>
      {/* Trình phát video */}
      <View style={styles.videoContainer}>
        {matchedVideo ? (
          <VideoView style={styles.videoPlayer} player={player} nativeControls={true} />
        ) : (
          <View style={styles.noVideoBox}>
            <Text style={styles.noVideoText}>Chưa có video khu vực này</Text>
          </View>
        )}

        {/* Nhãn GPS xác thực */}
        {matchedVideo && (
          <View style={styles.gpsBadge}>
            <Text style={styles.gpsBadgeText}>
              📍 GPS: {matchedVideo.latitude.toFixed(4)}, {matchedVideo.longitude.toFixed(4)}
            </Text>
          </View>
        )}
      </View>

      {/* Thanh chọn Tab khu vực video */}
      <View style={styles.tabsRow}>
        {sections.map((sec) => {
          const isActive = currentTab === sec.key;
          const hasVideo = room.room_videos?.some((v: any) => v.section_name === sec.key);
          return (
            <TouchableOpacity
              key={sec.key}
              style={[styles.tabBtn, isActive && styles.tabBtnActive, !hasVideo && styles.tabDisabled]}
              onPress={() => onSelectTab(sec.key)}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{sec.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Thông tin phòng */}
      <View style={styles.cardBody}>
        <Text style={styles.roomTitle}>{room.title}</Text>
        <Text style={styles.locationText}>📍 {room.public_location_text}</Text>

        <View style={styles.priceRow}>
          <View>
            <Text style={styles.priceLabel}>Giá thuê hàng tháng</Text>
            <Text style={styles.priceValue}>{room.price_monthly.toLocaleString('vi-VN')} đ</Text>
          </View>
          <View>
            <Text style={styles.priceLabel}>Tiền cọc</Text>
            <Text style={styles.depositValue}>{room.deposit_amount.toLocaleString('vi-VN')} đ</Text>
          </View>
        </View>

        <View style={styles.utilityRow}>
          <Text style={styles.utilityItem}>⚡ Điện: {room.electricity_price}đ/số</Text>
          <Text style={styles.utilityItem}>💧 Nước: {room.water_price.toLocaleString('vi-VN')}đ/tháng</Text>
        </View>

        <TouchableOpacity style={styles.rentBtn} onPress={onRequestRent}>
          <Ionicons name="key-outline" size={18} color="#FFF" />
          <Text style={styles.rentBtnText}>Yêu cầu thuê & Mở khóa SĐT chủ nhà</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#4B5563', fontSize: 14 },
  header: { padding: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  headerSubtitle: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  feedScroll: { padding: 16, paddingBottom: 40 },
  emptyBox: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  emptyText: { color: '#6B7280', marginTop: 10, fontSize: 15 },
  card: { backgroundColor: '#FFF', borderRadius: 16, overflow: 'hidden', marginBottom: 20, borderWidth: 1, borderColor: '#E5E7EB', elevation: 2 },
  videoContainer: { width: '100%', height: 260, backgroundColor: '#000' },
  videoPlayer: { width: '100%', height: '100%' },
  noVideoBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  noVideoText: { color: '#9CA3AF', fontSize: 13 },
  gpsBadge: { position: 'absolute', top: 12, left: 12, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  gpsBadgeText: { color: '#10B981', fontSize: 11, fontWeight: 'bold', fontFamily: 'monospace' },
  tabsRow: { flexDirection: 'row', backgroundColor: '#F9FAFB', padding: 8, gap: 6, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  tabBtn: { flex: 1, paddingVertical: 8, paddingHorizontal: 4, borderRadius: 8, alignItems: 'center', backgroundColor: '#E5E7EB' },
  tabBtnActive: { backgroundColor: '#10B981' },
  tabDisabled: { opacity: 0.5 },
  tabText: { fontSize: 11, fontWeight: '600', color: '#4B5563' },
  tabTextActive: { color: '#FFF' },
  cardBody: { padding: 16 },
  roomTitle: { fontSize: 17, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  locationText: { fontSize: 13, color: '#4B5563', marginBottom: 12 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#F9FAFB', padding: 12, borderRadius: 10, marginBottom: 12 },
  priceLabel: { fontSize: 11, color: '#6B7280' },
  priceValue: { fontSize: 15, fontWeight: 'bold', color: '#10B981', marginTop: 2 },
  depositValue: { fontSize: 15, fontWeight: 'bold', color: '#374151', marginTop: 2 },
  utilityRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, paddingHorizontal: 4 },
  utilityItem: { fontSize: 12, color: '#6B7280' },
  rentBtn: { backgroundColor: '#3B82F6', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 14, borderRadius: 12, gap: 8 },
  rentBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
});