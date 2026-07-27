import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { certificationService } from '../services/certification.service';
import { useAuth } from '../contexts/AuthContext';
import { CertificationFormModal } from '../components/CertificationFormModal';
import { Pagination } from '../components/ui/Pagination';
import clsx from 'clsx';

// Smart helper to get icon and color config for ANY provider (known or dynamic custom)
const getProviderConfig = (providerName: string) => {
  if (!providerName) return { icon: 'cloud', bg: 'bg-transparent', text: 'text-gray-500', border: 'border-gray-300' };

  const p = providerName.toLowerCase().trim();

  if (p.includes('aws') || p.includes('amazon')) return { icon: 'dns', bg: 'bg-transparent', text: 'text-[#FF9900]', border: 'border-[#FF9900]' };
  if (p.includes('azure') || p.includes('microsoft')) return { icon: 'grid_view', bg: 'bg-transparent', text: 'text-[#00A4EF]', border: 'border-[#00A4EF]' };
  if (p.includes('gcp') || p.includes('google')) return { icon: 'language', bg: 'bg-transparent', text: 'text-[#4285F4]', border: 'border-[#4285F4]' };
  if (p.includes('oracle')) return { icon: 'database', bg: 'bg-transparent', text: 'text-[#C74634]', border: 'border-[#C74634]' };
  if (p.includes('cisco')) return { icon: 'router', bg: 'bg-transparent', text: 'text-[#049FD9]', border: 'border-[#049FD9]' };
  if (p.includes('k8s') || p.includes('kubern')) return { icon: 'layers', bg: 'bg-transparent', text: 'text-[#326CE5]', border: 'border-[#326CE5]' };
  if (p.includes('terraform') || p.includes('hashi')) return { icon: 'token', bg: 'bg-transparent', text: 'text-[#844FBA]', border: 'border-[#844FBA]' };
  if (p.includes('red hat') || p.includes('redhat') || p.includes('linux')) return { icon: 'terminal', bg: 'bg-transparent', text: 'text-[#EE0000]', border: 'border-[#EE0000]' };
  if (p.includes('salesforce')) return { icon: 'cloud_queue', bg: 'bg-transparent', text: 'text-[#00A1E0]', border: 'border-[#00A1E0]' };
  if (p.includes('comptia')) return { icon: 'verified_user', bg: 'bg-transparent', text: 'text-[#C8102E]', border: 'border-[#C8102E]' };
  if (p.includes('docker')) return { icon: 'view_in_ar', bg: 'bg-transparent', text: 'text-[#2496ED]', border: 'border-[#2496ED]' };
  if (p.includes('snowflake')) return { icon: 'ac_unit', bg: 'bg-transparent', text: 'text-[#29B5E8]', border: 'border-[#29B5E8]' };
  if (p.includes('databricks')) return { icon: 'analytics', bg: 'bg-transparent', text: 'text-[#FF3621]', border: 'border-[#FF3621]' };

  // Category based smart fallback
  if (p.includes('cloud') || p.includes('host') || p.includes('net')) {
    return { icon: 'cloud_done', bg: 'bg-transparent', text: 'text-cyan-600', border: 'border-cyan-500' };
  }
  if (p.includes('sec') || p.includes('guard') || p.includes('cyber')) {
    return { icon: 'shield', bg: 'bg-transparent', text: 'text-rose-600', border: 'border-rose-500' };
  }
  if (p.includes('data') || p.includes('db') || p.includes('sql')) {
    return { icon: 'database', bg: 'bg-transparent', text: 'text-indigo-600', border: 'border-indigo-500' };
  }
  if (p.includes('code') || p.includes('dev') || p.includes('soft')) {
    return { icon: 'code', bg: 'bg-transparent', text: 'text-[#b70f30]', border: 'border-[#b70f30]' };
  }

  // Dynamic Hash-based Color & Icon System for ANY new provider
  const dynamicConfigs = [
    { bg: 'bg-transparent', text: 'text-rose-600', border: 'border-rose-500', icon: 'workspace_premium' },
    { bg: 'bg-transparent', text: 'text-blue-600', border: 'border-blue-500', icon: 'verified' },
    { bg: 'bg-transparent', text: 'text-emerald-600', border: 'border-emerald-500', icon: 'stars' },
    { bg: 'bg-transparent', text: 'text-amber-600', border: 'border-amber-500', icon: 'military_tech' },
    { bg: 'bg-transparent', text: 'text-purple-600', border: 'border-purple-500', icon: 'domain' },
    { bg: 'bg-transparent', text: 'text-cyan-600', border: 'border-cyan-500', icon: 'hub' },
  ];
  
  let hash = 0;
  for (let i = 0; i < p.length; i++) {
    hash = p.charCodeAt(i) + ((hash << 5) - hash);
  }
  return dynamicConfigs[Math.abs(hash) % dynamicConfigs.length];
};

