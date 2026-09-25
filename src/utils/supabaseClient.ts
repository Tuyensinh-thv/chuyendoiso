import { createClient } from '@supabase/supabase-js';

// Đọc cấu hình từ file .env (Vite yêu cầu tiền tố VITE_), có fallback mặc định cho môi trường build production
export const SUPABASE_URL: string = 
  import.meta.env.VITE_SUPABASE_URL || 'https://xnvclebtjowdeflkkiqc.supabase.co';

export const SUPABASE_ANON_KEY: string = 
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhudmNsZWJ0am93ZGVmbGtraXFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAzMTM3MzEsImV4cCI6MjEwNTg4OTczMX0.1zEnro5kN-ZtynJ3JvgGkLHQ3ZbCkbMbXg9k77PMxY0';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
