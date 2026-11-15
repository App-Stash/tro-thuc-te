import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MultiVideoRecorder, { RecordedVideoItem } from '../../features/listing/components/MultiVideoRecorder';
import { createRoomListing } from '../../features/listing/services/listingService';

export default function CreateListingScreen() {
  const [step, setStep] = useState<'form' | 'recording'>('form');
  const [loading, setLoading] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [publicLocationText, setPublicLocationText] = useState(''); // VD: "Gần ĐH Bách Khoa, Quận 10"
  const [exactAddress, setExactAddress] = useState('');             // VD: "Số 15/2 Tô Hiến Thành" (Bảo mật)
  const [priceMonthly, setPriceMonthly] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [electricityPrice, setElectricityPrice] = useState('3500');
  const [waterPrice, setWaterPrice] = useState('100000');

  // Dữ liệu 4 video sau khi quay xong
  const [recordedVideos, setRecordedVideos] = useState<RecordedVideoItem[]>([]);

  // ID giả lập chủ nhà (Sau khi làm auth sẽ lấy từ Supabase Auth session)
  const MOCK_LANDLORD_ID = 'a0000000-0000-0000-0000-000000000001';

  const handleStartRecording = () => {
    if (!title || !publicLocationText || !exactAddress || !priceMonthly || !depositAmount) {
      Alert.alert('Thiếu thông tin', 'Vui lòng điền đầy đủ tiêu đề, vị trí và giá phòng trước khi quay video.');
      return;
    }
    setStep('recording');
  };

  const handleCompleteAllVideos = async (videos: RecordedVideoItem[]) => {
    setRecordedVideos(videos);
    setStep('form');
    
    // Tiến hành gửi lên Supabase
    setLoading(true);
    const result = await createRoomListing({
      landlordId: MOCK_LANDLORD_ID,
      title,
      publicLocationText,
      exactAddress,
      priceMonthly: parseInt(priceMonthly),
      depositAmount: parseInt(depositAmount),
      electricityPrice: parseInt(electricityPrice),
      waterPrice: parseInt(waterPrice),
      videos,
    });

    setLoading(false);

    if (result.success) {
      Alert.alert(
        'Thành công! 🎉', 
        'Đã đăng phòng trọ và xác thực video GPS thành công. Phòng đang ở trạng thái sẵn sàng hiển thị cho người thuê.',
        [{ text: 'OK', onPress: () => { /* Reset form hoặc chuyển hướng */ } }]
      );
    } else {
      Alert.alert('Lỗi', 'Không thể lưu thông tin phòng lên hệ thống. Vui lòng thử lại.');
    }
  };

  if (step === 'recording') {
    return (
      <MultiVideoRecorder
        onCancel={() => setStep('form')}
        onCompleteAll={handleCompleteAllVideos}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.headerTitle}>🏠 Đăng Tin Cho Thuê Phòng</Text>
        <Text style={styles.headerSubtitle}>Quay video xác thực thực tế để tăng uy tín với người thuê</Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Tiêu đề phòng trọ</Text>
          <TextInput
            style={styles.input}
            placeholder="VD: Phòng cao cấp thoáng mát gần ĐH Bách Khoa"
            placeholderTextColor="#9CA3AF"
            value={title}
            onChangeText={setTitle}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Vị trí công khai (Hiển thị cho mọi người)</Text>
          <TextInput
            style={styles.input}
            placeholder="VD: Gần cổng chính ĐH Bách Khoa, Quận 10"
            placeholderTextColor="#9CA3AF"
            value={publicLocationText}
            onChangeText={setPublicLocationText}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Địa chỉ chính xác (🔒 Sẽ bị ẩn cho đến khi ký hợp đồng)</Text>
          <TextInput
            style={styles.input}
            placeholder="VD: Số 15/2 đường Tô Hiến Thành, Phường 15"
            placeholderTextColor="#9CA3AF"
            value={exactAddress}
            onChangeText={setExactAddress}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={styles.label}>Giá thuê (VNĐ/tháng)</Text>
            <TextInput
              style={styles.input}
              placeholder="VD: 3000000"
              keyboardType="numeric"
              placeholderTextColor="#9CA3AF"
              value={priceMonthly}
              onChangeText={setPriceMonthly}
            />
          </View>
          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={styles.label}>Tiền cọc (VNĐ)</Text>
            <TextInput
              style={styles.input}
              placeholder="VD: 1500000"
              keyboardType="numeric"
              placeholderTextColor="#9CA3AF"
              value={depositAmount}
              onChangeText={setDepositAmount}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={styles.label}>Giá điện (VNĐ/số)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={electricityPrice}
              onChangeText={setElectricityPrice}
            />
          </View>
          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={styles.label}>Giá nước (VNĐ/tháng)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={waterPrice}
              onChangeText={setWaterPrice}
            />
          </View>
        </View>

        {/* Trạng thái video đã quay */}
        <View style={styles.videoStatusBox}>
          <Ionicons name="videocam-outline" size={24} color="#10B981" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.videoStatusTitle}>Xác thực video 4 khu vực</Text>
            <Text style={styles.videoStatusDesc}>
              {recordedVideos.length === 4
                ? '✅ Đã quay đủ 4 video (Phòng ngủ, Bếp, Vệ sinh, Sinh hoạt)'
                : '⚠️ Bắt buộc quay đủ 4 khu vực (Mỗi khu vực ~15-30s kèm GPS)'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleStartRecording}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Ionicons name="camera-reverse-outline" size={20} color="#FFF" />
              <Text style={styles.submitBtnText}>
                {recordedVideos.length === 4 ? 'Quay lại video xác thực' : 'Bắt đầu quay video 4 khu vực'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  headerSubtitle: { fontSize: 13, color: '#6B7280', marginBottom: 24 },
  formGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
  },
  row: { flexDirection: 'row', gap: 12 },
  videoStatusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    padding: 14,
    borderRadius: 12,
    marginVertical: 16,
  },
  videoStatusTitle: { fontWeight: 'bold', color: '#065F46', fontSize: 14 },
  videoStatusDesc: { color: '#047857', fontSize: 12, marginTop: 2 },
  submitBtn: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 10,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  submitBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
});