import React, { useState } from 'react';
import clsx from 'clsx';

interface ScheduleExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (examDate: string) => void;
  itemName?: string;
  isPending?: boolean;
}

export function ScheduleExamModal({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  isPending = false
}: ScheduleExamModalProps) {
  const [examDate, setExamDate] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!examDate) {
      setError('Veuillez sélectionner une date d\'examen.');
      return;
    }
    setError('');
    onConfirm(examDate);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-5 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-red-50 text-[#b70f30]">
              <span className="material-symbols-outlined text-[20px]">edit_calendar</span>
            </span>
            <div>
              <h3 className="text-base font-bold text-gray-900">Programmer la Date d'Examen</h3>
              {itemName && <p className="text-xs text-gray-500 line-clamp-1">{itemName}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-700">
              Date prévue pour l'examen <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={examDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => {
                setExamDate(e.target.value);
                if (error) setError('');
              }}
              className={clsx(
                "w-full p-3 text-xs bg-gray-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 transition-all",
                error ? "border-red-300 focus:ring-red-500/20" : "border-gray-200 focus:ring-[#b70f30]/20 focus:border-[#b70f30]"
              )}
            />
            {error && (
              <p className="text-[11px] text-red-600 font-semibold flex items-center gap-1 mt-1">
                <span className="material-symbols-outlined text-[13px]">error</span>
                <span>{error}</span>
              </p>
            )}
          </div>

          <p className="text-[11px] text-gray-500 leading-relaxed bg-blue-50/60 p-3 rounded-xl border border-blue-100/60">
            Une fois enregistrée, votre date apparaîtra dans votre suivi et alertera votre manager si la date cible approche.
          </p>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#b70f30] hover:bg-red-800 rounded-xl shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isPending ? (
                <span>Enregistrement...</span>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">check</span>
                  <span>Confirmer la Date</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
