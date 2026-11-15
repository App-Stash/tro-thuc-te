import { supabase } from '../../../services/supabase';

export async function activateContractAndUnlockInfo(roomId: string, tenantId: string, landlordId: string, monthlyRent: number) {
  try {
    // 1. Tạo hợp đồng điện tử tự động
    const { data: contract, error: contractErr } = await supabase
      .from('contracts')
      .insert({
        room_id: roomId,
        landlord_id: landlordId,
        tenant_id: tenantId,
        start_date: new Date().toISOString(),
        end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(), // Hợp đồng 1 năm
        deposit_status: 'unpaid',
        contract_terms: 'Hợp đồng thuê nhà chuẩn giữa Chủ nhà và Người thuê qua nền tảng số...',
        tenant_agreed: true,
        landlord_agreed: true,
      })
      .select()
      .single();

    if (contractErr) throw contractErr;

    // 2. Chuyển trạng thái phòng sang 'occupied' (Đang thuê)
    await supabase
      .from('rooms')
      .update({ status: 'occupied', is_address_hidden: false }) // 🔓 Mở khóa địa chỉ chính xác
      .eq('id', roomId);

    // 3. Khởi tạo hóa đơn tháng đầu tiên (Tự động tính đúng 1% phí nền tảng)
    const platformFee = monthlyRent * 0.01; // Phí 1% giá thuê phòng
    const paymentCode = `TRO${roomId.slice(0, 4).toUpperCase()}T${new Date().getMonth() + 1}`;

    await supabase.from('invoices').insert({
      contract_id: contract.id,
      billing_month: new Date().toISOString().slice(0, 7), // VD: '2026-11'
      room_fee: monthlyRent,
      utility_fee: 0, // Cập nhật sau khi có số điện nước
      platform_fee: platformFee, // 1% giá thuê phòng
      total_amount: monthlyRent + platformFee,
      payment_code: paymentCode,
      status: 'pending',
      due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // Hạn 3 ngày
    });

    return { success: true, contractId: contract.id };
  } catch (error) {
    console.error('Lỗi kích hoạt hợp đồng:', error);
    return { success: false, error };
  }
}
