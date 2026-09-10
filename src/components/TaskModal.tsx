import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Save, 
  Calendar, 
  User, 
  Building, 
  Paperclip, 
  Upload, 
  ExternalLink, 
  Trash2, 
  Clock, 
  MessageSquareQuote,
  FileText,
  Download,
  Flag,
  Tag,
  CheckSquare,
  Square,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Send,
  MessageSquare,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { 
  TaskNQ57, 
  UserAccount, 
  TaskStatus, 
  EvidenceFile, 
  CustomCategory,
  TaskChecklistItem,
  TaskApprovalStatus,
  TaskDiscussionComment
} from '../types';
import { formatVietnameseDate, formatDeadlineBadge, formatFileSize } from '../utils/dateUtils';
import { getPriorityMeta, getCategoryBadgeClass } from '../utils/storage';
import { DEPARTMENTS } from '../data/initialData';
import { getRolePermissions, isTaskRelatedToUnit } from '../utils/permissions';

interface TaskModalProps {
  task: TaskNQ57 | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveTask: (updatedTask: TaskNQ57) => void;
  onDeleteTask?: (taskId: string) => void;
  onApproveTask?: (taskId: string, status?: TaskApprovalStatus) => void;
  currentUser: UserAccount;
  categories?: CustomCategory[];
  onOpenCategoryManager?: () => void;
  accounts?: UserAccount[];
}

