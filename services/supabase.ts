import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

// Thay thế bằng Project URL và Anon Key thực tế từ dự án Supabase của bạn
const SUPABASE_URL = 'https://your-project-id.supabase.co';
const SUPABASE_ANON_KEY = 'your-supabase-anon-key';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});