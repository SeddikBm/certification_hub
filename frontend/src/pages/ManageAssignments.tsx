import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assignmentService, type AssignmentResponse } from '../services/assignment.service';
import { AssignItemModal } from '../components/AssignItemModal';
import { Pagination } from '../components/ui/Pagination';
import { useAuth } from '../contexts/AuthContext';
import { formatStatus, formatPriority, getAssignmentProgressPercentage } from '../utils/enumFormatters';
import clsx from 'clsx';

export function ManageAssignments() {
  const { user } = useAuth();
  const isDirectView = user?.role === 'CAREER_MANAGER' || user?.role === 'SQUAD_LEAD';
  const queryClient = useQueryClient();

  const [collabSearch, setCollabSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 25;

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [modalPreselectedUser, setModalPreselectedUser] = useState<string | undefined>(undefined);
  const [modalDefaultItemType, setModalDefaultItemType] = useState<'CERTIFICATION' | 'TRAINING'>('CERTIFICATION');

  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (sectionName: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }));
  };

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

  // Client-side grouping by Career Manager -> Collaborators
  const groupedManagers = useMemo(() => {
    const term = collabSearch.toLowerCase().trim();
    const managerMap = new Map<string, {
      managerName: string;
      collaboratorsMap: Map<string, {
        userId: string;
        userName: string;
        userEmail?: string;
        squadName?: string;
        assignments: AssignmentResponse[];
      }>;
    }>();

    allAssignments.forEach(ass => {
      const uName = ass.userName || 'Inconnu';
      const uEmail = ass.userEmail || '';
      const mName = ass.managerName || 'Sans Career Manager';

      if (term && !uName.toLowerCase().includes(term) && !uEmail.toLowerCase().includes(term) && !mName.toLowerCase().includes(term)) {
        return;
      }

      if (priorityFilter && ass.priority !== priorityFilter) {
        return;
      }

      if (!managerMap.has(mName)) {
        managerMap.set(mName, {
          managerName: mName,
          collaboratorsMap: new Map()
        });
      }

      const collabMap = managerMap.get(mName)!.collaboratorsMap;
      if (!collabMap.has(ass.userId)) {
        collabMap.set(ass.userId, {
          userId: ass.userId,
          userName: uName,
          userEmail: uEmail,
          squadName: ass.squadName,
          assignments: []
        });
      }
      collabMap.get(ass.userId)!.assignments.push(ass);
    });

    return Array.from(managerMap.values()).map(mGroup => ({
      managerName: mGroup.managerName,
      collaborators: Array.from(mGroup.collaboratorsMap.values())
    }));
  }, [allAssignments, collabSearch, priorityFilter]);

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

  const renderPriorityBadge = (priorityStr: string | undefined, isTraining?: boolean) => {
    if (!priorityStr) return null;
    const label = formatPriority(priorityStr, isTraining);
    const isHigh = priorityStr === 'MANDATORY' || priorityStr === 'HIGH';
    return (
      <span className={clsx(
        "px-2 py-0.5 rounded-full text-[10px] font-extrabold border",
        isHigh ? "bg-red-50 text-red-700 border-red-200" : "bg-blue-50 text-blue-700 border-blue-200"
      )}>
        {label}
      </span>
    );
  };

  const renderDateWarning = (dateStr: string | undefined, isTraining?: boolean) => {
    if (!dateStr) return null;
    const targetDate = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
    const label = isTraining ? 'Date cible' : 'Examen';

    if (diffDays <= 7 && diffDays >= 0) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
          <span className="material-symbols-outlined text-[12px]">warning</span>
          <span>{label} proche ({diffDays} j)</span>
        </span>
      );
    } else if (diffDays < 0) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200 flex items-center gap-1">
          <span className="material-symbols-outlined text-[12px]">alarm_off</span>
          <span>{label} dépassé(e)</span>
        </span>
      );
    }
    return (
      <span className="text-[11px] text-gray-500 font-semibold flex items-center gap-1">
        <span className="material-symbols-outlined text-[13px]">calendar_today</span>
        <span>{label} : {targetDate.toLocaleDateString('fr-FR')}</span>
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
          <div className="md:col-span-3 space-y-1.5">
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
          <div className="md:col-span-3 space-y-1.5">
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

          {/* Dynamic Status Filter */}
          <div className="md:col-span-3 space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 block">Statut</label>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-xs rounded-xl px-3 py-2 outline-none focus:border-[#b70f30]"
            >
              <option value="">Tous les statuts</option>
              <option value="PENDING_APPROVAL">En attente de validation</option>
              <option value="APPROVED">Approuvé</option>
              <option value="PLANNED">Planifié</option>
              <option value="IN_PROGRESS">En cours</option>
              {typeFilter !== 'TRAINING' && <option value="EXAM_SCHEDULED">Examen programmé</option>}
              <option value="COMPLETED">{typeFilter === 'CERTIFICATION' ? 'Obtenu' : typeFilter === 'TRAINING' ? 'Terminé' : 'Obtenu / Terminé'}</option>
              {typeFilter !== 'TRAINING' && <option value="FAILED">Échoué</option>}
              <option value="CANCELLED">Refusé / Annulé</option>
              {typeFilter !== 'TRAINING' && <option value="EXPIRED">Expiré</option>}
            </select>
          </div>

          {/* Priority Filter */}
          <div className="md:col-span-3 space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 block">Priorité</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-xs rounded-xl px-3 py-2 outline-none focus:border-[#b70f30]"
            >
              <option value="">Toutes les priorités</option>
              <option value="MANDATORY">Obligatoire</option>
              <option value="HIGH">Haute</option>
              <option value="NORMAL">Normale</option>
              <option value="OPTIONAL">Optionnelle</option>
            </select>
          </div>

        </div>
      </div>

      {/* Grouped Career Managers & Collaborators View */}
      {isLoading ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-4 border-red-200 border-t-[#b70f30] rounded-full animate-spin mb-3"></div>
          <p className="text-gray-500 text-xs">Chargement des assignations...</p>
        </div>
      ) : error ? (
        <div className="bg-white p-12 text-center text-red-600 rounded-2xl border border-gray-100 shadow-sm">
          Échec du chargement des assignations.
        </div>
      ) : groupedManagers.length === 0 ? (
        <div className="bg-white p-12 text-center text-gray-400 text-xs rounded-2xl border border-gray-100 shadow-sm">
          Aucune assignation trouvée.
        </div>
      ) : (
        <div className="space-y-6">
          {isDirectView ? (
            /* Direct Collaborator Cards View for Career Manager */
            <div className="space-y-5">
              {groupedManagers.flatMap(m => m.collaborators).map(group => {
                const pendingCount = group.assignments.filter(a => (a.statusCertification === 'PENDING_APPROVAL' || a.statusTraining === 'PENDING_APPROVAL')).length;
                const activeCount = group.assignments.length - pendingCount;

                return (
                  <div key={group.userId} className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
                    {/* Collaborator Header */}
                    <div className="bg-gray-50/80 px-6 py-3.5 border-b border-gray-200/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center border border-indigo-100">
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
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-white">
                      {group.assignments.map((ass) => {
                        const status = ass.itemType === 'CERTIFICATION' ? ass.statusCertification : ass.statusTraining;
                        const isPending = status === 'PENDING_APPROVAL';

                        return (
                          <div key={ass.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50/40 hover:border-gray-200 transition-all flex flex-col justify-between space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={clsx(
                                  "px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider border",
                                  ass.itemType === 'CERTIFICATION' ? "bg-amber-50 text-amber-800 border-amber-200" : "bg-blue-50 text-blue-800 border-blue-200"
                                )}>
                                  {ass.itemType === 'CERTIFICATION' ? 'Certification' : 'Formation'}
                                </span>
                                {renderPriorityBadge(ass.priority, ass.itemType === 'TRAINING')}
                              </div>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700">
                                {formatStatus(status, ass.itemType)}
                              </span>
                            </div>

                            <div>
                              <h4 className="text-xs font-bold text-gray-900 line-clamp-1">{ass.itemName}</h4>
                              <div className="flex items-center justify-between text-[11px] text-gray-500 mt-1">
                                <span>Provider: {ass.provider || '-'}</span>
                                {renderDateWarning(ass.examAt, ass.itemType === 'TRAINING')}
                              </div>
                            </div>

                            {/* Progress Bar (ONLY for Formations) */}
                            {ass.itemType === 'TRAINING' && (
                              <div className="space-y-1 bg-white p-2 rounded-lg border border-gray-100">
                                <div className="flex justify-between text-[10px] font-bold text-gray-600">
                                  <span>Progression Formation</span>
                                  <span>{ass.trainingProgressPercentage || 0}%</span>
                                </div>
                                <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                  <div 
                                    className="bg-[#b70f30] h-full rounded-full transition-all duration-300"
                                    style={{ width: `${ass.trainingProgressPercentage || 0}%` }}
                                  ></div>
                                </div>
                              </div>
                            )}

                            {isPending ? (
                              <div className="pt-2 border-t border-gray-200 flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => updateStatusMutation.mutate({
                                    id: ass.id,
                                    data: ass.itemType === 'CERTIFICATION'
                                      ? { statusCertification: 'CANCELLED' }
                                      : { statusTraining: 'CANCELLED' }
                                  })}
                                  className="px-2.5 py-1 text-[11px] font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                                >
                                  <span className="material-symbols-outlined text-[14px]">close</span>
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
                                  className="px-2.5 py-1 text-[11px] font-semibold text-white bg-[#006949] hover:bg-emerald-800 rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                                >
                                  <span className="material-symbols-outlined text-[14px]">check</span>
                                  <span>Approuver</span>
                                </button>
                              </div>
                            ) : (
                              <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                                <span>Attribué le: {ass.assignedAt ? new Date(ass.assignedAt).toLocaleDateString('fr-FR') : '-'}</span>
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
          ) : (
            groupedManagers.map(mGroup => {
              const isCollapsed = collapsedSections[mGroup.managerName] || false;

              return (
                <div key={mGroup.managerName} className="space-y-4">
                  {/* Career Manager Banner Header (Collapsible Accordion) */}
                  <div 
                    onClick={() => toggleSection(mGroup.managerName)}
                    className="flex items-center justify-between bg-gradient-to-r from-red-50/80 via-gray-50 to-white px-5 py-3.5 rounded-2xl border border-red-100/90 shadow-2xs cursor-pointer hover:border-red-200 transition-all select-none group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#b70f30] text-white flex items-center justify-center font-bold text-xs shadow-sm">
                        <span className="material-symbols-outlined text-[18px]">badge</span>
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-gray-900 tracking-tight flex items-center gap-2">
                          <span>Équipe :</span>
                          <span className="text-[#b70f30]">{mGroup.managerName}</span>
                        </h2>
                        <p className="text-[11px] text-gray-500">
                          {mGroup.collaborators.length} collaborateur(s) sous cette responsabilité
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-500 group-hover:text-[#b70f30] transition-colors">
                        {isCollapsed ? 'Afficher' : 'Masquer'}
                      </span>
                      <div className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-600 group-hover:text-[#b70f30] group-hover:border-red-200 transition-all">
                        <span className="material-symbols-outlined text-[18px]">
                          {isCollapsed ? 'expand_more' : 'expand_less'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Collaborators Under this Manager */}
                  {!isCollapsed && (
                    <div className="space-y-5 pl-2 sm:pl-4 border-l-2 border-red-100">
                      {mGroup.collaborators.map(group => {
                        const pendingCount = group.assignments.filter(a => (a.statusCertification === 'PENDING_APPROVAL' || a.statusTraining === 'PENDING_APPROVAL')).length;
                        const activeCount = group.assignments.length - pendingCount;

                        return (
                          <div key={group.userId} className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
                            {/* Collaborator Header */}
                            <div className="bg-gray-50/80 px-6 py-3.5 border-b border-gray-200/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                              <div className="flex items-center gap-3.5">
                                <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center border border-indigo-100">
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
                            <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-white">
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
                                          {ass.itemType === 'CERTIFICATION' ? 'Certification' : 'Formation'}
                                        </span>
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700">
                                          {formatStatus(status, ass.itemType)}
                                        </span>
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
                                          className="px-3 py-1.5 text-xs font-semibold text-white bg-[#006949] hover:bg-emerald-800 rounded-xl transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                                        >
                                          <span className="material-symbols-outlined text-[15px]">check</span>
                                          <span>Approuver</span>
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                                        <span>Attribué le: {ass.assignedAt ? new Date(ass.assignedAt).toLocaleDateString('fr-FR') : '-'}</span>
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
                </div>
              );
            })
          )}
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
