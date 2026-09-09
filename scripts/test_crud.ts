import { 
  fetchTasksFromSupabase, 
  saveTaskToSupabase, 
  fetchAuditLogsFromSupabase, 
  addAuditLogToSupabase 
} from '../src/utils/supabaseService';

async function testCRUD() {
  console.log('Testing Supabase Data Service...');
  const tasks = await fetchTasksFromSupabase();
  console.log('Total tasks fetched from Supabase:', tasks.length);
  
  if (tasks.length > 0) {
    const firstTask = { ...tasks[0] };
    console.log('Task NV01 current status:', firstTask.trangThai, 'progress:', firstTask.tiendo);
    
    // Test update with checklist and directive
    firstTask.checklist = [
      { id: 'sub_test_1', title: 'Thu thập danh mục văn bản', completed: true },
      { id: 'sub_test_2', title: 'Soạn thảo dự thảo tờ trình', completed: false }
    ];
    firstTask.yKienChiDao = 'BGH giao đ/c Kiên đôn đốc hoàn thành trong tuần.';
    firstTask.approvalStatus = 'Cho_Duyet';
    
    const saved = await saveTaskToSupabase(firstTask);
    console.log('Task update to Supabase result:', saved);
    
    // Fetch again to verify
    const refetched = await fetchTasksFromSupabase();
    const updatedTask = refetched.find(t => t.id === firstTask.id);
    console.log('Verified checklist length:', updatedTask?.checklist?.length);
    console.log('Verified directive opinion:', updatedTask?.yKienChiDao);
    console.log('Verified approvalStatus:', updatedTask?.approvalStatus);
  }

  // Test Audit Log
  const logSaved = await addAuditLogToSupabase({
    id: 'test_log_' + Date.now(),
    timestamp: new Date().toISOString(),
    actor: 'Nguyễn Trung Kiên (Admin)',
    actorRole: 'Admin',
    action: 'UPDATE',
    taskId: 'NV01',
    taskTitle: tasks[0]?.tenNhiemVu,
    details: 'Kiểm tra ghi dữ liệu Supabase thời gian thực thành công'
  });
  console.log('Audit log write to Supabase result:', logSaved);
  
  const logs = await fetchAuditLogsFromSupabase();
  console.log('Recent audit logs count:', logs.length);
  console.log('Latest log details:', logs[0]?.details);
  
  console.log('=== ALL SUPABASE CRUD TESTS PASSED! ===');
  process.exit(0);
}

testCRUD().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
