import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assignmentService, type AssignmentResponse } from '../services/assignment.service';
import { RequestAssignmentModal } from '../components/RequestAssignmentModal';
import { ScheduleExamModal } from '../components/ScheduleExamModal';
import { Pagination } from '../components/ui/Pagination';
import clsx from 'clsx';

export function MyAssignments() {
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'CERTIFICATION' | 'TRAINING'>('CERTIFICATION');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const pageSize = 25;

  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [scheduleModalState, setScheduleModalState] = useState<{
    isOpen: boolean;
    assignmentId: string | null;
    itemName?: string;
    targetDate?: string;
  }>({
    isOpen: false,
    assignmentId: null,
    itemName: undefined,
    targetDate: undefined
  });

  const [progressModalState, setProgressModalState] = useState<{
    isOpen: boolean;
    assignmentId: string | null;
    currentProgress: number;
  }>({
    isOpen: false,
    assignmentId: null,
    currentProgress: 0
  });
  const [tempProgress, setTempProgress] = useState<number>(0);

  const [startDateModalState, setStartDateModalState] = useState<{
    isOpen: boolean;
    assignmentId: string | null;
    itemType?: string;
    targetDate?: string;
  }>({
    isOpen: false,
    assignmentId: null,
    itemType: undefined,
    targetDate: undefined
  });
  const [plannedStartDate, setPlannedStartDate] = useState<string>('');

  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Fetch My Assignments (GET /api/v1/assignments/my)
  const { data: assignmentsPage, isLoading, error } = useQuery({
    queryKey: ['my-assignments', { itemType: activeTab, status: statusFilter, page }],
    queryFn: () => assignmentService.getMyAssignments({
      itemType: activeTab,
      status: statusFilter || undefined,
      page,
      size: pageSize
    })
  });

  // Status update mutation (Commencer, Planifier examen, Marquer terminé)
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => assignmentService.updateAssignment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['management-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      showNotification('success', 'Statut mis à jour avec succès.');
    },
    onError: (err: any) => {
      console.error(err);
      showNotification('error', err.response?.data?.message || 'Échec de la mise à jour du statut.');
    }
  });

  // Render Status Badge for all Enum Values
  const renderStatusBadge = (status: string | undefined) => {
    if (!status) return null;

    const badgeConfig: Record<string, { bg: string, text: string, border: string, label: string, icon: string }> = {
      PENDING_APPROVAL: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'En attente', icon: 'hourglass_top' },
      APPROVED: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: 'Approuvé', icon: 'verified' },
      PLANNED: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', label: 'Planifié', icon: 'event' },
      IN_PROGRESS: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', label: 'En cours', icon: 'autorenew' },
      EXAM_SCHEDULED: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', label: 'Examen Programmé', icon: 'edit_calendar' },
      COMPLETED: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Obtenu / Terminé', icon: 'check_circle' },
      FAILED: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', label: 'Échoué', icon: 'cancel' },
      CANCELLED: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-300', label: 'Annulé / Refusé', icon: 'block' },
      EXPIRED: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', label: 'Expiré', icon: 'history' }
    };

    const cfg = badgeConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200', label: status, icon: 'info' };

    return (
      <span className={clsx("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border", cfg.bg, cfg.text, cfg.border)}>
        <span className="material-symbols-outlined text-[15px]">{cfg.icon}</span>
        <span>{cfg.label}</span>
      </span>
    );
  };

  // Check if Exam / Target Date is Close (< 7 Days)
  const renderDateWarning = (examAt: string | undefined, currentStatus?: string) => {
    if (!examAt) return null;
    if (currentStatus === 'COMPLETED' || currentStatus === 'CANCELLED') return null;

    const examDate = new Date(examAt);
    const now = new Date();
    const diffDays = Math.ceil((examDate.getTime() - now.getTime()) / (1000 * 3600 * 24));

    if (diffDays <= 7 && diffDays >= 0) {
      return (
        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
          <span className="material-symbols-outlined text-[13px]">warning</span>
          <span>Date proche ({diffDays} j)</span>
        </div>
      );
    } else if (diffDays < 0) {
      return (
        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
          <span className="material-symbols-outlined text-[13px]">error</span>
          <span>Date dépassée</span>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 pb-12 relative">

      {/* Centered Top Toast Notification */}
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
          <h1 className="text-2xl font-extrabold text-[#111827] tracking-tight">Mes Parcours & Assignations</h1>
          <p className="text-xs text-gray-500 mt-1">Suivez l'avancement de vos certifications et formations attribuées ou demandées.</p>
        </div>
        <div>
          <button
            type="button"
            onClick={() => setIsRequestModalOpen(true)}
            className="h-9 px-4 text-xs font-semibold rounded-xl shadow-2xs hover:shadow-md transition-all flex items-center gap-1.5 bg-[#b70f30] text-white hover:bg-red-800 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add_task</span>
            <span>Demander une Certification / Formation</span>
          </button>
        </div>
      </div>

      {/* Tabs & Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-3">
          
          {/* Tabs */}
          <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-200/60">
            <button
              type="button"
              onClick={() => { setActiveTab('CERTIFICATION'); setPage(0); }}
              className={clsx(
                "px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer",
                activeTab === 'CERTIFICATION' 
                  ? "bg-white text-[#b70f30] shadow-2xs border border-red-100" 
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              <span className="material-symbols-outlined text-[18px]">verified</span>
              <span>Certifications</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('TRAINING'); setPage(0); }}
              className={clsx(
                "px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer",
                activeTab === 'TRAINING' 
                  ? "bg-white text-[#b70f30] shadow-2xs border border-red-100" 
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              <span className="material-symbols-outlined text-[18px]">school</span>
              <span>Formations</span>
            </button>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-500">Statut :</label>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
              className="bg-gray-50 border border-gray-200 text-gray-900 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-[#b70f30]"
            >
              <option value="">Tous les statuts</option>
              {activeTab === 'CERTIFICATION' ? (
                <>
                  <option value="PENDING_APPROVAL">En attente de validation</option>
                  <option value="APPROVED">Approuvé</option>
                  <option value="PLANNED">Planifié</option>
                  <option value="IN_PROGRESS">En cours</option>
                  <option value="EXAM_SCHEDULED">Examen programmé</option>
                  <option value="COMPLETED">Obtenu</option>
                  <option value="FAILED">Échoué</option>
                  <option value="CANCELLED">Refusé / Annulé</option>
                  <option value="EXPIRED">Expiré</option>
                </>
              ) : (
                <>
                  <option value="PENDING_APPROVAL">En attente de validation</option>
                  <option value="APPROVED">Approuvé</option>
                  <option value="PLANNED">Planifié</option>
                  <option value="IN_PROGRESS">En cours</option>
                  <option value="COMPLETED">Terminé</option>
                  <option value="CANCELLED">Refusé / Annulé</option>
                </>
              )}
            </select>
          </div>

        </div>
      </div>

      {/* Main Table */}
      <div className="bg-surface rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden relative min-h-[400px]">
        {isLoading && (
          <div className="absolute inset-0 z-10 bg-surface/60 backdrop-blur-xs flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-4 border-red-200 border-t-[#b70f30] rounded-full animate-spin mb-3"></div>
            <p className="text-gray-500 font-medium text-xs">Chargement de vos assignations...</p>
          </div>
        )}

        {error && (
          <div className="p-12 text-center text-red-600 flex flex-col items-center justify-center">
            <span className="material-symbols-outlined text-[48px] mb-2">error</span>
            <p className="text-xs font-medium">Échec du chargement des assignations.</p>
          </div>
        )}

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-[#fdf4f5] border-b border-red-100 text-[#7c2d37] text-xs font-bold">
                <th className="p-3.5 pl-6 w-[26%]">Intitulé de l'Item</th>
                <th className="p-3.5 w-[15%]">Provider / Organisme</th>
                <th className="p-3.5 text-center w-[13%]">Date d'Assignation</th>
                <th className="p-3.5 text-center w-[14%]">Statut</th>
                <th className="p-3.5 text-center w-[18%]">Date Cible / Examen</th>
                <th className="p-3.5 text-center w-[14%]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {!assignmentsPage?.content || assignmentsPage.content.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-gray-400 text-xs">
                    Aucune assignation trouvée pour le filtre sélectionné.
                  </td>
                </tr>
              ) : (
                assignmentsPage.content.map(ass => {
                  const status = ass.itemType === 'CERTIFICATION' ? ass.statusCertification : ass.statusTraining;

                  return (
                    <tr key={ass.id} className="hover:bg-[#fcf8f8] transition-colors group">
                      
                      {/* Item Name & Code */}
                      <td className="p-3.5 pl-6">
                        <div>
                          <div className="font-bold text-gray-900 text-xs flex items-center gap-1.5 flex-wrap">
                            {ass.itemCode && (
                              <span className="px-1.5 py-0.5 text-[10px] font-extrabold text-[#b70f30] bg-red-50 rounded border border-red-100/80 uppercase">
                                {ass.itemCode}
                              </span>
                            )}
                            <span>{ass.itemName || `Item ID: ${ass.itemId}`}</span>
                          </div>
                          {ass.notes && <div className="text-[11px] text-gray-500 italic mt-0.5">{ass.notes}</div>}
                        </div>
                      </td>

                      {/* Provider */}
                      <td className="p-3.5">
                        <span className="text-xs font-semibold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-md">
                          {ass.provider || 'N/A'}
                        </span>
                      </td>

                      {/* Assigned At */}
                      <td className="p-3.5 text-center text-xs text-gray-600 font-medium">
                        {ass.assignedAt ? new Date(ass.assignedAt).toLocaleDateString('fr-FR') : '-'}
                      </td>

                      {/* Status */}
                      <td className="p-3.5 text-center">
                        <div className="flex justify-center">{renderStatusBadge(status)}</div>
                      </td>

                      {/* Date Cible / Examen / Planification Column */}
                      <td className="p-3.5 text-center">
                        {status === 'COMPLETED' || status === 'FAILED' ? (
                          <span className="text-xs text-gray-400 font-medium">-</span>
                        ) : status === 'EXAM_SCHEDULED' && ass.examAt ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-gray-100 text-gray-700 border border-gray-200/80 shadow-2xs">
                            <span className="material-symbols-outlined text-[14px] text-gray-500">edit_calendar</span>
                            <span>Examen : {new Date(ass.examAt).toLocaleDateString('fr-FR')}</span>
                          </div>
                        ) : status === 'PLANNED' && ass.targetDate ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200/80 shadow-2xs">
                            <span className="material-symbols-outlined text-[14px] text-blue-600">event_repeat</span>
                            <span>Prévu : {new Date(ass.targetDate).toLocaleDateString('fr-FR')}</span>
                          </div>
                        ) : ass.isNearDeadline && ass.targetDate ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200/90 shadow-2xs animate-pulse" title="Moins de 7 jours pour planifier votre examen !">
                            <span className="material-symbols-outlined text-[14px] text-amber-600">warning</span>
                            <span>Cible : {new Date(ass.targetDate).toLocaleDateString('fr-FR')} (7j)</span>
                          </div>
                        ) : ass.targetDate ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-gray-100 text-gray-700 border border-gray-200/80 shadow-2xs">
                            <span className="material-symbols-outlined text-[14px] text-gray-500">flag</span>
                            <span>Cible : {new Date(ass.targetDate).toLocaleDateString('fr-FR')}</span>
                          </div>
                        ) : ass.examAt ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-gray-100 text-gray-700 border border-gray-200/80 shadow-2xs">
                            <span className="material-symbols-outlined text-[14px] text-gray-500">event</span>
                            <span>Examen : {new Date(ass.examAt).toLocaleDateString('fr-FR')}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Non définie</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-center">
                        <div className="flex flex-col items-center justify-center gap-2">
                          
                          {/* Mini Progress Bar in Actions column for IN_PROGRESS */}
                          {status === 'IN_PROGRESS' && (
                            <div className="space-y-1 bg-gray-50 p-2 rounded-xl border border-gray-200/60 w-full max-w-[210px]">
                              <div className="flex justify-between items-center text-[10px] font-bold text-gray-700">
                                <span>Avancement: {ass.trainingProgressPercentage || 0}%</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setTempProgress(ass.trainingProgressPercentage || 0);
                                    setProgressModalState({
                                      isOpen: true,
                                      assignmentId: ass.id,
                                      currentProgress: ass.trainingProgressPercentage || 0
                                    });
                                  }}
                                  className="text-[10px] font-extrabold text-[#b70f30] cursor-pointer flex items-center gap-0.5"
                                >
                                  <span className="material-symbols-outlined text-[12px]">edit</span>
                                  <span className="hover:underline">Modifier</span>
                                </button>
                              </div>
                              <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="bg-[#b70f30] h-full rounded-full transition-all duration-300"
                                  style={{ width: `${ass.trainingProgressPercentage || 0}%` }}
                                />
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            {/* Commencer ou Planifier pour statut APPROVED */}
                          {status === 'APPROVED' && (
                            <>
                              <button
                                type="button"
                                onClick={() => updateStatusMutation.mutate({
                                  id: ass.id,
                                  data: ass.itemType === 'CERTIFICATION'
                                    ? { statusCertification: 'IN_PROGRESS', trainingProgressPercentage: 0 }
                                    : { statusTraining: 'IN_PROGRESS', trainingProgressPercentage: 0 }
                                })}
                                className="px-2.5 py-1 text-[11px] font-semibold text-[#006949] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[14px]">play_arrow</span>
                                <span>Commencer</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setPlannedStartDate(new Date().toISOString().split('T')[0]);
                                  setStartDateModalState({
                                    isOpen: true,
                                    assignmentId: ass.id,
                                    itemType: ass.itemType,
                                    targetDate: ass.targetDate
                                  });
                                }}
                                className="px-2.5 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[14px]">event_repeat</span>
                                <span>Planifier</span>
                              </button>
                            </>
                          )}

                          {status === 'PLANNED' && (
                            <button
                              type="button"
                              onClick={() => updateStatusMutation.mutate({
                                id: ass.id,
                                data: ass.itemType === 'CERTIFICATION'
                                  ? { statusCertification: 'IN_PROGRESS', trainingProgressPercentage: 0 }
                                  : { statusTraining: 'IN_PROGRESS', trainingProgressPercentage: 0 }
                              })}
                              className="px-2.5 py-1 text-[11px] font-semibold text-[#006949] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[14px]">play_arrow</span>
                              <span>Débuter maintenant</span>
                            </button>
                          )}

                          {/* Certification in IN_PROGRESS: Planifier Examen (ONLY if progress = 100%) */}
                          {ass.itemType === 'CERTIFICATION' && status === 'IN_PROGRESS' && (ass.trainingProgressPercentage || 0) >= 100 && (
                            <button
                              type="button"
                              onClick={() => setScheduleModalState({
                                isOpen: true,
                                assignmentId: ass.id,
                                itemName: ass.itemName,
                                targetDate: ass.targetDate
                              })}
                              className="px-2.5 py-1 text-[11px] font-semibold text-white bg-[#b70f30] hover:bg-red-800 rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                            >
                              <span className="material-symbols-outlined text-[14px]">edit_calendar</span>
                              <span>Planifier Examen</span>
                            </button>
                          )}

                          {/* Certification in EXAM_SCHEDULED: Can declare COMPLETED (Obtenu) or FAILED */}
                          {ass.itemType === 'CERTIFICATION' && status === 'EXAM_SCHEDULED' && (
                            <>
                              <button
                                type="button"
                                onClick={() => updateStatusMutation.mutate({
                                  id: ass.id,
                                  data: { statusCertification: 'COMPLETED' }
                                })}
                                className="px-2.5 py-1 text-[11px] font-semibold text-white bg-[#006949] hover:bg-emerald-800 rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                              >
                                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                                <span>Déclarer Obtenu</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => updateStatusMutation.mutate({
                                  id: ass.id,
                                  data: { statusCertification: 'FAILED' }
                                })}
                                className="px-2.5 py-1 text-[11px] font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-all flex items-center gap-1 cursor-pointer border border-red-200"
                              >
                                <span className="material-symbols-outlined text-[14px]">close</span>
                                <span>Déclarer Échec</span>
                              </button>
                            </>
                          )}

                          {/* Training in IN_PROGRESS: Can mark COMPLETED */}
                          {ass.itemType === 'TRAINING' && status === 'IN_PROGRESS' && (
                            <button
                              type="button"
                              onClick={() => updateStatusMutation.mutate({
                                id: ass.id,
                                data: { statusTraining: 'COMPLETED', trainingProgressPercentage: 100 }
                              })}
                              className="px-2.5 py-1 text-[11px] font-semibold text-white bg-[#006949] hover:bg-emerald-800 rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                            >
                              <span className="material-symbols-outlined text-[14px]">check_circle</span>
                              <span>Marquer Terminé</span>
                            </button>
                          )}

                          {status === 'PENDING_APPROVAL' && (
                            <span className="text-xs text-amber-700 font-semibold bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                              En attente de votre CM
                            </span>
                          )}

                          </div>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {assignmentsPage && (
          <Pagination
            currentPage={assignmentsPage.number}
            totalPages={assignmentsPage.totalPages}
            totalElements={assignmentsPage.totalElements}
            pageSize={pageSize}
            onPageChange={(newPage) => setPage(newPage)}
            itemName="assignations"
          />
        )}
      </div>

      {/* Request Assignment Modal */}
      <RequestAssignmentModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        onSuccessNotification={showNotification}
      />

      {/* Schedule Exam Modal */}
      <ScheduleExamModal
        isOpen={scheduleModalState.isOpen}
        itemName={scheduleModalState.itemName}
        targetDate={scheduleModalState.targetDate}
        onClose={() => setScheduleModalState({ isOpen: false, assignmentId: null, targetDate: undefined })}
        onConfirm={(examDateStr) => {
          if (scheduleModalState.assignmentId) {
            updateStatusMutation.mutate({
              id: scheduleModalState.assignmentId,
              data: {
                statusCertification: 'EXAM_SCHEDULED',
                examAt: new Date(examDateStr).toISOString()
              }
            });
            setScheduleModalState({ isOpen: false, assignmentId: null });
            showNotification('success', 'Date d\'examen enregistrée avec succès !');
          }
        }}
        isPending={updateStatusMutation.isPending}
      />

      {/* Progress Update Modal */}
      {progressModalState.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5 border border-gray-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-red-50 text-[#b70f30] flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-[18px]">trending_up</span>
                </div>
                <h3 className="text-base font-extrabold text-[#111827]">Mettre à jour l'avancement</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setProgressModalState({ isOpen: false, assignmentId: null, currentProgress: 0 })} 
                className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-200/60">
                <span className="text-xs font-bold text-gray-700">Pourcentage de progression</span>
                <span className="text-sm font-extrabold text-[#b70f30]">{tempProgress}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                step="5" 
                value={tempProgress} 
                onChange={(e) => setTempProgress(Number(e.target.value))}
                className="w-full accent-[#b70f30] cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-gray-400 font-semibold">
                <span>0% (Début)</span>
                <span>50% (Mi-parcours)</span>
                <span>100% (Terminé)</span>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button 
                type="button" 
                onClick={() => setProgressModalState({ isOpen: false, assignmentId: null, currentProgress: 0 })} 
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button 
                type="button" 
                onClick={() => {
                  if (progressModalState.assignmentId) {
                    updateStatusMutation.mutate({
                      id: progressModalState.assignmentId,
                      data: { trainingProgressPercentage: tempProgress }
                    });
                    setProgressModalState({ isOpen: false, assignmentId: null, currentProgress: 0 });
                    showNotification('success', `Avancement mis à jour à ${tempProgress}% !`);
                  }
                }} 
                className="px-4 py-2 text-xs font-semibold text-white bg-[#b70f30] hover:bg-red-800 rounded-xl shadow-2xs transition-all cursor-pointer"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Start Date Planifier Modal */}
      {startDateModalState.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5 border border-gray-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-[18px]">event_repeat</span>
                </div>
                <h3 className="text-base font-extrabold text-[#111827]">Planifier la date de début</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setStartDateModalState({ isOpen: false, assignmentId: null, itemType: undefined })} 
                className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-gray-700">
                Date de début prévue {startDateModalState.targetDate ? "(dans l'intervalle d'une semaine)" : ''} <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={plannedStartDate}
                min={new Date().toISOString().split('T')[0]}
                max={startDateModalState.targetDate ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : undefined}
                onChange={(e) => setPlannedStartDate(e.target.value)}
                className="w-full p-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#b70f30]/10 focus:border-[#b70f30]"
              />
              <p className="text-[11px] text-gray-500 bg-blue-50/60 p-2.5 rounded-xl border border-blue-100/60">
                Une fois la date atteinte, votre statut passera automatiquement en cours avec l'avancement.
              </p>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button 
                type="button" 
                onClick={() => setStartDateModalState({ isOpen: false, assignmentId: null, itemType: undefined })} 
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button 
                type="button" 
                onClick={() => {
                  if (startDateModalState.assignmentId) {
                    updateStatusMutation.mutate({
                      id: startDateModalState.assignmentId,
                      data: startDateModalState.itemType === 'CERTIFICATION'
                        ? { statusCertification: 'PLANNED' }
                        : { statusTraining: 'PLANNED' }
                    });
                    setStartDateModalState({ isOpen: false, assignmentId: null, itemType: undefined });
                    showNotification('success', 'Statut planifié avec succès !');
                  }
                }} 
                className="px-4 py-2 text-xs font-semibold text-white bg-[#b70f30] hover:bg-red-800 rounded-xl shadow-2xs transition-all cursor-pointer"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
