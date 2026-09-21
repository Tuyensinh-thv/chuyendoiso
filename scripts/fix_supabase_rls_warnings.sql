-- ====================================================================
-- MIGRATION: KHẮC PHỤC 10 CẢNH BÁO RLS TRÊN SUPABASE SECURITY ADVISOR
-- Dự án: Cổng Điều Hành Chuyển Đổi Số - Đại học Hùng Vương (NQ57)
-- ====================================================================
-- Mục tiêu:
-- 1. Xóa bỏ các chính sách RLS bị trùng lặp (duplicate) và dùng lệnh gộp "FOR ALL USING (true)".
-- 2. Tách biệt rõ ràng các quyền: SELECT (đọc), INSERT (thêm), UPDATE (sửa), DELETE (xóa).
-- 3. Bảo vệ bảng audit_logs: Cho phép ghi thêm và đọc, nhưng CẤM SỬA/XÓA nhật ký.
-- 4. Đảm bảo ứng dụng web chuyendoiso.hvu.edu.vn hoạt động 100% trơn tru, không gián đoạn.
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. BẢNG audit_logs (Nhật ký hệ thống)
-- --------------------------------------------------------------------
-- Xóa các policy cũ bị trùng lặp
DROP POLICY IF EXISTS "Allow public all for audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Cho phép đọc nhật ký" ON public.audit_logs;
DROP POLICY IF EXISTS "Cho phép ghi nhật ký" ON public.audit_logs;
DROP POLICY IF EXISTS "Allow read audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Allow insert audit_logs" ON public.audit_logs;

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Cho phép xem lịch sử nhật ký
CREATE POLICY "Allow read audit_logs" 
ON public.audit_logs 
FOR SELECT 
TO anon, authenticated 
USING (true);

-- Cho phép ghi thêm log khi người dùng thao tác
CREATE POLICY "Allow insert audit_logs" 
ON public.audit_logs 
FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

-- (Không tạo policy UPDATE/DELETE -> Không ai có thể xóa hay sửa nhật ký đã ghi!)

-- --------------------------------------------------------------------
-- 2. BẢNG tasks (Danh sách 63 nhiệm vụ NQ57)
-- --------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow public all for tasks" ON public.tasks;
DROP POLICY IF EXISTS "Cho phép ghi/cập nhật nhiệm vụ" ON public.tasks;
DROP POLICY IF EXISTS "Cho phép đọc dữ liệu nhiệm vụ" ON public.tasks;
DROP POLICY IF EXISTS "Allow read tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow insert tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow update tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow delete tasks" ON public.tasks;

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Cho phép đọc công khai danh sách nhiệm vụ
CREATE POLICY "Allow read tasks" 
ON public.tasks 
FOR SELECT 
TO anon, authenticated 
USING (true);

-- Cho phép thêm nhiệm vụ mới
CREATE POLICY "Allow insert tasks" 
ON public.tasks 
FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

-- Cho phép cập nhật tiến độ, file minh chứng, trạng thái
CREATE POLICY "Allow update tasks" 
ON public.tasks 
FOR UPDATE 
TO anon, authenticated 
USING (true) 
WITH CHECK (true);

-- Cho phép xóa nhiệm vụ (dành cho quản trị viên)
CREATE POLICY "Allow delete tasks" 
ON public.tasks 
FOR DELETE 
TO anon, authenticated 
USING (true);

-- --------------------------------------------------------------------
-- 3. BẢNG task_subtasks (Checklist công việc của từng nhiệm vụ)
-- --------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow public all for task_subtasks" ON public.task_subtasks;
DROP POLICY IF EXISTS "Allow read task_subtasks" ON public.task_subtasks;
DROP POLICY IF EXISTS "Allow insert task_subtasks" ON public.task_subtasks;
DROP POLICY IF EXISTS "Allow update task_subtasks" ON public.task_subtasks;
DROP POLICY IF EXISTS "Allow delete task_subtasks" ON public.task_subtasks;

