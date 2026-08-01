import { useState, useRef } from 'react';
import { assignmentService } from '../services/assignment.service';

interface UploadCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignmentId: string;
  itemName: string;
  onSuccess: (message: string) => void;
}

export function UploadCertificateModal({
  isOpen,
  onClose,
  assignmentId,
  itemName,
  onSuccess
}: UploadCertificateModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const validateAndSetFile = (selectedFile: File) => {
    setErrorMessage(null);

    // 1. Validation type PDF
    const isPdf = selectedFile.type === 'application/pdf' || selectedFile.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setErrorMessage('Seuls les fichiers au format PDF sont autorisés.');
      setFile(null);
      return;
    }

    // 2. Validation taille max 5MB (5 * 1024 * 1024 octets)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setErrorMessage('La taille du fichier ne doit pas dépasser 5 Mo.');
      setFile(null);
      return;
    }

    setFile(selectedFile);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErrorMessage('Veuillez sélectionner un fichier PDF.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await assignmentService.uploadCertificate(assignmentId, file);
      onSuccess('Le certificat PDF a été téléversé avec succès.');
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.detail || "Échec lors de l'envoi du certificat.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5 border border-gray-100">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-50 text-[#b70f30] flex items-center justify-center border border-red-100">
              <span className="material-symbols-outlined text-[22px]">upload_file</span>
            </div>
            <div>
              <h3 className="text-base font-extrabold text-gray-900 tracking-tight">Déposer un Certificat</h3>
              <p className="text-xs text-gray-500 truncate max-w-[240px] font-medium">{itemName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 p-1.5 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2 font-medium">
            <span className="material-symbols-outlined text-[18px] flex-shrink-0">error</span>
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
              isDragging
                ? 'border-[#b70f30] bg-red-50/50 scale-[1.01]'
                : file
                ? 'border-emerald-300 bg-emerald-50/30'
                : 'border-gray-200 hover:border-red-300 bg-gray-50/50 hover:bg-gray-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />

            {file ? (
              <div className="flex flex-col items-center gap-1.5 py-1">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[28px]">picture_as_pdf</span>
                </div>
                <p className="text-xs font-bold text-gray-900 truncate max-w-[280px]">{file.name}</p>
                <p className="text-[11px] text-gray-500 font-semibold">{(file.size / (1024 * 1024)).toFixed(2)} MB • PDF</p>
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
                  Glissez votre certificat PDF ici, ou <span className="text-[#b70f30] underline">parcourez</span>
                </p>
                <p className="text-[11px] text-gray-400 font-medium">Format PDF uniquement (Taille max : 5 MB)</p>
              </>
            )}
          </div>

          {/* Actions */}
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
              disabled={isSubmitting || !file}
              className="px-5 py-2 text-xs font-extrabold text-white bg-[#b70f30] hover:bg-red-800 rounded-xl transition-all shadow-md shadow-red-900/10 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting && <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>}
              <span>Déposer le certificat</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
