import React, { useState, useEffect } from 'react';
import { X, Image as ImageIcon, Sparkles } from 'lucide-react';
import { WishlistItem } from '../../types';
import { parseToCents } from '../../utils/calculations';
import { clientApi } from '../../services/clientApi';

interface WishlistFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (itemData: Partial<WishlistItem>) => Promise<void>;
  editItem?: WishlistItem | null;
}

export const WishlistFormModal: React.FC<WishlistFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editItem,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [targetAmountStr, setTargetAmountStr] = useState('');
  const [currentPriceStr, setCurrentPriceStr] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [description, setDescription] = useState('');
  const [productUrl, setProductUrl] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [targetDate, setTargetDate] = useState('');
  const [imagePath, setImagePath] = useState('');
  const [status, setStatus] = useState<'active' | 'completed' | 'paused' | 'archived'>('active');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editItem) {
      setName(editItem.name);
      setCategory(editItem.category || 'Electronics');
      setTargetAmountStr((editItem.target_amount / 100).toFixed(2));
      setCurrentPriceStr(
        editItem.current_price ? (editItem.current_price / 100).toFixed(2) : ''
      );
      setBrand(editItem.brand || '');
      setModel(editItem.model || '');
      setDescription(editItem.description || '');
      setProductUrl(editItem.product_url || '');
      setPriority(editItem.priority || 'medium');
      setTargetDate(editItem.target_date || '');
      setImagePath(editItem.image_path || '');
      setStatus(editItem.status || 'active');
    } else {
      setName('');
      setCategory('Electronics');
      setTargetAmountStr('');
      setCurrentPriceStr('');
      setBrand('');
      setModel('');
      setDescription('');
      setProductUrl('');
      setPriority('medium');
      setTargetDate('');
      setImagePath('');
      setStatus('active');
    }
    setError(null);
  }, [editItem, isOpen]);

  if (!isOpen) return null;

  const categories = [
    'Electronics',
    'Cameras',
    'Computers',
    'Gaming',
    'Clothing',
    'Travel',
    'Education',
    'Home',
    'Other',
  ];

  const handleSelectImage = async () => {
    try {
      const selected = await clientApi.selectAndSaveImage();
      if (selected) {
        setImagePath(selected);
      }
    } catch (err: any) {
      console.error(err);
      setError('Failed to select and save image');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Item Name is required');
      return;
    }

    const targetCents = parseToCents(targetAmountStr);
    if (targetCents <= 0) {
      setError('Target Savings Goal must be greater than $0.00');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        name: name.trim(),
        category,
        target_amount: targetCents,
        current_price: currentPriceStr ? parseToCents(currentPriceStr) : undefined,
        brand: brand.trim() || undefined,
        model: model.trim() || undefined,
        description: description.trim() || undefined,
        product_url: productUrl.trim() || undefined,
        priority,
        target_date: targetDate || undefined,
        image_path: imagePath || undefined,
        status,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save item');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-2xl animate-in fade-in duration-200">
      <div className="w-full max-w-2xl max-h-[90vh] bg-[#0c0d12] border border-white/[0.09] rounded-[2rem] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-8 py-5 border-b border-white/[0.05] flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="w-9 h-9 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-editorial text-lg text-white font-normal">
                {editItem ? 'Edit Collection Item.' : 'Add Collection Item.'}
              </h3>
              <p className="text-[11px] text-neutral-400 font-normal">
                Curate a new purchase target and savings plan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body - Purged all "e.g." text */}
        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto space-y-5">
          {error && (
            <div className="p-3.5 bg-red-950/60 border border-red-500/30 rounded-2xl text-red-300 text-[12px]">
              {error}
            </div>
          )}

          {/* Name & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] uppercase tracking-wider font-medium text-neutral-400 mb-1.5">
                Item Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Sony a6000 Camera"
                required
                className="w-full bg-black/60 border border-white/10 focus:border-white/30 rounded-2xl px-4 py-2.5 text-[13px] text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wider font-medium text-neutral-400 mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-black/60 border border-white/10 focus:border-white/30 rounded-2xl px-4 py-2.5 text-[13px] text-white focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Target Price & Current Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] uppercase tracking-wider font-medium text-neutral-400 mb-1.5">
                Target Savings Goal ($) *
              </label>
              <input
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={targetAmountStr}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9.]/g, '');
                  const parts = val.split('.');
                  const clean = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : val;
                  setTargetAmountStr(clean);
                }}
                placeholder="200.00"
                required
                className="w-full bg-black/60 border border-white/10 focus:border-white/30 rounded-2xl px-4 py-2.5 text-[15px] font-semibold text-white focus:outline-none cursor-text select-text"
              />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wider font-medium text-neutral-400 mb-1.5">
                Market Price ($) (Optional)
              </label>
              <input
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={currentPriceStr}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9.]/g, '');
                  const parts = val.split('.');
                  const clean = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : val;
                  setCurrentPriceStr(clean);
                }}
                placeholder="249.00"
                className="w-full bg-black/60 border border-white/10 focus:border-white/30 rounded-2xl px-4 py-2.5 text-[13px] text-white focus:outline-none cursor-text select-text"
              />
            </div>
          </div>

          {/* Image Selection & Preview */}
          <div>
            <label className="block text-[11px] uppercase tracking-wider font-medium text-neutral-400 mb-1.5">
              Product Visual
            </label>
            <div className="flex items-center space-x-4 p-3.5 rounded-2xl border border-white/[0.06] bg-black/40">
              <div className="w-16 h-16 rounded-xl bg-black border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                {imagePath ? (
                  <img src={imagePath} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-6 h-6 text-neutral-600" />
                )}
              </div>
              <div className="flex-1">
                <button
                  type="button"
                  onClick={handleSelectImage}
                  className="px-4 py-2 rounded-full bg-white/[0.08] hover:bg-white/[0.12] text-white text-[12px] font-semibold border border-white/10 transition"
                >
                  Choose Image File...
                </button>
                <p className="text-[11px] text-neutral-500 mt-1.5">
                  Supports PNG, JPG, JPEG, and WebP. Persisted securely in local app storage.
                </p>
              </div>
            </div>
          </div>

          {/* Brand, Model */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] uppercase tracking-wider font-medium text-neutral-400 mb-1.5">
                Brand
              </label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Sony, Apple, Leica..."
                className="w-full bg-black/60 border border-white/10 focus:border-white/30 rounded-2xl px-4 py-2 text-[12px] text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wider font-medium text-neutral-400 mb-1.5">
                Model
              </label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="ILCE-6000L"
                className="w-full bg-black/60 border border-white/10 focus:border-white/30 rounded-2xl px-4 py-2 text-[12px] text-white focus:outline-none"
              />
            </div>
          </div>

          {/* Priority & Target Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] uppercase tracking-wider font-medium text-neutral-400 mb-1.5">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full bg-black/60 border border-white/10 focus:border-white/30 rounded-2xl px-4 py-2 text-[12px] text-white focus:outline-none"
              >
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wider font-medium text-neutral-400 mb-1.5">
                Target Date (Optional)
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full bg-black/60 border border-white/10 focus:border-white/30 rounded-2xl px-4 py-2 text-[12px] text-white focus:outline-none"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] uppercase tracking-wider font-medium text-neutral-400 mb-1.5">
              Description / Motivation Notes
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Why do you desire this item? What mission does it fulfill?"
              className="w-full bg-black/60 border border-white/10 focus:border-white/30 rounded-2xl px-4 py-2.5 text-[12px] text-white focus:outline-none"
            />
          </div>

          {/* Status (if editing) */}
          {editItem && (
            <div>
              <label className="block text-[11px] uppercase tracking-wider font-medium text-neutral-400 mb-1.5">
                Collection Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-black/60 border border-white/10 focus:border-white/30 rounded-2xl px-4 py-2 text-[12px] text-white focus:outline-none"
              >
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="paused">Paused</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          )}

          {/* Form Actions */}
          <div className="pt-3 border-t border-white/[0.05] flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full border border-white/10 text-neutral-400 hover:text-white text-[12px] font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-full bg-white text-black text-[12px] font-semibold hover:bg-neutral-200 active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-white/5"
            >
              {isSubmitting ? 'Saving...' : editItem ? 'Update Item' : 'Add to Collection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
