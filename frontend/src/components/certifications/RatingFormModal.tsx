import { useState } from 'react';
import { certificationService, type RatingCreateRequest, type RatingResponse } from '../../services/certification.service';

interface RatingFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  certId: string;
  certName: string;
  existingRating?: RatingResponse | null;
  onSuccess: () => void;
}

export function RatingFormModal({
  isOpen,
  onClose,
  certId,
  certName,
  existingRating,
  onSuccess
}: RatingFormModalProps) {
  const [rating, setRating] = useState<number>(existingRating?.rating || 5);
  const [materialsQuality, setMaterialsQuality] = useState<number>(existingRating?.materialsQuality || 5);
  const [difficulty, setDifficulty] = useState<number>(existingRating?.difficulty || 3);
  const [usefulness, setUsefulness] = useState<number>(existingRating?.usefulness || 5);
  const [wouldRecommend, setWouldRecommend] = useState<boolean>(existingRating?.wouldRecommend ?? true);
  const [comment, setComment] = useState<string>(existingRating?.comment || '');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    const payload: RatingCreateRequest = {
      rating,
      materialsQuality,
      difficulty,
      usefulness,
      wouldRecommend,
      comment: comment.trim() ? comment.trim() : undefined
    };

    try {
      await certificationService.addRating(certId, payload);
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.detail || "Échec de l'enregistrement de votre avis.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStarSelector = (
    label: string,
    value: number,
    onChange: (val: number) => void
  ) => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 p-3 rounded-xl bg-gray-50/80 border border-gray-100">
      <span className="text-xs font-semibold text-gray-700">{label}</span>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="p-1 hover:scale-110 transition-transform cursor-pointer focus:outline-hidden"
          >
            <span
              className="material-symbols-outlined text-[22px] transition-colors"
              style={{
                color: star <= value ? '#f59e0b' : '#d1d5db',
                fontVariationSettings: star <= value ? "'FILL' 1" : "'FILL' 0"
              }}
            >
              star
            </span>
          </button>
        ))}
        <span className="text-xs font-bold text-amber-900 ml-1.5 w-6 text-right">{value}/5</span>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-5 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200/60">
              <span className="material-symbols-outlined text-[20px]">rate_review</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Avis sur la Certification</h3>
              <p className="text-xs text-gray-500 truncate max-w-[280px]">{certName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1">
          {/* Note Globale */}
          {renderStarSelector('Note Globale *', rating, setRating)}

          {/* Detailed Criteria */}
          <div className="space-y-2">
            <p className="text-xs font-extrabold text-gray-800 uppercase tracking-wider">Critères Détaillés</p>
            {renderStarSelector('Qualité des matériaux de cours', materialsQuality, setMaterialsQuality)}
            {renderStarSelector('Niveau de difficulté', difficulty, setDifficulty)}
            {renderStarSelector('Utilité professionnelle', usefulness, setUsefulness)}
          </div>

          {/* Recommandation */}
          <div className="p-3.5 rounded-xl bg-gray-50/80 border border-gray-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-700">Recommanderiez-vous cette certification ?</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setWouldRecommend(true)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  wouldRecommend
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">thumb_up</span>
                Oui
              </button>
              <button
                type="button"
                onClick={() => setWouldRecommend(false)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  !wouldRecommend
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">thumb_down</span>
                Non
              </button>
            </div>
          </div>

          {/* Comment */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700">Commentaire & Remarques (Optionnel)</label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Partagez votre retour d'expérience sur l'examen, le temps de préparation, les conseils..."
              className="w-full text-xs p-3 rounded-xl border border-gray-200 focus:border-[#b70f30] focus:ring-1 focus:ring-[#b70f30] outline-hidden transition-all"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-[#b70f30] hover:bg-red-800 rounded-xl transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting && <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>}
              <span>{existingRating ? 'Mettre à jour' : 'Publier mon avis'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
