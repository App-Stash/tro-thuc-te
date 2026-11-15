import { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { activateContractAndUnlockInfo } from '../services/contractService';

export function useContractUnlock() {
  const router = useRouter();
  const [activating, setActivating] = useState(false);

  const requestUnlockRoom = (
    roomId: string,
    tenantId: string,
    landlordId: string,
    monthlyRent: number,
    roomTitle: string
  ) => {
    Alert.alert(
      'Xác nhận thuê phòng & Mở khóa liên hệ',
      `Bạn muốn chốt thuê "${roomTitle}" với giá ${monthlyRent.toLocaleString('vi-VN')} đ/tháng? Hệ thống sẽ kích hoạt hợp đồng điện tử và hiển thị SĐT + Địa chỉ chính xác của chủ nhà.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đồng ý thuê',
          onPress: async () => {
            setActivating(true);
            const res = await activateContractAndUnlockInfo(roomId, tenantId, landlordId, monthlyRent);
            setActivating(false);

            if (res.success) {
              Alert.alert(
                'Đã mở khóa thành công! 🔓',
                'Bạn có thể xem địa chỉ chính xác, SĐT chủ nhà và quét mã VietQR tại mục Hợp đồng.',
                [{ text: 'Xem hợp đồng ngay', onPress: () => router.push('/(tenant)/my-contract') }]
              );
            } else {
              Alert.alert('Lỗi', 'Không thể kích hoạt hợp đồng lúc này.');
            }
          },
        },
      ]
    );
  };

  return {
    activating,
    requestUnlockRoom,
  };
}