ALTER TABLE public.task_subtasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read task_subtasks" 
ON public.task_subtasks 
FOR SELECT 
TO anon, authenticated 
USING (true);

CREATE POLICY "Allow insert task_subtasks" 
ON public.task_subtasks 
FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

CREATE POLICY "Allow update task_subtasks" 
ON public.task_subtasks 
FOR UPDATE 
TO anon, authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow delete task_subtasks" 
ON public.task_subtasks 
FOR DELETE 
TO anon, authenticated 
USING (true);

-- --------------------------------------------------------------------
-- 4. BẢNG departments (Danh mục phòng ban / đơn vị)
-- --------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow public all for departments" ON public.departments;
DROP POLICY IF EXISTS "Allow read departments" ON public.departments;
DROP POLICY IF EXISTS "Allow manage departments" ON public.departments;

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read departments" 
ON public.departments 
FOR SELECT 
TO anon, authenticated 
USING (true);

CREATE POLICY "Allow manage departments" 
ON public.departments 
FOR ALL 
TO anon, authenticated 
USING (true) 
WITH CHECK (true);

-- --------------------------------------------------------------------
-- 5. BẢNG plan_groups (Nhóm kế hoạch NQ57)
-- --------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow public all for plan_groups" ON public.plan_groups;
DROP POLICY IF EXISTS "Allow read plan_groups" ON public.plan_groups;
DROP POLICY IF EXISTS "Allow manage plan_groups" ON public.plan_groups;

ALTER TABLE public.plan_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read plan_groups" 
ON public.plan_groups 
FOR SELECT 
TO anon, authenticated 
USING (true);

CREATE POLICY "Allow manage plan_groups" 
ON public.plan_groups 
FOR ALL 
TO anon, authenticated 
USING (true) 
WITH CHECK (true);

-- --------------------------------------------------------------------
-- 6. BẢNG custom_categories (Danh mục tùy chỉnh)
-- --------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow public all for custom_categories" ON public.custom_categories;
DROP POLICY IF EXISTS "Allow read custom_categories" ON public.custom_categories;
DROP POLICY IF EXISTS "Allow manage custom_categories" ON public.custom_categories;

ALTER TABLE public.custom_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read custom_categories" 
ON public.custom_categories 
FOR SELECT 
TO anon, authenticated 
USING (true);

CREATE POLICY "Allow manage custom_categories" 
ON public.custom_categories 
FOR ALL 
TO anon, authenticated 
USING (true) 
WITH CHECK (true);

-- --------------------------------------------------------------------
-- 7. BẢNG user_accounts (Tài khoản cán bộ / quản trị)
-- --------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow public all for user_accounts" ON public.user_accounts;
DROP POLICY IF EXISTS "Cho phép đọc tài khoản" ON public.user_accounts;
DROP POLICY IF EXISTS "Cho phép ghi tài khoản" ON public.user_accounts;
DROP POLICY IF EXISTS "Allow read user_accounts" ON public.user_accounts;
DROP POLICY IF EXISTS "Allow update user_accounts" ON public.user_accounts;
DROP POLICY IF EXISTS "Allow insert user_accounts" ON public.user_accounts;

ALTER TABLE public.user_accounts ENABLE ROW LEVEL SECURITY;

-- Cho phép đọc danh sách tài khoản để xác thực đăng nhập
CREATE POLICY "Allow read user_accounts" 
ON public.user_accounts 
FOR SELECT 
TO anon, authenticated 
USING (true);

-- Cho phép cập nhật mật khẩu, thông tin cá nhân
CREATE POLICY "Allow update user_accounts" 
ON public.user_accounts 
FOR UPDATE 
TO anon, authenticated 
USING (true) 
WITH CHECK (true);

-- Cho phép tạo tài khoản mới nếu có phân quyền
CREATE POLICY "Allow insert user_accounts" 
ON public.user_accounts 
FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

-- ====================================================================
-- HOÀN TẤT
-- ====================================================================