export function Certifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
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
    setTimeout(() => setNotification(null), 4000);
  };

  useEffect(() => {
    if (location.state?.notification) {
      showNotification(location.state.notification.type, location.state.notification.message);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

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
      className="p-3.5 text-xs text-[#7c2d37] font-bold cursor-pointer hover:bg-red-100/40 transition-colors group select-none"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        <span>{label}</span>
        <span className={clsx("material-symbols-outlined text-[16px] transition-all", sortField === field ? "text-[#b70f30] opacity-100" : "text-[#7c2d37] opacity-0 group-hover:opacity-100")}>
          {getSortIcon(field)}
        </span>
      </div>
    </th>
  );

  return (
    <div className="max-w-[1400px] mx-auto space-y-stack-md pb-12 relative">
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
          <h1 className="text-2xl font-extrabold text-[#111827] tracking-tight">Catalogue des Certifications</h1>
        </div>
        <div className="flex items-center gap-3">
          {canAdd && (
            <button 
              type="button"
              className="h-9 px-4 text-xs font-semibold rounded-xl shadow-2xs hover:shadow-md transition-all flex items-center gap-1.5 bg-[#b70f30] text-white hover:bg-red-800" 
              onClick={() => { setCertToEdit(null); setIsModalOpen(true); }}
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>Ajouter une Certification</span>
            </button>
          )}
        </div>
      </div>

      {/* Modern Filter Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 w-full">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end">
          
          {/* Search Input */}
          <div className="md:col-span-4 space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 block">Recherche rapide</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">search</span>
              <input 
                className="w-full bg-gray-50/50 text-gray-900 border border-gray-200 focus:border-[#b70f30] focus:ring-2 focus:ring-[#b70f30]/10 rounded-xl pl-10 pr-9 py-2.5 text-xs font-medium transition-all placeholder:text-gray-400 outline-none" 
                placeholder="Rechercher par code, nom..." 
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

          {/* Difficulty Filter */}
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 block">Difficulté</label>
            <div className="relative">
              <select 
                className="w-full bg-gray-50/50 text-gray-900 border border-gray-200 focus:border-[#b70f30] focus:ring-2 focus:ring-[#b70f30]/10 rounded-xl pl-3.5 pr-8 py-2.5 text-xs font-medium transition-all appearance-none cursor-pointer outline-none"
                value={difficultyFilter}
                onChange={(e) => { setDifficultyFilter(e.target.value); setPage(0); }}
              >
                <option value="">Toutes difficultés</option>
                <option value="FOUNDATIONAL">FOUNDATIONAL</option>
                <option value="INTERMEDIATE">INTERMEDIATE</option>
                <option value="ADVANCED">ADVANCED</option>
                <option value="EXPERT">EXPERT</option>
              </select>
              {difficultyFilter ? (
                <button 
                  type="button" 
                  onClick={() => setDifficultyFilter('')} 
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
                <option value="HIGH">HIGH</option>
                <option value="NORMAL">NORMAL</option>
                <option value="ADVANCED">ADVANCED</option>
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
              disabled={!(searchTerm || providerFilter || difficultyFilter || priorityFilter)}
              onClick={() => {
                setSearchTerm('');
                setProviderFilter('');
                setDifficultyFilter('');
                setPriorityFilter('');
                setPage(0);
              }}
              className={clsx(
                "w-full h-[38px] px-2 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1 shadow-2xs",
                (searchTerm || providerFilter || difficultyFilter || priorityFilter) 
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
              <tr className="bg-[#fdf4f5] border-b border-red-100">
                {renderSortableHeader("Code & Nom", "name")}
                {renderSortableHeader("Provider", "provider")}
                {renderSortableHeader("Difficulté", "difficulty")}
                {renderSortableHeader("Priorité", "priority")}
                {renderSortableHeader("Coût", "examCostUsd")}
                <th className="p-3.5 text-xs text-[#7c2d37] font-bold">Note</th>
                <th className="p-3.5 text-xs text-[#7c2d37] font-bold text-center">Actions</th>
              </tr>
            </thead>
            {certsPage?.content && certsPage.content.length > 0 && (
              <tbody className="text-sm divide-y divide-outline-variant/20 relative">
                {certsPage.content.map((cert) => {
                  const totalCost = (cert.examCostUsd || 0) + (cert.trainingCostUsd || 0);
                  const pConfig = getProviderConfig(cert.provider || '');
                  
                  return (
                    <tr key={cert.id} className="hover:bg-[#fcf8f8] transition-colors group cursor-pointer border-b border-gray-100" onClick={() => navigate(`/certifications/${cert.id}`)}>
                      <td className="p-3.5 pl-6">
                        <div className="font-semibold text-gray-900 truncate max-w-[260px] group-hover:text-[#b70f30] transition-colors" title={cert.name}>{cert.name}</div>
                        <div className="text-gray-400 text-xs font-mono mt-0.5">{cert.code}</div>
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <span className={clsx("material-symbols-outlined text-[20px]", pConfig.text)}>{pConfig.icon}</span>
                          <span className="text-gray-800 font-semibold text-xs">{cert.provider || '-'}</span>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className={clsx(
                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border uppercase tracking-wider",
                          cert.difficulty === 'FOUNDATIONAL' ? 'bg-emerald-50/50 text-emerald-700 border-emerald-300' : 
                          cert.difficulty === 'INTERMEDIATE' ? 'bg-sky-50/50 text-sky-700 border-sky-300' : 
                          cert.difficulty === 'ADVANCED' ? 'bg-purple-50/50 text-purple-700 border-purple-300' : 
                          cert.difficulty === 'EXPERT' ? 'bg-rose-50/50 text-rose-700 border-rose-400' :
                          'bg-gray-100 text-gray-700 border-gray-200'
                        )}>
                          {cert.difficulty}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className={clsx("w-2 h-2 rounded-full",
                            cert.priority === 'MANDATORY' ? 'bg-[#b70f30]' : 
                            cert.priority === 'HIGH' ? 'bg-amber-500' : 
                            cert.priority === 'NORMAL' ? 'bg-gray-500' : 
                            'bg-slate-400'
                          )}></span>
                          <span className="text-[11px] font-semibold tracking-wide uppercase text-gray-700">
                            {cert.priority}
                          </span>
                        </div>
                      </td>
                      <td className="p-3.5 font-semibold text-gray-800 text-xs">
                        {totalCost > 0 ? `${totalCost.toLocaleString()} MAD` : <span className="text-gray-300">-</span>}
                      </td>
                      <td className="p-3.5">
                        {cert.averageRating ? (
                          <div className="flex items-center gap-1 text-gray-800 font-semibold bg-amber-50 px-2 py-0.5 rounded-md w-fit border border-amber-200 text-xs">
                            <span className="material-symbols-outlined text-[15px] icon-fill text-amber-500">star</span>
                            {cert.averageRating.toFixed(1)}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs italic bg-gray-50 px-2 py-0.5 rounded-md w-fit border border-gray-200">N/A</span>
                        )}
                      </td>
                      <td className="p-3.5 text-center relative">
                        <div className="flex items-center justify-center gap-1">
                          {canAdd && (
                            <>
                              <button 
                                type="button"
                                className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all flex items-center justify-center" 
                                title="Éditer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCertToEdit(cert);
                                  setIsModalOpen(true);
                                }}
                              >
                                <span className="material-symbols-outlined text-[18px]">edit</span>
                              </button>
                              <button 
                                type="button"
                                className="w-8 h-8 rounded-lg text-gray-400 hover:text-[#b70f30] hover:bg-red-50 transition-all flex items-center justify-center"
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  setDeleteError(null); 
                                  setCertToDelete({id: cert.id, name: cert.name}); 
                                  setDeleteDialogOpen(true); 
                                }} 
                                title="Supprimer"
                              >
                                <span className="material-symbols-outlined text-[18px]">delete</span>
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
        {certsPage && (
          <Pagination
            currentPage={certsPage.number}
            totalPages={certsPage.totalPages}
            totalElements={certsPage.totalElements}
            pageSize={size}
            onPageChange={(newPage) => setPage(newPage)}
            itemName="certifications"
          />
        )}
      </div>

      {/* Delete Dialog */}
      {deleteDialogOpen && certToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-xl shadow-xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <span className="material-symbols-outlined text-3xl">warning</span>
              <h3 className="text-lg font-bold text-gray-900">Confirmer la suppression</h3>
            </div>
            <p className="text-xs text-gray-600">
              Êtes-vous sûr de vouloir supprimer la certification <strong className="text-gray-900">{certToDelete.name}</strong> ?
            </p>
            {deleteError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2 font-medium">
                <span className="material-symbols-outlined text-[18px] flex-shrink-0">error</span>
                <span>{deleteError}</span>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button 
                type="button" 
                onClick={() => { setDeleteDialogOpen(false); setCertToDelete(null); setDeleteError(null); }}
                className="px-3.5 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Fermer
              </button>
              <button 
                type="button" 
                onClick={() => deleteMutation.mutate(certToDelete.id)} 
                disabled={deleteMutation.isPending || !!deleteError}
                className={clsx(
                  "px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5",
                  (deleteMutation.isPending || !!deleteError) 
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300" 
                    : "bg-[#b70f30] text-white hover:bg-red-800 shadow-2xs"
                )}
              >
                {deleteMutation.isPending && <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>}
                Supprimer
              </button>
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
