import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { managerAssignmentService, type CareerManagerHierarchyResponse, type AssignedCollaboratorResponse } from '../services/managerAssignment.service';
import { userService } from '../services/user.service';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  manager: CareerManagerHierarchyResponse | null;
  onSuccessNotification: (type: 'success' | 'error', msg: string) => void;
}

export function ManagerCollaboratorsModal({ isOpen, onClose, manager, onSuccessNotification }: Props) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch currently assigned collaborators for this manager
  const { data: assignedCollaborators = [], isLoading: isLoadingAssigned } = useQuery({
    queryKey: ['assignedCollaborators', manager?.managerId],
    queryFn: () => manager?.managerId ? managerAssignmentService.getAssignedCollaborators(manager.managerId) : Promise.resolve([]),
    enabled: isOpen && !!manager?.managerId
  });

  // Fetch all collaborators for autocomplete search
  const { data: collaboratorsPage, isLoading: isLoadingSearch } = useQuery({
    queryKey: ['collaboratorsSearch', searchQuery],
    queryFn: () => userService.getUsers({
      role: 'COLLABORATOR',
      search: searchQuery || undefined,
      size: 15
    }),
    enabled: isOpen && searchQuery.trim().length > 0
  });

  // Add Assignment Mutation (POST /api/v1/manager-assignments)
  const addMutation = useMutation({
    mutationFn: (collaboratorId: string) => {
      if (!manager?.managerId) throw new Error("Manager ID manquant");
      return managerAssignmentService.assignManager({
        managerId: manager.managerId,
        collaboratorId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignedCollaborators', manager?.managerId] });
      queryClient.invalidateQueries({ queryKey: ['managerHierarchy'] });
      onSuccessNotification('success', 'Collaborateur affecté avec succès au Career Manager.');
      setSearchQuery('');
    },
    onError: (err: any) => {
      console.error(err);
      if (err.response?.status === 409) {
        onSuccessNotification('error', 'Ce collaborateur est déjà affecté à ce manager.');
      } else {
        onSuccessNotification('error', err.response?.data?.message || 'Erreur lors de l\'affectation du collaborateur.');
      }
    }
  });

  // Remove Assignment Mutation (DELETE /api/v1/manager-assignments/:managerId/:collaboratorId)
  const removeMutation = useMutation({
    mutationFn: (collaboratorId: string) => {
      if (!manager?.managerId) throw new Error("Manager ID manquant");
      return managerAssignmentService.removeAssignment(manager.managerId, collaboratorId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignedCollaborators', manager?.managerId] });
      queryClient.invalidateQueries({ queryKey: ['managerHierarchy'] });
      onSuccessNotification('success', 'Collaborateur retiré avec succès du Career Manager.');
    },
    onError: (err: any) => {
      console.error(err);
      onSuccessNotification('error', err.response?.data?.message || 'Erreur lors du retrait du collaborateur.');
    }
  });

  // Filter out collaborators that are already assigned to this manager from search results
  const assignedIdsSet = useMemo(() => {
    return new Set(assignedCollaborators.map(c => c.collaboratorId));
  }, [assignedCollaborators]);

  const searchResults = useMemo(() => {
    if (!collaboratorsPage?.content) return [];
    return collaboratorsPage.content.filter(c => !assignedIdsSet.has(c.id));
  }, [collaboratorsPage?.content, assignedIdsSet]);

  if (!isOpen || !manager) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[640px] max-h-[90vh] flex flex-col overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-100 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[22px]">supervisor_account</span>
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-[#111827] tracking-tight">
                Équipe de {manager.firstName} {manager.lastName}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">{manager.email} • {assignedCollaborators.length} collaborateur(s)</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors text-gray-400 hover:text-gray-700 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 bg-gray-50/50">
          
          {/* Autocomplete Search & Add Section */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs space-y-3">
            <label className="block text-xs font-semibold text-gray-700">
              Rechercher & Ajouter un Collaborateur
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">person_search</span>
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tapez le nom, prénom ou email d'un collaborateur..."
                className="w-full pl-10 pr-9 py-2.5 text-xs font-medium bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#b70f30]/10 focus:border-[#b70f30] transition-all"
              />
              {searchQuery && (
                <button 
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-200/60"
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              )}
            </div>

            {/* Autocomplete Results Dropdown */}
            {searchQuery.trim().length > 0 && (
              <div className="border border-gray-200 rounded-xl bg-white shadow-md divide-y divide-gray-100 max-h-[220px] overflow-y-auto">
                {isLoadingSearch ? (
                  <div className="p-4 text-center text-xs text-gray-400">Recherche des collaborateurs...</div>
                ) : searchResults.length === 0 ? (
                  <div className="p-4 text-center text-xs text-gray-400">Aucun collaborateur disponible trouvé.</div>
                ) : (
                  searchResults.map(c => (
                    <div key={c.id} className="p-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-700 font-bold text-[11px] flex items-center justify-center border border-blue-100">
                          {c.firstName?.[0]}{c.lastName?.[0]}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-gray-900">{c.firstName} {c.lastName}</div>
                          <div className="text-[11px] text-gray-500">{c.email} {c.squadName ? `• Squad: ${c.squadName}` : ''}</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={addMutation.isPending}
                        onClick={() => addMutation.mutate(c.id)}
                        className="h-7 px-2.5 text-[11px] font-semibold text-white bg-[#b70f30] hover:bg-red-800 rounded-md transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50 shadow-2xs"
                      >
                        <span className="material-symbols-outlined text-[14px]">person_add</span>
                        <span>Ajouter</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Assigned Collaborators List */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                Collaborateurs Assignés ({assignedCollaborators.length})
              </h3>
            </div>

            {isLoadingAssigned ? (
              <div className="py-8 text-center text-xs text-gray-400">Chargement de l'équipe...</div>
            ) : assignedCollaborators.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400">
                Aucun collaborateur n'est actuellement assigné à ce manager.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {assignedCollaborators.map((c: AssignedCollaboratorResponse) => (
                  <div key={c.collaboratorId} className="py-3 flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center border border-indigo-100">
                        {c.firstName?.[0]}{c.lastName?.[0]}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-gray-900">{c.firstName} {c.lastName}</div>
                        <div className="text-[11px] text-gray-500">{c.email} {c.squadName ? `• Squad: ${c.squadName}` : ''}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={removeMutation.isPending}
                      onClick={() => removeMutation.mutate(c.collaboratorId)}
                      className="w-8 h-8 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-all cursor-pointer"
                      title="Retirer de l'équipe"
                    >
                      <span className="material-symbols-outlined text-[18px]">person_remove</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-gray-100 bg-white flex justify-end">
          <button 
            type="button"
            onClick={onClose} 
            className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
}
