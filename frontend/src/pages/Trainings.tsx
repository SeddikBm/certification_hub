import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { trainingService, type TrainingResponse } from '../services/training.service';
import { useAuth } from '../contexts/AuthContext';
import { TrainingFormModal } from '../components/TrainingFormModal';
import clsx from 'clsx';

// Smart helper to get icon and color config for ANY provider
const getProviderConfig = (providerName: string) => {
  if (!providerName) return { icon: 'school', bg: 'bg-transparent', text: 'text-gray-500', border: 'border-gray-300' };

  const p = providerName.toLowerCase().trim();

  if (p.includes('aws') || p.includes('amazon')) return { icon: 'dns', bg: 'bg-transparent', text: 'text-[#FF9900]', border: 'border-[#FF9900]' };
  if (p.includes('azure') || p.includes('microsoft')) return { icon: 'grid_view', bg: 'bg-transparent', text: 'text-[#00A4EF]', border: 'border-[#00A4EF]' };
  if (p.includes('gcp') || p.includes('google')) return { icon: 'language', bg: 'bg-transparent', text: 'text-[#4285F4]', border: 'border-[#4285F4]' };
  if (p.includes('udemy')) return { icon: 'play_circle', bg: 'bg-transparent', text: 'text-[#A435F0]', border: 'border-[#A435F0]' };
  if (p.includes('coursera')) return { icon: 'auto_stories', bg: 'bg-transparent', text: 'text-[#0056D2]', border: 'border-[#0056D2]' };
  if (p.includes('pluralsight')) return { icon: 'subscriptions', bg: 'bg-transparent', text: 'text-[#F15B2A]', border: 'border-[#F15B2A]' };

  const dynamicConfigs = [
    { bg: 'bg-transparent', text: 'text-rose-600', border: 'border-rose-500', icon: 'school' },
    { bg: 'bg-transparent', text: 'text-blue-600', border: 'border-blue-500', icon: 'workspace_premium' },
    { bg: 'bg-transparent', text: 'text-emerald-600', border: 'border-emerald-500', icon: 'menu_book' },
    { bg: 'bg-transparent', text: 'text-amber-600', border: 'border-amber-500', icon: 'local_library' },
    { bg: 'bg-transparent', text: 'text-purple-600', border: 'border-purple-500', icon: 'cast_for_education' },
  ];

  let hash = 0;
  for (let i = 0; i < p.length; i++) {
    hash = p.charCodeAt(i) + ((hash << 5) - hash);
  }
  return dynamicConfigs[Math.abs(hash) % dynamicConfigs.length];
};

