import React, { useState, useEffect } from 'react';
import { X, ArrowLeft } from '@phosphor-icons/react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  requireTwoStep?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  description,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  isDestructive = true,
  requireTwoStep = true,
  onConfirm,
  onCancel,
}) => {
  const [step, setStep] = useState<1 | 2>(1);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleInitialClick = () => {
    if (requireTwoStep) {
      setStep(2);
    } else {
      onConfirm();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/35 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md confirm-modal-card bg-[#0c0d12]/75 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-2xl p-7 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between">
          <h3 className="font-editorial text-xl font-normal text-white tracking-tight">
            {step === 1 ? title : 'Are you sure?'}
          </h3>
          <button
            onClick={onCancel}
            className="text-neutral-400 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-2.5">
          <p className="text-xs text-neutral-400 leading-relaxed font-normal">
            {step === 1
              ? description
              : 'Please confirm you want to proceed. This action will permanently remove the record and cannot be undone.'}
          </p>
        </div>

        <div className="mt-7 flex items-center justify-end space-x-3">
          {step === 1 ? (
            <>
              <button
                type="button"
                onClick={onCancel}
                className="px-5 py-2.5 rounded-full border border-white/10 text-neutral-300 hover:text-white text-xs font-medium transition hover:bg-white/5"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={handleInitialClick}
                className={`px-5 py-2.5 rounded-full text-xs font-semibold shadow-lg active:scale-95 transition ${
                  isDestructive
                    ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20'
                    : 'bg-white hover:bg-neutral-200 text-black shadow-white/10'
                }`}
              >
                {confirmLabel}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-5 py-2.5 rounded-full border border-white/10 text-neutral-300 hover:text-white text-xs font-medium transition hover:bg-white/5 flex items-center space-x-1.5"
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="px-5 py-2.5 rounded-full text-xs font-semibold shadow-lg active:scale-95 transition bg-red-600 hover:bg-red-700 text-white shadow-red-600/30 ring-2 ring-red-500/50"
              >
                Confirm Delete
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
