export type VideoSectionKey = 'bedroom' | 'kitchen' | 'bathroom' | 'living_area';

export interface RoomVideo {
  id: string;
  room_id: string;
  section_name: VideoSectionKey;
  video_url: string;
  latitude: number;
  longitude: number;
  recorded_at: string;
}

export interface Room {
  id: string;
  landlord_id: string;
  title: string;
  public_location_text: string;
  exact_address: string;
  is_address_hidden: boolean;
  price_monthly: number;
  deposit_amount: number;
  electricity_price: number;
  water_price: number;
  status: 'available' | 'occupied' | 'expired';
  room_videos?: RoomVideo[];
}

export interface Contract {
  id: string;
  room_id: string;
  landlord_id: string;
  tenant_id: string;
  start_date: string;
  end_date: string;
  deposit_status: 'unpaid' | 'paid';
  contract_terms: string;
}

export interface Invoice {
  id: string;
  contract_id: string;
  billing_month: string;
  room_fee: number;
  utility_fee: number;
  platform_fee: number; // 1% phí nền tảng
  total_amount: number;
  payment_code: string;
  status: 'pending' | 'paid' | 'overdue';
  paid_at?: string;
}