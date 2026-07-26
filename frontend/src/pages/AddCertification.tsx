import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { certificationService, type CertificationRequest } from "../services/certification.service";

const certificationSchema = z.object({
  code: z.string().min(1, "Code is required"),
  name: z.string().min(1, "Name is required"),
  provider: z.string().optional(),
  difficulty: z.string().min(1, "Difficulty is required"),
  priority: z.string().min(1, "Priority is required"),
  examCostUsd: z.coerce.number().min(0, "Cost cannot be negative").optional(),
  trainingCostUsd: z.coerce.number().min(0, "Cost cannot be negative").optional(),
  validityMonths: z.coerce.number().min(1, "Validity must be at least 1 month").optional(),
  officialUrl: z.string().url("Invalid URL format").optional().or(z.literal("")),
  examProviderUrl: z.string().url("Invalid URL format").optional().or(z.literal("")),
});

type CertificationFormValues = z.infer<typeof certificationSchema>;

export function AddCertification() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showToast, setShowToast] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CertificationFormValues>({
    resolver: zodResolver(certificationSchema),
    defaultValues: {
      code: "",
      name: "",
      provider: "",
      difficulty: "INTERMEDIATE",
      priority: "MEDIUM",
      examCostUsd: undefined,
      trainingCostUsd: undefined,
      validityMonths: 36,
      officialUrl: "",
      examProviderUrl: ""
    }
  });

  const createMutation = useMutation({
    mutationFn: (data: CertificationRequest) => certificationService.createCertification(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certifications'] });
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        navigate('/certifications');
      }, 2000);
    },
    onError: (error: any) => {
      setApiError(error.response?.data?.message || "An error occurred while saving the certification.");
    }
  });

  const onSubmit = (data: CertificationFormValues) => {
    setApiError(null);
    createMutation.mutate({
      ...data,
      squads: [] // Empty for now as per backend requirements
    });
  };

  return (
    <div className="fixed inset-0 bg-[#002b45]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-surface-container-lowest w-full max-w-4xl rounded-xl shadow-[0_8px_32px_rgba(0,43,69,0.12)] flex flex-col max-h-[90vh] overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-outline-variant bg-surface-container-lowest sticky top-0 z-20">
          <div>
            <h2 className="font-headline-md text-headline-md text-on-surface">Ajouter Certification</h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Saisissez les détails de la certification ci-dessous.</p>
          </div>
          <button 
            type="button" 
            onClick={() => navigate('/certifications')}
            className="p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto p-6 bg-surface-bright flex-1 flex flex-col space-y-8">
          {apiError && (
            <div className="bg-error/10 text-error p-4 rounded-xl text-sm font-medium">
              {apiError}
            </div>
          )}

          {/* Section: Informations de Base */}
          <fieldset>
            <legend className="font-headline-sm text-headline-sm text-primary mb-4 flex items-center">
              <span className="material-symbols-outlined mr-2">info</span> Informations de Base
            </legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-1">
                <label className="font-label-md text-label-md text-on-surface flex items-center">
                  Code <span className="text-error ml-1">*</span>
                </label>
                <Input 
                  placeholder="Ex: AWS-SAA-C03" 
                  {...register("code")} 
                  error={!!errors.code} 
                />
                {errors.code && <p className="text-error text-xs">{errors.code.message}</p>}
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-label-md text-label-md text-on-surface flex items-center">
                  Nom <span className="text-error ml-1">*</span>
                </label>
                <Input 
                  placeholder="Ex: AWS Certified Solutions Architect - Associate" 
                  {...register("name")} 
                  error={!!errors.name} 
                />
                {errors.name && <p className="text-error text-xs">{errors.name.message}</p>}
              </div>
              <div className="flex flex-col gap-1 md:col-span-2 lg:col-span-1">
                <label className="font-label-md text-label-md text-on-surface flex items-center">
                  Provider <span className="text-error ml-1">*</span>
                </label>
                <div className="relative">
                  <select 
                    className={`w-full px-4 py-3 bg-surface-container-lowest border rounded-xl font-body-md text-body-md text-on-surface appearance-none focus:outline-none focus:ring-1 transition-shadow cursor-pointer ${errors.provider ? 'border-error focus:border-error focus:ring-error' : 'border-outline-variant focus:border-primary focus:ring-primary'}`}
                    {...register("provider")}
                  >
                    <option value="">Sélectionner un provider</option>
                    <option value="AWS">Amazon Web Services (AWS)</option>
                    <option value="AZURE">Microsoft Azure</option>
                    <option value="GCP">Google Cloud Platform</option>
                    <option value="CISCO">Cisco</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
                </div>
                {errors.provider && <p className="text-error text-xs">{errors.provider.message}</p>}
              </div>
            </div>
          </fieldset>

          <hr className="border-outline-variant" />

          {/* Section: Classification & Organisation */}
          <fieldset>
            <legend className="font-headline-sm text-headline-sm text-primary mb-4 flex items-center">
              <span className="material-symbols-outlined mr-2">category</span> Classification & Organisation
            </legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-1">
                <label className="font-label-md text-label-md text-on-surface">Difficulté *</label>
                <div className="relative">
                  <select 
                    className={`w-full px-4 py-3 bg-surface-container-lowest border rounded-xl font-body-md text-body-md text-on-surface appearance-none focus:outline-none focus:ring-1 transition-shadow cursor-pointer ${errors.difficulty ? 'border-error focus:border-error focus:ring-error' : 'border-outline-variant focus:border-primary focus:ring-primary'}`}
                    {...register("difficulty")}
                  >
                    <option value="BEGINNER">Beginner</option>
                    <option value="INTERMEDIATE">Intermediate</option>
                    <option value="ADVANCED">Advanced</option>
                    <option value="EXPERT">Expert</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
                </div>
                {errors.difficulty && <p className="text-error text-xs">{errors.difficulty.message}</p>}
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-label-md text-label-md text-on-surface">Priorité Interne *</label>
                <div className="relative">
                  <select 
                    className={`w-full px-4 py-3 bg-surface-container-lowest border rounded-xl font-body-md text-body-md text-on-surface appearance-none focus:outline-none focus:ring-1 transition-shadow cursor-pointer ${errors.priority ? 'border-error focus:border-error focus:ring-error' : 'border-outline-variant focus:border-primary focus:ring-primary'}`}
                    {...register("priority")}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
                </div>
                {errors.priority && <p className="text-error text-xs">{errors.priority.message}</p>}
              </div>
            </div>
          </fieldset>

          <hr className="border-outline-variant" />

          {/* Section: Modalités d'Examen */}
          <fieldset>
            <legend className="font-headline-sm text-headline-sm text-primary mb-4 flex items-center">
              <span className="material-symbols-outlined mr-2">timer</span> Modalités d'Examen
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="flex flex-col gap-1">
                <label className="font-label-md text-label-md text-on-surface flex items-center">
                  Coût Examen (€) <span className="text-error ml-1">*</span>
                </label>
                <Input 
                  type="number" 
                  step="0.01" 
                  placeholder="150.00" 
                  rightIcon="euro" 
                  {...register("examCostUsd")} 
                  error={!!errors.examCostUsd} 
                />
                {errors.examCostUsd && <p className="text-error text-xs">{errors.examCostUsd.message}</p>}
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-label-md text-label-md text-on-surface flex items-center">
                  Coût Formation (€)
                </label>
                <Input 
                  type="number" 
                  step="0.01" 
                  placeholder="0.00" 
                  rightIcon="euro" 
                  {...register("trainingCostUsd")} 
                  error={!!errors.trainingCostUsd} 
                />
                {errors.trainingCostUsd && <p className="text-error text-xs">{errors.trainingCostUsd.message}</p>}
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-label-md text-label-md text-on-surface">Validité (mois)</label>
                <div className="relative group w-full">
                  <input 
                    className={`w-full py-3 bg-surface-container-lowest border rounded-xl font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:ring-1 transition-all duration-200 pl-4 pr-12 ${errors.validityMonths ? 'border-error focus:border-error focus:ring-error' : 'border-outline-variant focus:border-primary focus:ring-primary'}`} 
                    type="number" 
                    min="0" 
                    step="1" 
                    placeholder="36" 
                    {...register("validityMonths")} 
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant font-body-sm text-body-sm pointer-events-none">mois</span>
                </div>
                {errors.validityMonths && <p className="text-error text-xs">{errors.validityMonths.message}</p>}
              </div>
            </div>
          </fieldset>

          <hr className="border-outline-variant" />

          {/* Section: Liens utiles */}
          <fieldset>
            <legend className="font-headline-sm text-headline-sm text-primary mb-4 flex items-center">
              <span className="material-symbols-outlined mr-2">link</span> Ressources
            </legend>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="font-label-md text-label-md text-on-surface">URL Officielle</label>
                <Input 
                  type="url" 
                  placeholder="https://" 
                  {...register("officialUrl")} 
                  error={!!errors.officialUrl} 
                />
                {errors.officialUrl && <p className="text-error text-xs">{errors.officialUrl.message}</p>}
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-label-md text-label-md text-on-surface">URL Réservation Examen</label>
                <Input 
                  type="url" 
                  placeholder="https://" 
                  {...register("examProviderUrl")} 
                  error={!!errors.examProviderUrl} 
                />
                {errors.examProviderUrl && <p className="text-error text-xs">{errors.examProviderUrl.message}</p>}
              </div>
            </div>
          </fieldset>
          
          {/* Modal Footer */}
          <div className="pt-4 border-t border-outline-variant bg-surface-bright flex justify-end gap-3 sticky bottom-0 z-20">
            <Button variant="outline" type="button" onClick={() => navigate('/certifications')} disabled={isSubmitting || createMutation.isPending}>Annuler</Button>
            <Button type="submit" disabled={isSubmitting || createMutation.isPending}>
              {(isSubmitting || createMutation.isPending) ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </form>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-[60]">
          <div className="flex items-center gap-3 bg-tertiary-container text-on-tertiary-container px-4 py-3 rounded-lg shadow-lg border border-tertiary-fixed/30">
            <span className="material-symbols-outlined text-tertiary-fixed" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            <span className="font-body-sm text-body-sm font-medium">Certification enregistrée avec succès</span>
          </div>
        </div>
      )}
    </div>
  );
}
