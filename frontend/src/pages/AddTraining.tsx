import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { trainingService, type TrainingRequest } from "../services/training.service";

const trainingSchema = z.object({
  title: z.string().min(1, "Title is required"),
  type: z.string().min(1, "Type is required"),
  provider: z.string().optional(),
  priority: z.string().min(1, "Priority is required"),
  durationHours: z.coerce.number().min(0, "Duration must be >= 0").optional(),
  language: z.string().optional(),
  costUsd: z.coerce.number().min(0, "Cost cannot be negative").optional(),
  url: z.string().url("Invalid URL format").optional().or(z.literal("")),
  description: z.string().optional(),
});

type TrainingFormValues = z.infer<typeof trainingSchema>;

export function AddTraining() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showToast, setShowToast] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TrainingFormValues>({
    resolver: zodResolver(trainingSchema),
    defaultValues: {
      title: "",
      type: "",
      provider: "",
      priority: "MEDIUM",
      durationHours: 0,
      language: "en",
      costUsd: 0,
      url: "",
      description: ""
    }
  });

  const createMutation = useMutation({
    mutationFn: (data: TrainingRequest) => trainingService.createTraining(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainings'] });
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        navigate('/trainings');
      }, 2000);
    },
    onError: (error: any) => {
      setApiError(error.response?.data?.message || "An error occurred while saving the training.");
    }
  });

  const onSubmit = (data: TrainingFormValues) => {
    setApiError(null);
    createMutation.mutate({
      ...data,
      squads: [] // Send empty array for now as per backend requirements
    });
  };

  return (
    <div className="fixed inset-0 bg-primary-fixed-dim/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-surface w-full max-w-[800px] rounded-[24px] overflow-hidden flex flex-col shadow-[0_4px_20px_rgba(0,43,69,0.08)] border border-outline-variant/30 my-auto max-h-full">
        {/* Modal Header */}
        <div className="px-8 py-6 border-b border-outline-variant/30 flex justify-between items-center bg-surface sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>menu_book</span>
            </div>
            <div>
              <h2 className="font-headline-md text-headline-md text-on-surface">Add New Training</h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Configure details for the resource center.</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => navigate('/trainings')}
            className="text-on-surface-variant hover:text-on-surface transition-colors p-2 rounded-full hover:bg-surface-variant"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-8 overflow-y-auto flex-1 space-y-8 bg-surface-container-lowest">
          {apiError && (
            <div className="bg-error/10 text-error p-4 rounded-xl text-sm font-medium">
              {apiError}
            </div>
          )}

          <section>
            <h3 className="font-headline-sm text-headline-sm text-primary mb-6 flex items-center gap-2 border-b border-outline-variant/20 pb-2">
              <span className="material-symbols-outlined">info</span>
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block font-label-md text-label-md text-on-surface-variant mb-1">Training Title *</label>
                <Input 
                  placeholder="e.g., Advanced Cloud Architecture" 
                  {...register("title")} 
                  error={!!errors.title} 
                />
                {errors.title && <p className="text-error text-xs mt-1">{errors.title.message}</p>}
              </div>
              <div>
                <label className="block font-label-md text-label-md text-on-surface-variant mb-1">Type *</label>
                <div className="relative">
                  <select 
                    className={`w-full py-3 pl-4 pr-10 bg-surface-container-lowest border rounded-xl font-body-md text-body-md focus:outline-none focus:ring-1 appearance-none ${errors.type ? 'border-error focus:border-error focus:ring-error' : 'border-outline-variant focus:border-primary focus:ring-primary'}`}
                    {...register("type")}
                  >
                    <option value="">Select Type</option>
                    <option value="INTERNAL">Internal</option>
                    <option value="EXTERNAL">External</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
                </div>
                {errors.type && <p className="text-error text-xs mt-1">{errors.type.message}</p>}
              </div>
              <div>
                <label className="block font-label-md text-label-md text-on-surface-variant mb-1">Provider</label>
                <div className="relative">
                  <select 
                    className="w-full py-3 pl-4 pr-10 bg-surface-container-lowest border border-outline-variant rounded-xl font-body-md text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary appearance-none"
                    {...register("provider")}
                  >
                    <option value="">Select Provider</option>
                    <option value="aws">AWS</option>
                    <option value="google">Google Cloud</option>
                    <option value="microsoft">Microsoft</option>
                    <option value="devoteam">Devoteam Internal</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h3 className="font-headline-sm text-headline-sm text-primary mb-6 flex items-center gap-2 border-b border-outline-variant/20 pb-2">
              <span className="material-symbols-outlined">schedule</span>
              Training Logistics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block font-label-md text-label-md text-on-surface-variant mb-1">Duration (hours)</label>
                <Input 
                  type="number" 
                  step="0.5"
                  placeholder="0" 
                  leftIcon="timer" 
                  {...register("durationHours")} 
                  error={!!errors.durationHours} 
                />
                {errors.durationHours && <p className="text-error text-xs mt-1">{errors.durationHours.message}</p>}
              </div>
              <div>
                <label className="block font-label-md text-label-md text-on-surface-variant mb-1">Language</label>
                <div className="relative">
                  <select 
                    className="w-full py-3 pl-4 pr-10 bg-surface-container-lowest border border-outline-variant rounded-xl font-body-md text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary appearance-none"
                    {...register("language")}
                  >
                    <option value="en">English</option>
                    <option value="fr">French</option>
                    <option value="es">Spanish</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
                </div>
              </div>
              <div>
                <label className="block font-label-md text-label-md text-on-surface-variant mb-1">Cost (€)</label>
                <Input 
                  type="number" 
                  step="0.01"
                  placeholder="0.00" 
                  leftIcon="euro" 
                  {...register("costUsd")} 
                  error={!!errors.costUsd} 
                />
                {errors.costUsd && <p className="text-error text-xs mt-1">{errors.costUsd.message}</p>}
              </div>
            </div>
          </section>

          <section>
            <h3 className="font-headline-sm text-headline-sm text-primary mb-6 flex items-center gap-2 border-b border-outline-variant/20 pb-2">
              <span className="material-symbols-outlined">category</span>
              Classification & Organization
            </h3>
            <div className="grid grid-cols-1 gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block font-label-md text-label-md text-on-surface-variant mb-1">Priority *</label>
                  <div className="relative">
                    <select 
                      className={`w-full py-3 pl-4 pr-10 bg-surface-container-lowest border rounded-xl font-body-md text-body-md focus:outline-none focus:ring-1 appearance-none ${errors.priority ? 'border-error focus:border-error focus:ring-error' : 'border-outline-variant focus:border-primary focus:ring-primary'}`}
                      {...register("priority")}
                    >
                      <option value="HIGH">High (Mandatory)</option>
                      <option value="MEDIUM">Medium (Recommended)</option>
                      <option value="LOW">Low (Optional)</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
                  </div>
                  {errors.priority && <p className="text-error text-xs mt-1">{errors.priority.message}</p>}
                </div>
                <div>
                  <label className="block font-label-md text-label-md text-on-surface-variant mb-1">Enrollment URL</label>
                  <Input 
                    type="url" 
                    placeholder="https://..." 
                    leftIcon="link" 
                    {...register("url")} 
                    error={!!errors.url} 
                  />
                  {errors.url && <p className="text-error text-xs mt-1">{errors.url.message}</p>}
                </div>
              </div>
            </div>
          </section>

          <section>
            <h3 className="font-headline-sm text-headline-sm text-primary mb-6 flex items-center gap-2 border-b border-outline-variant/20 pb-2">
              <span className="material-symbols-outlined">description</span>
              Description
            </h3>
            <div>
              <label className="block font-label-md text-label-md text-on-surface-variant mb-1">Training Details</label>
              <textarea 
                className="w-full p-4 bg-surface-container-lowest border border-outline-variant rounded-xl font-body-md text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none" 
                placeholder="Provide a comprehensive overview..." 
                rows={4}
                {...register("description")}
              ></textarea>
            </div>
          </section>

          {/* Modal Footer */}
          <div className="py-4 mt-6 border-t border-outline-variant/30 flex justify-end gap-4 sticky bottom-0 z-20 bg-surface-container-lowest">
            <Button variant="outline" type="button" onClick={() => navigate('/trainings')} disabled={isSubmitting || createMutation.isPending}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting || createMutation.isPending}>
              {(isSubmitting || createMutation.isPending) ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </div>
      
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-tertiary-container text-on-tertiary-container px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 transition-all duration-300 transform">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          <span className="font-label-md text-label-md">Training saved successfully</span>
        </div>
      )}
    </div>
  );
}
