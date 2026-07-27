import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService, type UserResponse } from '../services/user.service';
import { squadService } from '../services/squad.service';
import { UserFormModal } from '../components/UserFormModal';
import { Pagination } from '../components/ui/Pagination';
import clsx from 'clsx';

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin',
  DIRECTOR: 'Directeur',
  CAREER_MANAGER: 'Career Manager',
  TRAINING_MANAGER: 'Training Manager',
  SQUAD_LEAD: 'Squad Lead',
  COLLABORATOR: 'Collaborateur'
};

export function Users() {
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [squadFilter, setSquadFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [sortField, setSortField] = useState<string>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState<number>(0);
  const pageSize = 25;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<UserResponse | null>(null);

  // Status Toggle state
  const [actionTarget, setActionTarget] = useState<UserResponse | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Fetch Squads list for filter dropdown
  const { data: squads = [] } = useQuery({
    queryKey: ['squads'],
    queryFn: squadService.getSquads
  });

  // Fetch Users list with data-level security backend endpoint GET /api/v1/users
  const { data: usersPage, isLoading, error } = useQuery({
    queryKey: ['users', { page, pageSize, sortField, sortDirection, searchTerm, roleFilter, squadFilter, statusFilter }],
    queryFn: () => userService.getUsers({
      page,
      size: pageSize,
      search: searchTerm || undefined,
      role: roleFilter || undefined,
      squadId: squadFilter || undefined,
      status: statusFilter || undefined,
      sort: sortField === 'role' ? undefined : `${sortField},${sortDirection}`
    })
  });

  // Client-side sorting enhancement for Role display labels
  const displayedUsers = useMemo(() => {
    if (!usersPage?.content) return [];
    const list = [...usersPage.content];

    if (sortField === 'role') {
      list.sort((a, b) => {
        const labelA = ROLE_LABELS[a.role] || a.role;
        const labelB = ROLE_LABELS[b.role] || b.role;
        const cmp = labelA.localeCompare(labelB);
        return sortDirection === 'asc' ? cmp : -cmp;
      });
    }

    return list;
  }, [usersPage?.content, sortField, sortDirection]);

  // Toggle User Status (ACTIVE <-> INACTIVE)
  const toggleStatusMutation = useMutation({
    mutationFn: (user: UserResponse) => {
      const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      return userService.updateUser(user.id, {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        status: newStatus
      });
    },
    onSuccess: (_, user) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setActionTarget(null);
      const newStatusLabel = user.status === 'ACTIVE' ? 'désactivé' : 'activé';
      showNotification('success', `Compte de ${user.firstName} ${user.lastName} ${newStatusLabel} avec succès.`);
    },
    onError: (err: any) => {
      console.error(err);
      showNotification('error', err.response?.data?.message || 'Erreur lors du changement de statut.');
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

  const renderRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            Admin
          </span>
        );
      case 'DIRECTOR':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            Directeur
          </span>
        );
      case 'CAREER_MANAGER':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            Career Manager
          </span>
        );
      case 'TRAINING_MANAGER':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            Training Manager
          </span>
        );
      case 'SQUAD_LEAD':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-200">
            Squad Lead
          </span>
        );
      case 'COLLABORATOR':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            Collaborateur
          </span>
        );
    }
  };

  const renderStatusBadge = (status: string) => {
    return status === 'ACTIVE' ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
        Actif
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
        Inactif
      </span>
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

      {/* Page Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#111827] tracking-tight">Gestion des Utilisateurs</h1>
        </div>
        <div className="flex items-center gap-3">
          <button 
            type="button"
            className="h-9 px-4 text-xs font-semibold rounded-xl shadow-2xs hover:shadow-md transition-all flex items-center gap-1.5 bg-[#b70f30] text-white hover:bg-red-800 cursor-pointer" 
            onClick={() => { setUserToEdit(null); setIsModalOpen(true); }}
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            <span>Ajouter un Utilisateur</span>
          </button>
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
                placeholder="Nom, prénom, email..." 
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
          
          {/* Role Filter */}
          <div className="md:col-span-3 space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 block">Rôle</label>
            <div className="relative">
              <select 
                className="w-full bg-gray-50/50 text-gray-900 border border-gray-200 focus:border-[#b70f30] focus:ring-2 focus:ring-[#b70f30]/10 rounded-xl pl-3.5 pr-8 py-2.5 text-xs font-medium transition-all appearance-none cursor-pointer outline-none"
                value={roleFilter}
                onChange={(e) => { setRoleFilter(e.target.value); setPage(0); }}
              >
                <option value="">Tous les rôles</option>
                <option value="ADMIN">Admin</option>
                <option value="DIRECTOR">Directeur</option>
                <option value="CAREER_MANAGER">Career Manager</option>
                <option value="TRAINING_MANAGER">Training Manager</option>
                <option value="SQUAD_LEAD">Squad Lead</option>
                <option value="COLLABORATOR">Collaborateur</option>
              </select>
              {roleFilter ? (
                <button 
                  type="button" 
                  onClick={() => setRoleFilter('')} 
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

          {/* Squad Filter */}
          <div className="md:col-span-3 space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 block">Squad</label>
            <div className="relative">
              <select 
                className="w-full bg-gray-50/50 text-gray-900 border border-gray-200 focus:border-[#b70f30] focus:ring-2 focus:ring-[#b70f30]/10 rounded-xl pl-3.5 pr-8 py-2.5 text-xs font-medium transition-all appearance-none cursor-pointer outline-none"
                value={squadFilter}
                onChange={(e) => { setSquadFilter(e.target.value); setPage(0); }}
              >
                <option value="">Toutes les squads</option>
                {squads.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              {squadFilter ? (
                <button 
                  type="button" 
                  onClick={() => setSquadFilter('')} 
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

          {/* Status Filter */}
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 block">Statut</label>
            <div className="relative">
              <select 
                className="w-full bg-gray-50/50 text-gray-900 border border-gray-200 focus:border-[#b70f30] focus:ring-2 focus:ring-[#b70f30]/10 rounded-xl pl-3.5 pr-8 py-2.5 text-xs font-medium transition-all appearance-none cursor-pointer outline-none"
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
              >
                <option value="">Tous les statuts</option>
                <option value="ACTIVE">Actif</option>
                <option value="INACTIVE">Inactif</option>
              </select>
              {statusFilter ? (
                <button 
                  type="button" 
                  onClick={() => setStatusFilter('')} 
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
              disabled={!(searchTerm || roleFilter || squadFilter || statusFilter)}
              onClick={() => {
                setSearchTerm('');
                setRoleFilter('');
                setSquadFilter('');
                setStatusFilter('');
                setPage(0);
              }}
              className={clsx(
                "w-full h-[38px] px-2 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1 shadow-2xs",
                (searchTerm || roleFilter || squadFilter || statusFilter) 
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
        {isLoading && !usersPage && (
          <div className="absolute inset-0 z-10 bg-surface/60 backdrop-blur-xs flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-4 border-red-200 border-t-[#b70f30] rounded-full animate-spin mb-3"></div>
            <p className="text-gray-500 font-medium text-xs">Chargement des utilisateurs...</p>
          </div>
        )}
        
        {error && !usersPage && (
          <div className="p-12 text-center text-red-600 flex flex-col items-center h-full justify-center">
            <span className="material-symbols-outlined text-[48px] mb-2">error</span>
            <p className="text-xs font-medium">Échec du chargement des utilisateurs.</p>
          </div>
        )}

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[950px]">
            <thead>
              <tr className="bg-[#fdf4f5] border-b border-red-100">
                {renderSortableHeader("Nom & Prénom", "lastName")}
                {renderSortableHeader("Email", "email")}
                {renderSortableHeader("Rôle", "role")}
                {renderSortableHeader("Squad", "squad.name")}
                {renderSortableHeader("Statut", "status")}
                <th className="p-3.5 text-xs text-[#7c2d37] font-bold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayedUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-gray-400 text-xs">
                    Aucun utilisateur trouvé.
                  </td>
                </tr>
              ) : (
                displayedUsers.map((u) => {
                  return (
                    <tr 
                      key={u.id} 
                      className="hover:bg-[#fcf8f8] transition-colors group border-b border-gray-100"
                    >
                      {/* Nom & Prénom FIRST */}
                      <td className="p-3.5 pl-6">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-red-50 text-[#b70f30] font-bold text-[11px] flex items-center justify-center border border-red-100">
                            {u.firstName?.[0]}{u.lastName?.[0]}
                          </div>
                          <span className="font-semibold text-gray-900 text-xs">{u.firstName} {u.lastName}</span>
                        </div>
                      </td>

                      {/* Email SECOND */}
                      <td className="p-3.5">
                        <span className="font-semibold text-gray-800 text-xs">{u.email}</span>
                      </td>

                      {/* Rôle */}
                      <td className="p-3.5">
                        {renderRoleBadge(u.role)}
                      </td>

                      {/* Squad (Clean text without icon) */}
                      <td className="p-3.5">
                        <span className="text-gray-700 text-xs font-medium">{u.squadName || '-'}</span>
                      </td>

                      {/* Statut */}
                      <td className="p-3.5">
                        {renderStatusBadge(u.status)}
                      </td>

                      {/* Subtle & Elegant Actions (Neutral Gray by Default) */}
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => { setUserToEdit(u); setIsModalOpen(true); }}
                            className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-all cursor-pointer"
                            title="Éditer l'utilisateur"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setActionTarget(u)}
                            className="w-8 h-8 rounded-lg text-gray-400 hover:text-[#b70f30] hover:bg-red-50 flex items-center justify-center transition-all cursor-pointer"
                            title={u.status === 'ACTIVE' ? "Désactiver le compte" : "Activer le compte"}
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              {u.status === 'ACTIVE' ? 'block' : 'check_circle'}
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {usersPage && (
          <Pagination
            currentPage={usersPage.number}
            totalPages={usersPage.totalPages}
            totalElements={usersPage.totalElements}
            pageSize={pageSize}
            onPageChange={(newPage) => setPage(newPage)}
            itemName="utilisateurs"
          />
        )}

      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <UserFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          userToEdit={userToEdit}
          onSuccess={(msg) => {
            showNotification('success', msg);
            queryClient.invalidateQueries({ queryKey: ['users'] });
          }}
        />
      )}

      {/* Status Toggle Modal */}
      {actionTarget && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[440px] p-6 space-y-4 border border-gray-100">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <span className="material-symbols-outlined text-[24px]">
                  {actionTarget.status === 'ACTIVE' ? 'warning' : 'info'}
                </span>
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  {actionTarget.status === 'ACTIVE' ? 'Désactiver le compte ?' : 'Activer le compte ?'}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Utilisateur : {actionTarget.firstName} {actionTarget.lastName} ({actionTarget.email})
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Êtes-vous sûr de vouloir {actionTarget.status === 'ACTIVE' ? 'désactiver' : 'réactiver'} le compte de <strong className="text-gray-900">{actionTarget.firstName} {actionTarget.lastName}</strong> ?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActionTarget(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => toggleStatusMutation.mutate(actionTarget)}
                disabled={toggleStatusMutation.isPending}
                className={clsx(
                  "px-4 py-2 text-xs font-semibold text-white rounded-xl transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50",
                  actionTarget.status === 'ACTIVE' ? "bg-[#b70f30] hover:bg-red-800" : "bg-emerald-600 hover:bg-emerald-700"
                )}
              >
                {toggleStatusMutation.isPending && <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>}
                <span>{actionTarget.status === 'ACTIVE' ? 'Confirmer la désactivation' : 'Confirmer l\'activation'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
