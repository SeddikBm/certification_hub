import { useState, useEffect } from 'react';
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
  const [materialsQuality, setMaterialsQuality] = useState<number>(existingRating?.materialsQuality || 5);
  const [difficulty, setDifficulty] = useState<number>(existingRating?.difficulty || 3);
  const [usefulness, setUsefulness] = useState<number>(existingRating?.usefulness || 5);

  // Auto-calculated overall rating (average of 3 criteria)
  const [rating, setRating] = useState<number>(existingRating?.rating || 4);

  const [wouldRecommend, setWouldRecommend] = useState<boolean>(existingRating?.wouldRecommend ?? true);
  const [comment, setComment] = useState<string>(existingRating?.comment || '');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Recalculate automatic rating when criteria change
  useEffect(() => {
    const avg = Math.round((materialsQuality + difficulty + usefulness) / 3);
    setRating(Math.max(1, Math.min(5, avg)));
  }, [materialsQuality, difficulty, usefulness]);

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

  const calculatedAvgFloat = ((materialsQuality + difficulty + usefulness) / 3).toFixed(1);

  const renderStarSelector = (
    label: string,
    value: number,
    onChange: (val: number) => void
  ) => (
    <div className="p-3.5 rounded-2xl border bg-gray-50/80 border-gray-100/90 hover:bg-gray-50 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <span className="text-xs font-bold text-gray-800">
            {label}
          </span>
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <div className="flex text-amber-400">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => onChange(star)}
                className="p-1 hover:scale-110 transition-transform cursor-pointer focus:outline-hidden"
              >
                <span
                  className="material-symbols-outlined text-[24px] transition-colors"
                  style={{
                    color: star <= value ? '#f59e0b' : '#e5e7eb',
                    fontVariationSettings: star <= value ? "'FILL' 1" : "'FILL' 0"
                  }}
                >
                  star
                </span>
              </button>
            ))}
          </div>
          <span className="text-xs font-extrabold px-2 py-0.5 rounded-md bg-gray-200 text-gray-700">
            {value} / 5
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-5 overflow-hidden flex flex-col max-h-[90vh] border border-gray-100">
        
        {/* Header Banner */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
              <span className="material-symbols-outlined text-[22px]">star</span>
            </div>
            <div>
              <h3 className="text-base font-extrabold text-gray-900 tracking-tight">Votre Avis & Évaluation</h3>
              <p className="text-xs text-gray-500 truncate max-w-[280px] font-medium">{certName}</p>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1">

          {/* Detailed Criteria */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">Évaluation des Critères</p>
              <span className="text-[11px] font-extrabold text-amber-800 bg-gradient-to-r from-amber-50 to-orange-50 px-2.5 py-1 rounded-full border border-amber-200/80 shadow-2xs">
                Note globale : {calculatedAvgFloat} / 5
              </span>
            </div>
            {renderStarSelector('Qualité des matériaux de cours', materialsQuality, setMaterialsQuality)}
            {renderStarSelector('Niveau de difficulté de l\'examen', difficulty, setDifficulty)}
            {renderStarSelector('Utilité dans votre travail', usefulness, setUsefulness)}
          </div>

          {/* Recommandation */}
          <div className="p-3.5 rounded-2xl bg-gray-50/80 border border-gray-100/90 flex items-center justify-between">
            <span className="text-xs font-bold text-gray-800">Recommanderiez-vous cette certification ?</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setWouldRecommend(true)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
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
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  !wouldRecommend
                    ? 'bg-rose-600 text-white shadow-xs'
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
            <label className="text-xs font-bold text-gray-800">Commentaire & Remarques (Optionnel)</label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Partagez vos conseils d'apprentissage, points forts de la formation, temps de révision recommandé..."
              className="w-full text-xs p-3 rounded-xl border border-gray-200 focus:border-[#b70f30] focus:ring-2 focus:ring-[#b70f30]/10 outline-hidden transition-all placeholder:text-gray-400"
            />
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
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-extrabold text-white bg-[#b70f30] hover:bg-red-800 rounded-xl transition-all shadow-md shadow-red-900/10 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting && <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>}
              <span>{existingRating ? 'Mettre à jour mon avis' : 'Publier mon avis'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
