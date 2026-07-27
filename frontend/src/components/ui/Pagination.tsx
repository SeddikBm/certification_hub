import clsx from 'clsx';

export interface PaginationProps {
  currentPage: number; // 0-indexed
  totalPages: number;
  totalElements: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  itemName?: string;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  totalElements,
  pageSize = 25,
  onPageChange,
  itemName = 'éléments',
  className
}: PaginationProps) {
  // Only display pagination if totalElements > 25 and totalPages > 1
  if (totalElements <= 25 || totalPages <= 1) return null;

  const startItem = totalElements === 0 ? 0 : currentPage * pageSize + 1;
  const endItem = Math.min((currentPage + 1) * pageSize, totalElements);

  // Generate page numbers with ellipses
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 0; i < totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(0);

      let start = Math.max(1, currentPage - 1);
      let end = Math.min(totalPages - 2, currentPage + 1);

      if (currentPage <= 2) {
        end = Math.min(totalPages - 2, 3);
      } else if (currentPage >= totalPages - 3) {
        start = Math.max(1, totalPages - 4);
      }

      if (start > 1) {
        pages.push('...');
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages - 2) {
        pages.push('...');
      }

      pages.push(totalPages - 1);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div
      className={clsx(
        "flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-outline-variant/30 bg-surface-container-lowest text-xs text-on-surface-variant",
        className
      )}
    >
      <div className="font-medium text-gray-600">
        Affichage de <span className="font-bold text-gray-900">{startItem}</span> à{' '}
        <span className="font-bold text-gray-900">{endItem}</span> sur{' '}
        <span className="font-bold text-gray-900">{totalElements}</span> {itemName}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={currentPage === 0}
            onClick={() => onPageChange(currentPage - 1)}
            className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:text-[#b70f30] hover:border-red-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-semibold flex items-center gap-1 shadow-2xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">chevron_left</span>
            <span>Précédent</span>
          </button>

          <div className="flex items-center gap-1">
            {pageNumbers.map((page, index) => {
              if (page === '...') {
                return (
                  <span key={`ellipsis-${index}`} className="px-2 py-1 text-gray-400 font-bold select-none">
                    ...
                  </span>
                );
              }

              const pageNum = page as number;
              const isActive = pageNum === currentPage;

              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => onPageChange(pageNum)}
                  className={clsx(
                    "w-8 h-8 rounded-xl text-xs font-bold transition-all flex items-center justify-center cursor-pointer",
                    isActive
                      ? "bg-[#b70f30] text-white shadow-xs"
                      : "text-gray-600 hover:bg-gray-100 hover:text-[#b70f30]"
                  )}
                >
                  {pageNum + 1}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            disabled={currentPage >= totalPages - 1}
            onClick={() => onPageChange(currentPage + 1)}
            className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:text-[#b70f30] hover:border-red-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-semibold flex items-center gap-1 shadow-2xs cursor-pointer"
          >
            <span>Suivant</span>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          </button>
        </div>
      )}
    </div>
  );
}
