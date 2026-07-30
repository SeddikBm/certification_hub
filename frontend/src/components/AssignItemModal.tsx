import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assignmentService } from '../services/assignment.service';
import { managerAssignmentService } from '../services/managerAssignment.service';
import { userService } from '../services/user.service';
import { certificationService } from '../services/certification.service';
import { trainingService } from '../services/training.service';
import { useAuth } from '../contexts/AuthContext';
import clsx from 'clsx';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccessNotification: (type: 'success' | 'error', msg: string) => void;
  preselectedUserId?: string;
  defaultItemType?: 'CERTIFICATION' | 'TRAINING';
}

export function AssignItemModal({
  isOpen,
  onClose,
  onSuccessNotification,
  preselectedUserId,
  defaultItemType = 'CERTIFICATION'
}: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [itemType, setItemType] = useState<'CERTIFICATION' | 'TRAINING'>(defaultItemType);
  const [selectedUserId, setSelectedUserId] = useState<string>(preselectedUserId || '');
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [userSearch, setUserSearch] = useState<string>('');
  const [itemSearch, setItemSearch] = useState<string>('');
  const [priority, setPriority] = useState<string>('NORMAL');
  const [targetDate, setTargetDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setSelectedUserId(preselectedUserId || '');
      setItemType(defaultItemType);
      setPriority('NORMAL');
      setTargetDate('');
    }
  }, [isOpen, preselectedUserId, defaultItemType]);

  const isAdmin = user?.role === 'ADMIN';
  const isAdminOrTM = user?.role === 'ADMIN' || user?.role === 'TRAINING_MANAGER';

  // 1. Fetch Collaborators List
  // For Career Manager: fetch managed collaborators from GET /api/v1/manager-assignments/:managerId/collaborators
  // For Admin / Training Manager: fetch all collaborators from GET /api/v1/users?role=COLLABORATOR
  const { data: managedCollabs = [], isLoading: isLoadingManaged } = useQuery({
    queryKey: ['myManagedCollaborators', user?.id],
    queryFn: () => user?.id ? managerAssignmentService.getAssignedCollaborators(user.id) : Promise.resolve([]),
    enabled: isOpen && !isAdminOrTM && !!user?.id
  });

  const { data: adminCollabsPage, isLoading: isLoadingAdminCollabs } = useQuery({
    queryKey: ['adminCollaboratorsList', userSearch],
    queryFn: () => userService.getUsers({
      role: 'COLLABORATOR',
      search: userSearch || undefined,
      size: 50
    }),
    enabled: isOpen && isAdminOrTM
  });

  const collaboratorsList = useMemo(() => {
    if (isAdminOrTM) {
      return (adminCollabsPage?.content || []).map(u => ({
        id: u.id,
        name: `${u.firstName} ${u.lastName}`,
        email: u.email,
        squadName: u.squadName
      }));
    }
    const filtered = userSearch.trim()
      ? managedCollabs.filter(c => 
          `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase().includes(userSearch.toLowerCase()) ||
          (c.email || '').toLowerCase().includes(userSearch.toLowerCase())
        )
      : managedCollabs;

    return filtered.map(c => ({
      id: c.collaboratorId || (c as any).id,
      name: c.firstName && c.lastName ? `${c.firstName} ${c.lastName}` : (c as any).name || (c as any).userName || 'Collaborateur',
      email: c.email,
      squadName: c.squadName
    }));
  }, [isAdminOrTM, adminCollabsPage?.content, managedCollabs, userSearch]);

  const selectedCollabInfo = useMemo(() => {
    return collaboratorsList.find(c => c.id === selectedUserId);
  }, [collaboratorsList, selectedUserId]);

  // 2. Fetch Catalogue Items (Certifications or Trainings)
  const { data: certsPage, isLoading: isLoadingCerts } = useQuery({
    queryKey: ['certsCatalogSearch', itemSearch],
    queryFn: () => certificationService.getAllCertifications({
      search: itemSearch || undefined,
      size: 30
    }),
    enabled: isOpen && itemType === 'CERTIFICATION'
  });

  const { data: trainingsPage, isLoading: isLoadingTrainings } = useQuery({
    queryKey: ['trainingsCatalogSearch', itemSearch],
    queryFn: () => trainingService.getAllTrainings({
      search: itemSearch || undefined,
      size: 30
    }),
    enabled: isOpen && itemType === 'TRAINING'
  });

  const certItems = certsPage?.content || [];
  const trainingItems = trainingsPage?.content || [];

  // Selected item preview
  const selectedCert = useMemo(() => {
    return certItems.find(c => c.id === selectedItemId);
  }, [certItems, selectedItemId]);

  const selectedTraining = useMemo(() => {
    return trainingItems.find(t => t.id === selectedItemId);
  }, [trainingItems, selectedItemId]);

  // Create Assignment Mutation
  const createMutation = useMutation({
    mutationFn: () => assignmentService.createAssignment({
      itemType,
      itemId: selectedItemId,
      userId: selectedUserId,
      priority: priority || undefined,
      targetDate: targetDate || undefined,
      notes: notes || undefined
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['my-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['management-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      onSuccessNotification('success', 'Assignation créée avec succès.');
      resetForm();
      onClose();
    },
    onError: (err: any) => {
      console.error(err);
      const serverMsg = err.response?.data?.message || err.response?.data?.detail;
      if (err.response?.status === 409) {
        onSuccessNotification('error', serverMsg || 'Ce collaborateur a déjà une assignation en cours pour cette certification/formation.');
      } else if (err.response?.status === 403) {
        onSuccessNotification('error', serverMsg || 'Accès refusé. Vous n\'avez pas les droits d\'effectuer cette assignation.');
      } else {
        onSuccessNotification('error', serverMsg || 'Erreur lors de la création de l\'assignation.');
      }
    }
  });

  const resetForm = () => {
    setSelectedUserId(preselectedUserId || '');
    setSelectedItemId('');
    setUserSearch('');
    setItemSearch('');
    setPriority('NORMAL');
    setTargetDate('');
    setNotes('');
  };

  if (!isOpen) return null;

  const isUserLoading = isAdmin ? isLoadingAdminCollabs : isLoadingManaged;
  const isItemLoading = itemType === 'CERTIFICATION' ? isLoadingCerts : isLoadingTrainings;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[680px] max-h-[90vh] flex flex-col overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-[#b70f30] flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[22px]">
                {itemType === 'CERTIFICATION' ? 'verified' : 'school'}
              </span>
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-[#111827] tracking-tight">
                Assigner une {itemType === 'CERTIFICATION' ? 'Certification' : 'Formation'}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {isAdmin ? 'Sélectionner n\'importe quel collaborateur' : 'Sélectionner un collaborateur de votre équipe'}
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={() => { resetForm(); onClose(); }} 
            className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors text-gray-400 hover:text-gray-700 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 bg-gray-50/50">
          
          {/* Step 1: Item Type Selection */}
          <div className="flex items-center gap-3 bg-white p-2.5 rounded-2xl border border-gray-100">
            <button
              type="button"
              onClick={() => { setItemType('CERTIFICATION'); setSelectedItemId(''); }}
              className={clsx(
                "flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer",
                itemType === 'CERTIFICATION' 
                  ? "bg-[#b70f30] text-white shadow-2xs" 
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              )}
            >
              <span className="material-symbols-outlined text-[18px]">verified</span>
              <span>Certification</span>
            </button>

            <button
              type="button"
              onClick={() => { setItemType('TRAINING'); setSelectedItemId(''); }}
              className={clsx(
                "flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer",
                itemType === 'TRAINING' 
                  ? "bg-[#b70f30] text-white shadow-2xs" 
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              )}
            >
              <span className="material-symbols-outlined text-[18px]">school</span>
              <span>Formation</span>
            </button>
          </div>

          {/* Step 2: Select Collaborator (Locked Banner if preselected, or Search List if global) */}
          {preselectedUserId ? (
            <div className="bg-gradient-to-r from-red-50/80 via-gray-50 to-white p-4 rounded-2xl border border-red-100/90 shadow-2xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#b70f30] text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                  {selectedCollabInfo?.name?.[0] || 'C'}
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                    <span>Collaborateur ciblé :</span>
                    <span className="text-[#b70f30] font-extrabold">{selectedCollabInfo?.name || 'Collaborateur'}</span>
                  </div>
                  <div className="text-[11px] text-gray-500">{selectedCollabInfo?.email || ''} {selectedCollabInfo?.squadName ? `• Squad: ${selectedCollabInfo.squadName}` : ''}</div>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                <span>Pré-sélectionné</span>
              </span>
            </div>
          ) : (
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs space-y-3">
              <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider">
                1. Sélectionner le Collaborateur
              </label>

              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">person_search</span>
                <input
                  type="text"
                  placeholder="Rechercher un collaborateur par nom ou email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#b70f30]/10 focus:border-[#b70f30]"
                />
              </div>

              {isUserLoading ? (
                <div className="p-3 text-center text-xs text-gray-400">Chargement des collaborateurs...</div>
              ) : collaboratorsList.length === 0 ? (
                <div className="p-3 text-center text-xs text-gray-400">
                  {isAdmin ? 'Aucun collaborateur trouvé.' : 'Aucun collaborateur dans votre équipe.'}
                </div>
              ) : (
                <div className="max-h-[140px] overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-100 bg-white">
                  {collaboratorsList.map(c => {
                    const isSelected = selectedUserId === c.id;
                    return (
                      <div
                        key={c.id}
                        onClick={() => setSelectedUserId(c.id)}
                        className={clsx(
                          "p-2.5 flex items-center justify-between cursor-pointer transition-colors",
                          isSelected ? "bg-red-50/80 border-l-4 border-[#b70f30]" : "hover:bg-gray-50"
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={clsx(
                            "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold",
                            isSelected ? "bg-[#b70f30] text-white" : "bg-blue-50 text-blue-700 border border-blue-100"
                          )}>
                            {c.name?.[0]}
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-gray-900">{c.name}</div>
                            <div className="text-[11px] text-gray-500">{c.email} {c.squadName ? `• Squad: ${c.squadName}` : ''}</div>
                          </div>
                        </div>
                        {isSelected && (
                          <span className="material-symbols-outlined text-[18px] text-[#b70f30]">check_circle</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Select Item from Catalogue */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs space-y-3">
            <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider">
              2. Sélectionner la {itemType === 'CERTIFICATION' ? 'Certification' : 'Formation'}
            </label>

            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">search</span>
              <input
                type="text"
                placeholder={`Rechercher une ${itemType === 'CERTIFICATION' ? 'certification' : 'formation'} dans le catalogue...`}
                value={itemSearch}
                onChange={(e) => setItemSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#b70f30]/10 focus:border-[#b70f30]"
              />
            </div>

            {isItemLoading ? (
              <div className="p-3 text-center text-xs text-gray-400">Recherche dans le catalogue...</div>
            ) : itemType === 'CERTIFICATION' ? (
              certItems.length === 0 ? (
                <div className="p-3 text-center text-xs text-gray-400">Aucune certification trouvée.</div>
              ) : (
                <div className="max-h-[160px] overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-100 bg-white">
                  {certItems.map(cert => {
                    const isSelected = selectedItemId === cert.id;
                    return (
                      <div
                        key={cert.id}
                        onClick={() => setSelectedItemId(cert.id)}
                        className={clsx(
                          "p-3 flex items-center justify-between cursor-pointer transition-colors",
                          isSelected ? "bg-red-50/80 border-l-4 border-[#b70f30]" : "hover:bg-gray-50"
                        )}
                      >
                        <div>
                          <div className="text-xs font-semibold text-gray-900">{cert.name}</div>
                          <div className="text-[11px] text-gray-500 mt-0.5">
                            {cert.code} • {cert.provider} • Diff: {cert.difficulty}
                          </div>
                        </div>
                        {isSelected && (
                          <span className="material-symbols-outlined text-[18px] text-[#b70f30]">check_circle</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              trainingItems.length === 0 ? (
                <div className="p-3 text-center text-xs text-gray-400">Aucune formation trouvée.</div>
              ) : (
                <div className="max-h-[160px] overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-100 bg-white">
                  {trainingItems.map(tr => {
                    const isSelected = selectedItemId === tr.id;
                    return (
                      <div
                        key={tr.id}
                        onClick={() => setSelectedItemId(tr.id)}
                        className={clsx(
                          "p-3 flex items-center justify-between cursor-pointer transition-colors",
                          isSelected ? "bg-red-50/80 border-l-4 border-[#b70f30]" : "hover:bg-gray-50"
                        )}
                      >
                        <div>
                          <div className="text-xs font-semibold text-gray-900">{tr.title}</div>
                          <div className="text-[11px] text-gray-500 mt-0.5">
                            {tr.provider} • Type: {tr.type} • Durée: {tr.durationHours || '-'}h
                          </div>
                        </div>
                        {isSelected && (
                          <span className="material-symbols-outlined text-[18px] text-[#b70f30]">check_circle</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </div>

          {/* Item Preview Banner */}
          {(selectedCert || selectedTraining) && (
            <div className="p-3.5 bg-red-50/60 border border-red-200 rounded-2xl flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#b70f30] text-white flex items-center justify-center flex-shrink-0 font-bold">
                <span className="material-symbols-outlined text-[20px]">
                  {selectedCert ? 'verified' : 'school'}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-gray-900 truncate">
                  {selectedCert?.name || selectedTraining?.title}
                </div>
                <div className="text-[11px] text-gray-600 mt-0.5">
                  Provider: <strong>{selectedCert?.provider || selectedTraining?.provider}</strong>
                  {selectedCert?.examCostUsd ? ` • Coût Examen: ${selectedCert.examCostUsd} MAD` : ''}
                </div>
              </div>
            </div>
          )}

          {/* Priority & Target Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-700">Priorité d'Assignation</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#b70f30]/10 focus:border-[#b70f30]"
              >
                <option value="MANDATORY">Obligatoire</option>
                <option value="HIGH">Haute</option>
                <option value="NORMAL">Normale</option>
                <option value="OPTIONAL">Optionnelle</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-700">
                Date Cible (Deadline, min. 7 jours)
              </label>
              <input
                type="date"
                value={targetDate}
                min={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#b70f30]/10 focus:border-[#b70f30]"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs space-y-2">
            <label className="block text-xs font-semibold text-gray-700">Notes & Remarques (optionnel)</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ajouter des consignes ou des objectifs pour cette assignation..."
              className="w-full p-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#b70f30]/10 focus:border-[#b70f30]"
            />
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 bg-white flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => { resetForm(); onClose(); }}
            className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
          >
            Annuler
          </button>
          <button
            type="button"
            disabled={createMutation.isPending || !selectedUserId || !selectedItemId}
            onClick={() => createMutation.mutate()}
            className="px-5 py-2 text-xs font-semibold text-white bg-[#b70f30] hover:bg-red-800 rounded-xl transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {createMutation.isPending && <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>}
            <span>Confirmer l'assignation</span>
          </button>
        </div>

      </div>
    </div>
  );
}
