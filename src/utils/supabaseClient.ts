import { createClient } from '@supabase/supabase-js';

// Đọc cấu hình từ file .env (Vite yêu cầu tiền tố VITE_)
export const SUPABASE_URL: string = 
  import.meta.env.VITE_SUPABASE_URL || '';

export const SUPABASE_ANON_KEY: string = 
  import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('⚠️ [Supabase] Thiếu cấu hình VITE_SUPABASE_URL hoặc VITE_SUPABASE_ANON_KEY trong file .env');
}

export const supabase = createClient(SUPABASE_URL || 'https://placeholder.supabase.co', SUPABASE_ANON_KEY || 'placeholder', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
