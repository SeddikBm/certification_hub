import React, { useState } from 'react';
import clsx from 'clsx';

interface ScheduleExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (examDate: string) => void;
  itemName?: string;
  targetDate?: string;
  isPending?: boolean;
}

export function ScheduleExamModal({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  targetDate,
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
    if (targetDate && new Date(examDate) > new Date(targetDate)) {
      setError('La date d\'examen ne peut pas dépasser la date cible fixée par le Career Manager.');
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
              max={targetDate ? targetDate.split('T')[0] : undefined}
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

          {targetDate ? (
            <div className="text-[11px] text-blue-800 leading-relaxed bg-blue-50/80 p-3 rounded-xl border border-blue-200/80 space-y-1">
              <div className="font-bold flex items-center gap-1 text-blue-900">
                <span className="material-symbols-outlined text-[15px]">info</span>
                <span>Information importante :</span>
              </div>
              <p>
                La date d'examen ne doit pas dépasser la date cible fixée par votre Career Manager. Une fois enregistrée, elle sera automatiquement transmise à votre CM.
              </p>
            </div>
          ) : (
            <div className="text-[11px] text-blue-800 leading-relaxed bg-blue-50/80 p-3 rounded-xl border border-blue-200/80 space-y-1">
              <div className="font-bold flex items-center gap-1 text-blue-900">
                <span className="material-symbols-outlined text-[15px]">info</span>
                <span>Recommandation :</span>
              </div>
              <p>
                Aucune date cible n'a été imposée. Choisissez une date d'examen vous laissant suffisamment de temps pour réviser et réussir votre certification.
              </p>
            </div>
          )}

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
