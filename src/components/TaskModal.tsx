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
  RefreshCw,
  Award,
  ArrowLeft
} from 'lucide-react';
import { 
  TaskNQ57, 
  UserAccount, 
  TaskStatus, 
  EvidenceFile, 
  CustomCategory,
  TaskChecklistItem,
  TaskApprovalStatus,
  TaskDiscussionComment,
  ChecklistEvaluationStatus
} from '../types';
import { formatVietnameseDate, formatDeadlineBadge, formatFileSize, getDaysDifference } from '../utils/dateUtils';
import { getPriorityMeta, getCategoryBadgeClass } from '../utils/storage';
import { DEPARTMENTS } from '../data/initialData';
import { getRolePermissions, isTaskRelatedToUnit } from '../utils/permissions';
import { 
  DocumentType, 
  DOCUMENT_TYPES, 
  generateTaskFolderPath, 
  generateEvidenceFileName, 
  detectDocumentType 
} from '../utils/driveNamingUtils';

interface TaskModalProps {
  task: TaskNQ57 | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveTask: (updatedTask: TaskNQ57) => Promise<void> | void;
  onDeleteTask?: (taskId: string) => void;
  onApproveTask?: (taskId: string, status?: TaskApprovalStatus) => void;
  currentUser: UserAccount;
  categories?: CustomCategory[];
  onOpenCategoryManager?: () => void;
  accounts?: UserAccount[];
  isFullPage?: boolean;
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
  isFullPage = false,
}) => {
  if (!isOpen || !task) return null;

  const [formState, setFormState] = useState<TaskNQ57>({ ...task });
  const [newDirective, setNewDirective] = useState('');
  const [newComment, setNewComment] = useState('');
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  const [newChecklistAssignee, setNewChecklistAssignee] = useState('');
  const [newChecklistDueDate, setNewChecklistDueDate] = useState('');
  const [evaluatingChecklistId, setEvaluatingChecklistId] = useState<string | null>(null);
  const [evalStatus, setEvalStatus] = useState<ChecklistEvaluationStatus>('Dat');
  const [evalNote, setEvalNote] = useState('');
  const [externalDriveUrl, setExternalDriveUrl] = useState(task.linkMinhChung || '');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<DocumentType>('BC');
  const [rightTab, setRightTab] = useState<'checklist' | 'comments'>('checklist');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (task) {
      setFormState({ 
        ...task,
        checklist: Array.isArray(task.checklist) ? task.checklist : [],
        approvalStatus: task.approvalStatus || (task.tiendo === 100 ? 'Da_Duyet' : (task.filesMinhChung?.length ? 'Cho_Duyet' : 'Chua_Nop')),
        comments: Array.isArray(task.comments) ? task.comments : [],
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
  const canEditChecklist = canEditCoreContent || (currentUser.vaiTro === 'Don_Vi' && isMyUnitTask);

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

  // File Upload to Simulated Google Drive storage with standardized naming
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    Array.from(files).forEach((file: File) => {
      // Auto-detect docType from file name, fallback to user-selectedDocType
      const detected = detectDocumentType(file.name);
      const effectiveDocType = detected !== 'MC' ? detected : selectedDocType;

      // Standardized file name: [NVxx]_[DocType]_[ContentName]_[YYYYMMDD].[ext]
      const standardizedName = generateEvidenceFileName(
        formState.id,
        file.name,
        effectiveDocType
      );

      // Standardized folder path: Google_Drive/HVU_NQ57/[NVxx]_[TaskNameClean]
      const standardizedFolderPath = generateTaskFolderPath(formState.id, formState.tenNhiemVu);

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
          driveFolder: standardizedFolderPath,
          fileData: reader.result as string,
          docType: effectiveDocType,
          originalName: file.name,
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

  // Accounts grouping for checklist assignee selection
  const toChuyenTrachAccounts = accounts.filter(
    (a) => a.vaiTro === 'To_Chuyen_Trach' || a.donVi?.toLowerCase().includes('chuyển đổi số') || a.donVi?.toLowerCase().includes('tổ cđs')
  );

  const relatedUnitAccounts = accounts.filter(
    (a) =>
      a.vaiTro !== 'To_Chuyen_Trach' &&
      !a.donVi?.toLowerCase().includes('chuyển đổi số') &&
      !a.donVi?.toLowerCase().includes('tổ cđs') &&
      isTaskRelatedToUnit(formState, a.donVi)
  );

  const otherAccounts = accounts.filter(
    (a) =>
      !toChuyenTrachAccounts.some((tc) => tc.email === a.email) &&
      !relatedUnitAccounts.some((ru) => ru.email === a.email)
  );

  // Checklist operations
  const handleToggleChecklist = (id: string) => {
    setFormState((prev) => {
      const updatedList = (prev.checklist || []).map((item) => {
        if (item.id !== id) return item;
        const nextCompleted = !item.completed;
        return {
          ...item,
          completed: nextCompleted,
          evaluationStatus: nextCompleted 
            ? (item.evaluationStatus && item.evaluationStatus !== 'Chua_Danh_Gia' ? item.evaluationStatus : 'Dat')
            : (item.evaluationStatus === 'Dat' ? 'Chua_Danh_Gia' : item.evaluationStatus),
        };
      });
      return {
        ...prev,
        checklist: updatedList,
        ngayCapNhat: new Date().toISOString(),
      };
    });
  };

  const handleAddChecklistItem = () => {
    if (!newChecklistTitle.trim()) return;
    const selectedAcc = accounts.find((a) => a.email === newChecklistAssignee || a.hoTen === newChecklistAssignee);
    const newItem: TaskChecklistItem = {
      id: 'cl_' + Date.now(),
      title: newChecklistTitle.trim(),
      completed: false,
      assignee: selectedAcc ? selectedAcc.hoTen : (newChecklistAssignee.trim() || undefined),
      assigneeEmail: selectedAcc?.email,
      assigneeRole: selectedAcc ? (selectedAcc.vaiTro === 'To_Chuyen_Trach' ? 'Tổ CĐS' : selectedAcc.donVi) : undefined,
      dueDate: newChecklistDueDate || undefined,
      evaluationStatus: 'Chua_Danh_Gia',
    };
    setFormState((prev) => ({
      ...prev,
      checklist: [...(prev.checklist || []), newItem],
      ngayCapNhat: new Date().toISOString(),
    }));
    setNewChecklistTitle('');
    setNewChecklistAssignee('');
    setNewChecklistDueDate('');
  };

  const handleRemoveChecklistItem = (id: string) => {
    setFormState((prev) => ({
      ...prev,
      checklist: (prev.checklist || []).filter((item) => item.id !== id),
      ngayCapNhat: new Date().toISOString(),
    }));
  };

  const handleOpenEvaluation = (item: TaskChecklistItem) => {
    setEvaluatingChecklistId(item.id);
    setEvalStatus(item.evaluationStatus && item.evaluationStatus !== 'Chua_Danh_Gia' ? item.evaluationStatus : 'Dat');
    setEvalNote(item.evaluationNote || '');
  };

  const handleSaveEvaluation = (checklistId: string) => {
    setFormState((prev) => {
      const updatedList = (prev.checklist || []).map((item) => {
        if (item.id !== checklistId) return item;
        const isApproved = evalStatus === 'Dat';
        return {
          ...item,
          evaluationStatus: evalStatus,
          evaluationNote: evalNote.trim(),
          evaluator: currentUser.hoTen,
          evaluatedAt: new Date().toLocaleDateString('vi-VN'),
          completed: isApproved ? true : item.completed,
        };
      });
      return {
        ...prev,
        checklist: updatedList,
        ngayCapNhat: new Date().toISOString(),
      };
    });
    setEvaluatingChecklistId(null);
  };

  const handleSyncProgressFromChecklist = () => {
    const list = formState.checklist || [];
    if (list.length === 0) return;
    const completedCount = list.filter((item) => item.completed || item.evaluationStatus === 'Dat').length;
    const calcProgress = Math.round((completedCount / list.length) * 100);
    setFormState((prev) => ({
      ...prev,
      tiendo: calcProgress,
      trangThai: calcProgress === 100 ? 'Đã hoàn thành' : calcProgress > 0 ? 'Đang thực hiện' : 'Chưa thực hiện',
      approvalStatus: calcProgress === 100 && prev.approvalStatus === 'Chua_Nop' ? 'Cho_Duyet' : prev.approvalStatus,
      ngayCapNhat: new Date().toISOString(),
    }));
  };

  const getChecklistDueDateBadge = (dueDate?: string) => {
    if (!dueDate) return null;
    const diff = getDaysDifference(dueDate);
    if (diff < 0) {
      return {
        label: `Trễ ${Math.abs(diff)} ngày (${formatVietnameseDate(dueDate)})`,
        className: 'bg-rose-50 text-rose-700 border-rose-200 font-semibold',
      };
    }
    if (diff === 0) {
      return {
        label: `Hôm nay (${formatVietnameseDate(dueDate)})`,
        className: 'bg-amber-100 text-amber-900 border-amber-300 font-bold animate-pulse',
      };
    }
    if (diff <= 3) {
      return {
        label: `Còn ${diff} ngày (${formatVietnameseDate(dueDate)})`,
        className: 'bg-amber-50 text-amber-700 border-amber-200 font-medium',
      };
    }
    return {
      label: formatVietnameseDate(dueDate),
      className: 'bg-slate-50 text-slate-600 border-slate-200',
    };
  };

  const getEvaluationBadge = (status?: ChecklistEvaluationStatus) => {
    switch (status) {
      case 'Dat':
        return {
          label: 'Đạt',
          className: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold',
        };
      case 'Yeu_Cau_Sua':
        return {
          label: 'Yêu cầu sửa',
          className: 'bg-rose-50 text-rose-700 border-rose-200 font-bold',
        };
      case 'Can_Bo_Sung':
        return {
          label: 'Cần bổ sung MC',
          className: 'bg-amber-50 text-amber-800 border-amber-200 font-bold',
        };
      case 'Chua_Danh_Gia':
      default:
        return {
          label: 'Chưa đánh giá',
          className: 'bg-slate-100 text-slate-600 border-slate-200',
        };
    }
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

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let currentChecklist = [...(formState.checklist || [])];
      if (newChecklistTitle.trim()) {
        const selectedAcc = accounts.find((a) => a.email === newChecklistAssignee || a.hoTen === newChecklistAssignee);
        currentChecklist.push({
          id: 'cl_' + Date.now(),
          title: newChecklistTitle.trim(),
          completed: false,
          assignee: selectedAcc ? selectedAcc.hoTen : (newChecklistAssignee.trim() || undefined),
          assigneeEmail: selectedAcc?.email,
          assigneeRole: selectedAcc ? (selectedAcc.vaiTro === 'To_Chuyen_Trach' ? 'Tổ CĐS' : selectedAcc.donVi) : undefined,
          dueDate: newChecklistDueDate || undefined,
          evaluationStatus: 'Chua_Danh_Gia',
        });
      }

      let currentDirectives = [...(formState.directivesHistory || [])];
      let currentYKien = formState.yKienChiDao;
      if (newDirective.trim()) {
        const now = new Date().toLocaleString('vi-VN');
        const directiveEntry = {
          id: 'dir_' + Date.now(),
          author: currentUser.hoTen,
          role: currentUser.vaiTro === 'Lanh_Dao' ? 'Lãnh đạo trường' : 'Tổ CĐS',
          content: newDirective.trim(),
          createdAt: now,
        };
        currentDirectives.push(directiveEntry);
        currentYKien = newDirective.trim();
      }

      let currentComments = [...(formState.comments || [])];
      if (newComment.trim()) {
        currentComments.push({
          id: 'cmt_' + Date.now(),
          author: currentUser.hoTen,
          role: currentUser.vaiTro === 'Admin' ? 'Quản trị viên' : currentUser.vaiTro === 'Lanh_Dao' ? 'Lãnh đạo trường' : currentUser.vaiTro === 'To_Chuyen_Trach' ? 'Tổ CĐS' : currentUser.donVi,
          content: newComment.trim(),
          createdAt: new Date().toLocaleDateString('vi-VN') + ' ' + new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        });
      }

      const updated = {
        ...formState,
        checklist: currentChecklist,
        directivesHistory: currentDirectives,
        yKienChiDao: currentYKien,
        comments: currentComments,
        linkMinhChung: externalDriveUrl.trim(),
        ngayCapNhat: new Date().toISOString(),
      };
      await onSaveTask(updated);
      onClose();
    } catch (err) {
      console.error('Save task error:', err);
      alert('Đã xảy ra lỗi khi lưu nhiệm vụ, vui lòng thử lại!');
    } finally {
      setIsSaving(false);
    }
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

  const modalContent = (
    <div 
      className={isFullPage 
        ? "bg-white w-full flex-1 flex flex-col text-zinc-900 min-h-0" 
        : "bg-white w-full max-w-6xl h-full sm:h-auto sm:max-h-[96vh] rounded-none sm:rounded-xl shadow-2xl border-0 sm:border border-zinc-300 overflow-hidden flex flex-col text-zinc-900"
      }
      onClick={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
    >
      {/* Header with Task ID & Title */}
      <div className={`px-4 sm:px-6 py-3 border-b border-zinc-200 bg-zinc-50/70 flex items-start justify-between gap-3 shrink-0 ${isFullPage ? 'bg-white shadow-2xs' : ''}`}>
        {isFullPage && (
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0B2545] text-white hover:bg-[#1E3A8A] text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0 mr-1 mt-0.5"
            title="Quay lại danh sách nhiệm vụ"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại danh sách</span>
          </button>
        )}
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
          
          {/* LEFT COLUMN: Mission info, Progress, Drive Evidence, Deliverables, Directives */}
          <div className="lg:col-span-6 space-y-2.5">
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

            {/* Box 2: Google Drive Evidence */}
            <div className="border border-zinc-200 rounded-lg p-2.5 bg-zinc-50/40 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-1">
                  <Paperclip className="w-3 h-3 text-zinc-600" />
                  Minh chứng Drive ({(formState.filesMinhChung?.length || 0) + (externalDriveUrl.trim() ? 1 : 0)})
                </span>
                
                {/* Upload Action with Document Type Selector */}
                <div className="flex items-center gap-1.5">
                  <select
                    value={selectedDocType}
                    onChange={(e) => setSelectedDocType(e.target.value as DocumentType)}
                    className="text-[10px] font-semibold bg-white border border-zinc-300 rounded px-1.5 py-0.5 text-zinc-800 focus:outline-none"
                    title="Chọn loại văn bản để mã hóa tên file chuẩn (BC, KH, QD, HD, MC)"
                  >
                    {DOCUMENT_TYPES.map((dt) => (
                      <option key={dt.code} value={dt.code}>
                        [{dt.code}] {dt.label}
                      </option>
                    ))}
                  </select>

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


              {/* Uploaded File List + External Link item */}
              <div className="space-y-1 max-h-28 overflow-y-auto pr-0.5">
                {(!formState.filesMinhChung || formState.filesMinhChung.length === 0) && !externalDriveUrl.trim() ? (
                  <p className="text-[11px] text-zinc-400 italic py-1">Chưa có tệp minh chứng tải lên.</p>
                ) : (
                  <>
                    {externalDriveUrl.trim() && (
                      <div className="flex items-center justify-between p-1.5 rounded border border-blue-200 bg-blue-50/50 text-xs">
                        <div className="flex items-center gap-1.5 min-w-0 pr-1">
                          <span className="text-[9px] font-bold px-1 py-0.2 rounded border font-mono shrink-0 bg-blue-100 text-blue-800 border-blue-200">
                            LINK
                          </span>
                          <span className="text-[11px] font-medium text-blue-900 truncate max-w-[200px]" title={externalDriveUrl}>
                            {externalDriveUrl}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <a
                            href={externalDriveUrl.startsWith('http') ? externalDriveUrl : `https://${externalDriveUrl}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-0.5 text-blue-600 hover:text-blue-900"
                            title="Mở liên kết"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <button
                            type="button"
                            onClick={() => setExternalDriveUrl('')}
                            className="p-0.5 text-zinc-400 hover:text-rose-600"
                            title="Xóa liên kết"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                    {formState.filesMinhChung?.map((file) => {
                    const docBadge = file.docType || (file.name.includes('_KH_') ? 'KH' : file.name.includes('_BC_') ? 'BC' : file.name.includes('_QD_') ? 'QD' : file.name.includes('_HD_') ? 'HD' : 'MC');
                    const badgeColor = 
                      docBadge === 'KH' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      docBadge === 'BC' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      docBadge === 'QD' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      docBadge === 'HD' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                      'bg-zinc-100 text-zinc-700 border-zinc-200';

                    return (
                      <div key={file.id} className="flex items-center justify-between p-1.5 rounded border border-zinc-200 bg-white text-xs">
                        <div className="flex items-center gap-1.5 min-w-0 pr-1">
                          <span className={`text-[9px] font-bold px-1 py-0.2 rounded border font-mono shrink-0 ${badgeColor}`}>
                            {docBadge}
                          </span>
                          <span className="text-[11px] font-medium text-zinc-900 truncate max-w-[170px]" title={file.name}>
                            {file.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button type="button" onClick={() => handleDownloadSimulatedFile(file)} className="p-0.5 text-zinc-600 hover:text-zinc-900" title="Tải về">
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button type="button" onClick={() => handleRemoveFile(file.id)} className="p-0.5 text-zinc-400 hover:text-rose-600" title="Xóa">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </>
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

            {/* Box 4: Required Output Deliverable (NQ57) */}
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

            {/* Box 5: Leadership Directives */}
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

          {/* RIGHT COLUMN: Progress on top, followed by Checklist & Add item (no gaps) */}
          <div className="lg:col-span-6 space-y-2.5">
            {/* Box 1 (Top): Progress & Status */}
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

            {/* Box 2: Tabs [Checklist] & [Trao đổi] */}
            <div className="border border-zinc-200 rounded-lg p-2.5 sm:p-3 bg-zinc-50/40 space-y-2">
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
                <div className="space-y-2">
                  {/* Checklist Items Container: no min-h gap */}
                  <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                    {(!formState.checklist || formState.checklist.length === 0) ? (
                      <div className="text-center py-3 px-2 bg-white rounded-lg border border-dashed border-zinc-300">
                        <p className="text-xs font-semibold text-zinc-600">Chưa có đầu việc con nào</p>
                        <p className="text-[11px] text-zinc-400 mt-0.5">Thêm việc con ở form ngay bên dưới ↓</p>
                      </div>
                    ) : (
                      <div className="border border-zinc-200 rounded-lg bg-white overflow-hidden divide-y divide-zinc-100 shadow-2xs">
                        {formState.checklist.map((item) => {
                          const isBeingEvaluated = evaluatingChecklistId === item.id;
                          const diff = item.dueDate ? getDaysDifference(item.dueDate) : null;

                          return (
                            <div
                              key={item.id}
                              className={`p-2 transition-colors ${
                                item.completed ? 'bg-zinc-50/50' : 'hover:bg-zinc-50/80'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2 text-xs">
                                {/* Checkbox + Text (Nội dung - Tên người - Thời hạn) */}
                                <div className="flex items-start gap-2 min-w-0 flex-1">
                                  <button
                                    type="button"
                                    disabled={!canEditChecklist}
                                    onClick={() => handleToggleChecklist(item.id)}
                                    className="mt-0.5 shrink-0 text-zinc-400 hover:text-zinc-700 cursor-pointer"
                                  >
                                    {item.completed ? (
                                      <CheckSquare className="w-4 h-4 text-emerald-600" />
                                    ) : (
                                      <Square className="w-4 h-4 text-zinc-400" />
                                    )}
                                  </button>

                                  <div className="min-w-0 flex-1 leading-snug">
                                    <span
                                      className={`font-medium ${
                                        item.completed
                                          ? 'line-through text-zinc-400 font-normal'
                                          : 'text-zinc-900'
                                      }`}
                                    >
                                      {item.title}
                                    </span>

                                    {item.assignee && (
                                      <span className={`text-[11px] ${item.completed ? 'text-zinc-400' : 'text-zinc-500'}`}>
                                        {' '}— <span className={`font-medium ${item.completed ? 'text-zinc-500' : 'text-zinc-700'}`}>{item.assignee}</span>
                                      </span>
                                    )}

                                    {item.dueDate && (
                                      <span
                                        className={`text-[11px] ml-1 ${
                                          item.completed
                                            ? 'text-zinc-400'
                                            : diff !== null && diff < 0
                                            ? 'text-rose-600 font-semibold'
                                            : diff === 0
                                            ? 'text-amber-600 font-bold'
                                            : 'text-zinc-500 font-medium'
                                        }`}
                                      >
                                        — {item.completed
                                            ? formatVietnameseDate(item.dueDate)
                                            : diff !== null && diff < 0
                                            ? `Trễ ${Math.abs(diff)} ngày (${formatVietnameseDate(item.dueDate)})`
                                            : diff === 0
                                            ? `Hôm nay (${formatVietnameseDate(item.dueDate)})`
                                            : formatVietnameseDate(item.dueDate)}
                                      </span>
                                    )}

                                    {/* Nhãn hoàn thành / Đánh giá */}
                                    {item.completed ? (
                                      <span className="ml-1.5 inline-block text-[10px] font-semibold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        {item.evaluationStatus === 'Dat' || !item.evaluationStatus || item.evaluationStatus === 'Chua_Danh_Gia'
                                          ? 'Đã hoàn thành'
                                          : item.evaluationStatus === 'Yeu_Cau_Sua'
                                          ? 'Yêu cầu sửa'
                                          : 'Cần bổ sung'}
                                      </span>
                                    ) : (
                                      item.evaluationStatus && item.evaluationStatus !== 'Chua_Danh_Gia' && (
                                        <span
                                          className={`ml-1.5 inline-block text-[10px] font-semibold px-1.5 py-0.2 rounded border ${
                                            item.evaluationStatus === 'Dat'
                                              ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                                              : item.evaluationStatus === 'Yeu_Cau_Sua'
                                              ? 'text-rose-700 bg-rose-50 border-rose-200'
                                              : 'text-amber-800 bg-amber-50 border-amber-200'
                                          }`}
                                        >
                                          {item.evaluationStatus === 'Dat'
                                            ? 'Đạt'
                                            : item.evaluationStatus === 'Yeu_Cau_Sua'
                                            ? 'Yêu cầu sửa'
                                            : 'Cần bổ sung'}
                                        </span>
                                      )
                                    )}
                                  </div>
                                </div>

                                {/* Right: Action buttons (Đánh giá, Xóa) */}
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEvaluation(item)}
                                    className={`px-1.5 py-0.5 text-[10px] font-medium rounded border cursor-pointer transition-colors ${
                                      isBeingEvaluated
                                        ? 'bg-zinc-900 text-white border-zinc-900'
                                        : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-600 border-zinc-200'
                                    }`}
                                    title="Đánh giá chất lượng thực thi"
                                  >
                                    Đánh giá
                                  </button>

                                  {canEditChecklist && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveChecklistItem(item.id)}
                                      className="text-zinc-400 hover:text-rose-600 p-0.5 rounded cursor-pointer transition-colors"
                                      title="Xóa đầu việc này"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Nhận xét đánh giá nếu có */}
                              {item.evaluationNote && (
                                <div className="ml-6 mt-1 text-[11px] text-zinc-600 italic flex items-start gap-1">
                                  <MessageSquareQuote className="w-3 h-3 text-zinc-400 shrink-0 mt-0.5" />
                                  <span>
                                    "{item.evaluationNote}"
                                    {item.evaluator && (
                                      <span className="text-[10px] text-zinc-400 not-italic ml-1">
                                        — {item.evaluator} {item.evaluatedAt ? `(${item.evaluatedAt})` : ''}
                                      </span>
                                    )}
                                  </span>
                                </div>
                              )}

                              {/* Inline Evaluation Panel */}
                              {isBeingEvaluated && (
                                <div className="mt-2 p-2 rounded-lg border border-zinc-300 bg-zinc-50/90 space-y-2 animate-in fade-in duration-150">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1">
                                      <Award className="w-3 h-3 text-zinc-800" />
                                      Đánh giá chất lượng thực thi
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => setEvaluatingChecklistId(null)}
                                      className="text-zinc-400 hover:text-zinc-700 text-xs cursor-pointer font-bold"
                                    >
                                      ✕ Đóng
                                    </button>
                                  </div>

                                  {/* 4 Trạng thái đánh giá */}
                                  <div className="grid grid-cols-2 gap-1 sm:grid-cols-4">
                                    {[
                                      { id: 'Dat', label: 'Đạt', style: 'text-emerald-700 bg-emerald-50 border-emerald-300' },
                                      { id: 'Yeu_Cau_Sua', label: 'Yêu cầu sửa', style: 'text-rose-700 bg-rose-50 border-rose-300' },
                                      { id: 'Can_Bo_Sung', label: 'Cần bổ sung', style: 'text-amber-800 bg-amber-50 border-amber-300' },
                                      { id: 'Chua_Danh_Gia', label: 'Chưa ĐG', style: 'text-slate-700 bg-slate-100 border-slate-300' },
                                    ].map((opt) => (
                                      <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => setEvalStatus(opt.id as ChecklistEvaluationStatus)}
                                        className={`py-1 px-1 rounded text-[10px] font-semibold border text-center transition-all cursor-pointer ${
                                          evalStatus === opt.id
                                            ? `${opt.style} ring-2 ring-zinc-900 shadow-2xs font-bold`
                                            : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-100'
                                        }`}
                                      >
                                        {opt.label}
                                      </button>
                                    ))}
                                  </div>

                                  {/* Nhận xét đánh giá */}
                                  <div>
                                    <textarea
                                      value={evalNote}
                                      onChange={(e) => setEvalNote(e.target.value)}
                                      rows={2}
                                      placeholder="Nhập nhận xét chất lượng, lý do yêu cầu sửa đổi..."
                                      className="w-full text-xs p-1.5 rounded border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-zinc-900"
                                    />
                                  </div>

                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => setEvaluatingChecklistId(null)}
                                      className="px-2 py-1 text-xs text-zinc-600 hover:text-zinc-900 rounded cursor-pointer"
                                    >
                                      Hủy
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleSaveEvaluation(item.id)}
                                      className="px-2.5 py-1 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded cursor-pointer shadow-2xs"
                                    >
                                      Lưu đánh giá
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Form thêm đầu việc con */}
                  {canEditChecklist && (
                    <div className="pt-2 border-t border-zinc-200 bg-white p-2.5 rounded-lg border border-zinc-200 space-y-2 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-zinc-700 uppercase tracking-wider">
                          + Thêm đầu việc con mới
                        </span>
                        <span className="text-[10px] text-zinc-400">Thời hạn tùy chọn (không bắt buộc)</span>
                      </div>

                      {/* Row 1: Title */}
                      <input
                        type="text"
                        placeholder="Nội dung đầu việc con (vd: Soạn thảo dự thảo, Lấy ý kiến các phòng...)"
                        value={newChecklistTitle}
                        onChange={(e) => setNewChecklistTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddChecklistItem();
                          }
                        }}
                        className="w-full text-xs border border-zinc-300 rounded px-2.5 py-1.5 bg-white text-zinc-900 focus:outline-none focus:border-zinc-900"
                      />

                      {/* Row 2: Assignee + Due Date */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-semibold text-zinc-600 block mb-0.5">
                            Người phụ trách:
                          </label>
                          <select
                            value={newChecklistAssignee}
                            onChange={(e) => setNewChecklistAssignee(e.target.value)}
                            className="w-full text-xs border border-zinc-300 rounded px-2 py-1 bg-white text-zinc-900 focus:outline-none focus:border-zinc-900"
                          >
                            <option value="">-- Tùy chọn người thực hiện --</option>
                            {toChuyenTrachAccounts.length > 0 && (
                              <optgroup label="⭐ Tổ Chuyên trách CĐS">
                                {toChuyenTrachAccounts.map((acc) => (
                                  <option key={acc.email} value={acc.email}>
                                    {acc.hoTen} (Tổ CĐS)
                                  </option>
                                ))}
                              </optgroup>
                            )}
                            {relatedUnitAccounts.length > 0 && (
                              <optgroup label="🏢 Đơn vị chủ trì / phối hợp">
                                {relatedUnitAccounts.map((acc) => (
                                  <option key={acc.email} value={acc.email}>
                                    {acc.hoTen} ({acc.donVi})
                                  </option>
                                ))}
                              </optgroup>
                            )}
                            {otherAccounts.length > 0 && (
                              <optgroup label="👥 Cán bộ / Giảng viên khác">
                                {otherAccounts.map((acc) => (
                                  <option key={acc.email} value={acc.email}>
                                    {acc.hoTen} ({acc.donVi})
                                  </option>
                                ))}
                              </optgroup>
                            )}
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] font-semibold text-zinc-600 block mb-0.5">
                            Hạn hoàn thành (tùy chọn):
                          </label>
                          <input
                            type="date"
                            value={newChecklistDueDate}
                            onChange={(e) => setNewChecklistDueDate(e.target.value)}
                            className="w-full text-xs border border-zinc-300 rounded px-2 py-1 bg-white text-zinc-900 focus:outline-none focus:border-zinc-900"
                          />
                        </div>
                      </div>

                      {/* Row 3: Submit button */}
                      <div className="flex justify-end pt-0.5">
                        <button
                          type="button"
                          onClick={handleAddChecklistItem}
                          disabled={!newChecklistTitle.trim()}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded disabled:opacity-40 flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Thêm việc con</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Tab 2: Comments */
                <div className="space-y-1.5">
                  <div className="space-y-1 max-h-[380px] overflow-y-auto pr-0.5">
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
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-500 rounded shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {isSaving ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>{isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
            </button>
          </div>
        </div>

      </div>
    );

  if (isFullPage) {
    return modalContent;
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/50 p-0 sm:p-4 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      {modalContent}
    </div>
  );
};
