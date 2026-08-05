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
  onStatusUpdated: (newStatus: string) => void;
  validationDetails?: ValidationDetails | null;
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
  validationDetails
}: ViewCertificateModalProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  useEffect(() => {
    let activeUrl: string | null = null;

    if (isOpen && certificateId) {
      setIsLoading(true);
      setError(null);

      assignmentService.getCertificatePreviewUrl(certificateId)
        .then((url) => {
          activeUrl = url;
          setPdfUrl(url);
          setIsLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setError("Impossible de charger le prévisualisateur du certificat PDF.");
          setIsLoading(false);
        });
    }

    return () => {
      if (activeUrl) {
        window.URL.revokeObjectURL(activeUrl);
      }
      setPdfUrl(null);
    };
  }, [isOpen, certificateId]);

  if (!isOpen || !certificateId) return null;

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

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[88vh] flex flex-col border border-gray-100 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-50 text-[#b70f30] flex items-center justify-center border border-red-100 font-bold">
              <span className="material-symbols-outlined text-[22px]">verified</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-gray-900">{itemName || 'Certificat Officiel'}</h3>
                <span className={clsx(
                  "px-2.5 py-0.5 rounded-md text-[10px] font-extrabold border",
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
              <p className="text-xs text-gray-500 font-medium">
                Collaborateur: <strong className="text-gray-800">{collaboratorName || 'Inconnu'}</strong> • {fileName || 'Fichier PDF'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
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

        {/* PDF Viewer Body */}
        <div className="flex-1 bg-gray-900/90 relative p-2 overflow-hidden flex items-center justify-center">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center space-y-3 text-white">
              <div className="w-9 h-9 border-3 border-red-200 border-t-[#b70f30] rounded-full animate-spin"></div>
              <p className="text-xs font-semibold text-gray-300">Chargement de l'aperçu PDF...</p>
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
                Télécharger le PDF directement
              </button>
            </div>
          ) : pdfUrl ? (
            <iframe
              src={pdfUrl}
              className="w-full h-full rounded-xl bg-white border-0 shadow-inner"
              title="Aperçu du certificat PDF"
            />
          ) : null}
        </div>

        {/* AI Validation Details Panel */}
        {validationDetails && (
          <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50 flex flex-wrap items-center gap-3">
            {/* Badge décision IA */}
            <span className={clsx(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-extrabold border",
              validationDetails.decision === 'APPROVED'  ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
              validationDetails.decision === 'REJECTED'  ? 'bg-red-50 text-red-800 border-red-200' :
              'bg-amber-50 text-amber-800 border-amber-200'
            )}>
              <span className="material-symbols-outlined text-[14px]">
                {validationDetails.decision === 'APPROVED' ? 'check_circle' :
                 validationDetails.decision === 'REJECTED' ? 'cancel' : 'hourglass_top'}
              </span>
              IA :{' '}
              {validationDetails.decision === 'APPROVED' ? 'Approuvé' :
               validationDetails.decision === 'REJECTED' ? 'Refusé' : 'Revue manuelle'}
            </span>

            {/* Scores */}
            {validationDetails.scores && (
              <div className="flex items-center gap-2">
                <AiScorePill label="Nom" value={validationDetails.scores.name_score} />
                <AiScorePill label="Titre" value={validationDetails.scores.title_score} />
                <AiScorePill label="Date" value={validationDetails.scores.date_score} />
              </div>
            )}

            {/* Source */}
            {validationDetails.source && (
              <span className="text-[11px] text-gray-400 font-medium ml-auto">
                {validationDetails.source === 'WEB_VERIFIED' ? '🌐 Vérification web' :
                 validationDetails.source === 'TEXT_ONLY' ? '📄 Texte seul' : 'Aucune vérification'}
              </span>
            )}
          </div>
        )}

        {/* Validation Action Bar */}
        <div className="px-6 py-4 border-t border-gray-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-gray-500 font-semibold">
            Attribuez un statut à ce certificat après vérification du document.
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {currentStatus === 'EXPIRED' ? (
              <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">history</span>
                <span>Certificat Expiré Automatiquement</span>
              </span>
            ) : (
              <>
                <button
                  type="button"
                  disabled={isUpdating || currentStatus === 'PENDING_VALIDATION'}
                  onClick={() => handleUpdateStatus('PENDING_VALIDATION')}
                  className={clsx(
                    "px-3.5 py-2 text-xs font-extrabold rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer",
                    currentStatus === 'PENDING_VALIDATION'
                      ? "bg-amber-100 text-amber-800 border-amber-300 opacity-60 cursor-default"
                      : "bg-amber-50 text-amber-800 hover:bg-amber-100 border-amber-200"
                  )}
                >
                  <span className="material-symbols-outlined text-[16px]">hourglass_top</span>
                  <span>En attente</span>
                </button>

                <button
                  type="button"
                  disabled={isUpdating || currentStatus === 'REJECTED'}
                  onClick={() => handleUpdateStatus('REJECTED')}
                  className={clsx(
                    "px-4 py-2 text-xs font-extrabold rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer",
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
                    "px-4 py-2 text-xs font-extrabold text-white rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer",
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

      </div>
    </div>
  );
}

// Score pill mini-component for the validation details panel
function AiScorePill({ label, value }: { label: string; value: number }) {
  const pct = Math.round(value * 100);
  const color = pct >= 80 ? 'emerald' : pct >= 50 ? 'amber' : 'red';
  return (
    <span className={clsx(
      'inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border',
      color === 'emerald' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
      color === 'amber'   ? 'bg-amber-50 text-amber-700 border-amber-200' :
      'bg-red-50 text-red-700 border-red-200'
    )}>
      {label}: {pct}%
    </span>
  );
}
