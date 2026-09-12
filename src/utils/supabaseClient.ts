import { createClient } from '@supabase/supabase-js';

// Đọc cấu hình từ file .env (Vite yêu cầu tiền tố VITE_), có fallback mặc định cho môi trường build production
export const SUPABASE_URL: string = 
  import.meta.env.VITE_SUPABASE_URL || 'https://whzzmrjoztjcllxmaztk.supabase.co';

export const SUPABASE_ANON_KEY: string = 
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndoenptcmpvenRqY2xseG1henRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5MTI5NjksImV4cCI6MjEwNDQ4ODk2OX0.nnPYuVeLo5ImuDdJeSOGrczwsluXOJ_BqMAo3Zj3Wws';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
