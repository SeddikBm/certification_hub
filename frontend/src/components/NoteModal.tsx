interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  user?: string;
  notes: string;
}

export function NoteModal({ isOpen, onClose, title, user, notes }: NoteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-lg w-full p-6 sm:p-7 space-y-5 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-50 text-[#b70f30] border border-red-100 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">sticky_note_2</span>
            </div>
            <div>
              <h3 className="text-base font-extrabold text-gray-900 leading-snug">{title}</h3>
              {user && (
                <p className="text-xs text-gray-500 font-medium">Concernant : <span className="font-bold text-gray-700">{user}</span></p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Content Box */}
        <div className="bg-gray-50/80 rounded-2xl p-4 border border-gray-200/80 space-y-2">
          <span className="text-[11px] font-mono font-extrabold text-[#b70f30] uppercase tracking-wider block">
            💬 Note / Motivation transmise :
          </span>
          <p className="text-xs text-gray-800 leading-relaxed font-medium whitespace-pre-wrap">
            {notes}
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
