import React, { useState, useEffect } from 'react';
import { X, Plus, Flag, Tag } from 'lucide-react';
import { TaskNQ57, UserAccount, CustomCategory } from '../types';
import { PLAN_GROUPS, DEPARTMENTS } from '../data/initialData';
import { getPriorityMeta } from '../utils/storage';

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (task: TaskNQ57) => void;
  currentUser: UserAccount;
  existingCount: number;
  initialDate?: string;
  categories: CustomCategory[];
  onOpenCategoryManager?: () => void;
}

export const NewTaskModal: React.FC<NewTaskModalProps> = ({
  isOpen,
  onClose,
  onAddTask,
  existingCount,
  initialDate,
  categories,
  onOpenCategoryManager,
}) => {
  if (!isOpen) return null;

  const nextId = `NV${String(existingCount + 1).padStart(2, '0')}`;

  const [id, setId] = useState(nextId);
  const [tenNhiemVu, setTenNhiemVu] = useState('');
  const [nhomKeHoach, setNhomKeHoach] = useState(PLAN_GROUPS[0]);
  const [selectedChuTri, setSelectedChuTri] = useState<string[]>([DEPARTMENTS[17] || 'Văn phòng']);
  const [selectedPhoiHop, setSelectedPhoiHop] = useState<string[]>([]);
  const [customPhoiHop, setCustomPhoiHop] = useState('');
  const [sanPhamDauRa, setSanPhamDauRa] = useState('');
  const [thoiHan, setThoiHan] = useState(initialDate || '2026-09-20');
  const [nguoiPhuTrach, setNguoiPhuTrach] = useState('');
  const [mucDoUuTien, setMucDoUuTien] = useState<'Cao' | 'Trung bình' | 'Bình thường' | 'High' | 'Medium' | 'Low'>('Cao');
  const [selectedCategory, setSelectedCategory] = useState<string>(categories[0]?.id || 'cat_work');
  const [yKienChiDao, setYKienChiDao] = useState('');

  useEffect(() => {
    if (initialDate) {
      setThoiHan(initialDate);
    }
  }, [initialDate]);

  const handleAddChuTri = (dept: string) => {
    if (!selectedChuTri.includes(dept)) {
      setSelectedChuTri([...selectedChuTri, dept]);
    }
  };

  const handleRemoveChuTri = (dept: string) => {
    if (selectedChuTri.length > 1) {
      setSelectedChuTri(selectedChuTri.filter((d) => d !== dept));
    }
  };

  const handleAddPhoiHop = (dept: string) => {
    if (!selectedPhoiHop.includes(dept)) {
      setSelectedPhoiHop([...selectedPhoiHop, dept]);
    }
  };

  const handleRemovePhoiHop = (dept: string) => {
    setSelectedPhoiHop(selectedPhoiHop.filter((d) => d !== dept));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenNhiemVu.trim()) {
      alert('Vui lòng nhập tên nhiệm vụ!');
      return;
    }

    const finalChuTri = selectedChuTri.length > 0 ? selectedChuTri.join(', ') : 'Văn phòng';
    const finalPhoiHop = [...selectedPhoiHop, customPhoiHop.trim()].filter(Boolean).join(', ');

    const newTask: TaskNQ57 = {
      id: id.trim() || nextId,
      nhomKeHoach,
      tenNhiemVu: tenNhiemVu.trim(),
      donViChuTri: finalChuTri,
      donViPhoiHop: finalPhoiHop,
      sanPhamDauRa: sanPhamDauRa.trim(),
      thoiHan,
      trangThai: 'Chưa thực hiện',
      nguoiPhuTrach: nguoiPhuTrach.trim() || 'Trưởng đơn vị',
      emailPhuTrach: '',
      linkMinhChung: '',
      filesMinhChung: [],
      ghiChuNoiBo: '',
      yKienChiDao: yKienChiDao.trim(),
      ngayCapNhat: new Date().toISOString(),
      tiendo: 0,
      mucDoUuTien,
      category: selectedCategory,
    };

    onAddTask(newTask);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-zinc-200 overflow-hidden flex flex-col max-h-[90vh] text-zinc-900"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-700 flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900">Giao & Lên lịch nhiệm vụ mới</h2>
              <p className="text-[11px] text-zinc-500">
                {initialDate ? `Lên lịch trực tiếp cho ngày ${initialDate}` : 'Bổ sung nhiệm vụ đôn đốc vào hệ thống theo dõi HVU'}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs sm:text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-700 uppercase tracking-wider mb-1">Mã nhiệm vụ</label>
              <input
                type="text"
                value={id}
                onChange={(e) => setId(e.target.value)}
                required
                className="w-full text-xs font-mono font-bold border border-zinc-200 rounded-lg p-2 bg-zinc-50 text-zinc-900 focus:bg-white focus:outline-hidden focus:border-zinc-900"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-zinc-700 uppercase tracking-wider mb-1">Nhóm Kế hoạch</label>
              <select
                value={nhomKeHoach}
                onChange={(e) => setNhomKeHoach(e.target.value)}
                className="w-full text-xs border border-zinc-200 rounded-lg p-2 bg-zinc-50 text-zinc-900 focus:bg-white focus:outline-hidden focus:border-zinc-900"
              >
                {PLAN_GROUPS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-700 uppercase tracking-wider mb-1">Nội dung nhiệm vụ *</label>
            <textarea
              required
              rows={2}
              placeholder="Nhập chi tiết nhiệm vụ cần thực hiện..."
              value={tenNhiemVu}
              onChange={(e) => setTenNhiemVu(e.target.value)}
              className="w-full text-xs border border-zinc-200 rounded-lg p-2.5 bg-zinc-50 text-zinc-900 placeholder-zinc-400 focus:bg-white focus:outline-hidden focus:border-zinc-900"
            />
          </div>

          {/* Multi-Department Selection (Lead and Coordinating) */}
          <div className="p-3.5 bg-zinc-50/80 rounded-xl border border-zinc-200 space-y-3">
            {/* Đơn vị chủ trì (Multi-select) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-zinc-700 uppercase tracking-wider">
                  Đơn vị chủ trì / Đồng chủ trì * <span className="text-zinc-400 font-normal lowercase">(có thể chọn nhiều)</span>
                </label>
              </div>

              <div className="flex flex-wrap gap-1.5 items-center mb-1.5">
                {selectedChuTri.map((dept) => (
                  <span key={dept} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-100 text-blue-900 border border-blue-200">
                    <span>{dept}</span>
                    {selectedChuTri.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveChuTri(dept)}
                        className="hover:text-rose-600 ml-0.5 cursor-pointer font-bold"
                      >
                        ×
                      </button>
                    )}
                  </span>
                ))}
                
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAddChuTri(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="text-xs border border-dashed border-blue-400 rounded-lg px-2 py-1 bg-white text-blue-700 hover:border-blue-600 cursor-pointer font-medium"
                  defaultValue=""
                >
                  <option value="" disabled>+ Thêm đơn vị chủ trì</option>
                  {DEPARTMENTS.filter((d) => !selectedChuTri.includes(d)).map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Đơn vị phối hợp (Multi-select) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-zinc-700 uppercase tracking-wider">
                  Đơn vị phối hợp <span className="text-zinc-400 font-normal lowercase">(chọn một hoặc nhiều đơn vị)</span>
                </label>
              </div>

              <div className="flex flex-wrap gap-1.5 items-center mb-2">
                {selectedPhoiHop.map((dept) => (
                  <span key={dept} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-100 text-amber-900 border border-amber-200">
                    <span>{dept}</span>
                    <button
                      type="button"
                      onClick={() => handleRemovePhoiHop(dept)}
                      className="hover:text-rose-600 ml-0.5 cursor-pointer font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))}

                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAddPhoiHop(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="text-xs border border-dashed border-amber-400 rounded-lg px-2 py-1 bg-white text-amber-800 hover:border-amber-600 cursor-pointer font-medium"
                  defaultValue=""
                >
                  <option value="" disabled>+ Chọn đơn vị phối hợp</option>
                  {DEPARTMENTS.filter((d) => !selectedPhoiHop.includes(d)).map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => handleAddPhoiHop('Các đơn vị thuộc và trực thuộc')}
                  className="text-[11px] px-2 py-1 rounded-lg bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-100 cursor-pointer"
                >
                  + Các đơn vị trực thuộc
                </button>
                <button
                  type="button"
                  onClick={() => handleAddPhoiHop('Toàn trường')}
                  className="text-[11px] px-2 py-1 rounded-lg bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-100 cursor-pointer"
                >
                  + Toàn trường
                </button>
              </div>

              <input
                type="text"
                placeholder="Hoặc nhập thêm đơn vị phối hợp tự do..."
                value={customPhoiHop}
                onChange={(e) => setCustomPhoiHop(e.target.value)}
                className="w-full text-xs border border-zinc-200 rounded-lg p-2 bg-white text-zinc-900 placeholder-zinc-400 focus:outline-hidden focus:border-zinc-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-700 uppercase tracking-wider mb-1">Người phụ trách</label>
              <input
                type="text"
                placeholder="Họ tên cán bộ phụ trách"
                value={nguoiPhuTrach}
                onChange={(e) => setNguoiPhuTrach(e.target.value)}
                className="w-full text-xs border border-zinc-200 rounded-lg p-2 bg-zinc-50 text-zinc-900 placeholder-zinc-400 focus:bg-white focus:outline-hidden focus:border-zinc-900"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-700 uppercase tracking-wider mb-1">Thời hạn hoàn thành *</label>
              <input
                type="date"
                required
                value={thoiHan}
                onChange={(e) => setThoiHan(e.target.value)}
                className="w-full text-xs border border-zinc-200 rounded-lg p-2 bg-zinc-50 text-zinc-900 focus:bg-white focus:outline-hidden focus:border-zinc-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-700 uppercase tracking-wider mb-1">Sản phẩm đầu ra / Minh chứng yêu cầu *</label>
            <input
              type="text"
              required
              placeholder="VD: Quyết định ban hành, Báo cáo tiến độ..."
              value={sanPhamDauRa}
              onChange={(e) => setSanPhamDauRa(e.target.value)}
              className="w-full text-xs border border-zinc-200 rounded-lg p-2 bg-zinc-50 text-zinc-900 placeholder-zinc-400 focus:bg-white focus:outline-hidden focus:border-zinc-900"
            />
          </div>

          {/* Priority & Category Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-zinc-50/70 p-3 rounded-xl border border-zinc-200/80">
            {/* Priority Selection */}
            <div>
              <label className="block text-[11px] font-semibold text-zinc-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Flag className="w-3.5 h-3.5 text-zinc-500" />
                Mức độ ưu tiên *
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['Cao', 'Trung bình', 'Bình thường'] as const).map((p) => {
                  const meta = getPriorityMeta(p);
                  const isSelected = mucDoUuTien === p || (p === 'Bình thường' && mucDoUuTien === 'Low') || (p === 'Cao' && mucDoUuTien === 'High') || (p === 'Trung bình' && mucDoUuTien === 'Medium');
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setMucDoUuTien(p)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                        isSelected
                          ? `${meta.badgeClass} ring-1 ring-zinc-900 shadow-2xs`
                          : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${meta.dotClass}`} />
                      <span>{p === 'Cao' ? 'Cao' : p === 'Trung bình' ? 'Vừa' : 'Thấp'}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Category Selection */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-semibold text-zinc-700 uppercase tracking-wider flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-zinc-500" />
                  Danh mục
                </label>
                {onOpenCategoryManager && (
                  <button
                    type="button"
                    onClick={onOpenCategoryManager}
                    className="text-[11px] text-zinc-500 hover:text-zinc-900 underline cursor-pointer"
                  >
                    + Quản lý
                  </button>
                )}
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full text-xs border border-zinc-200 rounded-lg p-2 bg-white text-zinc-900 focus:outline-hidden focus:border-zinc-900"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-700 uppercase tracking-wider mb-1">Ý kiến chỉ đạo ban đầu của BGH</label>
            <input
              type="text"
              placeholder="Chỉ đạo trực tiếp của Hiệu trưởng..."
              value={yKienChiDao}
              onChange={(e) => setYKienChiDao(e.target.value)}
              className="w-full text-xs border border-zinc-200 rounded-lg p-2 bg-zinc-50 text-zinc-900 placeholder-zinc-400 focus:bg-white focus:outline-hidden focus:border-zinc-900"
            />
          </div>

          <div className="pt-3 border-t border-zinc-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              Tạo & Giao nhiệm vụ
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
