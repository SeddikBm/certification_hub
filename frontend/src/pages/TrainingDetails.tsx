import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trainingService } from '../services/training.service';
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

export function TrainingDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const canManage = user?.role === 'ADMIN' || user?.role === 'TRAINING_MANAGER';

  // Query Training Details
  const { data: training, isLoading, error } = useQuery({
    queryKey: ['training', id],
    queryFn: () => trainingService.getTrainingById(id!),
    enabled: !!id
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (trainingId: string) => trainingService.deleteTraining(trainingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainings'] });
      navigate('/trainings', { state: { notification: { type: 'success', message: 'Formation supprimée avec succès.' } } });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || "Impossible de supprimer : des collaborateurs sont actuellement assignés à cette formation.";
      setDeleteError(msg);
    }
  });

  if (isLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="material-symbols-outlined animate-spin text-4xl text-[#b70f30]">progress_activity</span>
          <span className="text-gray-500 font-medium text-sm">Chargement de la formation...</span>
        </div>
      </div>
    );
  }

  if (error || !training) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="bg-red-50 border border-red-200 text-[#b70f30] px-6 py-4 rounded-xl flex items-center gap-3">
          <span className="material-symbols-outlined">error</span>
          <span className="font-medium text-sm">Formation introuvable ou erreur de chargement.</span>
        </div>
      </div>
    );
  }

  const pConfig = getProviderConfig(training.provider || '');

  const instructor = training.metadata?.instructor || '-';
  const language = training.metadata?.language || training.language || '-';
  const description = training.metadata?.description || training.description || 'Aucune description disponible pour cette formation.';

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

      {/* Breadcrumb Navigation */}
      <div>
        <nav aria-label="Breadcrumb" className="flex text-xs font-medium text-gray-500 mb-3">
          <ol className="inline-flex items-center space-x-1 sm:space-x-2">
            <li>
              <Link to="/trainings" className="hover:text-[#b70f30] transition-colors">
                Formations
              </Link>
            </li>
            <li>
              <div className="flex items-center">
                <span className="material-symbols-outlined text-[16px] text-gray-400">chevron_right</span>
                <span className="text-gray-900 font-semibold truncate max-w-[200px] sm:max-w-[400px]">{training.title}</span>
              </div>
            </li>
          </ol>
        </nav>

        {/* Title Header with Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3.5">
            <span className={clsx("material-symbols-outlined text-[34px] flex-shrink-0", pConfig.text)}>{pConfig.icon}</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-500">{training.provider || 'Sans Provider'}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 uppercase tracking-wider">
                  {training.type}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#111827] mt-0.5 tracking-tight">{training.title}</h1>
            </div>
          </div>

          {/* Action Buttons (Admin & Training Manager only) */}
          {canManage && (
            <div className="flex items-center gap-2 self-end sm:self-center">
              <button 
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="h-8 px-3 text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <span className="material-symbols-outlined text-[15px]">edit</span>
                <span>Éditer</span>
              </button>
              <button 
                type="button"
                onClick={() => { setDeleteError(null); setDeleteDialogOpen(true); }}
                className="h-8 px-3 text-xs font-semibold text-[#b70f30] bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <span className="material-symbols-outlined text-[15px]">delete</span>
                <span>Supprimer</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Section 1: Informations Générales */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-5">
            <span className="material-symbols-outlined text-[#b70f30] text-[20px]">info</span>
            <h2 className="text-base font-bold text-[#111827]">Informations Générales</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
            <div>
              <span className="text-xs font-medium text-gray-400 block mb-1">Type</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wider">
                {training.type}
              </span>
            </div>

            <div>
              <span className="text-xs font-medium text-gray-400 block mb-1">Provider</span>
              <div className="flex items-center gap-2">
                <span className={clsx("material-symbols-outlined text-[18px]", pConfig.text)}>{pConfig.icon}</span>
                <span className="text-sm font-semibold text-gray-800">{training.provider || '-'}</span>
              </div>
            </div>

            <div>
              <span className="text-xs font-medium text-gray-400 block mb-1">Priorité</span>
              <div className="flex items-center gap-1.5">
                <span className={clsx("w-2 h-2 rounded-full", training.priority === 'MANDATORY' ? 'bg-[#b70f30]' : 'bg-blue-600')}></span>
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-700">{training.priority}</span>
              </div>
            </div>

            <div>
              <span className="text-xs font-medium text-gray-400 block mb-1">Instructeur / Formateur</span>
              <span className="text-sm font-semibold text-gray-800">{instructor}</span>
            </div>

            <div>
              <span className="text-xs font-medium text-gray-400 block mb-1">Durée</span>
              <span className="text-sm font-semibold text-gray-800">{training.durationHours ? `${training.durationHours} heures` : '-'}</span>
            </div>

            <div>
              <span className="text-xs font-medium text-gray-400 block mb-1">Langue</span>
              <span className="text-sm font-semibold text-gray-800">{language}</span>
            </div>

            <div>
              <span className="text-xs font-medium text-gray-400 block mb-1">Coût de la Formation</span>
              <span className="text-sm font-extrabold text-[#b70f30]">{!training.costUsd || training.costUsd === 0 ? 'Gratuit' : `${training.costUsd.toLocaleString()} MAD`}</span>
            </div>

            {training.url && (
              <div>
                <span className="text-xs font-medium text-gray-400 block mb-1">Lien de la Formation</span>
                <a 
                  href={training.url} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#b70f30] hover:underline"
                >
                  <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                  <span>Accéder à la plateforme</span>
                </a>
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 pt-4">
            <span className="text-xs font-medium text-gray-400 block mb-1.5">Description & Programme</span>
            <p className="text-xs font-normal text-gray-600 whitespace-pre-line leading-relaxed break-words [overflow-wrap:anywhere]">
              {description}
            </p>
          </div>

        </div>

        {/* Section 2: Squads Concernées */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-4">
              <span className="material-symbols-outlined text-[#b70f30] text-[20px]">groups</span>
              <h2 className="text-base font-bold text-[#111827]">Squads Concernées</h2>
            </div>

            {!training.associatedSquads || training.associatedSquads.length === 0 ? (
              <p className="text-xs text-gray-400 italic">Aucune squad associée à cette formation.</p>
            ) : (
              <div className="space-y-2.5">
                {training.associatedSquads.map((sq) => (
                  <div key={sq.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-gray-400 text-[18px]">group</span>
                      <span className="text-xs font-bold text-gray-800">{sq.name}</span>
                    </div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-50 text-[#b70f30] border border-red-100">
                      P{sq.priority || 3}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <TrainingFormModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          trainingToEdit={training}
          onSuccess={(msg) => {
            showNotification('success', msg);
            queryClient.invalidateQueries({ queryKey: ['training', id] });
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deleteDialogOpen && (
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
                Êtes-vous sûr de vouloir supprimer la formation <strong className="text-gray-900">{training.title}</strong> ?
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteDialogOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
              >
                Fermer
              </button>
              {!deleteError && (
                <button
                  type="button"
                  onClick={() => deleteMutation.mutate(training.id)}
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
