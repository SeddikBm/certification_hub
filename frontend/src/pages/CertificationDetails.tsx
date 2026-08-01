import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { certificationService } from '../services/certification.service';
import { useAuth } from '../contexts/AuthContext';
import { CertificationFormModal } from '../components/CertificationFormModal';
import { RatingFormModal } from '../components/certifications/RatingFormModal';
import { assignmentService } from '../services/assignment.service';
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

export function CertificationDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [reportingUser, setReportingUser] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const canManage = user?.role === 'ADMIN' || user?.role === 'TRAINING_MANAGER';

  // Query Certification Details
  const { data: cert, isLoading, error, refetch } = useQuery({
    queryKey: ['certification', id],
    queryFn: () => certificationService.getCertificationById(id!),
    enabled: !!id
  });

  // Query Ratings
  const { data: ratingsPage } = useQuery({
    queryKey: ['certification-ratings', id],
    queryFn: () => certificationService.getCertificationRatings(id!),
    enabled: !!id
  });

  // Query user's assignments to check if completed
  const { data: myAssignmentsPage } = useQuery({
    queryKey: ['my-assignments-completed', id],
    queryFn: () => assignmentService.getMyAssignments({ page: 0, size: 100 }),
    enabled: !!user && !!id
  });

  const hasCompletedCert = Boolean(
    myAssignmentsPage?.content?.some(
      a => a.itemId === id && a.itemType === 'CERTIFICATION' && 
      (a.statusCertification === 'COMPLETED' || a.statusCertification === 'FAILED')
    )
  );

  // Report Rating Mutation
  const reportMutation = useMutation({
    mutationFn: (authorId: string) => certificationService.reportRating(id!, authorId),
    onSuccess: () => {
      showNotification('success', 'Cet avis a été signalé pour modération.');
      setReportingUser(null);
    },
    onError: () => {
      showNotification('error', "Échec lors du signalement de l'avis.");
      setReportingUser(null);
    }
  });

  // Delete Rating Mutation (Admin & Training Manager)
  const deleteRatingMutation = useMutation({
    mutationFn: (authorId: string) => certificationService.deleteRating(id!, authorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certification-ratings', id] });
      queryClient.invalidateQueries({ queryKey: ['certification', id] });
      showNotification('success', "L'avis a été supprimé avec succès.");
      refetch();
    },
    onError: () => {
      showNotification('error', "Échec lors de la suppression de l'avis.");
    }
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (certId: string) => certificationService.deleteCertification(certId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certifications'] });
      navigate('/certifications', { state: { notification: { type: 'success', message: 'Certification supprimée avec succès.' } } });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || "Impossible de supprimer : des collaborateurs sont actuellement assignés à cette certification.";
      setDeleteError(msg);
    }
  });

  if (isLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="material-symbols-outlined animate-spin text-4xl text-[#b70f30]">progress_activity</span>
          <span className="text-gray-500 font-medium text-sm">Chargement de la certification...</span>
        </div>
      </div>
    );
  }

  if (error || !cert) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="bg-red-50 border border-red-200 text-[#b70f30] px-6 py-4 rounded-xl flex items-center gap-3">
          <span className="material-symbols-outlined">error</span>
          <span className="font-medium text-sm">Certification introuvable ou erreur de chargement.</span>
        </div>
      </div>
    );
  }

  const pConfig = getProviderConfig(cert.provider || '');

  // Calculate validity label
  const validityLabel = cert.validityMonths 
    ? `${Math.floor(cert.validityMonths / 12)} an${cert.validityMonths >= 24 ? 's' : ''}` 
    : 'Permanente';

  const examDuration = cert.metadata?.examDuration || cert.metadata?.duration;
  const passingScore = cert.metadata?.passingScore;
  const description = cert.metadata?.description;
  const ratings = ratingsPage?.content || [];

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
      
      {/* Breadcrumb & Header */}
      <div>
        <nav aria-label="Breadcrumb" className="flex text-xs font-medium text-gray-500 mb-3">
          <ol className="inline-flex items-center space-x-1 sm:space-x-2">
            <li>
              <Link to="/certifications" className="hover:text-[#b70f30] transition-colors">
                Certifications
              </Link>
            </li>
            <li>
              <div className="flex items-center">
                <span className="material-symbols-outlined text-[16px] text-gray-400">chevron_right</span>
                <span className="text-gray-900 font-semibold truncate max-w-[200px] sm:max-w-[400px]">{cert.name}</span>
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
                <span className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider">{cert.code}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                <span className="text-xs font-semibold text-gray-600">{cert.provider || 'Sans Provider'}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#111827] mt-0.5 tracking-tight">{cert.name}</h1>
            </div>
          </div>

          {/* Buttons: Small reduced size */}
          {canManage && (
            <div className="flex items-center gap-2 self-end sm:self-center">
              <button 
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="h-8 px-3 text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <span className="material-symbols-outlined text-[15px]">edit</span>
                <span>Éditer</span>
              </button>
              <button 
                type="button"
                onClick={() => { setDeleteError(null); setDeleteDialogOpen(true); }}
                className="h-8 px-3 text-xs font-semibold text-[#b70f30] bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <span className="material-symbols-outlined text-[15px]">delete</span>
                <span>Supprimer</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Section 1: Infos Générales */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-5">
            <span className="material-symbols-outlined text-[#b70f30] text-[20px]">info</span>
            <h2 className="text-base font-bold text-[#111827]">Informations Générales</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <span className="text-xs font-medium text-gray-400 block mb-1">Code Certification</span>
              <span className="text-sm font-mono font-semibold text-gray-800">{cert.code}</span>
            </div>
            <div>
              <span className="text-xs font-medium text-gray-400 block mb-1">Provider</span>
              <div className="flex items-center gap-2">
                <span className={clsx("w-2 h-2 rounded-full", pConfig.text)}></span>
                <span className="text-sm font-semibold text-gray-800">{cert.provider || '-'}</span>
              </div>
            </div>
            <div>
              <span className="text-xs font-medium text-gray-400 block mb-1">Difficulté</span>
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
            </div>
            <div>
              <span className="text-xs font-medium text-gray-400 block mb-1">Priorité Interne</span>
              <div className="flex items-center gap-1.5">
                <span className={clsx("w-2 h-2 rounded-full",
                  cert.priority === 'MANDATORY' ? 'bg-red-600' : 
                  cert.priority === 'HIGH' ? 'bg-amber-500' : 
                  cert.priority === 'NORMAL' ? 'bg-emerald-500' : 
                  'bg-blue-600'
                )}></span>
                <span className={clsx(
                  "text-xs font-bold uppercase",
                  cert.priority === 'MANDATORY' ? 'text-red-600' : 
                  cert.priority === 'HIGH' ? 'text-amber-600' : 
                  cert.priority === 'NORMAL' ? 'text-emerald-600' : 
                  'text-blue-600'
                )}>
                  {cert.priority}
                </span>
              </div>
            </div>
          </div>

          {description && (
            <div className="mt-6 pt-5 border-t border-gray-100">
              <span className="text-xs font-medium text-gray-400 block mb-1.5">Description</span>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed whitespace-pre-line">{description}</p>
            </div>
          )}
        </div>

        {/* Section 2: Détails d'Examen */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-5">
            <span className="material-symbols-outlined text-[#b70f30] text-[20px]">timer</span>
            <h2 className="text-base font-bold text-[#111827]">Détails d'Examen</h2>
          </div>

          <ul className="space-y-4">
            <li className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-600">
                  <span className="material-symbols-outlined text-[18px]">schedule</span>
                </div>
                <span className="text-xs font-medium text-gray-600">Durée d'examen</span>
              </div>
              <span className="text-xs font-extrabold text-gray-900">{examDuration ? `${examDuration} min` : '-'}</span>
            </li>

            <li className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-600">
                  <span className="material-symbols-outlined text-[18px]">workspace_premium</span>
                </div>
                <span className="text-xs font-medium text-gray-600">Note de passage</span>
              </div>
              <span className="text-xs font-extrabold text-gray-900">{passingScore ? `${passingScore}%` : '-'}</span>
            </li>

            <li className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-600">
                  <span className="material-symbols-outlined text-[18px]">payments</span>
                </div>
                <span className="text-xs font-medium text-gray-600">Coût Examen</span>
              </div>
              <span className="text-xs font-extrabold text-gray-900">{cert.examCostUsd ? `${cert.examCostUsd.toLocaleString()} MAD` : '-'}</span>
            </li>

            <li className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-600">
                  <span className="material-symbols-outlined text-[18px]">school</span>
                </div>
                <span className="text-xs font-medium text-gray-600">Coût Formation</span>
              </div>
              <span className="text-xs font-extrabold text-gray-900">{cert.trainingCostUsd ? `${cert.trainingCostUsd.toLocaleString()} MAD` : '-'}</span>
            </li>

            <li className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-600">
                  <span className="material-symbols-outlined text-[18px]">history</span>
                </div>
                <span className="text-xs font-medium text-gray-600">Durée de Validité</span>
              </div>
              <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {validityLabel}
              </span>
            </li>
          </ul>
        </div>

        {/* Section 3: URLs & Liens */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-4">
            <span className="material-symbols-outlined text-[#b70f30] text-[20px]">link</span>
            <h2 className="text-base font-bold text-[#111827]">Liens & Ressources</h2>
          </div>

          <div className="space-y-3">
            {cert.officialUrl ? (
              <a 
                href={cert.officialUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-red-200 hover:bg-red-50/30 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#b70f30] text-[20px]">language</span>
                  <span className="text-xs font-semibold text-gray-700 group-hover:text-[#b70f30] transition-colors">Site Officiel</span>
                </div>
                <span className="material-symbols-outlined text-gray-400 group-hover:text-[#b70f30] text-[18px]">open_in_new</span>
              </a>
            ) : (
              <div className="p-3 rounded-xl border border-gray-100 text-xs text-gray-400 italic">Aucune URL officielle spécifiée</div>
            )}

            {cert.examProviderUrl ? (
              <a 
                href={cert.examProviderUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-red-200 hover:bg-red-50/30 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#b70f30] text-[20px]">cast_for_education</span>
                  <span className="text-xs font-semibold text-gray-700 group-hover:text-[#b70f30] transition-colors">Centre d'Examen (Provider)</span>
                </div>
                <span className="material-symbols-outlined text-gray-400 group-hover:text-[#b70f30] text-[18px]">open_in_new</span>
              </a>
            ) : (
              <div className="p-3 rounded-xl border border-gray-100 text-xs text-gray-400 italic">Aucune URL d'examen spécifiée</div>
            )}
          </div>
        </div>

        {/* Section 4: Squads Concernées avec Priorité */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-4">
            <span className="material-symbols-outlined text-[#b70f30] text-[20px]">groups</span>
            <h2 className="text-base font-bold text-[#111827]">Squads Concernées</h2>
          </div>

          {cert.associatedSquads && cert.associatedSquads.length > 0 ? (
            <div className="flex flex-wrap gap-2.5">
              {cert.associatedSquads.map((sq, idx) => (
                <div 
                  key={idx} 
                  className="px-3 py-1.5 bg-red-50/60 border border-red-100 rounded-xl flex items-center gap-2 text-xs font-medium text-[#b70f30]"
                >
                  <span>{sq.name}</span>
                  {sq.priority && (
                    <span className="px-1.5 py-0.5 rounded bg-[#b70f30] text-white text-[10px] font-bold">
                      P{sq.priority}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-4 text-xs text-gray-400 italic">Aucune squad associée à cette certification.</div>
          )}
        </div>

        {/* Section 5: Note Globale & Avis (Ratings with Star Ratings, Detailed Breakdown, Moderation) */}
        <div className="lg:col-span-12 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-4 mb-6 gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#b70f30] text-[20px]">star</span>
                <h2 className="text-base font-bold text-[#111827]">Avis & Commentaires</h2>
              </div>
              
              {cert.averageRating ? (
                <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                  <span className="material-symbols-outlined text-[18px] text-amber-500" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="text-xs font-extrabold text-amber-900">{cert.averageRating.toFixed(1)} / 5</span>
                  <span className="text-[11px] text-amber-700 ml-1">({ratings.length} avis)</span>
                </div>
              ) : (
                <span className="text-xs text-gray-400 italic">Pas encore de note</span>
              )}
            </div>

            {hasCompletedCert && (
              <button
                type="button"
                onClick={() => setIsRatingModalOpen(true)}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#b70f30] hover:bg-red-800 rounded-xl transition-all shadow-xs flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">rate_review</span>
                <span>{ratings.find(r => r.userId === user?.id) ? 'Modifier mon avis' : 'Donner mon avis'}</span>
              </button>
            )}
          </div>

          {ratings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ratings.map((r, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-gray-200 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-xs font-bold text-gray-900">{r.userFullName || 'Utilisateur Anonyme'}</p>
                        {r.squadName && (
                          <p className="text-[11px] font-medium text-gray-500 mt-0.5">Squad: {r.squadName}</p>
                        )}
                      </div>
                      <div className="flex text-amber-400">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span 
                            key={star} 
                            className="material-symbols-outlined text-[16px]"
                            style={{ fontVariationSettings: star <= (r.rating || 0) ? "'FILL' 1" : "'FILL' 0" }}
                          >
                            star
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Criteria Badges */}
                    {(r.materialsQuality || r.difficulty || r.usefulness) && (
                      <div className="flex flex-wrap gap-1.5 my-2">
                        {r.materialsQuality && (
                          <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-semibold border border-blue-100">
                            Matériaux: {r.materialsQuality}/5
                          </span>
                        )}
                        {r.difficulty && (
                          <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[10px] font-semibold border border-purple-100">
                            Difficulté: {r.difficulty}/5
                          </span>
                        )}
                        {r.usefulness && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-100">
                            Utilité: {r.usefulness}/5
                          </span>
                        )}
                      </div>
                    )}

                    {r.comment && (
                      <p className="text-xs text-gray-600 mt-2 leading-relaxed whitespace-pre-line">{r.comment}</p>
                    )}
                  </div>

                  <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                    {r.wouldRecommend !== undefined ? (
                      <div className="flex items-center gap-1.5 text-[11px] text-gray-500 font-medium">
                        <span className={`material-symbols-outlined text-[15px] ${r.wouldRecommend ? 'text-emerald-600' : 'text-red-500'}`}>
                          {r.wouldRecommend ? 'thumb_up' : 'thumb_down'}
                        </span>
                        <span>{r.wouldRecommend ? 'Recommande cette certification' : 'Ne recommande pas'}</span>
                      </div>
                    ) : <div />}

                    <div className="flex items-center gap-2">
                      {canManage && r.isReported && (
                        <>
                          <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px]">warning</span>
                            <span>Signalé</span>
                          </span>

                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm("Cet avis a été signalé comme inapproprié. Êtes-vous sûr de vouloir le supprimer ?")) {
                                deleteRatingMutation.mutate(r.userId);
                              }
                            }}
                            disabled={deleteRatingMutation.isPending}
                            title="Supprimer cet avis signalé (Admin/TM)"
                            className="text-white bg-[#b70f30] hover:bg-red-800 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold shadow-2xs cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[14px]">delete</span>
                            <span>Supprimer</span>
                          </button>
                        </>
                      )}

                      {r.userId !== user?.id && (!canManage || !r.isReported) && (
                        <button
                          type="button"
                          onClick={() => {
                            setReportingUser(r.userId);
                            reportMutation.mutate(r.userId);
                          }}
                          disabled={reportMutation.isPending && reportingUser === r.userId}
                          title="Signaler cet avis pour modération"
                          className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1 text-[10px] font-semibold cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[14px]">flag</span>
                          <span>{reportMutation.isPending && reportingUser === r.userId ? 'Signalement...' : 'Signaler'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-gray-400 text-xs italic">
              Aucun commentaire publié pour cette certification.
            </div>
          )}
        </div>

      </div>

      {/* Rating Form Modal */}
      {isRatingModalOpen && (
        <RatingFormModal
          isOpen={isRatingModalOpen}
          onClose={() => setIsRatingModalOpen(false)}
          certId={cert.id}
          certName={cert.name}
          existingRating={ratings.find(r => r.userId === user?.id)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['certification-ratings', cert.id] });
            queryClient.invalidateQueries({ queryKey: ['certification', cert.id] });
            showNotification('success', 'Votre avis a été enregistré avec succès !');
            refetch();
          }}
        />
      )}

      {/* Edit Form Modal */}
      {isEditModalOpen && (
        <CertificationFormModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          certificationToEdit={cert}
          onSuccess={() => {
            setIsEditModalOpen(false);
            showNotification('success', 'Certification modifiée avec succès.');
            refetch();
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteDialogOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <span className="material-symbols-outlined text-3xl">warning</span>
              <h3 className="text-lg font-bold text-gray-900">Confirmer la suppression</h3>
            </div>
            <p className="text-xs text-gray-600">
              Êtes-vous sûr de vouloir supprimer la certification <strong className="text-gray-900">{cert.name}</strong> ?
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
                onClick={() => { setDeleteDialogOpen(false); setDeleteError(null); }}
                className="px-3.5 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Fermer
              </button>
              <button 
                type="button" 
                onClick={() => deleteMutation.mutate(cert.id)}
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

    </div>
  );
}

