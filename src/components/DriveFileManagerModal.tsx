import React, { useState } from 'react';
import { 
  X, 
  FileText, 
  Download, 
  Search, 
  HardDrive,
  FolderOpen,
} from 'lucide-react';
import { TaskNQ57, EvidenceFile } from '../types';
import { formatFileSize, formatVietnameseDate } from '../utils/dateUtils';
import { DEPARTMENTS } from '../data/initialData';

interface DriveFileManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: TaskNQ57[];
  onSelectTask: (task: TaskNQ57) => void;
}

export const DriveFileManagerModal: React.FC<DriveFileManagerModalProps> = ({
  isOpen,
  onClose,
  tasks,
  onSelectTask,
}) => {
  if (!isOpen) return null;

  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Collect all files from all tasks
  const allFiles: { file: EvidenceFile; task: TaskNQ57 }[] = [];
  tasks.forEach((task) => {
    (task.filesMinhChung || []).forEach((file) => {
      allFiles.push({ file, task });
    });
  });

  const filteredFiles = allFiles.filter(({ file, task }) => {
    const matchesDept = selectedDept === 'all' || task.donViChuTri === selectedDept;
    const matchesSearch = 
      file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.tenNhiemVu.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesDept && matchesSearch;
  });

  const totalSize = allFiles.reduce((sum, item) => sum + item.file.size, 0);

  const handleDownload = (file: EvidenceFile) => {
    if (file.fileData) {
      const link = document.createElement('a');
      link.href = file.fileData;
      link.download = file.name;
      link.click();
    } else {
      window.open(file.driveUrl, '_blank');
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-4xl rounded-2xl shadow-xl border border-zinc-200 overflow-hidden flex flex-col max-h-[90vh] text-zinc-900"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-700 flex items-center justify-center">
              <HardDrive className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900">Kho Minh chứng Google Drive Tập trung</h2>
              <p className="text-[11px] text-zinc-500">
                Thư mục gốc: <code className="bg-zinc-100 px-1 py-0.5 rounded text-zinc-700">Google_Drive/HVU_NQ57/</code> • Chuẩn đặt tên: <code className="text-zinc-600">[Mã_NV]_[Tên_Đơn_Vị]_[Tên_File]</code>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar & Filter */}
        <div className="p-3.5 border-b border-zinc-100 bg-zinc-50/50 flex flex-col sm:flex-row gap-2.5 items-center justify-between shrink-0">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-60">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Tìm file theo tên, mã NV..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg text-zinc-900 placeholder-zinc-400 focus:outline-hidden focus:border-zinc-900"
              />
            </div>

            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="text-xs bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-zinc-800 focus:outline-hidden focus:border-zinc-900"
            >
              <option value="all">Tất cả đơn vị ({DEPARTMENTS.length})</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          <div className="text-[11px] text-zinc-500 font-medium">
            Tổng số: <strong className="text-zinc-900">{filteredFiles.length}</strong> files ({formatFileSize(totalSize)})
          </div>
        </div>

        {/* List of Files */}
        <div className="p-6 overflow-y-auto flex-1 space-y-2 text-xs sm:text-sm">
          {filteredFiles.length === 0 ? (
            <div className="text-center py-12 text-zinc-400 space-y-2">
              <FolderOpen className="w-10 h-10 mx-auto opacity-40" />
              <p className="text-xs">Không tìm thấy file minh chứng nào phù hợp điều kiện lọc.</p>
            </div>
          ) : (
            filteredFiles.map(({ file, task }) => (
              <div
                key={file.id}
                className="p-3 rounded-xl border border-zinc-200 bg-white hover:border-zinc-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-700 flex items-center justify-center shrink-0 mt-0.5">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono text-[10px] font-semibold bg-zinc-100 text-zinc-800 px-1.5 py-0.5 rounded border border-zinc-200">
                        {task.id}
                      </span>
                      <span className="text-[11px] font-semibold text-zinc-600 bg-zinc-50 border border-zinc-200 px-1.5 py-0.2 rounded">
                        {task.donViChuTri}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-zinc-900 truncate mt-1" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      {formatFileSize(file.size)} • {formatVietnameseDate(file.uploadDate)} • {file.uploadedBy}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => {
                      onClose();
                      onSelectTask(task);
                    }}
                    className="px-2.5 py-1 text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors cursor-pointer"
                  >
                    Xem nhiệm vụ
                  </button>
                  <button
                    onClick={() => handleDownload(file)}
                    className="px-2.5 py-1 text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    <span>Tải về</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-zinc-100 flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
};
