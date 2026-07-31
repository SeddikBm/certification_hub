import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assignmentService } from '../services/assignment.service';
import { certificationService } from '../services/certification.service';
import { trainingService } from '../services/training.service';
import { managerAssignmentService } from '../services/managerAssignment.service';
import { useAuth } from '../contexts/AuthContext';
import clsx from 'clsx';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccessNotification: (type: 'success' | 'error', msg: string) => void;
}

export function RequestAssignmentModal({ isOpen, onClose, onSuccessNotification }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [itemType, setItemType] = useState<'CERTIFICATION' | 'TRAINING'>('CERTIFICATION');
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [itemSearch, setItemSearch] = useState<string>('');
  const [selectedManagerId, setSelectedManagerId] = useState<string>('');
  const [priority, setPriority] = useState<string>('NORMAL');
  const [notes, setNotes] = useState<string>('');

  // 0. Fetch My Career Managers
  const { data: myManagers = [] } = useQuery({
    queryKey: ['myManagersList', user?.id],
    queryFn: () => managerAssignmentService.getMyManagers(),
    enabled: isOpen && !!user?.id
  });

  // 1. Fetch Catalogue Items
  const { data: certsPage, isLoading: isLoadingCerts } = useQuery({
    queryKey: ['myCertsRequestCatalog', itemSearch],
    queryFn: () => certificationService.getAllCertifications({
      search: itemSearch || undefined,
      size: 30
    }),
    enabled: isOpen && itemType === 'CERTIFICATION'
  });

  const { data: trainingsPage, isLoading: isLoadingTrainings } = useQuery({
    queryKey: ['myTrainingsRequestCatalog', itemSearch],
    queryFn: () => trainingService.getAllTrainings({
      search: itemSearch || undefined,
      size: 30
    }),
    enabled: isOpen && itemType === 'TRAINING'
  });

  const certItems = certsPage?.content || [];
  const trainingItems = trainingsPage?.content || [];

  const selectedCert = useMemo(() => certItems.find(c => c.id === selectedItemId), [certItems, selectedItemId]);
  const selectedTraining = useMemo(() => trainingItems.find(t => t.id === selectedItemId), [trainingItems, selectedItemId]);

  // Self Request Mutation (POST /api/v1/assignments with status PENDING_APPROVAL)
  const createRequestMutation = useMutation({
    mutationFn: () => {
      if (!user?.id) throw new Error("Utilisateur non connecté");
      const targetManager = selectedManagerId || (myManagers.length > 0 ? myManagers[0].collaboratorId : undefined);
      return assignmentService.createAssignment({
        itemType,
        itemId: selectedItemId,
        userId: user.id,
        targetManagerId: targetManager,
        priority,
        notes: notes ? `Demande collaborateur: ${notes}` : 'Demande formulée par le collaborateur'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['management-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      onSuccessNotification('success', 'Votre demande a été soumise avec succès à votre Career Manager.');
      resetForm();
      onClose();
    },
    onError: (err: any) => {
      console.error(err);
      if (err.response?.status === 409) {
        onSuccessNotification('error', 'Vous avez déjà une assignation ou une demande active pour cet item.');
      } else {
        onSuccessNotification('error', err.response?.data?.message || 'Erreur lors de la soumission de la demande.');
      }
    }
  });

  const resetForm = () => {
    setSelectedItemId('');
    setItemSearch('');
    setNotes('');
  };

  if (!isOpen) return null;

  const isLoading = itemType === 'CERTIFICATION' ? isLoadingCerts : isLoadingTrainings;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[620px] max-h-[90vh] flex flex-col overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-[#b70f30] flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[22px]">add_task</span>
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-[#111827] tracking-tight">
                Demander une {itemType === 'CERTIFICATION' ? 'Certification' : 'Formation'}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">Soumettre une demande à validation de votre Career Manager</p>
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 bg-gray-50/50">
          
          {/* Item Type Picker */}
          <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-gray-100">
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

          {/* Search Item */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs space-y-3">
            <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider">
              Choisir dans le Catalogue
            </label>

            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">search</span>
              <input
                type="text"
                placeholder={`Rechercher une ${itemType === 'CERTIFICATION' ? 'certification' : 'formation'}...`}
                value={itemSearch}
                onChange={(e) => setItemSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#b70f30]/10 focus:border-[#b70f30]"
              />
            </div>

            {isLoading ? (
              <div className="p-3 text-center text-xs text-gray-400">Chargement...</div>
            ) : itemType === 'CERTIFICATION' ? (
              certItems.length === 0 ? (
                <div className="p-3 text-center text-xs text-gray-400">Aucune certification trouvée.</div>
              ) : (
                <div className="max-h-[180px] overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-100 bg-white">
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
                          <div className="text-[11px] text-gray-500 mt-0.5">{cert.code} • {cert.provider} • Diff: {cert.difficulty}</div>
                        </div>
                        {isSelected && <span className="material-symbols-outlined text-[18px] text-[#b70f30]">check_circle</span>}
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              trainingItems.length === 0 ? (
                <div className="p-3 text-center text-xs text-gray-400">Aucune formation trouvée.</div>
              ) : (
                <div className="max-h-[180px] overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-100 bg-white">
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
                          <div className="text-[11px] text-gray-500 mt-0.5">{tr.provider} • Type: {tr.type}</div>
                        </div>
                        {isSelected && <span className="material-symbols-outlined text-[18px] text-[#b70f30]">check_circle</span>}
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </div>

          {/* Selected Item Card Banner */}
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
                </div>
              </div>
            </div>
          )}

          {/* Manager Selection if CMs exist */}
          {myManagers.length > 0 && (
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs space-y-2">
              <label className="block text-xs font-semibold text-gray-700">
                Career Manager pour validation <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedManagerId}
                onChange={(e) => setSelectedManagerId(e.target.value)}
                className="w-full p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#b70f30]/10 focus:border-[#b70f30]"
              >
                <option value="">Sélectionner le Career Manager...</option>
                {myManagers.map(m => (
                  <option key={m.collaboratorId} value={m.collaboratorId}>
                    {m.firstName} {m.lastName} ({m.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Priority Selection */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs space-y-2">
            <label className="block text-xs font-semibold text-gray-700">Priorité de la demande</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#b70f30]/10 focus:border-[#b70f30]"
            >
              <option value="MANDATORY">Obligatoire</option>
              <option value="HIGH">Haute</option>
              <option value="NORMAL">Normale (par défaut)</option>
              <option value="OPTIONAL">Optionnelle</option>
            </select>
          </div>

          {/* Justification / Notes */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs space-y-2">
            <label className="block text-xs font-semibold text-gray-700">Motivation / Objectif professionnel (optionnel)</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Expliquer brièvement pourquoi vous demandez ce parcours..."
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
            disabled={createRequestMutation.isPending || !selectedItemId}
            onClick={() => createRequestMutation.mutate()}
            className="px-5 py-2 text-xs font-semibold text-white bg-[#b70f30] hover:bg-red-800 rounded-xl transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {createRequestMutation.isPending && <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>}
            <span>Soumettre la demande</span>
          </button>
        </div>

      </div>
    </div>
  );
}
