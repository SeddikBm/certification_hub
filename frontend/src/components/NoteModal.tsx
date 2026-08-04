interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  user?: string;
  notes: string;
}

export function NoteModal({ isOpen, onClose, title, user, notes }: NoteModalProps) {
  if (!isOpen) return null;

  // Prevent subtitle replication if user and title are the same or similar
  const showUserSubtitle = user && user.trim().toLowerCase() !== title.trim().toLowerCase();

  return (
    <div 
      className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-lg w-full p-6 sm:p-7 space-y-5 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center shrink-0 shadow-2xs">
              <span className="material-symbols-outlined text-[22px] text-indigo-600">sticky_note_2</span>
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-extrabold text-gray-900 leading-snug truncate" title={title}>
                {title}
              </h3>
              {showUserSubtitle && (
                <p className="text-xs text-gray-500 font-medium truncate">
                  Collaborateur : <span className="font-bold text-gray-700">{user}</span>
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Content Box */}
        <div className="bg-indigo-50/40 rounded-2xl p-4 border border-indigo-100/70 space-y-2">
          <span className="text-[11px] font-mono font-extrabold text-indigo-700 uppercase tracking-wider block flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[15px]">chat</span>
            <span>Note / Motivation transmise :</span>
          </span>
          <p className="text-xs text-gray-800 leading-relaxed font-medium whitespace-pre-wrap">
            {notes}
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
