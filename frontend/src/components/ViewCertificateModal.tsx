import { useState, useEffect } from 'react';
import { assignmentService, type ValidationDetails } from '../services/assignment.service';
import clsx from 'clsx';

interface ViewCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  certificateId: string | null;
  fileName?: string;
  collaboratorName?: string;
  itemName?: string;
  currentStatus?: string;
  onStatusUpdated?: (newStatus: string) => void;
  validationDetails?: ValidationDetails | null;
  isManagerView?: boolean;
}

export function ViewCertificateModal({
  isOpen,
  onClose,
  certificateId,
  fileName,
  collaboratorName,
  itemName,
  currentStatus,
  onStatusUpdated,
  validationDetails,
  isManagerView = false
}: ViewCertificateModalProps) {

  const [previewData, setPreviewData] = useState<{ url: string; mimeType: string } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  useEffect(() => {
    let activeUrl: string | null = null;

    if (isOpen && certificateId) {
      setIsLoading(true);
      setError(null);

      assignmentService.getCertificatePreviewUrl(certificateId)
        .then((res) => {
          activeUrl = res.url;
          setPreviewData(res);
          setIsLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setError("Impossible de prévisualiser le fichier directement. Vous pouvez le télécharger via le bouton ci-dessous.");
          setIsLoading(false);
        });
    }

    return () => {
      if (activeUrl) {
        window.URL.revokeObjectURL(activeUrl);
      }
      setPreviewData(null);
    };
  }, [isOpen, certificateId]);

  if (!isOpen || !certificateId) return null;

  const isImage = previewData?.mimeType?.startsWith('image/') ||
    (fileName && (fileName.endsWith('.png') || fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || fileName.endsWith('.webp')));

  const handleUpdateStatus = async (status: string) => {
    setIsUpdating(true);
    try {
      await assignmentService.updateCertificateStatus(certificateId, status);
      onStatusUpdated(status);
    } catch (err: any) {
      alert(err.response?.data?.message || "Échec de la mise à jour du statut.");
    } finally {
      setIsUpdating(false);
    }
  };

  const showRightPanel = isManagerView || !!validationDetails;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-[92vh] flex flex-col border border-gray-100 overflow-hidden">
        
        {/* Header (Full width) */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-gray-100 bg-gray-50/80 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-red-50 text-[#b70f30] flex items-center justify-center border border-red-100 font-bold shrink-0 shadow-2xs">
              <span className="material-symbols-outlined text-[22px]">verified</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-extrabold text-gray-900 truncate" title={itemName}>{itemName || 'Certificat Officiel'}</h3>
                <span className={clsx(
                  "px-2.5 py-0.5 rounded-md text-[10px] font-extrabold border shrink-0",
                  currentStatus === 'VALID' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                  currentStatus === 'REJECTED' ? "bg-red-50 text-red-700 border-red-200" :
                  currentStatus === 'EXPIRED' ? "bg-orange-50 text-orange-700 border-orange-200" :
                  "bg-amber-50 text-amber-700 border-amber-200"
                )}>
                  {currentStatus === 'VALID' ? 'VALIDÉ' :
                   currentStatus === 'REJECTED' ? 'REFUSÉ' :
                   currentStatus === 'EXPIRED' ? 'EXPIRÉ' : 'EN ATTENTE DE VALIDATION'}
                </span>
              </div>
              <p className="text-xs text-gray-500 font-medium truncate">
                Collaborateur: <strong className="text-gray-800">{collaboratorName || 'Inconnu'}</strong> • {fileName || 'Fichier PDF'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => assignmentService.downloadCertificate(certificateId, fileName)}
              className="h-9 px-3 text-xs font-bold text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <span className="material-symbols-outlined text-[16px] text-emerald-600">download</span>
              <span>Télécharger</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl hover:bg-gray-200/60 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        {showRightPanel ? (
          /* Split 2-Column Dashboard Layout */

          <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
            
            {/* Left Column: Image / PDF Document Viewer (58-60% width) */}
            <div className="w-full lg:w-[60%] bg-slate-950 relative p-3 flex items-center justify-center min-h-[350px] lg:min-h-full overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center space-y-3 text-white">
                  <div className="w-9 h-9 border-3 border-red-200 border-t-[#b70f30] rounded-full animate-spin"></div>
                  <p className="text-xs font-semibold text-gray-300">Chargement du document...</p>
                </div>
              ) : error ? (
                <div className="p-8 text-center bg-white rounded-2xl max-w-md border border-red-100 shadow-xl space-y-3">
                  <span className="material-symbols-outlined text-red-500 text-4xl">error</span>
                  <p className="text-xs font-bold text-gray-800">{error}</p>
                  <button
                    type="button"
                    onClick={() => assignmentService.downloadCertificate(certificateId, fileName)}
                    className="px-4 py-2 bg-[#b70f30] text-white text-xs font-bold rounded-xl"
                  >
                    Télécharger le fichier directement
                  </button>
                </div>
              ) : previewData ? (
                isImage ? (
                  <img
                    src={previewData.url}
                    alt="Aperçu du certificat"
                    className="max-h-full max-w-full object-contain rounded-xl shadow-2xl bg-white"
                  />
                ) : (
                  <iframe
                    src={previewData.url}
                    className="w-full h-full rounded-xl bg-white border-0 shadow-inner"
                    title="Aperçu du certificat PDF"
                  />
                )
              ) : null}
            </div>

            {/* Right Column: AI Validation Dashboard (40% width) */}
            <div className="w-full lg:w-[40%] bg-gray-50/70 p-5 flex flex-col justify-between overflow-y-auto space-y-4">
              
              <div className="space-y-4">
                {/* Section Header */}
                <div className="flex items-center justify-between border-b border-gray-200/80 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-indigo-600">smart_toy</span>
                    <h4 className="text-sm font-extrabold text-gray-900">Analyse & Vérification IA</h4>
                  </div>
                  {validationDetails?.source && (
                    <span className="text-[11px] text-gray-500 font-bold bg-white px-2.5 py-1 rounded-lg border border-gray-200/80 shadow-2xs">
                      {validationDetails.source === 'WEB_VERIFIED' ? '🌐 Vérification web' :
                       validationDetails.source === 'TEXT_ONLY' ? '📄 OCR / Extraction texte' : 'Aucune vérification'}
                    </span>
                  )}
                </div>

                {/* Decision Badge Card */}
                {validationDetails && (
                  <div className="p-3.5 bg-white rounded-xl border border-gray-200/80 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Résultat global IA</span>
                      <span className={clsx(
                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-extrabold border shadow-2xs",
                        validationDetails.decision === 'APPROVED' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                        validationDetails.decision === 'REJECTED' ? 'bg-red-50 text-red-800 border-red-200' :
                        'bg-amber-50 text-amber-800 border-amber-200'
                      )}>
                        <span className="material-symbols-outlined text-[15px]">
                          {validationDetails.decision === 'APPROVED' ? 'check_circle' :
                           validationDetails.decision === 'REJECTED' ? 'cancel' : 'hourglass_top'}
                        </span>
                        <span>
                          {validationDetails.decision === 'APPROVED' ? 'Approuvé par l\'IA' :
                           validationDetails.decision === 'REJECTED' ? 'Refusé par l\'IA' : 'Revue manuelle'}
                        </span>
                      </span>
                    </div>

                    {/* Scores Grid */}
                    {validationDetails.scores && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-gray-100">
                        <AiScorePill label="Nom" value={validationDetails.scores.name_score} type="fuzzy" />
                        <AiScorePill label="Titre" value={validationDetails.scores.title_score} type="strict" />
                        <AiScorePill label="Date" value={validationDetails.scores.date_score} type="strict" />
                      </div>
                    )}
                  </div>
                )}

                {/* Conformance Banner / Details Panel */}
                {validationDetails?.decision === 'APPROVED' ? (
                  <div className="p-3.5 bg-emerald-50 text-emerald-900 rounded-xl border border-emerald-200/80 text-xs font-semibold flex items-center gap-2.5 shadow-2xs">
                    <span className="material-symbols-outlined text-[20px] text-emerald-600 shrink-0">check_circle</span>
                    <span>Toutes les données sont conformes (Certificat + Base + Site).</span>
                  </div>
                ) : (
                  validationDetails?.reasons &&
                  validationDetails.reasons.filter(r => !r.toLowerCase().includes('données sont conformes')).length > 0 && (
                    <div className="p-4 bg-white rounded-xl border border-gray-200/80 shadow-2xs space-y-2">
                      <p className="text-[11px] font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[15px] text-amber-500">warning</span>
                        <span>Détails des écarts détectés</span>
                      </p>
                      <ul className="space-y-2 pt-1">
                        {validationDetails.reasons
                          .filter(r => !r.toLowerCase().includes('données sont conformes'))
                          .map((r, i) => (
                            <li key={i} className="text-xs text-gray-700 flex items-start gap-2 bg-amber-50/50 p-2 rounded-lg border border-amber-100/60 font-medium leading-relaxed">
                              <span className="material-symbols-outlined text-[15px] text-amber-600 shrink-0 mt-0.5">info</span>
                              <span>{r}</span>
                            </li>
                          ))}
                      </ul>
                    </div>
                  )
                )}
              </div>

              {/* Action Bar inside Right Column (Manager Only) */}
              {isManagerView && (
                <div className="pt-4 border-t border-gray-200/80 bg-white p-4 rounded-xl border border-gray-200/70 shadow-2xs space-y-3">
                  <p className="text-[11px] text-gray-500 font-semibold leading-snug">
                    Attribuez un statut à ce certificat après vérification du document.
                  </p>

                  <div className="flex items-center gap-2.5 justify-end">
                    {currentStatus === 'EXPIRED' ? (
                      <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px]">history</span>
                        <span>Certificat Expiré Automatiquement</span>
                      </span>
                    ) : (
                      <>
                        <button
                          type="button"
                          disabled={isUpdating || currentStatus === 'REJECTED'}
                          onClick={() => handleUpdateStatus('REJECTED')}
                          className={clsx(
                            "flex-1 py-2 px-3 text-xs font-extrabold rounded-xl border transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs",
                            currentStatus === 'REJECTED'
                              ? "bg-red-100 text-red-800 border-red-300 opacity-60 cursor-default"
                              : "bg-red-50 text-red-700 hover:bg-red-100 border-red-200"
                          )}
                        >
                          <span className="material-symbols-outlined text-[16px]">cancel</span>
                          <span>Refuser</span>
                        </button>

                        <button
                          type="button"
                          disabled={isUpdating || currentStatus === 'VALID'}
                          onClick={() => handleUpdateStatus('VALID')}
                          className={clsx(
                            "flex-1 py-2 px-3 text-xs font-extrabold text-white rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                            currentStatus === 'VALID'
                              ? "bg-emerald-700 opacity-60 cursor-default"
                              : "bg-[#006949] hover:bg-emerald-800 shadow-emerald-900/10"
                          )}
                        >
                          <span className="material-symbols-outlined text-[16px]">check_circle</span>
                          <span>Valider</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

            </div>

          </div>
        ) : (
          /* Single Spacious Viewer for Collaborators */
          <div className="flex-1 bg-slate-950 relative p-3 overflow-hidden flex items-center justify-center min-h-[500px]">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center space-y-3 text-white">
                <div className="w-9 h-9 border-3 border-red-200 border-t-[#b70f30] rounded-full animate-spin"></div>
                <p className="text-xs font-semibold text-gray-300">Chargement de l'aperçu...</p>
              </div>
            ) : error ? (
              <div className="p-8 text-center bg-white rounded-2xl max-w-md border border-red-100 shadow-xl space-y-3">
                <span className="material-symbols-outlined text-red-500 text-4xl">error</span>
                <p className="text-xs font-bold text-gray-800">{error}</p>
                <button
                  type="button"
                  onClick={() => assignmentService.downloadCertificate(certificateId, fileName)}
                  className="px-4 py-2 bg-[#b70f30] text-white text-xs font-bold rounded-xl"
                >
                  Télécharger le fichier directement
                </button>
              </div>
            ) : previewData ? (
              isImage ? (
                <img
                  src={previewData.url}
                  alt="Aperçu du certificat"
                  className="max-h-full max-w-full object-contain rounded-xl shadow-2xl bg-white"
                />
              ) : (
                <iframe
                  src={previewData.url}
                  className="w-full h-full rounded-xl bg-white border-0 shadow-inner"
                  title="Aperçu du certificat PDF"
                />
              )
            ) : null}
          </div>
        )}

      </div>
    </div>
  );
}



// Score pill mini-component for the validation details panel
function AiScorePill({ label, value, type }: { label: string; value: number; type: 'fuzzy' | 'strict' }) {
  if (type === 'strict') {
    const isMatched = value >= 1.0;
    return (
      <span className={clsx(
        'inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-extrabold border shadow-2xs',
        isMatched ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'
      )}>
        <span className="material-symbols-outlined text-[13px]">{isMatched ? 'task_alt' : 'highlight_off'}</span>
        <span>{label} : {isMatched ? 'Conforme' : 'Non conforme'}</span>
      </span>
    );
  }

  const pct = Math.round(value * 100);
  const isOk = pct >= 90;
  return (
    <span className={clsx(
      'inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-extrabold border shadow-2xs',
      isOk ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'
    )}>
      <span className="material-symbols-outlined text-[13px]">{isOk ? 'tune' : 'warning'}</span>
      <span>{label} : {pct}%</span>
    </span>
  );
}


