import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assignmentService, type AssignmentResponse } from '../services/assignment.service';
import { AssignItemModal } from '../components/AssignItemModal';
import { Pagination } from '../components/ui/Pagination';
import clsx from 'clsx';

export function ManageAssignments() {
  const queryClient = useQueryClient();

  const [collabSearch, setCollabSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 25;

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [modalPreselectedUser, setModalPreselectedUser] = useState<string | undefined>(undefined);
  const [modalDefaultItemType, setModalDefaultItemType] = useState<'CERTIFICATION' | 'TRAINING'>('CERTIFICATION');

  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Fetch Assignments (GET /api/v1/assignments)
  // Backend returns:
  // - Admin: ALL assignments
  // - Career Manager: Managed collaborators' assignments
  const { data: assignmentsPage, isLoading, error } = useQuery({
    queryKey: ['assignments', { itemType: typeFilter, status: statusFilter, page }],
    queryFn: () => assignmentService.getAllAssignments({
      itemType: typeFilter || undefined,
      status: statusFilter || undefined,
      page,
      size: pageSize
    })
  });

  const allAssignments = assignmentsPage?.content || [];

  // Client-side grouping by Collaborator
  const groupedCollaborators = useMemo(() => {
    const term = collabSearch.toLowerCase().trim();
    const map = new Map<string, {
      userId: string;
      userName: string;
      userEmail?: string;
      squadName?: string;
      assignments: AssignmentResponse[];
    }>();

    allAssignments.forEach(ass => {
      const uName = ass.userName || 'Inconnu';
      const uEmail = ass.userEmail || '';

      if (term && !uName.toLowerCase().includes(term) && !uEmail.toLowerCase().includes(term)) {
        return;
      }

      if (!map.has(ass.userId)) {
        map.set(ass.userId, {
          userId: ass.userId,
          userName: uName,
          userEmail: uEmail,
          squadName: ass.squadName,
          assignments: []
        });
      }
      map.get(ass.userId)!.assignments.push(ass);
    });

    return Array.from(map.values());
  }, [allAssignments, collabSearch]);

  // Update Status Mutation (Approuver / Refuser)
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => assignmentService.updateAssignment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      showNotification('success', 'Assignation mise à jour avec succès.');
    },
    onError: (err: any) => {
      console.error(err);
      showNotification('error', err.response?.data?.message || 'Échec de la mise à jour.');
    }
  });

  // Export Excel Functionality
  const handleExportExcel = () => {
    if (!allAssignments.length) {
      showNotification('error', 'Aucune donnée à exporter.');
      return;
    }

    const headers = ["Collaborateur", "Email", "Squad", "Type", "Intitule Item", "Provider", "Statut", "Progression %", "Date Assigne", "Notes"];
    const rows = allAssignments.map(a => {
      const status = a.itemType === 'CERTIFICATION' ? a.statusCertification : a.statusTraining;
      return [
        `"${a.userName || ''}"`,
        `"${a.userEmail || ''}"`,
        `"${a.squadName || ''}"`,
        `"${a.itemType}"`,
        `"${a.itemName || ''}"`,
        `"${a.provider || ''}"`,
        `"${status || ''}"`,
        `"${a.trainingProgressPercentage || 0}%"`,
        `"${a.assignedAt ? new Date(a.assignedAt).toLocaleDateString('fr-FR') : ''}"`,
        `"${(a.notes || '').replace(/"/g, '""')}"`
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Assignations_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotification('success', 'Exportation des assignations réussie.');
  };

  // Helper Badge Color
  const renderBadge = (status: string | undefined) => {
    if (!status) return null;
    const isPending = status === 'PENDING_APPROVAL';
    const isApproved = status === 'APPROVED' || status === 'COMPLETED';
    const isCancelled = status === 'CANCELLED' || status === 'FAILED';

    return (
      <span className={clsx(
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border",
        isPending ? "bg-amber-50 text-amber-700 border-amber-200" :
        isApproved ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
        isCancelled ? "bg-red-50 text-red-700 border-red-200" :
        "bg-blue-50 text-blue-700 border-blue-200"
      )}>
        <span>{status}</span>
      </span>
    );
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 pb-12 relative">
      
      {/* Toast Notification */}
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#111827] tracking-tight">Gestion des Assignations</h1>
          <p className="text-xs text-gray-500 mt-1">Supervisez et attribuez les parcours de certifications et formations de vos équipes.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleExportExcel}
            className="h-9 px-3.5 text-xs font-semibold rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-all flex items-center gap-1.5 text-gray-700 shadow-2xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px] text-emerald-600">download</span>
            <span>Exporter Excel</span>
          </button>

          <button
            type="button"
            onClick={() => { setModalDefaultItemType('TRAINING'); setModalPreselectedUser(undefined); setIsAssignModalOpen(true); }}
            className="h-9 px-3.5 text-xs font-semibold rounded-xl border border-red-200/80 bg-red-50 text-[#b70f30] hover:bg-red-100/80 transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">school</span>
            <span>Assigner Formation</span>
          </button>

          <button
            type="button"
            onClick={() => { setModalDefaultItemType('CERTIFICATION'); setModalPreselectedUser(undefined); setIsAssignModalOpen(true); }}
            className="h-9 px-4 text-xs font-semibold rounded-xl bg-[#b70f30] text-white hover:bg-red-800 transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">verified</span>
            <span>Assigner Certification</span>
          </button>
        </div>
      </div>

      {/* Filter Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 w-full">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end">
          
          {/* Collaborator Search */}
          <div className="md:col-span-4 space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 block">Collaborateur</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">search</span>
              <input
                type="text"
                placeholder="Nom, email..."
                value={collabSearch}
                onChange={(e) => setCollabSearch(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 focus:border-[#b70f30] rounded-xl pl-10 pr-4 py-2 text-xs outline-none"
              />
            </div>
          </div>

          {/* Type Filter */}
          <div className="md:col-span-4 space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 block">Type d'Item</label>
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }}
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-xs rounded-xl px-3 py-2 outline-none focus:border-[#b70f30]"
            >
              <option value="">Tous les types</option>
              <option value="CERTIFICATION">Certification</option>
              <option value="TRAINING">Formation</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="md:col-span-4 space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 block">Statut</label>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-xs rounded-xl px-3 py-2 outline-none focus:border-[#b70f30]"
            >
              <option value="">Tous les statuts</option>
              <option value="PENDING_APPROVAL">En attente (PENDING_APPROVAL)</option>
              <option value="APPROVED">Approuvé (APPROVED)</option>
              <option value="PLANNED">Planifié (PLANNED)</option>
              <option value="IN_PROGRESS">En cours (IN_PROGRESS)</option>
              <option value="EXAM_SCHEDULED">Examen Programmé (EXAM_SCHEDULED)</option>
              <option value="COMPLETED">Terminé (COMPLETED)</option>
              <option value="FAILED">Échoué (FAILED)</option>
              <option value="CANCELLED">Annulé (CANCELLED)</option>
            </select>
          </div>

        </div>
      </div>

      {/* Grouped Collaborators View */}
      {isLoading ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-4 border-red-200 border-t-[#b70f30] rounded-full animate-spin mb-3"></div>
          <p className="text-gray-500 text-xs">Chargement des assignations...</p>
        </div>
      ) : error ? (
        <div className="bg-white p-12 text-center text-red-600 rounded-2xl border border-gray-100 shadow-sm">
          Échec du chargement des assignations.
        </div>
      ) : groupedCollaborators.length === 0 ? (
        <div className="bg-white p-12 text-center text-gray-400 text-xs rounded-2xl border border-gray-100 shadow-sm">
          Aucune assignation trouvée.
        </div>
      ) : (
        <div className="space-y-6">
          {groupedCollaborators.map(group => {
            const pendingCount = group.assignments.filter(a => (a.statusCertification === 'PENDING_APPROVAL' || a.statusTraining === 'PENDING_APPROVAL')).length;
            const activeCount = group.assignments.length - pendingCount;

            return (
              <div key={group.userId} className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
                
                {/* Collaborator Header */}
                <div className="bg-gray-50/80 px-6 py-4 border-b border-gray-200/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center border border-indigo-100">
                      {group.userName?.[0]}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">{group.userName}</h3>
                      <p className="text-xs text-gray-500">{group.userEmail} {group.squadName ? `• Squad: ${group.squadName}` : ''}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {pendingCount > 0 && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          {pendingCount} Demande(s) en attente
                        </span>
                      )}
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {activeCount} Parcours actif(s)
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => { setModalPreselectedUser(group.userId); setIsAssignModalOpen(true); }}
                      className="px-3 py-1.5 text-xs font-semibold text-[#b70f30] bg-red-50 hover:bg-red-100 rounded-xl border border-red-200/60 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">add</span>
                      <span>Assigner</span>
                    </button>
                  </div>
                </div>

                {/* Assignment Cards Grid */}
                <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.assignments.map(ass => {
                    const status = ass.itemType === 'CERTIFICATION' ? ass.statusCertification : ass.statusTraining;
                    const isPending = status === 'PENDING_APPROVAL';

                    return (
                      <div key={ass.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between relative">
                        <div>
                          <div className="flex items-center justify-between mb-2.5">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                              <span className="material-symbols-outlined text-[13px]">
                                {ass.itemType === 'CERTIFICATION' ? 'verified' : 'school'}
                              </span>
                              {ass.itemType}
                            </span>
                            {renderBadge(status)}
                          </div>

                          <h4 className="text-xs font-bold text-gray-900 leading-snug mb-1">
                            {ass.itemName || `Item ID: ${ass.itemId}`}
                          </h4>

                          <p className="text-[11px] text-gray-500 mb-3">
                            Provider: <strong className="text-gray-700">{ass.provider || 'N/A'}</strong>
                          </p>

                          {ass.notes && (
                            <div className="text-[11px] text-gray-600 bg-gray-50 p-2 rounded-lg border border-gray-100 mb-3 italic">
                              "{ass.notes}"
                            </div>
                          )}
                        </div>

                        {/* Actions for Pending Requests */}
                        {isPending ? (
                          <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => updateStatusMutation.mutate({
                                id: ass.id,
                                data: ass.itemType === 'CERTIFICATION'
                                  ? { statusCertification: 'CANCELLED' }
                                  : { statusTraining: 'CANCELLED' }
                              })}
                              className="px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[15px]">close</span>
                              <span>Refuser</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => updateStatusMutation.mutate({
                                id: ass.id,
                                data: ass.itemType === 'CERTIFICATION'
                                  ? { statusCertification: 'APPROVED' }
                                  : { statusTraining: 'APPROVED' }
                              })}
                              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[15px]">check</span>
                              <span>Approuver</span>
                            </button>
                          </div>
                        ) : (
                          <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                            <span>Assigné le : {ass.assignedAt ? new Date(ass.assignedAt).toLocaleDateString('fr-FR') : '-'}</span>
                            {ass.itemType === 'TRAINING' && <span>Avancement : <strong>{ass.trainingProgressPercentage || 0}%</strong></span>}
                          </div>
                        )}

                      </div>
                    );
                  })}
                </div>

              </div>
            );
          })}
        </div>
      )}

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

      {/* Assign Modal */}
      <AssignItemModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        onSuccessNotification={showNotification}
        preselectedUserId={modalPreselectedUser}
        defaultItemType={modalDefaultItemType}
      />

    </div>
  );
}
