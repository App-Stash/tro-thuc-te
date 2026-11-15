import { supabase } from '../../../services/supabase';
import { RecordedVideoItem } from '../components/MultiVideoRecorder';

interface CreateListingPayload {
  landlordId: string;
  title: string;
  publicLocationText: string; // VD: "Khu vực Cầu Giấy, gần ĐH Quốc Gia"
  exactAddress: string;       // VD: "Số 15 ngõ 20 Xuân Thủy" (Sẽ bị ẩn cho đến khi ký hợp đồng)
  priceMonthly: number;
  depositAmount: number;
  electricityPrice: number;
  waterPrice: number;
  videos: RecordedVideoItem[];
}

export async function createRoomListing(payload: CreateListingPayload) {
  try {
    // 1. Tạo bản ghi phòng trước (Trạng thái mặc định: 'available')
    const { data: roomData, error: roomError } = await supabase
      .from('rooms')
      .insert({
        landlord_id: payload.landlordId,
        title: payload.title,
        public_location_text: payload.publicLocationText,
        exact_address: payload.exactAddress,
        is_address_hidden: true, // Bảo mật 2 lớp: Ẩn địa chỉ & SĐT
        price_monthly: payload.priceMonthly,
        deposit_amount: payload.depositAmount,
        electricity_price: payload.electricityPrice,
        water_price: payload.waterPrice,
        status: 'available',
      })
      .select()
      .single();

    if (roomError || !roomData) throw roomError;

    const roomId = roomData.id;

    // 2. Upload từng video của 4 khu vực lên Storage và lưu link vào room_videos
    for (const v of payload.videos) {
      const fileExt = v.uri.split('.').pop() || 'mp4';
      const fileName = `${roomId}/${v.sectionKey}_${Date.now()}.${fileExt}`;

      // Đọc file từ thiết bị và chuẩn bị upload (Dùng FormData hoặc Supabase Storage API)
      const formData = new FormData();
      formData.append('file', {
        uri: v.uri,
        name: fileName,
        type: `video/${fileExt}`,
      } as any);

      // Upload lên Supabase Storage (hoặc Cloudflare R2 qua Presigned URL)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('room-videos')
        .upload(fileName, formData);

      if (uploadError) {
        console.error(`Lỗi upload video khu vực ${v.sectionKey}:`, uploadError);
        continue;
      }

      // Lấy Public URL của video
      const { data: publicUrlData } = supabase.storage
        .from('room-videos')
        .getPublicUrl(fileName);

      // Lưu thông tin video vào bảng room_videos kèm tọa độ GPS xác thực
      await supabase.from('room_videos').insert({
        room_id: roomId,
        section_name: v.sectionKey,
        video_url: publicUrlData.publicUrl,
        latitude: v.latitude,
        longitude: v.longitude,
        recorded_at: v.recordedAt,
      });
    }

    return { success: true, roomId };
  } catch (error) {
    console.error('Lỗi tạo phòng:', error);
    return { success: false, error };
  }
}