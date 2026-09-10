import React, { useState } from 'react';
import { X, Plus, Trash2, Tag, Check, Palette } from 'lucide-react';
import { CustomCategory } from '../types';
import { getCategoryBadgeClass } from '../utils/storage';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CustomCategory[];
  onSaveCategories: (categories: CustomCategory[]) => void;
  taskCountsByCategory?: Record<string, number>;
}

const AVAILABLE_COLORS = [
  { id: 'blue', name: 'Xanh dương', bg: 'bg-blue-500' },
  { id: 'purple', name: 'Tím', bg: 'bg-purple-500' },
  { id: 'emerald', name: 'Xanh lục', bg: 'bg-emerald-500' },
  { id: 'amber', name: 'Vàng cam', bg: 'bg-amber-500' },
  { id: 'rose', name: 'Đỏ hồng', bg: 'bg-rose-500' },
  { id: 'cyan', name: 'Xanh ngọc', bg: 'bg-cyan-500' },
  { id: 'indigo', name: 'Chàm', bg: 'bg-indigo-500' },
];

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  onClose,
  categories,
  onSaveCategories,
  taskCountsByCategory = {},
}) => {
  if (!isOpen) return null;

  const [categoryList, setCategoryList] = useState<CustomCategory[]>(categories);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('blue');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      setErrorMsg('Vui lòng nhập tên danh mục');
      return;
    }

    if (categoryList.some((c) => c.name.toLowerCase() === newCatName.trim().toLowerCase())) {
      setErrorMsg('Danh mục này đã tồn tại');
      return;
    }

    const newCat: CustomCategory = {
      id: 'cat_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 5),
      name: newCatName.trim(),
      color: newCatColor,
      description: newCatDesc.trim() || undefined,
    };

    const updated = [...categoryList, newCat];
    setCategoryList(updated);
    onSaveCategories(updated);
    setNewCatName('');
    setNewCatDesc('');
    setErrorMsg('');
  };

  const handleDeleteCategory = (catId: string) => {
    if (categoryList.length <= 1) {
      alert('Phải giữ lại ít nhất 1 danh mục phân loại!');
      return;
    }
    const updated = categoryList.filter((c) => c.id !== catId);
    setCategoryList(updated);
    onSaveCategories(updated);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 p-0 sm:p-4 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-lg h-full sm:h-auto sm:max-h-[85vh] rounded-none sm:rounded-2xl shadow-xl border-0 sm:border border-zinc-200 overflow-hidden flex flex-col text-zinc-900"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-700 flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900">Quản lý Danh mục (Categories)</h2>
              <p className="text-[11px] text-zinc-500">
                Tùy biến nhãn phân loại (Personal, Work, Study...)
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs sm:text-sm">
          
          {/* Add New Category Box */}
          <form onSubmit={handleAddCategory} className="bg-zinc-50/70 p-3.5 rounded-xl border border-zinc-200/80 space-y-3">
            <h3 className="text-[11px] font-semibold text-zinc-700 uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-zinc-500" />
              Tạo danh mục mới
            </h3>

            {errorMsg && (
              <p className="text-xs text-rose-700 bg-rose-50 p-2 rounded-lg border border-rose-200 font-medium">
                {errorMsg}
              </p>
            )}

            <div className="space-y-2.5">
              <div>
                <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                  Tên danh mục (ví dụ: Personal, Work, Study...) *
                </label>
                <input
                  type="text"
                  placeholder="Nhập tên danh mục..."
                  value={newCatName}
                  onChange={(e) => {
                    setNewCatName(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  className="w-full text-xs border border-zinc-200 rounded-lg p-2 bg-white text-zinc-900 placeholder-zinc-400 focus:outline-hidden focus:border-zinc-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-600 mb-1 flex items-center gap-1">
                  <Palette className="w-3.5 h-3.5" />
                  Màu sắc
                </label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {AVAILABLE_COLORS.map((col) => (
                    <button
                      key={col.id}
                      type="button"
                      onClick={() => setNewCatColor(col.id)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                        newCatColor === col.id
                          ? 'bg-zinc-900 text-white border-zinc-900 shadow-2xs'
                          : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${col.bg}`} />
                      <span>{col.name}</span>
                      {newCatColor === col.id && <Check className="w-3 h-3 ml-0.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                  Mô tả ngắn (tùy chọn)
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Công việc cá nhân tự theo dõi..."
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  className="w-full text-xs border border-zinc-200 rounded-lg p-2 bg-white text-zinc-900 placeholder-zinc-400 focus:outline-hidden focus:border-zinc-900"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg shadow-xs flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm danh mục</span>
                </button>
              </div>
            </div>
          </form>

          {/* Existing Categories List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                Danh sách danh mục ({categoryList.length})
              </h3>
            </div>

            <div className="space-y-1.5">
              {categoryList.map((cat) => {
                const count = taskCountsByCategory[cat.id] || taskCountsByCategory[cat.name] || 0;
                const badgeStyle = getCategoryBadgeClass(cat.color);

                return (
                  <div
                    key={cat.id}
                    className="p-2.5 bg-zinc-50/60 rounded-xl border border-zinc-200/80 flex items-center justify-between gap-3 hover:bg-zinc-100/50 transition-all"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium border ${badgeStyle}`}>
                        {cat.name}
                      </span>
                      {cat.description && (
                        <p className="text-xs text-zinc-500 truncate hidden sm:block">
                          {cat.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-white text-zinc-600 border border-zinc-200 font-medium">
                        {count} nhiệm vụ
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="p-1 text-zinc-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                        title="Xóa danh mục"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

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
