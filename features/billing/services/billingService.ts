import { supabase } from '../../../services/supabase';

// 1. Hàm tạo link ảnh VietQR động dựa trên STK của Chủ nhà và mã nội dung hóa đơn
export function generateVietQRUrl(bankBin: string, bankAccount: string, amount: number, content: string) {
  // Sử dụng API VietQR công khai (hoặc VietQR chính thức)
  // VD: https://img.vietqr.io/image/970436-123456789-compact2.png?amount=3000000&addInfo=TRO101T11
  return `https://img.vietqr.io/image/${bankBin}-${bankAccount}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(content)}&accountName=CHU%20NHA`;
}

// 2. Hàm xử lý Webhook nhận biến động số dư từ SePay (Giả lập Supabase Edge Function hoặc API Endpoint)
// Khi khách hàng quét QR chuyển khoản, SePay bắn webhook về đây. Hệ thống tự động gạch nợ.
export async function handleSePayWebhook(webhookData: {
  gateway: string;
  transactionDate: string;
  accountNumber: string;
  subAccount: string | null;
  amountIn: number;
  accumulated: number;
  code: string; // Nội dung chuyển khoản (VD: 'TRO101T11')
  transactionContent: string;
  referenceNumber: string;
  id: number;
}) {
  try {
    const transferContent = webhookData.transactionContent.toUpperCase();
    const paidAmount = webhookData.amountIn;

    // Tìm hóa đơn chưa thanh toán dựa trên mã nội dung chuyển khoản (payment_code)
    const { data: invoice, error: invoiceErr } = await supabase
      .from('invoices')
      .select('*, contracts(room_id, landlord_id)')
      .eq('status', 'pending')
      .ilike('payment_code', `%${webhookData.code}%`)
      .single();

    if (invoiceErr || !invoice) {
      return { success: false, message: 'Không tìm thấy hóa đơn khớp với mã chuyển khoản.' };
    }

    // Kiểm tra số tiền thanh toán có khớp với tổng tiền hóa đơn không (room_fee + utility_fee + platform_fee)
    if (paidAmount < invoice.total_amount) {
      return { success: false, message: 'Số tiền chuyển khoản ít hơn tổng hóa đơn.' };
    }

    // 1. Cập nhật trạng thái hóa đơn thành 'paid' (Đã thanh toán)
    const { error: updateInvErr } = await supabase
      .from('invoices')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
      })
      .eq('id', invoice.id);

    if (updateInvErr) throw updateInvErr;

    // 2. Hệ thống tự động ghi nhận doanh thu 1% phí nền tảng (platform_fee) vào quỹ của bạn
    // (Phần còn lại tự động thuộc về Chủ nhà qua tài khoản ngân hàng của họ)
    console.log(`[HỆ THỐNG] Đã gạch nợ thành công hóa đơn ${invoice.payment_code}. Phí 1% thu về: ${invoice.platform_fee}đ`);

    return { success: true, message: 'Gạch nợ tự động thành công!' };
  } catch (error) {
    console.error('Lỗi xử lý SePay Webhook:', error);
    return { success: false, error };
  }
}