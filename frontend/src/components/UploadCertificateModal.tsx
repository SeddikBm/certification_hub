import { useState, useRef, useEffect, useCallback } from 'react';
import { assignmentService, type ValidationDetails } from '../services/assignment.service';

interface UploadCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignmentId: string;
  itemName: string;
  onSuccess: (message: string) => void;
}

type UploadPhase = 'idle' | 'uploading' | 'validating' | 'done';

interface ValidationStep {
  id: string;
  label: string;
  sublabel: string;
  icon: string;
  durationMs: number; // durée approximative avant passage à l'étape suivante
}

const VALIDATION_STEPS: ValidationStep[] = [
  { id: 'ocr',    label: 'Lecture OCR',          sublabel: 'Extraction du texte du document…',   icon: 'document_scanner',  durationMs: 1200 },
  { id: 'parse',  label: 'Analyse LLM',           sublabel: 'Identification des champs…',          icon: 'psychology',        durationMs: 1200 },
  { id: 'match',  label: 'Vérification identité', sublabel: 'Comparaison avec le collaborateur…',  icon: 'person_check',      durationMs: 1200 },
  { id: 'web',    label: 'Vérification externe',  sublabel: 'Consultation de la source officielle…',icon: 'travel_explore',   durationMs: 1400 },
  { id: 'result', label: 'Résultat final',         sublabel: 'Calcul de la décision…',             icon: 'verified',          durationMs: 800 },
];

