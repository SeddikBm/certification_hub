import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { managerAssignmentService, type CareerManagerHierarchyResponse } from '../services/managerAssignment.service';
import { ManagerCollaboratorsModal } from '../components/ManagerCollaboratorsModal';
import { Pagination } from '../components/ui/Pagination';
import clsx from 'clsx';

export function Hierarchy() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('firstName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState<number>(0);
  const pageSize = 25;

  const [selectedManager, setSelectedManager] = useState<CareerManagerHierarchyResponse | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Fetch Hierarchy Overview (GET /api/v1/manager-assignments/hierarchy)
  const { data: hierarchyPage, isLoading, error } = useQuery({
    queryKey: ['managerHierarchy', { page, pageSize, sortField, sortDirection }],
    queryFn: () => managerAssignmentService.getHierarchyOverview({
      page,
      size: pageSize,
      sort: `${sortField},${sortDirection}`
    })
  });

  // Client-side filtering by search term if provided
  const displayedManagers = useMemo(() => {
    if (!hierarchyPage?.content) return [];
    if (!searchTerm.trim()) return hierarchyPage.content;

    const term = searchTerm.toLowerCase().trim();
    return hierarchyPage.content.filter(m => 
      m.firstName.toLowerCase().includes(term) ||
      m.lastName.toLowerCase().includes(term) ||
      m.email.toLowerCase().includes(term)
    );
  }, [hierarchyPage?.content, searchTerm]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setPage(0);
  };

  const renderSortableHeader = (label: string, field: string) => {
    const isActive = sortField === field;
    return (
      <th 
        className="p-3.5 text-xs text-[#7c2d37] font-bold cursor-pointer hover:bg-red-100/40 transition-colors group select-none"
        onClick={() => handleSort(field)}
      >
        <div className="flex items-center gap-1">
          <span>{label}</span>
          <span className={clsx(
            "material-symbols-outlined text-[16px] transition-all",
            isActive ? "text-[#b70f30] opacity-100" : "text-[#7c2d37] opacity-0 group-hover:opacity-100"
          )}>
            {isActive ? (sortDirection === 'asc' ? 'expand_less' : 'expand_more') : 'unfold_more'}
          </span>
        </div>
      </th>
    );
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 pb-12 relative">
      
      {/* Centered Top Floating Toast Notification */}
      {notification && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[300] max-w-lg w-[90vw] animate-in slide-in-from-top-4 fade-in duration-300">
          <div className={clsx(
            "px-5 py-3 rounded-2xl shadow-xl border flex items-center justify-between gap-3 text-xs font-semibold text-white",
            notification.type === 'success' ? "bg-emerald-600 border-emerald-500" : "bg-[#b70f30] border-red-700"
          )}>
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[20px]">
                {notification.type === 'success' ? 'check_circle' : 'error'}
              </span>
              <span>{notification.message}</span>
            </div>
            <button type="button" onClick={() => setNotification(null)} className="hover:opacity-80 cursor-pointer">
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#111827] tracking-tight">Hiérarchie & Équipes</h1>
        </div>
      </div>

      {/* Filter Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 w-full">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end">
          <div className="md:col-span-6 space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 block">Rechercher un Career Manager</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">search</span>
              <input 
                className="w-full bg-gray-50/50 text-gray-900 border border-gray-200 focus:border-[#b70f30] focus:ring-2 focus:ring-[#b70f30]/10 rounded-xl pl-10 pr-9 py-2.5 text-xs font-medium transition-all placeholder:text-gray-400 outline-none" 
                placeholder="Nom, prénom, email..." 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button 
                  type="button" 
                  onClick={() => setSearchTerm('')} 
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 transition-colors"
                  title="Effacer la recherche"
                >
                  <span className="material-symbols-outlined text-[15px]">close</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-surface rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden relative min-h-[400px]">
        {isLoading && !hierarchyPage && (
          <div className="absolute inset-0 z-10 bg-surface/60 backdrop-blur-xs flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-4 border-red-200 border-t-[#b70f30] rounded-full animate-spin mb-3"></div>
            <p className="text-gray-500 font-medium text-xs">Chargement de la hiérarchie...</p>
          </div>
        )}
        
        {error && !hierarchyPage && (
          <div className="p-12 text-center text-red-600 flex flex-col items-center h-full justify-center">
            <span className="material-symbols-outlined text-[48px] mb-2">error</span>
            <p className="text-xs font-medium">Échec du chargement de la hiérarchie.</p>
          </div>
        )}

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[950px]">
            <thead>
              <tr className="bg-[#fdf4f5] border-b border-red-100">
                {renderSortableHeader("Career Manager", "firstName")}
                {renderSortableHeader("Email", "email")}
                <th className="p-3.5 text-xs text-[#7c2d37] font-bold">Collaborateurs Gérés</th>
                <th className="p-3.5 text-xs text-[#7c2d37] font-bold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayedManagers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-gray-400 text-xs">
                    Aucun Career Manager trouvé.
                  </td>
                </tr>
              ) : (
                displayedManagers.map((m) => {
                  return (
                    <tr 
                      key={m.managerId} 
                      className="hover:bg-[#fcf8f8] transition-colors group border-b border-gray-100"
                    >
                      {/* Career Manager Nom & Prénom */}
                      <td className="p-3.5 pl-6">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center border border-indigo-100">
                            {m.firstName?.[0]}{m.lastName?.[0]}
                          </div>
                          <span className="font-semibold text-gray-900 text-xs">{m.firstName} {m.lastName}</span>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="p-3.5">
                        <span className="font-semibold text-gray-800 text-xs">{m.email}</span>
                      </td>

                      {/* Nombre de Collaborateurs */}
                      <td className="p-3.5">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                          <span className="material-symbols-outlined text-[15px]">groups</span>
                          <span>{m.collaboratorCount} collaborateur(s)</span>
                        </span>
                      </td>

                      {/* Action Button */}
                      <td className="p-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => { setSelectedManager(m); setIsModalOpen(true); }}
                          className="px-3.5 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all flex items-center gap-1.5 mx-auto cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px] text-[#b70f30]">groups</span>
                          <span>Gérer l'équipe</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Unified Modern Pagination (only displays if > 25 elements) */}
        {hierarchyPage && (
          <Pagination
            currentPage={hierarchyPage.number}
            totalPages={hierarchyPage.totalPages}
            totalElements={hierarchyPage.totalElements}
            pageSize={pageSize}
            onPageChange={(newPage) => setPage(newPage)}
            itemName="managers"
          />
        )}

      </div>

      {/* Manage Collaborators Modal */}
      {isModalOpen && selectedManager && (
        <ManagerCollaboratorsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          manager={selectedManager}
          onSuccessNotification={showNotification}
        />
      )}

    </div>
  );
}