export function Trainings() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [providerFilter, setProviderFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  
  const [sortField, setSortField] = useState<string>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState<number>(0);
  const pageSize = 10;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [trainingToEdit, setTrainingToEdit] = useState<TrainingResponse | null>(null);

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState<TrainingResponse | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  useEffect(() => {
    if (location.state?.notification) {
      showNotification(location.state.notification.type, location.state.notification.message);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const canManage = user?.role === 'ADMIN' || user?.role === 'TRAINING_MANAGER';

  // Query Trainings List with proper sorting
  const { data: trainingsPage, isLoading, error } = useQuery({
    queryKey: ['trainings', { page, pageSize, sortField, sortDirection, searchTerm, providerFilter, typeFilter, priorityFilter }],
    queryFn: () => trainingService.getAllTrainings({ 
      page,
      size: pageSize,
      search: searchTerm || undefined,
      provider: providerFilter || undefined,
      type: typeFilter || undefined,
      priority: priorityFilter || undefined,
      sort: `${sortField},${sortDirection}`
    })
  });

  // Unique Providers List
  const providers = Array.from(new Set(trainingsPage?.content.map(t => t.provider).filter(Boolean))) as string[];

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => trainingService.deleteTraining(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainings'] });
      setDeleteTarget(null);
      setDeleteError(null);
      showNotification('success', 'La formation a été supprimée avec succès.');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || "Impossible de supprimer : des collaborateurs sont actuellement assignés à cette formation.";
      setDeleteError(msg);
    }
  });

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

  const renderTypeBadge = (type: string) => {
    switch (type) {
      case 'UDEMY_BUSINESS':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            Udemy Business
          </span>
        );
      case 'INTERNAL':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            Interne
          </span>
        );
      case 'EXTERNAL':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Externe
          </span>
        );
      case 'CONFERENCE':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            Conférence
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-50 text-gray-700 border border-gray-200">
            {type}
          </span>
        );
    }
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

      {/* Page Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#111827] tracking-tight">Catalogue des Formations</h1>
        </div>
        <div className="flex items-center gap-3">
          {canManage && (
            <button 
              type="button"
              className="h-9 px-4 text-xs font-semibold rounded-xl shadow-2xs hover:shadow-md transition-all flex items-center gap-1.5 bg-[#b70f30] text-white hover:bg-red-800 cursor-pointer" 
              onClick={() => { setTrainingToEdit(null); setIsModalOpen(true); }}
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>Ajouter une Formation</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 w-full">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end">
          
          {/* Search Input */}
          <div className="md:col-span-3 space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 block">Recherche rapide</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">search</span>
              <input 
                className="w-full bg-gray-50/50 text-gray-900 border border-gray-200 focus:border-[#b70f30] focus:ring-2 focus:ring-[#b70f30]/10 rounded-xl pl-10 pr-9 py-2.5 text-xs font-medium transition-all placeholder:text-gray-400 outline-none" 
                placeholder="Titre, provider..." 
                type="text"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
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
          
          {/* Provider Filter */}
          <div className="md:col-span-3 space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 block">Provider</label>
            <div className="relative">
              <select 
                className="w-full bg-gray-50/50 text-gray-900 border border-gray-200 focus:border-[#b70f30] focus:ring-2 focus:ring-[#b70f30]/10 rounded-xl pl-3.5 pr-8 py-2.5 text-xs font-medium transition-all appearance-none cursor-pointer outline-none"
                value={providerFilter}
                onChange={(e) => { setProviderFilter(e.target.value); setPage(0); }}
              >
                <option value="">Tous les providers</option>
                {providers.map((p, i) => (
                  <option key={i} value={p}>{p}</option>
                ))}
              </select>
              {providerFilter ? (
                <button 
                  type="button" 
                  onClick={() => setProviderFilter('')} 
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 transition-colors"
                  title="Effacer ce filtre"
                >
                  <span className="material-symbols-outlined text-[15px]">close</span>
                </button>
              ) : (
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-[18px]">expand_more</span>
              )}
            </div>
          </div>

          {/* Type Filter */}
          <div className="md:col-span-3 space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 block">Type</label>
            <div className="relative">
              <select 
                className="w-full bg-gray-50/50 text-gray-900 border border-gray-200 focus:border-[#b70f30] focus:ring-2 focus:ring-[#b70f30]/10 rounded-xl pl-3.5 pr-8 py-2.5 text-xs font-medium transition-all appearance-none cursor-pointer outline-none"
                value={typeFilter}
                onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }}
              >
                <option value="">Tous les types</option>
                <option value="UDEMY_BUSINESS">Udemy Business</option>
                <option value="INTERNAL">Interne</option>
                <option value="EXTERNAL">Externe</option>
                <option value="CONFERENCE">Conférence</option>
              </select>
              {typeFilter ? (
                <button 
                  type="button" 
                  onClick={() => setTypeFilter('')} 
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 transition-colors"
                  title="Effacer ce filtre"
                >
                  <span className="material-symbols-outlined text-[15px]">close</span>
                </button>
              ) : (
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-[18px]">expand_more</span>
              )}
            </div>
          </div>

          {/* Priority Filter */}
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 block">Priorité</label>
            <div className="relative">
              <select 
                className="w-full bg-gray-50/50 text-gray-900 border border-gray-200 focus:border-[#b70f30] focus:ring-2 focus:ring-[#b70f30]/10 rounded-xl pl-3.5 pr-8 py-2.5 text-xs font-medium transition-all appearance-none cursor-pointer outline-none"
                value={priorityFilter}
                onChange={(e) => { setPriorityFilter(e.target.value); setPage(0); }}
              >
                <option value="">Toutes priorités</option>
                <option value="MANDATORY">MANDATORY</option>
                <option value="OPTIONAL">OPTIONAL</option>
              </select>
              {priorityFilter ? (
                <button 
                  type="button" 
                  onClick={() => setPriorityFilter('')} 
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 transition-colors"
                  title="Effacer ce filtre"
                >
                  <span className="material-symbols-outlined text-[15px]">close</span>
                </button>
              ) : (
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-[18px]">expand_more</span>
              )}
            </div>
          </div>

          {/* Dedicated Clear All Filters Button */}
          <div className="md:col-span-1">
            <button 
              type="button" 
              disabled={!(searchTerm || providerFilter || typeFilter || priorityFilter)}
              onClick={() => {
                setSearchTerm('');
                setProviderFilter('');
                setTypeFilter('');
                setPriorityFilter('');
                setPage(0);
              }}
              className={clsx(
                "w-full h-[38px] px-2 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1 shadow-2xs",
                (searchTerm || providerFilter || typeFilter || priorityFilter) 
                  ? "bg-red-50 text-[#b70f30] hover:bg-red-100 border border-red-200 cursor-pointer" 
                  : "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed opacity-50"
              )}
              title="Effacer tous les filtres"
            >
              <span className="material-symbols-outlined text-[16px]">filter_alt_off</span>
              <span className="hidden xl:inline">Effacer</span>
            </button>
          </div>

        </div>
      </div>

      {/* Data Table */}
      <div className="bg-surface rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden relative min-h-[400px]">
        {isLoading && !trainingsPage && (
          <div className="absolute inset-0 z-10 bg-surface/60 backdrop-blur-xs flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-4 border-red-200 border-t-[#b70f30] rounded-full animate-spin mb-3"></div>
            <p className="text-gray-500 font-medium text-xs">Chargement des formations...</p>
          </div>
        )}
        
        {error && !trainingsPage && (
          <div className="p-12 text-center text-red-600 flex flex-col items-center h-full justify-center">
            <span className="material-symbols-outlined text-[48px] mb-2">error</span>
            <p className="text-xs font-medium">Échec du chargement des formations.</p>
          </div>
        )}

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[950px]">
            <thead>
              <tr className="bg-[#fdf4f5] border-b border-red-100">
                {renderSortableHeader("Titre de la Formation", "title")}
                {renderSortableHeader("Type", "type")}
                {renderSortableHeader("Provider", "provider")}
                {renderSortableHeader("Priorité", "priority")}
                {renderSortableHeader("Durée", "durationHours")}
                {renderSortableHeader("Coût", "costUsd")}
                {canManage && <th className="p-3.5 text-xs text-[#7c2d37] font-bold text-center">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {trainingsPage?.content.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 7 : 6} className="p-12 text-center text-gray-400 text-xs">
                    Aucune formation trouvée.
                  </td>
                </tr>
              ) : (
                trainingsPage?.content.map((training) => {
                  const pConfig = getProviderConfig(training.provider || '');
                  return (
                    <tr 
                      key={training.id} 
                      className="hover:bg-[#fcf8f8] transition-colors group cursor-pointer border-b border-gray-100"
                      onClick={() => navigate(`/trainings/${training.id}`)}
                    >
                      <td className="p-3.5 pl-6">
                        <div className="font-semibold text-gray-900 truncate max-w-[320px] group-hover:text-[#b70f30] transition-colors text-xs" title={training.title}>
                          {training.title}
                        </div>
                        {training.metadata?.instructor && (
                          <div className="text-gray-400 text-[11px] mt-0.5">Instructeur: {training.metadata.instructor}</div>
                        )}
                      </td>
                      <td className="p-3.5">
                        {renderTypeBadge(training.type)}
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <span className={clsx("material-symbols-outlined text-[20px]", pConfig.text)}>{pConfig.icon}</span>
                          <span className="text-gray-800 font-semibold text-xs">{training.provider || '-'}</span>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className={clsx("w-2 h-2 rounded-full",
                            training.priority === 'MANDATORY' ? 'bg-[#b70f30]' : 'bg-gray-400'
                          )}></span>
                          <span className="text-[11px] font-semibold tracking-wide uppercase text-gray-700">
                            {training.priority}
                          </span>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className="text-xs font-semibold text-gray-700">
                          {training.durationHours ? `${training.durationHours} h` : '-'}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="text-xs font-semibold text-gray-900">
                          {!training.costUsd || training.costUsd === 0 ? 'Gratuit' : `${training.costUsd.toLocaleString()} MAD`}
                        </span>
                      </td>
                      {canManage && (
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setTrainingToEdit(training); setIsModalOpen(true); }}
                              className="w-7 h-7 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer"
                              title="Éditer la formation"
                            >
                              <span className="material-symbols-outlined text-[17px]">edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setDeleteError(null); setDeleteTarget(training); }}
                              className="w-7 h-7 rounded-lg text-[#b70f30] hover:bg-red-50 flex items-center justify-center transition-colors cursor-pointer"
                              title="Supprimer la formation"
                            >
                              <span className="material-symbols-outlined text-[17px]">delete</span>
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {trainingsPage && trainingsPage.totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between text-xs text-gray-500">
            <div>
              Affichage de {trainingsPage.number * pageSize + 1} à {Math.min((trainingsPage.number + 1) * pageSize, trainingsPage.totalElements)} sur {trainingsPage.totalElements} formations
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={trainingsPage.number === 0}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-semibold cursor-pointer"
              >
                Précédent
              </button>
              <span className="px-2 font-semibold text-gray-700">
                Page {trainingsPage.number + 1} sur {trainingsPage.totalPages}
              </span>
              <button
                type="button"
                disabled={trainingsPage.number >= trainingsPage.totalPages - 1}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-semibold cursor-pointer"
              >
                Suivant
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <TrainingFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          trainingToEdit={trainingToEdit}
          onSuccess={(msg) => {
            showNotification('success', msg);
            queryClient.invalidateQueries({ queryKey: ['trainings'] });
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[440px] p-6 space-y-4 border border-gray-100">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <span className="material-symbols-outlined text-[24px]">warning</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Supprimer la formation ?</h3>
                <p className="text-xs text-gray-500 mt-0.5">Cette action est irréversible.</p>
              </div>
            </div>

            {deleteError ? (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-[#b70f30]">
                {deleteError}
              </div>
            ) : (
              <p className="text-xs text-gray-600 leading-relaxed">
                Êtes-vous sûr de vouloir supprimer la formation <strong className="text-gray-900">{deleteTarget.title}</strong> ?
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => { setDeleteTarget(null); setDeleteError(null); }}
                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
              >
                Fermer
              </button>
              {!deleteError && (
                <button
                  type="button"
                  onClick={() => deleteMutation.mutate(deleteTarget.id)}
                  disabled={deleteMutation.isPending}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#b70f30] hover:bg-red-800 rounded-xl transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {deleteMutation.isPending && <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>}
                  <span>Confirmer la suppression</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
