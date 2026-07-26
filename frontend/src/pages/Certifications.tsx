import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { certificationService } from '../services/certification.service';
import { useAuth } from '../contexts/AuthContext';
import { CertificationFormModal } from '../components/CertificationFormModal';
import clsx from 'clsx';
import { Button } from '../components/ui/Button';

export function Certifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [providerFilter, setProviderFilter] = useState('');
  
  // Pagination & Sorting
  const [page, setPage] = useState(0);
  const [size] = useState(25);
  const [sortField, setSortField] = useState('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [certToEdit, setCertToEdit] = useState<any>(null);

  // Delete Dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [certToDelete, setCertToDelete] = useState<{id: string, name: string} | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  
  // Notification state
  const [notification, setNotification] = useState<{type: 'success'|'error', message: string} | null>(null);

  const showNotification = (type: 'success'|'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const { data: certsPage, isLoading, error, refetch } = useQuery({
    queryKey: ['certifications', { 
      search: searchTerm, 
      difficulty: difficultyFilter, 
      priority: priorityFilter,
      provider: providerFilter,
      page,
      size,
      sort: `${sortField},${sortDir}`
    }],
    queryFn: () => certificationService.getAllCertifications({ 
      search: searchTerm || undefined,
      difficulty: difficultyFilter || undefined,
      priority: priorityFilter || undefined,
      provider: providerFilter || undefined,
      page,
      size,
      sort: `${sortField},${sortDir}`
    }),
    placeholderData: (previousData) => previousData
  });

  const { data: providers = [] } = useQuery({
    queryKey: ['certification-providers'],
    queryFn: () => certificationService.getProviders()
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => certificationService.deleteCertification(id),
    onSuccess: () => {
      setDeleteDialogOpen(false);
      setCertToDelete(null);
      showNotification('success', 'La certification a été supprimée avec succès.');
      refetch();
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || "Impossible de supprimer : des collaborateurs sont actuellement assignés à cette certification.";
      setDeleteError(message);
    }
  });

  const canAdd = user?.role === 'ADMIN' || user?.role === 'TRAINING_MANAGER';

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
    setPage(0);
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return 'unfold_more';
    return sortDir === 'asc' ? 'expand_less' : 'expand_more';
  };

  const renderSortableHeader = (label: string, field: string) => (
    <th 
      className="p-3 text-sm text-on-surface-variant font-semibold cursor-pointer hover:bg-surface-container-low transition-colors group select-none"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        <span className={clsx("material-symbols-outlined text-[16px] transition-colors", sortField === field ? "text-primary" : "text-on-surface-variant opacity-0 group-hover:opacity-100")}>
          {getSortIcon(field)}
        </span>
      </div>
    </th>
  );

  return (
    <div className="max-w-[1400px] mx-auto space-y-stack-md pb-12 relative">
      {/* Toast Notification */}
      {notification && (
        <div className={clsx(
          "fixed bottom-6 right-6 z-[300] px-4 py-3 rounded-md shadow-xl animate-in slide-in-from-bottom-4 duration-300 flex items-center gap-3 min-w-[300px] justify-between",
          notification.type === 'success' ? "bg-[#059669] text-white" : "bg-[#DC2626] text-white"
        )}>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">
              {notification.type === 'success' ? 'check_circle' : 'error'}
            </span>
            <span className="text-[14px] font-medium">{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-white hover:opacity-80 transition-opacity">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}
      {/* Page Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-stack-md">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-1">Catalogue des Certifications</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant">Parcourez, gérez et assignez les certifications à vos équipes.</p>
        </div>
        <div className="flex items-center gap-3">
          {canAdd && (
            <Button className="h-9 px-4 text-[13px] font-medium rounded-lg shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-1 bg-primary text-on-primary hover:-translate-y-0.5" onClick={() => { setCertToEdit(null); setIsModalOpen(true); }}>
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>Ajouter</span>
            </Button>
          )}
        </div>
      </div>

      {/* Filter Card */}
      <div className="bg-surface rounded-xl shadow-sm border border-outline-variant/30 p-stack-md w-full">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-gutter items-end">
          <div className="space-y-1 relative md:col-span-2">
            <label className="font-label-md text-label-md text-on-surface-variant block">Recherche</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
              <input 
                className="w-full bg-surface-container-lowest text-on-surface border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded-xl pl-10 pr-4 py-3 font-body-md text-body-md transition-colors placeholder:text-on-surface-variant" 
                placeholder="Code, nom..." 
                type="text"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
              />
            </div>
          </div>
          
          <div className="space-y-1">
            <label className="font-label-md text-label-md text-on-surface-variant block">Provider</label>
            <div className="relative">
              <select 
                className="w-full bg-surface-container-lowest text-on-surface border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4 py-3 font-body-md text-body-md transition-colors appearance-none cursor-pointer"
                value={providerFilter}
                onChange={(e) => { setProviderFilter(e.target.value); setPage(0); }}
              >
                <option value="">Tous les providers</option>
                {providers.map((p, i) => (
                  <option key={i} value={p}>{p}</option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-label-md text-label-md text-on-surface-variant block">Difficulté</label>
            <div className="relative">
              <select 
                className="w-full bg-surface-container-lowest text-on-surface border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4 py-3 font-body-md text-body-md transition-colors appearance-none cursor-pointer"
                value={difficultyFilter}
                onChange={(e) => { setDifficultyFilter(e.target.value); setPage(0); }}
              >
                <option value="">Toutes les difficultés</option>
                <option value="FOUNDATIONAL">FOUNDATIONAL</option>
                <option value="INTERMEDIATE">INTERMEDIATE</option>
                <option value="ADVANCED">ADVANCED</option>
                <option value="EXPERT">EXPERT</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
            </div>
          </div>
          <div className="space-y-1">
            <label className="font-label-md text-label-md text-on-surface-variant block">Priorité</label>
            <div className="relative">
              <select 
                className="w-full bg-surface-container-lowest text-on-surface border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4 py-3 font-body-md text-body-md transition-colors appearance-none cursor-pointer"
                value={priorityFilter}
                onChange={(e) => { setPriorityFilter(e.target.value); setPage(0); }}
              >
                <option value="">Toutes les priorités</option>
                <option value="MANDATORY">MANDATORY</option>
                <option value="HIGH">HIGH</option>
                <option value="NORMAL">NORMAL</option>
                <option value="ADVANCED">ADVANCED</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-surface rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden relative min-h-[400px]">
        {isLoading && !certsPage && (
          <div className="absolute inset-0 z-10 bg-surface/50 backdrop-blur-sm flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
            <p className="text-on-surface-variant font-medium">Chargement des certifications...</p>
          </div>
        )}
        
        {error && !certsPage && (
          <div className="p-12 text-center text-error flex flex-col items-center h-full justify-center">
            <span className="material-symbols-outlined text-[48px] mb-2">error</span>
            <p>Échec du chargement des certifications.</p>
          </div>
        )}

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[950px]">
            <thead>
              <tr className="bg-surface-container-low/50 border-b border-outline-variant/30">
                {renderSortableHeader("Code & Nom", "name")}
                {renderSortableHeader("Provider", "provider")}
                {renderSortableHeader("Difficulté", "difficulty")}
                {renderSortableHeader("Priorité", "priority")}
                {renderSortableHeader("Coût", "examCostUsd")}
                <th className="p-3 text-sm text-on-surface-variant font-semibold">Note</th>
                <th className="p-3 text-sm text-on-surface-variant font-semibold text-center">Actions</th>
              </tr>
            </thead>
            {certsPage?.content && certsPage.content.length > 0 && (
              <tbody className="text-sm divide-y divide-outline-variant/20 relative">
                {certsPage.content.map((cert) => {
                  const totalCost = (cert.examCostUsd || 0) + (cert.trainingCostUsd || 0);
                  
                  const prov = (cert.provider || '').toLowerCase();
                  let pIcon = 'cloud';
                  let pColor = 'text-primary bg-primary-container/30';
                  if (prov.includes('aws')) { pIcon = 'dns'; pColor = 'text-[#FF9900] bg-[#FF9900]/10 border border-[#FF9900]/20'; }
                  else if (prov.includes('azure') || prov.includes('microsoft')) { pIcon = 'grid_view'; pColor = 'text-[#00A4EF] bg-[#00A4EF]/10 border border-[#00A4EF]/20'; }
                  else if (prov.includes('google')) { pIcon = 'language'; pColor = 'text-[#4285F4] bg-[#4285F4]/10 border border-[#4285F4]/20'; }
                  else if (prov.includes('oracle')) { pIcon = 'data_usage'; pColor = 'text-[#C74634] bg-[#C74634]/10 border border-[#C74634]/20'; }
                  
                  return (
                    <tr key={cert.id} className="hover:bg-surface-container-highest/20 transition-colors group cursor-pointer" onClick={() => window.location.href=`/certifications/${cert.id}`}>
                      <td className="p-3 pl-6">
                        <div className="font-semibold text-on-surface truncate max-w-[250px]" title={cert.name}>{cert.name}</div>
                        <div className="text-on-surface-variant text-xs mt-0.5 font-mono">{cert.code}</div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className={clsx("flex items-center justify-center w-8 h-8 rounded-full shadow-sm", pColor)}>
                             <span className="material-symbols-outlined text-[16px]">{pIcon}</span>
                          </div>
                          <span className="text-on-surface font-medium">{cert.provider || '-'}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={clsx(
                          "inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border uppercase tracking-wider",
                          cert.difficulty === 'FOUNDATIONAL' ? 'bg-secondary/10 text-secondary border-secondary/20' : 
                          cert.difficulty === 'INTERMEDIATE' ? 'bg-primary/10 text-primary border-primary/20' : 
                          cert.difficulty === 'ADVANCED' ? 'bg-tertiary/10 text-tertiary border-tertiary/20' : 
                          cert.difficulty === 'EXPERT' ? 'bg-on-surface-variant/10 text-on-surface-variant border-on-surface-variant/20' :
                          'bg-surface-container text-on-surface-variant border-outline-variant/30'
                        )}>
                          {cert.difficulty}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <span className={clsx("w-2 h-2 rounded-full",
                            cert.priority === 'MANDATORY' ? 'bg-error' : 
                            cert.priority === 'HIGH' ? 'bg-[#FF9800]' : 
                            cert.priority === 'NORMAL' ? 'bg-[#4CAF50]' : 
                            'bg-primary'
                          )}></span>
                          <span className={clsx(
                            "text-[12px] font-bold tracking-wide",
                            cert.priority === 'MANDATORY' ? 'text-error' : 
                            cert.priority === 'HIGH' ? 'text-[#F57C00]' : 
                            cert.priority === 'NORMAL' ? 'text-[#388E3C]' : 
                            'text-primary'
                          )}>
                            {cert.priority}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 font-mono font-medium text-on-surface">
                        {totalCost > 0 ? `$${totalCost}` : <span className="text-on-surface-variant/50">-</span>}
                      </td>
                      <td className="p-3">
                        {cert.averageRating ? (
                          <div className="flex items-center gap-1 text-on-surface font-semibold bg-surface-container-low px-2.5 py-1 rounded-lg w-fit border border-outline-variant/30">
                            <span className="material-symbols-outlined text-[16px] icon-fill text-[#fbbc04]">star</span>
                            {cert.averageRating.toFixed(1)}
                          </div>
                        ) : (
                          <span className="text-on-surface-variant text-xs italic bg-surface-container-lowest px-2.5 py-1 rounded-lg w-fit border border-outline-variant/30">N/A</span>
                        )}
                      </td>
                      <td className="p-3 text-center relative">
                        <div className="flex items-center justify-center gap-2">
                          {canAdd && (
                            <>
                              <button 
                                className="text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-full transition-all p-1.5 opacity-40 group-hover:opacity-100 focus:opacity-100" 
                                title="Modifier"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCertToEdit(cert);
                                  setIsModalOpen(true);
                                }}
                              >
                                <span className="material-symbols-outlined text-[20px]">edit</span>
                              </button>
                              <button 
                                className="text-on-surface-variant hover:text-error hover:bg-error/10 opacity-40 group-hover:opacity-100 focus:opacity-100 rounded-full transition-all p-1.5"
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  setDeleteError(null); 
                                  setCertToDelete({id: cert.id, name: cert.name}); 
                                  setDeleteDialogOpen(true); 
                                }} 
                                title="Supprimer"
                              >
                                <span className="material-symbols-outlined text-[20px]">delete</span>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            )}
            {certsPage?.content && certsPage.content.length === 0 && !isLoading && (
              <tbody>
                <tr>
                  <td colSpan={7} className="p-16 text-center text-on-surface-variant">
                    Aucune certification trouvée.
                  </td>
                </tr>
              </tbody>
            )}
          </table>
        </div>
        
        {/* Pagination */}
        {certsPage && certsPage.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-outline-variant/30 flex items-center justify-between bg-surface-container-lowest rounded-b-xl">
            <span className="text-sm text-on-surface-variant">
              Affichage de <span className="font-medium text-on-surface">{certsPage.content.length}</span> sur <span className="font-medium text-on-surface">{certsPage.totalElements}</span> résultats
            </span>
            <div className="flex items-center gap-1.5">
              <button 
                className="px-3 py-1.5 rounded-md border border-outline-variant/50 text-sm font-medium text-on-surface hover:bg-surface-container-low disabled:opacity-30 transition-colors flex items-center gap-1"
                disabled={certsPage.number === 0} 
                onClick={() => setPage(page - 1)}
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                Précédent
              </button>

              <div className="flex items-center gap-1 mx-2">
                {Array.from({ length: certsPage.totalPages }).map((_, idx) => {
                  // Simplified ellipsis logic for pagination
                  if (certsPage.totalPages > 7) {
                    if (idx !== 0 && idx !== certsPage.totalPages - 1 && Math.abs(idx - certsPage.number) > 1) {
                      if (idx === 1 && certsPage.number > 2) return <span key={idx} className="text-on-surface-variant px-1">...</span>;
                      if (idx === certsPage.totalPages - 2 && certsPage.number < certsPage.totalPages - 3) return <span key={idx} className="text-on-surface-variant px-1">...</span>;
                      return null;
                    }
                  }
                  return (
                    <button
                      key={idx}
                      onClick={() => setPage(idx)}
                      className={clsx(
                        "min-w-[32px] h-8 px-1 flex items-center justify-center rounded-md text-sm font-medium transition-colors",
                        certsPage.number === idx 
                          ? "bg-primary text-white shadow-sm"
                          : "text-on-surface-variant hover:bg-surface-container-low"
                      )}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              <button 
                className="px-3 py-1.5 rounded-md border border-outline-variant/50 text-sm font-medium text-on-surface hover:bg-surface-container-low disabled:opacity-30 transition-colors flex items-center gap-1"
                disabled={certsPage.number >= certsPage.totalPages - 1} 
                onClick={() => setPage(page + 1)}
              >
                Suivant
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Dialog */}
      {deleteDialogOpen && certToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-surface w-full max-w-md rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-bold text-on-surface mb-2">Supprimer la certification</h2>
            <p className="text-on-surface-variant mb-4">
              Êtes-vous sûr de vouloir supprimer <span className="font-semibold text-on-surface">{certToDelete.name}</span> ? Cette action est irréversible.
            </p>
            {deleteError && (
              <div className="bg-error-container/50 text-error p-3 rounded-lg text-sm mb-4 border border-error/20">
                {deleteError}
              </div>
            )}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => { setDeleteDialogOpen(false); setCertToDelete(null); }}>Annuler</Button>
              <Button 
                className={clsx(
                  "text-white transition-colors",
                  deleteError ? "bg-on-surface-variant/30 text-on-surface-variant cursor-not-allowed" : "bg-error hover:bg-error/90"
                )} 
                onClick={() => deleteMutation.mutate(certToDelete.id)} 
                disabled={deleteMutation.isPending || !!deleteError}
              >
                {deleteMutation.isPending ? 'Suppression...' : 'Supprimer'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      <CertificationFormModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setCertToEdit(null); }} 
        certificationToEdit={certToEdit}
        onSuccess={(msg) => showNotification('success', msg)}
      />

    </div>
  );
}