const DECISION_CONFIG = {
  APPROVED:       { label: 'Certificat Validé par l\'IA',     color: 'emerald', icon: 'check_circle',   bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800' },
  REJECTED:       { label: 'Certificat Refusé par l\'IA',     color: 'red',     icon: 'cancel',         bg: 'bg-red-50',     border: 'border-red-200',     text: 'text-red-800'     },
  PENDING_REVIEW: { label: 'En attente de revue manuelle',    color: 'amber',   icon: 'hourglass_top',  bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-800'   },
  PENDING_VALIDATION: { label: 'En attente de revue manuelle', color: 'amber', icon: 'hourglass_top', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800' },
};


export function UploadCertificateModal({
  isOpen,
  onClose,
  assignmentId,
  itemName,
  onSuccess
}: UploadCertificateModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [phase, setPhase] = useState<UploadPhase>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [validationResult, setValidationResult] = useState<ValidationDetails | null>(null);
  const [finalCertStatus, setFinalCertStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Simule l'avancement des étapes de manière fluide et progressive
  const animateSteps = useCallback((stepIdx: number) => {
    if (stepIdx >= VALIDATION_STEPS.length - 1) return;
    const step = VALIDATION_STEPS[stepIdx];
    stepTimerRef.current = setTimeout(() => {
      setCurrentStep(prev => Math.max(prev, stepIdx + 1));
      animateSteps(stepIdx + 1);
    }, step.durationMs);
  }, []);

  // Polling pour récupérer le résultat final et passer de manière fluide jusqu'au dernier step
  const startPolling = useCallback(() => {
    let attempts = 0;
    const maxAttempts = 120; // 120 × 1s = 2 min max

    pollingRef.current = setInterval(async () => {
      attempts++;
      try {
        const page = await assignmentService.getMyAssignments({ size: 50 });
        const myAssignment = page.content.find(a => a.id === assignmentId);

        if (myAssignment && myAssignment.certificateStatus !== 'PENDING_VALIDATION') {
          // Validation terminée par le backend !
          if (pollingRef.current) clearInterval(pollingRef.current);
          if (stepTimerRef.current) clearTimeout(stepTimerRef.current);

          setFinalCertStatus(myAssignment.certificateStatus ?? null);
          setValidationResult(myAssignment.validationDetails ?? null);

          // Animation progressive lisible et harmonieuse jusqu'à la fin
          const finishInterval = setInterval(() => {
            setCurrentStep(prev => {
              if (prev < VALIDATION_STEPS.length - 1) {
                return prev + 1;
              } else {
                clearInterval(finishInterval);
                setTimeout(() => setPhase('done'), 600);
                return prev;
              }
            });
          }, 700);

          return;
        }

        if (attempts >= maxAttempts) {
          if (pollingRef.current) clearInterval(pollingRef.current);
          setCurrentStep(VALIDATION_STEPS.length - 1);
          setFinalCertStatus('PENDING_VALIDATION');
          setPhase('done');
        }
      } catch {
        // Ignore les erreurs pendant le polling
      }
    }, 1000);
  }, [assignmentId]);


  // Reset modal state whenever modal is opened
  useEffect(() => {
    if (isOpen) {
      setFile(null);
      setIsDragging(false);
      setPhase('idle');
      setErrorMessage(null);
      setCurrentStep(0);
      setValidationResult(null);
      setFinalCertStatus(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } else {
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
    }
  }, [isOpen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
    };
  }, []);

  if (!isOpen) return null;

  const validateAndSetFile = (selectedFile: File) => {
    setErrorMessage(null);
    const fileNameLower = selectedFile.name.toLowerCase();
    const isAllowed = selectedFile.type === 'application/pdf' ||
                      selectedFile.type.startsWith('image/') ||
                      /\.(pdf|png|jpg|jpeg|webp)$/i.test(fileNameLower);

    if (!isAllowed) {
      setErrorMessage('Formats autorisés : PDF, PNG, JPG, JPEG, WEBP.');
      setFile(null);
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      setErrorMessage('La taille du fichier ne doit pas dépasser 5 Mo.');
      setFile(null);
      return;
    }
    setFile(selectedFile);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) validateAndSetFile(e.target.files[0]);
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) validateAndSetFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErrorMessage('Veuillez sélectionner un certificat (PDF ou Image).');
      return;
    }

    setPhase('uploading');
    setErrorMessage(null);
    setCurrentStep(0);

    try {
      await assignmentService.uploadCertificate(assignmentId, file);

      // Upload OK — passer en mode "validation IA en cours"
      setPhase('validating');
      setCurrentStep(0);
      animateSteps(0);
      startPolling();

    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.detail || "Échec lors de l'envoi du certificat.";
      setErrorMessage(msg);
      setPhase('idle');
    }
  };


  const handleClose = () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
    if (phase === 'done') {
      onSuccess(
        finalCertStatus === 'VALID'
          ? 'Certificat validé automatiquement par l\'IA !'
          : finalCertStatus === 'REJECTED'
          ? 'Certificat refusé par l\'IA. Vérifiez les informations.'
          : 'Certificat en attente de revue manuelle par votre Career Manager.'
      );
    }
    onClose();
  };

  const effectiveKey = finalCertStatus === 'VALID' ? 'APPROVED' :
                       finalCertStatus === 'REJECTED' ? 'REJECTED' :
                       (validationResult?.decision ?? 'PENDING_VALIDATION');

  const decisionCfg = DECISION_CONFIG[
    (effectiveKey as keyof typeof DECISION_CONFIG) ?? 'PENDING_VALIDATION'
  ] ?? DECISION_CONFIG.PENDING_VALIDATION;


  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-5 border border-gray-100">


        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-50 text-[#b70f30] flex items-center justify-center border border-red-100">
              <span className="material-symbols-outlined text-[22px]">upload_file</span>
            </div>
            <div>
              <h3 className="text-base font-extrabold text-gray-900 tracking-tight">
                {phase === 'validating' ? 'Validation IA en cours…' : phase === 'done' ? 'Résultat de la validation' : 'Déposer un Certificat'}
              </h3>
              <p className="text-xs text-gray-500 truncate max-w-[240px] font-medium">{itemName}</p>
            </div>
          </div>
          {(phase === 'idle' || phase === 'done') && (
            <button
              type="button"
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-700 p-1.5 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          )}
        </div>

        {/* ─── Phase IDLE / UPLOADING : formulaire ──────────────────────────── */}
        {(phase === 'idle' || phase === 'uploading') && (
          <>
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2 font-medium">
                <span className="material-symbols-outlined text-[18px] flex-shrink-0">error</span>
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                  isDragging ? 'border-[#b70f30] bg-red-50/50 scale-[1.01]'
                  : file ? 'border-emerald-300 bg-emerald-50/30'
                  : 'border-gray-200 hover:border-red-300 bg-gray-50/50 hover:bg-gray-50'
                }`}
              >
                <input ref={fileInputRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/*" onChange={handleFileChange} className="hidden" />
                {file ? (
                  <div className="flex flex-col items-center gap-1.5 py-1">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[28px]">
                        {file.type.startsWith('image/') || /\.(png|jpg|jpeg|webp)$/i.test(file.name) ? 'image' : 'picture_as_pdf'}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-gray-900 truncate max-w-[280px]">{file.name}</p>
                    <p className="text-[11px] text-gray-500 font-semibold">{(file.size / (1024 * 1024)).toFixed(2)} MB • {file.name.split('.').pop()?.toUpperCase()}</p>
                    <span className="text-[11px] text-emerald-700 font-bold bg-emerald-100/60 px-2.5 py-0.5 rounded-full mt-1">
                      Fichier prêt à être envoyé
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-500 flex items-center justify-center mb-1">
                      <span className="material-symbols-outlined text-[26px]">cloud_upload</span>
                    </div>
                    <p className="text-xs font-bold text-gray-800">
                      Glissez votre certificat (PDF ou Image) ici, ou <span className="text-[#b70f30] underline">parcourez</span>
                    </p>
                    <p className="text-[11px] text-gray-400 font-medium">Formats autorisés : PDF, PNG, JPG (Taille max : 5 MB)</p>
                  </>
                )}
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={phase === 'uploading' || !file}
                  className="px-5 py-2 text-xs font-extrabold text-white bg-[#b70f30] hover:bg-red-800 rounded-xl transition-all shadow-md shadow-red-900/10 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {phase === 'uploading' && <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>}
                  <span>{phase === 'uploading' ? 'Envoi…' : 'Déposer le certificat'}</span>
                </button>
              </div>
            </form>
          </>
        )}

        {/* ─── Phase VALIDATING : animation des étapes ──────────────────────── */}
        {phase === 'validating' && (
          <div className="space-y-4">
            <p className="text-xs text-gray-500 font-medium text-center">
              Le moteur IA analyse votre certificat. Cette opération peut prendre quelques dizaines de secondes.
            </p>
            <div className="space-y-2.5">
              {VALIDATION_STEPS.map((step, idx) => {
                const isDone = idx < currentStep;
                const isActive = idx === currentStep;
                const isPending = idx > currentStep;

                return (
                  <div
                    key={step.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-500 ${
                      isDone   ? 'bg-emerald-50 border-emerald-200'
                      : isActive ? 'bg-blue-50 border-blue-200 shadow-sm shadow-blue-100'
                      : 'bg-gray-50 border-gray-100 opacity-40'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isDone   ? 'bg-emerald-100 text-emerald-700'
                      : isActive ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-400'
                    }`}>
                      {isDone ? (
                        <span className="material-symbols-outlined text-[18px]">check_circle</span>
                      ) : isActive ? (
                        <span className="material-symbols-outlined text-[18px] animate-pulse">{step.icon}</span>
                      ) : (
                        <span className="material-symbols-outlined text-[18px]">{step.icon}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-bold ${isDone ? 'text-emerald-800' : isActive ? 'text-blue-800' : 'text-gray-400'}`}>
                        {step.label}
                      </p>
                      <p className={`text-[11px] font-medium ${isDone ? 'text-emerald-600' : isActive ? 'text-blue-600' : 'text-gray-400'}`}>
                        {isDone ? 'Terminé' : isActive ? step.sublabel : 'En attente…'}
                      </p>
                    </div>
                    {isActive && (
                      <span className="material-symbols-outlined text-[18px] text-blue-500 animate-spin flex-shrink-0">progress_activity</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── Phase DONE : résultat de la validation ────────────────────────── */}
        {phase === 'done' && (
          <div className="space-y-4">
            {/* Badge décision */}
            <div className={`flex items-center gap-3 p-4 rounded-2xl border ${decisionCfg.bg} ${decisionCfg.border}`}>
              <span className={`material-symbols-outlined text-[28px] flex-shrink-0 ${decisionCfg.text}`}>
                {decisionCfg.icon}
              </span>
              <p className={`text-sm font-extrabold ${decisionCfg.text}`}>{decisionCfg.label}</p>
            </div>

            {/* Scores */}
            {validationResult?.scores && (
              <div className="grid grid-cols-3 gap-2">
                <ScoreChip label="Nom" value={validationResult.scores.name_score} />
                <ScoreChip label="Titre" value={validationResult.scores.title_score} />
                <ScoreChip label="Date" value={validationResult.scores.date_score} />
              </div>
            )}


            {/* Données extraites */}
            {validationResult?.extracted?.holder_name && (
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs space-y-1">
                <p className="font-bold text-gray-700 mb-1.5">Données extraites par l'IA</p>
                {validationResult.extracted.holder_name && (
                  <ExtractedRow icon="person" label="Nom" value={validationResult.extracted.holder_name} />
                )}
                {validationResult.extracted.certification_title && (
                  <ExtractedRow icon="workspace_premium" label="Certification" value={validationResult.extracted.certification_title} />
                )}
                {validationResult.extracted.issue_date && (
                  <ExtractedRow icon="calendar_today" label="Date" value={validationResult.extracted.issue_date} />
                )}
                {validationResult.extracted.issuer && (
                  <ExtractedRow icon="business" label="Organisme" value={validationResult.extracted.issuer} />
                )}
              </div>
            )}

            {/* Conformance Message when Approved */}
            {validationResult?.decision === 'APPROVED' && (
              <div className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200/80 text-xs font-semibold">
                <span className="material-symbols-outlined text-[18px] text-emerald-600 shrink-0">check_circle</span>
                <span>Toutes les données sont conformes (Certificat + Base + Site).</span>
              </div>
            )}

            {/* Raisons en cas de non-conformité (filtrer le message de conformité pour éviter le doublon) */}
            {validationResult?.reasons &&
             validationResult.reasons.filter(r => !r.toLowerCase().includes('données sont conformes')).length > 0 && (
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-[11px] font-bold text-gray-600 mb-1.5">Détails de la validation</p>
                <ul className="space-y-1">
                  {validationResult.reasons
                    .filter(r => !r.toLowerCase().includes('données sont conformes'))
                    .map((r, i) => (
                      <li key={i} className="text-[11px] text-gray-600 flex items-start gap-1.5">
                        <span className="material-symbols-outlined text-[14px] text-amber-500 flex-shrink-0 mt-0.5">info</span>
                        <span>{r}</span>
                      </li>
                    ))}
                </ul>
              </div>
            )}



            {/* Source */}
            {validationResult?.source && (
              <p className="text-[11px] text-gray-400 font-medium text-center">
                Source de vérification : <span className="font-bold text-gray-600">{validationResult.source === 'WEB_VERIFIED' ? 'Vérification web externe' : validationResult.source === 'TEXT_ONLY' ? 'Analyse du texte uniquement' : 'Aucune'}</span>
              </p>
            )}

            <button
              type="button"
              onClick={handleClose}
              className="w-full py-2.5 text-xs font-extrabold text-white bg-[#b70f30] hover:bg-red-800 rounded-xl transition-all shadow-md"
            >
              Fermer
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

// ─── Sous-composants ────────────────────────────────────────────────────────

function ScoreChip({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  const pct = Math.round(value * 100);
  const color = pct >= 80 ? 'emerald' : pct >= 50 ? 'amber' : 'red';
  return (
    <div className={`p-2.5 rounded-xl border text-center ${highlight ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
      <p className={`text-[10px] font-bold ${highlight ? 'text-gray-400' : 'text-gray-500'} mb-0.5`}>{label}</p>
      <p className={`text-lg font-black ${
        highlight ? 'text-white'
        : color === 'emerald' ? 'text-emerald-700'
        : color === 'amber'   ? 'text-amber-700'
        : 'text-red-700'
      }`}>{pct}%</p>
    </div>
  );
}

function ExtractedRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="grid grid-cols-[125px_1fr] items-start gap-2 py-1.5 border-b border-gray-100/60 last:border-0 text-xs">
      <div className="flex items-center gap-1.5 text-gray-500 font-semibold shrink-0">
        <span className="material-symbols-outlined text-[16px] text-gray-400 shrink-0">{icon}</span>
        <span>{label} :</span>
      </div>
      <div className="text-gray-900 font-extrabold break-words leading-relaxed">
        {value}
      </div>
    </div>
  );
}