export const TaskModal: React.FC<TaskModalProps> = ({
  task,
  isOpen,
  onClose,
  onSaveTask,
  onDeleteTask,
  onApproveTask,
  currentUser,
  categories = [],
  onOpenCategoryManager,
  accounts = [],
}) => {
  if (!isOpen || !task) return null;

  const [formState, setFormState] = useState<TaskNQ57>({ ...task });
  const [newDirective, setNewDirective] = useState('');
  const [newComment, setNewComment] = useState('');
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  const [externalDriveUrl, setExternalDriveUrl] = useState(task.linkMinhChung || '');
  const [isUploading, setIsUploading] = useState(false);
  const [rightTab, setRightTab] = useState<'checklist' | 'comments'>('checklist');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (task) {
      setFormState({ 
        ...task,
        checklist: task.checklist || [
          { id: 'cl_1', title: 'Xây dựng dự thảo và kế hoạch chi tiết', completed: (task.tiendo || 0) >= 30 },
          { id: 'cl_2', title: 'Họp rà soát và lấy ý kiến các đơn vị phối hợp', completed: (task.tiendo || 0) >= 60 },
          { id: 'cl_3', title: 'Hoàn thiện hồ sơ & minh chứng kiểm thử', completed: (task.tiendo || 0) >= 90 },
          { id: 'cl_4', title: 'Trình Ban Giám hiệu nghiệm thu & ban hành', completed: (task.tiendo || 0) === 100 },
        ],
        approvalStatus: task.approvalStatus || (task.tiendo === 100 ? 'Da_Duyet' : (task.filesMinhChung?.length ? 'Cho_Duyet' : 'Chua_Nop')),
        comments: task.comments || [],
      });
      setExternalDriveUrl(task.linkMinhChung || '');
    }
  }, [task]);

  // Role permissions
  const perms = getRolePermissions(currentUser.vaiTro);
  const canEditCoreContent = perms.canEditTaskContent;
  const canLeadDirect = perms.canDirectLead;
  const canApprove = perms.canApproveTask;
  const canDelete = perms.canDeleteTask;
  const isMyUnitTask = isTaskRelatedToUnit(formState, currentUser.donVi);
  const canEditProgress = perms.canUpdateProgress && (currentUser.vaiTro !== 'Don_Vi' || isMyUnitTask);
  const canEditChecklist = currentUser.vaiTro !== 'Lanh_Dao' && (currentUser.vaiTro !== 'Don_Vi' || isMyUnitTask);

  // Multi-unit parsing
  const chuTriList = (formState.donViChuTri || '').split(/[,;]/).map((s) => s.trim()).filter(Boolean);
  const phoiHopList = (formState.donViPhoiHop || '').split(/[,;]/).map((s) => s.trim()).filter(Boolean);

  const handleAddChuTri = (dept: string) => {
    if (!chuTriList.includes(dept)) {
      const updated = [...chuTriList, dept].join(', ');
      setFormState((prev) => ({ ...prev, donViChuTri: updated, ngayCapNhat: new Date().toISOString() }));
    }
  };

  const handleRemoveChuTri = (dept: string) => {
    const filtered = chuTriList.filter((d) => d !== dept);
    setFormState((prev) => ({ ...prev, donViChuTri: filtered.join(', ') || 'Đơn vị chưa xác định', ngayCapNhat: new Date().toISOString() }));
  };

  const handleAddPhoiHop = (dept: string) => {
    if (!phoiHopList.includes(dept)) {
      const updated = [...phoiHopList, dept].join(', ');
      setFormState((prev) => ({ ...prev, donViPhoiHop: updated, ngayCapNhat: new Date().toISOString() }));
    }
  };

  const handleRemovePhoiHop = (dept: string) => {
    const filtered = phoiHopList.filter((d) => d !== dept);
    setFormState((prev) => ({ ...prev, donViPhoiHop: filtered.join(', '), ngayCapNhat: new Date().toISOString() }));
  };

  const deadlineBadge = formatDeadlineBadge(formState.thoiHan);
  const currentPriorityMeta = getPriorityMeta(formState.mucDoUuTien);
  const currentCategory = categories.find((c) => c.id === formState.category || c.name === formState.category);
  const currentCatBadge = currentCategory ? getCategoryBadgeClass(currentCategory.color) : null;

  // File Upload to Simulated Google Drive storage
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    Array.from(files).forEach((file: File) => {
      const cleanDonVi = formState.donViChuTri.replace(/\s+/g, '');
      const standardizedName = `${formState.id}_${cleanDonVi}_${file.name.replace(/\s+/g, '_')}`;

      const reader = new FileReader();
      reader.onload = () => {
        const newFile: EvidenceFile = {
          id: 'file_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          name: standardizedName,
          size: file.size,
          mimeType: file.type || 'application/octet-stream',
          uploadDate: new Date().toISOString().slice(0, 10),
          uploadedBy: currentUser.hoTen,
          driveUrl: `https://drive.google.com/file/d/hvu-${formState.id.toLowerCase()}-${Date.now()}/view`,
          driveFolder: `Google_Drive/HVU_NQ57/${cleanDonVi}/${formState.id}`,
          fileData: reader.result as string,
        };

        setFormState((prev) => ({
          ...prev,
          filesMinhChung: [...(prev.filesMinhChung || []), newFile],
          linkMinhChung: prev.linkMinhChung || newFile.driveUrl,
          approvalStatus: prev.approvalStatus === 'Chua_Nop' ? 'Cho_Duyet' : prev.approvalStatus,
          ngayCapNhat: new Date().toISOString(),
        }));
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (fileId: string) => {
    setFormState((prev) => ({
      ...prev,
      filesMinhChung: prev.filesMinhChung.filter((f) => f.id !== fileId),
      ngayCapNhat: new Date().toISOString(),
    }));
  };

  // Base Wework Checklist operations
  const handleToggleChecklist = (id: string) => {
    setFormState((prev) => {
      const updatedList = (prev.checklist || []).map((item) => 
        item.id === id ? { ...item, completed: !item.completed } : item
      );
      return {
        ...prev,
        checklist: updatedList,
        ngayCapNhat: new Date().toISOString(),
      };
    });
  };

  const handleAddChecklistItem = () => {
    if (!newChecklistTitle.trim()) return;
    const newItem: TaskChecklistItem = {
      id: 'cl_' + Date.now(),
      title: newChecklistTitle.trim(),
      completed: false,
    };
    setFormState((prev) => ({
      ...prev,
      checklist: [...(prev.checklist || []), newItem],
      ngayCapNhat: new Date().toISOString(),
    }));
    setNewChecklistTitle('');
  };

  const handleRemoveChecklistItem = (id: string) => {
    setFormState((prev) => ({
      ...prev,
      checklist: (prev.checklist || []).filter((item) => item.id !== id),
      ngayCapNhat: new Date().toISOString(),
    }));
  };

  const handleSyncProgressFromChecklist = () => {
    const list = formState.checklist || [];
    if (list.length === 0) return;
    const completedCount = list.filter((item) => item.completed).length;
    const calcProgress = Math.round((completedCount / list.length) * 100);
    setFormState((prev) => ({
      ...prev,
      tiendo: calcProgress,
      trangThai: calcProgress === 100 ? 'Đã hoàn thành' : calcProgress > 0 ? 'Đang thực hiện' : 'Chưa thực hiện',
      approvalStatus: calcProgress === 100 && prev.approvalStatus === 'Chua_Nop' ? 'Cho_Duyet' : prev.approvalStatus,
      ngayCapNhat: new Date().toISOString(),
    }));
  };

  // Base Wework Discussion / Comments
  const handleAddComment = () => {
    if (!newComment.trim()) return;
    const commentItem: TaskDiscussionComment = {
      id: 'cmt_' + Date.now(),
      author: currentUser.hoTen,
      role: currentUser.vaiTro === 'Admin' ? 'Quản trị viên' : currentUser.vaiTro === 'Lanh_Dao' ? 'Lãnh đạo trường' : currentUser.vaiTro === 'To_Chuyen_Trach' ? 'Tổ CĐS' : currentUser.donVi,
      content: newComment.trim(),
      createdAt: new Date().toLocaleDateString('vi-VN') + ' ' + new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setFormState((prev) => ({
      ...prev,
      comments: [...(prev.comments || []), commentItem],
      ngayCapNhat: new Date().toISOString(),
    }));
    setNewComment('');
  };

  // Approval status update
  const handleUpdateApproval = (status: TaskApprovalStatus) => {
    setFormState((prev) => ({
      ...prev,
      approvalStatus: status,
      trangThai: status === 'Da_Duyet' ? 'Đã hoàn thành' : prev.trangThai,
      tiendo: status === 'Da_Duyet' ? 100 : prev.tiendo,
      ngayCapNhat: new Date().toISOString(),
    }));
  };

  const handleAddDirective = () => {
    if (!newDirective.trim()) return;
    const now = new Date().toLocaleString('vi-VN');
    const directiveEntry = {
      id: 'dir_' + Date.now(),
      author: currentUser.hoTen,
      role: currentUser.vaiTro === 'Lanh_Dao' ? 'Lãnh đạo trường' : 'Tổ CĐS',
      content: newDirective.trim(),
      createdAt: now,
    };

    setFormState((prev) => ({
      ...prev,
      yKienChiDao: newDirective.trim(),
      directivesHistory: [...(prev.directivesHistory || []), directiveEntry],
      ngayCapNhat: new Date().toISOString(),
    }));
    setNewDirective('');
  };

  const handleSave = () => {
    const updated = {
      ...formState,
      linkMinhChung: externalDriveUrl.trim(),
      ngayCapNhat: new Date().toISOString(),
    };
    onSaveTask(updated);
    onClose();
  };

  const handleDownloadSimulatedFile = (file: EvidenceFile) => {
    if (file.fileData) {
      const link = document.createElement('a');
      link.href = file.fileData;
      link.download = file.name;
      link.click();
    } else {
      window.open(file.driveUrl, '_blank');
    }
  };

  // Checklist stats
  const totalChecklist = formState.checklist?.length || 0;
  const completedChecklist = formState.checklist?.filter((item) => item.completed).length || 0;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/50 p-0 sm:p-4 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-5xl h-full sm:h-auto sm:max-h-[96vh] rounded-none sm:rounded-xl shadow-2xl border-0 sm:border border-zinc-300 overflow-hidden flex flex-col text-zinc-900"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        
        {/* Header with Task ID & Title */}
        <div className="px-4 py-2.5 border-b border-zinc-200 bg-zinc-50/70 flex items-start justify-between gap-3 shrink-0">
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="bg-zinc-900 text-white text-[11px] font-mono font-bold px-2 py-0.5 rounded shadow-2xs">
                {formState.id}
              </span>
              <span className="text-[11px] text-zinc-700 bg-white border border-zinc-200 px-2 py-0.5 rounded font-medium truncate max-w-xs" title={formState.nhomKeHoach}>
                {formState.nhomKeHoach}
              </span>
              <span className="text-[11px] text-zinc-800 bg-white border border-zinc-200 px-2 py-0.5 rounded font-medium">
                {deadlineBadge.label}
              </span>
              <span className="text-[11px] text-zinc-800 bg-white border border-zinc-200 px-2 py-0.5 rounded font-medium">
                Ưu tiên: {currentPriorityMeta.shortLabel}
              </span>
              {currentCategory && (
                <span className="text-[11px] text-zinc-800 bg-white border border-zinc-200 px-2 py-0.5 rounded font-medium">
                  {currentCategory.name}
                </span>
              )}
              <span className="text-[11px] text-zinc-800 bg-white border border-zinc-200 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-zinc-700" />
                <span>
                  {formState.approvalStatus === 'Da_Duyet'
                    ? 'Đã nghiệm thu đạt'
                    : formState.approvalStatus === 'Cho_Duyet'
                    ? 'Chờ duyệt minh chứng'
                    : formState.approvalStatus === 'Yeu_Cau_Sua'
                    ? 'Yêu cầu sửa đổi'
                    : 'Chưa gửi nghiệm thu'}
                </span>
              </span>
            </div>
            {canEditCoreContent ? (
              <input
                type="text"
                value={formState.tenNhiemVu}
                onChange={(e) => setFormState({ ...formState, tenNhiemVu: e.target.value })}
                className="text-sm sm:text-base font-bold text-zinc-900 leading-snug w-full border border-zinc-300 rounded px-2.5 py-1 focus:border-zinc-900 bg-white mt-1"
                placeholder="Tên nhiệm vụ theo NQ57"
              />
            ) : (
              <h3 className="text-sm sm:text-base font-bold text-zinc-900 leading-snug mt-0.5">
                {formState.tenNhiemVu}
              </h3>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200 transition-colors cursor-pointer shrink-0"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: 2-Column Grid to fit everything without scrolling */}
        <div className="p-3 sm:p-3.5 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 text-xs">
          
          {/* LEFT COLUMN: Mission info, deliverables, directives */}
          <div className="lg:col-span-7 space-y-2.5">
            {/* Box 1: Assignment & Schedule */}
            <div className="border border-zinc-200 rounded-lg p-2.5 bg-zinc-50/40 space-y-2">
              {/* Row 1: Đơn vị chủ trì & Đơn vị phối hợp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider block mb-1">
                    Đơn vị chủ trì
                  </span>
                  <div className="flex flex-wrap gap-1 items-center">
                    {chuTriList.map((dept, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white text-zinc-900 border border-zinc-300 font-medium text-[11px]">
                        <span>{dept}</span>
                        {canEditCoreContent && chuTriList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveChuTri(dept)}
                            className="hover:text-rose-600 ml-0.5 cursor-pointer text-xs"
                            title="Xóa đơn vị này"
                          >
                            ×
                          </button>
                        )}
                      </span>
                    ))}
                    {canEditCoreContent && (
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAddChuTri(e.target.value);
                            e.target.value = '';
                          }
                        }}
                        className="text-[11px] border border-dashed border-zinc-300 rounded px-1 py-0.5 bg-white text-zinc-700 cursor-pointer"
                        defaultValue=""
                      >
                        <option value="" disabled>+ Thêm</option>
                        {DEPARTMENTS.filter((d) => !chuTriList.includes(d)).map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider block mb-1">
                    Đơn vị phối hợp
                  </span>
                  <div className="flex flex-wrap gap-1 items-center">
                    {phoiHopList.length === 0 ? (
                      <span className="text-[11px] text-zinc-400 italic">Chưa có phối hợp</span>
                    ) : (
                      phoiHopList.map((dept, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white text-zinc-900 border border-zinc-300 font-medium text-[11px]">
                          <span>{dept}</span>
                          {canEditCoreContent && (
                            <button
                              type="button"
                              onClick={() => handleRemovePhoiHop(dept)}
                              className="hover:text-rose-600 ml-0.5 cursor-pointer text-xs"
                              title="Xóa đơn vị phối hợp này"
                            >
                              ×
                            </button>
                          )}
                        </span>
                      ))
                    )}
                    {canEditCoreContent && (
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAddPhoiHop(e.target.value);
                            e.target.value = '';
                          }
                        }}
                        className="text-[11px] border border-dashed border-zinc-300 rounded px-1 py-0.5 bg-white text-zinc-700 cursor-pointer"
                        defaultValue=""
                      >
                        <option value="" disabled>+ Thêm</option>
                        {DEPARTMENTS.filter((d) => !phoiHopList.includes(d)).map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              </div>

              {/* Row 2: Người phụ trách, Ngày bắt đầu, Hạn hoàn thành */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1.5 border-t border-zinc-200/70">
                <div>
                  <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider block mb-0.5">
                    Người phụ trách
                  </span>
                  {canEditCoreContent ? (
                    <>
                      <input
                        type="text"
                        list="assignee-datalist-modal"
                        value={formState.nguoiPhuTrach}
                        onChange={(e) => setFormState({ ...formState, nguoiPhuTrach: e.target.value })}
                        className="text-xs border border-zinc-300 rounded px-2 py-1 bg-white text-zinc-900 font-medium w-full focus:outline-none focus:border-zinc-900"
                        placeholder="Chọn người phụ trách"
                      />
                      <datalist id="assignee-datalist-modal">
                        {accounts.map((acc) => (
                          <option key={acc.email} value={acc.hoTen}>
                            {acc.hoTen} ({acc.donVi})
                          </option>
                        ))}
                      </datalist>
                    </>
                  ) : (
                    <p className="text-xs font-semibold text-zinc-900">{formState.nguoiPhuTrach || 'Chưa chỉ định'}</p>
                  )}
                </div>

                <div>
                  <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider block mb-0.5">
                    Ngày bắt đầu
                  </span>
                  <input
                    type="date"
                    value={formState.ngayBatDau || ''}
                    disabled={!canEditCoreContent}
                    onChange={(e) => setFormState({ ...formState, ngayBatDau: e.target.value })}
                    className="text-xs border border-zinc-300 rounded px-2 py-1 bg-white text-zinc-900 font-medium w-full disabled:bg-zinc-100 disabled:text-zinc-500 focus:outline-none focus:border-zinc-900"
                  />
                </div>

                <div>
                  <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider block mb-0.5">
                    Hạn hoàn thành
                  </span>
                  <input
                    type="date"
                    value={formState.thoiHan}
                    disabled={!canEditCoreContent}
                    onChange={(e) => setFormState({ ...formState, thoiHan: e.target.value })}
                    className="text-xs border border-zinc-300 rounded px-2 py-1 bg-white text-zinc-900 font-medium w-full disabled:bg-zinc-100 disabled:text-zinc-500 focus:outline-none focus:border-zinc-900"
                  />
                </div>
              </div>

              {/* Row 3: Mức độ ưu tiên & Danh mục */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1.5 border-t border-zinc-200/70">
                <div>
                  <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider block mb-1">
                    Mức độ ưu tiên
                  </span>
                  <div className="grid grid-cols-3 gap-1">
                    {(['Cao', 'Trung bình', 'Bình thường'] as const).map((p) => {
                      const isCurrent = formState.mucDoUuTien === p || 
                        (p === 'Bình thường' && (formState.mucDoUuTien === 'Low' || formState.mucDoUuTien === 'Thấp')) ||
                        (p === 'Cao' && formState.mucDoUuTien === 'High') ||
                        (p === 'Trung bình' && formState.mucDoUuTien === 'Medium');

                      return (
                        <button
                          key={p}
                          type="button"
                          disabled={!canEditCoreContent}
                          onClick={() => setFormState({ ...formState, mucDoUuTien: p })}
                          className={`py-1 px-1.5 rounded text-xs font-semibold border transition-all text-center ${
                            isCurrent
                              ? 'bg-zinc-900 text-white border-zinc-900 shadow-2xs'
                              : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                          } ${!canEditCoreContent ? 'opacity-80 cursor-default' : 'cursor-pointer'}`}
                        >
                          {p === 'Cao' ? 'Cao' : p === 'Trung bình' ? 'Vừa' : 'Thấp'}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">
                      Danh mục
                    </span>
                    {onOpenCategoryManager && canEditCoreContent && (
                      <button
                        type="button"
                        onClick={onOpenCategoryManager}
                        className="text-[10px] text-zinc-500 hover:text-zinc-900 underline cursor-pointer"
                      >
                        + Quản lý
                      </button>
                    )}
                  </div>
                  <select
                    value={formState.category || ''}
                    disabled={!canEditCoreContent}
                    onChange={(e) => setFormState({ ...formState, category: e.target.value })}
                    className="w-full text-xs border border-zinc-300 rounded px-2 py-1 bg-white text-zinc-900 disabled:bg-zinc-100 disabled:text-zinc-500 focus:outline-none focus:border-zinc-900"
                  >
                    <option value="">-- Chưa gán danh mục --</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Box 2: Required Output Deliverable (NQ57) */}
            <div className="border border-zinc-200 rounded-lg p-2.5 bg-zinc-50/40 space-y-1">
              <span className="text-[10px] font-bold text-zinc-700 uppercase tracking-wider block">
                Sản phẩm đầu ra yêu cầu theo NQ57
              </span>
              {canEditCoreContent ? (
                <textarea
                  value={formState.sanPhamDauRa}
                  onChange={(e) => setFormState({ ...formState, sanPhamDauRa: e.target.value })}
                  rows={2}
                  className="w-full text-xs font-medium text-zinc-900 bg-white border border-zinc-300 rounded p-2 focus:outline-none focus:border-zinc-900"
                  placeholder="Nhập sản phẩm hoặc minh chứng đầu ra yêu cầu theo NQ57..."
                />
              ) : (
                <p className="text-xs font-medium text-zinc-900 leading-relaxed">
                  {formState.sanPhamDauRa || 'Chưa ghi rõ sản phẩm đầu ra'}
                </p>
              )}
            </div>

            {/* Box 3: Leadership Directives */}
            <div className="border border-zinc-200 rounded-lg p-2.5 bg-zinc-50/40 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-zinc-700 uppercase tracking-wider block">
                  Ý kiến chỉ đạo Ban Giám hiệu
                </span>
                {canLeadDirect && (
                  <span className="text-[10px] text-zinc-600 font-semibold bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200">
                    Quyền: Ban Giám hiệu
                  </span>
                )}
              </div>

              {formState.yKienChiDao ? (
                <div className="p-2 bg-white rounded border border-zinc-200 text-xs text-zinc-900">
                  <p className="font-semibold text-zinc-900 text-[11px]">Chỉ đạo gần nhất:</p>
                  <p className="text-zinc-800 italic mt-0.5">"{formState.yKienChiDao}"</p>
                </div>
              ) : (
                <p className="text-xs text-zinc-400 italic">Chưa có chỉ đạo bổ sung.</p>
              )}

              {canLeadDirect && (
                <div className="flex items-center gap-1.5 pt-0.5">
                  <input
                    type="text"
                    placeholder="Nhập ý kiến chỉ đạo, đôn đốc của Ban Giám hiệu..."
                    value={newDirective}
                    onChange={(e) => setNewDirective(e.target.value)}
                    className="flex-1 text-xs border border-zinc-300 rounded px-2.5 py-1 bg-white text-zinc-900 focus:outline-none focus:border-zinc-900"
                  />
                  <button
                    type="button"
                    onClick={handleAddDirective}
                    disabled={!newDirective.trim()}
                    className="px-2.5 py-1 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded disabled:opacity-40 cursor-pointer shrink-0"
                  >
                    Ban hành
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Progress, Evidence, Checklist/Discussion */}
          <div className="lg:col-span-5 space-y-2.5">
            {/* Box 1: Progress & Status */}
            <div className="border border-zinc-200 rounded-lg p-2.5 bg-zinc-50/40 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-zinc-700 uppercase tracking-wider">
                  Tiến độ hoàn thành
                </span>
                <span className="font-bold text-sm text-zinc-900 tabular-nums">{formState.tiendo}%</span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={formState.tiendo}
                  disabled={!canEditProgress}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setFormState({
                      ...formState,
                      tiendo: val,
                      trangThai: val === 100 ? 'Đã hoàn thành' : formState.trangThai === 'Đã hoàn thành' ? 'Đang thực hiện' : formState.trangThai,
                    });
                  }}
                  className={`w-full accent-zinc-900 ${!canEditProgress ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                />
              </div>

              {/* Status Selector Buttons */}
              <div className="grid grid-cols-5 gap-1 pt-1">
                {(['Chưa thực hiện', 'Đang thực hiện', 'Sắp đến hạn', 'Đã hoàn thành', 'Quá hạn'] as TaskStatus[]).map((status) => {
                  const shortName = status === 'Chưa thực hiện' ? 'Chưa' :
                                    status === 'Đang thực hiện' ? 'Đang' :
                                    status === 'Sắp đến hạn' ? 'Sắp' :
                                    status === 'Đã hoàn thành' ? 'Xong' : 'Trễ';
                  const isSel = formState.trangThai === status;
                  return (
                    <button
                      key={status}
                      type="button"
                      disabled={!canEditProgress}
                      onClick={() => {
                        setFormState({
                          ...formState,
                          trangThai: status,
                          tiendo: status === 'Đã hoàn thành' ? 100 : formState.tiendo,
                          approvalStatus: status === 'Đã hoàn thành' && formState.approvalStatus === 'Chua_Nop' ? 'Cho_Duyet' : formState.approvalStatus,
                        });
                      }}
                      className={`py-1 px-0.5 rounded text-[11px] font-medium transition-all text-center border ${
                        isSel
                          ? 'bg-zinc-900 text-white border-zinc-900 font-bold'
                          : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                      } ${!canEditProgress ? 'opacity-80 cursor-default' : 'cursor-pointer'}`}
                      title={status}
                    >
                      {shortName}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Box 2: Google Drive Evidence */}
            <div className="border border-zinc-200 rounded-lg p-2.5 bg-zinc-50/40 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-1">
                  <Paperclip className="w-3 h-3 text-zinc-600" />
                  Minh chứng Drive ({formState.filesMinhChung?.length || 0})
                </span>
                <div>
                  <input
                    type="file"
                    multiple
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    id="task-file-upload-input"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="px-2 py-0.5 text-[11px] font-semibold text-zinc-800 bg-white hover:bg-zinc-100 border border-zinc-300 rounded flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                  >
                    <Upload className="w-3 h-3" />
                    <span>{isUploading ? 'Đang tải...' : '+ Tải lên'}</span>
                  </button>
                </div>
              </div>

              {/* Uploaded File List */}
              <div className="space-y-1 max-h-24 overflow-y-auto pr-0.5">
                {(!formState.filesMinhChung || formState.filesMinhChung.length === 0) ? (
                  <p className="text-[11px] text-zinc-400 italic py-1">Chưa có tệp minh chứng tải lên.</p>
                ) : (
                  formState.filesMinhChung.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-1.5 rounded border border-zinc-200 bg-white text-xs">
                      <span className="text-[11px] font-medium text-zinc-900 truncate max-w-[180px]" title={file.name}>
                        {file.name}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        <button type="button" onClick={() => handleDownloadSimulatedFile(file)} className="p-0.5 text-zinc-600 hover:text-zinc-900" title="Tải về">
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button type="button" onClick={() => handleRemoveFile(file.id)} className="p-0.5 text-zinc-400 hover:text-rose-600" title="Xóa">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Drive Link Input */}
              <div className="flex items-center gap-1 pt-1 border-t border-zinc-200/70">
                <input
                  type="url"
                  placeholder="Dán link Drive..."
                  value={externalDriveUrl}
                  onChange={(e) => setExternalDriveUrl(e.target.value)}
                  className="flex-1 text-[11px] border border-zinc-300 rounded px-2 py-1 bg-white text-zinc-900 focus:outline-none focus:border-zinc-900"
                />
                {externalDriveUrl && (
                  <a
                    href={externalDriveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2 py-1 text-[11px] font-medium text-zinc-800 bg-white hover:bg-zinc-100 rounded border border-zinc-300 shrink-0"
                  >
                    Mở
                  </a>
                )}
              </div>
            </div>

            {/* Box 3: Tabs: [Checklist] & [Trao đổi] */}
            <div className="border border-zinc-200 rounded-lg p-2.5 bg-zinc-50/40 space-y-1.5">
              {/* Tab Selector */}
              <div className="flex items-center justify-between border-b border-zinc-200 pb-1.5">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setRightTab('checklist')}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                      rightTab === 'checklist'
                        ? 'bg-zinc-900 text-white'
                        : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60'
                    }`}
                  >
                    Checklist ({completedChecklist}/{totalChecklist})
                  </button>
                  <button
                    type="button"
                    onClick={() => setRightTab('comments')}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                      rightTab === 'comments'
                        ? 'bg-zinc-900 text-white'
                        : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60'
                    }`}
                  >
                    Trao đổi ({formState.comments?.length || 0})
                  </button>
                </div>

                {rightTab === 'checklist' && totalChecklist > 0 && (
                  <button
                    type="button"
                    onClick={handleSyncProgressFromChecklist}
                    className="text-[10px] text-zinc-600 hover:text-zinc-900 underline flex items-center gap-0.5 cursor-pointer"
                    title="Đồng bộ tiến độ từ checklist"
                  >
                    <RefreshCw className="w-2.5 h-2.5" />
                    <span>Đồng bộ %</span>
                  </button>
                )}
              </div>

              {/* Tab 1: Checklist */}
              {rightTab === 'checklist' ? (
                <div className="space-y-1">
                  <div className="space-y-1 max-h-28 overflow-y-auto pr-0.5">
                    {(formState.checklist || []).map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-1.5 rounded bg-white border border-zinc-200">
                        <button
                          type="button"
                          disabled={!canEditChecklist}
                          onClick={() => handleToggleChecklist(item.id)}
                          className="flex items-center gap-2 text-left flex-1 cursor-pointer"
                        >
                          {item.completed ? (
                            <CheckSquare className="w-3.5 h-3.5 text-zinc-900 shrink-0" />
                          ) : (
                            <Square className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          )}
                          <span className={`text-[11px] ${item.completed ? 'line-through text-zinc-400' : 'text-zinc-900 font-medium'}`}>
                            {item.title}
                          </span>
                        </button>
                        {canEditChecklist && (
                          <button type="button" onClick={() => handleRemoveChecklistItem(item.id)} className="text-zinc-400 hover:text-rose-600 p-0.5">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {canEditChecklist && (
                    <div className="flex items-center gap-1 pt-1">
                      <input
                        type="text"
                        placeholder="+ Thêm đầu việc con (Enter)..."
                        value={newChecklistTitle}
                        onChange={(e) => setNewChecklistTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddChecklistItem()}
                        className="flex-1 text-[11px] border border-zinc-300 rounded px-2 py-1 bg-white text-zinc-900 focus:outline-none focus:border-zinc-900"
                      />
                      <button
                        type="button"
                        onClick={handleAddChecklistItem}
                        disabled={!newChecklistTitle.trim()}
                        className="px-2 py-1 text-[11px] font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded disabled:opacity-40 shrink-0"
                      >
                        Thêm
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* Tab 2: Comments */
                <div className="space-y-1.5">
                  <div className="space-y-1 max-h-28 overflow-y-auto pr-0.5">
                    {(formState.comments || []).length === 0 ? (
                      <p className="text-[11px] text-zinc-400 italic py-1">Chưa có trao đổi nào.</p>
                    ) : (
                      formState.comments?.map((cmt) => (
                        <div key={cmt.id} className="p-1.5 bg-white rounded border border-zinc-200 text-[11px] space-y-0.5">
                          <div className="flex items-center justify-between text-[10px] text-zinc-500">
                            <span className="font-bold text-zinc-900">{cmt.author} ({cmt.role})</span>
                            <span>{cmt.createdAt}</span>
                          </div>
                          <p className="text-zinc-800">{cmt.content}</p>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="flex items-center gap-1 pt-1">
                    <input
                      type="text"
                      placeholder="Nhập trao đổi nội bộ..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                      className="flex-1 text-[11px] border border-zinc-300 rounded px-2 py-1 bg-white text-zinc-900 focus:outline-none focus:border-zinc-900"
                    />
                    <button
                      type="button"
                      onClick={handleAddComment}
                      disabled={!newComment.trim()}
                      className="px-2.5 py-1 text-[11px] font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded disabled:opacity-40 shrink-0"
                    >
                      Gửi
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-4 py-2.5 border-t border-zinc-200 bg-zinc-50/70 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-3">
            {canDelete && onDeleteTask && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Bạn có chắc muốn xóa nhiệm vụ [${formState.id}] "${formState.tenNhiemVu}"?`)) {
                    onDeleteTask(formState.id);
                    onClose();
                  }
                }}
                className="px-2.5 py-1 text-xs font-medium text-rose-700 bg-white hover:bg-rose-50 border border-rose-200 rounded transition-colors cursor-pointer flex items-center gap-1"
                title="Xóa nhiệm vụ này khỏi hệ thống"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa</span>
              </button>
            )}
            <span className="text-[11px] text-zinc-500">
              Cập nhật: {new Date(formState.ngayCapNhat).toLocaleDateString('vi-VN')}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            {(currentUser.vaiTro === 'Admin' || currentUser.vaiTro === 'Lanh_Dao') && onApproveTask && (
              <>
                {formState.approvalStatus !== 'Da_Duyet' && (
                  <button
                    type="button"
                    onClick={() => {
                      onApproveTask(formState.id, 'Da_Duyet');
                      setFormState(prev => ({ ...prev, approvalStatus: 'Da_Duyet', tiendo: 100, trangThai: 'Đã hoàn thành' }));
                    }}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    title="Phê duyệt nghiệm thu chính thức"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Duyệt nghiệm thu</span>
                  </button>
                )}
                {formState.approvalStatus !== 'Yeu_Cau_Sua' && (
                  <button
                    type="button"
                    onClick={() => {
                      onApproveTask(formState.id, 'Yeu_Cau_Sua');
                      setFormState(prev => ({ ...prev, approvalStatus: 'Yeu_Cau_Sua' }));
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-zinc-800 bg-white hover:bg-zinc-100 border border-zinc-300 rounded flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Yêu cầu đơn vị bổ sung minh chứng hoặc sửa đổi"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-zinc-600" />
                    <span>Yêu cầu sửa</span>
                  </button>
                )}
              </>
            )}

            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 rounded hover:bg-zinc-200 transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Lưu thay đổi</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
