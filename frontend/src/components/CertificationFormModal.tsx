import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { squadService } from '../services/squad.service';
import type { CertificationResponse, CertificationRequest } from '../services/certification.service';
import { certificationService } from '../services/certification.service';
import clsx from 'clsx';

// -- Zod Schema --
const schema = z.object({
  code: z.string().min(1, "Le code est obligatoire").max(100, "Le code est trop long"),
  name: z.string().min(1, "Le nom est obligatoire"),
  provider: z.string().min(1, "Le provider est obligatoire"),
  difficulty: z.string().min(1, "La difficulté est obligatoire"),
  priority: z.string().min(1, "La priorité est obligatoire"),
  description: z.string().optional(),
  examDuration: z.union([z.literal(''), z.coerce.number().min(0, "Doit être >= 0")]).optional(),
  passingScore: z.union([z.literal(''), z.coerce.number().min(0, "Doit être >= 0").max(100, "Doit être <= 100")]).optional(),
  examCostUsd: z.coerce.number().min(0, "Le coût doit être >= 0").default(0),
  trainingCostUsd: z.coerce.number().min(0, "Le coût doit être >= 0").default(0),
  validityYears: z.union([z.literal(''), z.coerce.number().min(1, "La validité doit être >= 1")]).optional(),
  isPermanent: z.boolean().default(false),
  officialUrl: z.union([z.literal(""), z.string().url("URL invalide")]).optional(),
  examProviderUrl: z.union([z.literal(""), z.string().url("URL invalide")]).optional(),
  squads: z.array(z.object({
    squadId: z.string().min(1),
    squadName: z.string().optional(),
    priority: z.coerce.number().min(1).max(5)
  })).default([])
});

export type CertificationFormValues = z.infer<typeof schema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  certificationToEdit?: CertificationResponse | null;
  onSuccess: (message: string) => void;
}

export function CertificationFormModal({ isOpen, onClose, certificationToEdit, onSuccess }: Props) {
  const queryClient = useQueryClient();
  const [squadSearch, setSquadSearch] = useState('');
  
  const { data: squads = [] } = useQuery({
    queryKey: ['squads'],
    queryFn: squadService.getSquads,
    enabled: isOpen,
    retry: false
  });

  const { register, handleSubmit, control, reset, watch, formState: { errors, isSubmitting } } = useForm<CertificationFormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      squads: []
    }
  });

  const { fields: squadFields, append, remove } = useFieldArray({
    control,
    name: "squads"
  });

  useEffect(() => {
    if (isOpen) {
      if (certificationToEdit) {
        reset({
          code: certificationToEdit.code || '',
          name: certificationToEdit.name || '',
          provider: certificationToEdit.provider || '',
          difficulty: certificationToEdit.difficulty || 'FOUNDATIONAL',
          priority: certificationToEdit.priority || 'NORMAL',
          description: certificationToEdit.metadata?.description || '',
          examDuration: certificationToEdit.metadata?.examDuration || '',
          passingScore: certificationToEdit.metadata?.passingScore || '',
          examCostUsd: certificationToEdit.examCostUsd || 0,
          trainingCostUsd: certificationToEdit.trainingCostUsd || 0,
          validityYears: certificationToEdit.validityMonths ? Math.floor(certificationToEdit.validityMonths / 12) : '',
          isPermanent: certificationToEdit.validityMonths == null,
          officialUrl: certificationToEdit.officialUrl || '',
          examProviderUrl: certificationToEdit.examProviderUrl || '',
          squads: (certificationToEdit.associatedSquads || []).map(s => ({
            squadId: s.id,
            squadName: s.name,
            priority: s.priority || 3
          }))
        });
      } else {
        reset({
          code: '',
          name: '',
          provider: '',
          difficulty: 'FOUNDATIONAL',
          priority: 'NORMAL',
          description: '',
          examCostUsd: 0,
          trainingCostUsd: 0,
          validityYears: 1,
          isPermanent: false,
          officialUrl: '',
          examProviderUrl: '',
          squads: []
        });
      }
    }
  }, [isOpen, certificationToEdit, reset]);

  const mutation = useMutation({
    mutationFn: (data: CertificationFormValues) => {
      const payload: CertificationRequest = {
        code: data.code,
        name: data.name,
        provider: data.provider,
        difficulty: data.difficulty,
        priority: data.priority,
        examCostUsd: data.examCostUsd,
        trainingCostUsd: data.trainingCostUsd,
        validityMonths: data.isPermanent ? null : (data.validityYears ? Number(data.validityYears) * 12 : undefined),
        officialUrl: data.officialUrl || undefined,
        examProviderUrl: data.examProviderUrl || undefined,
        metadata: {
          description: data.description || undefined,
          examDuration: data.examDuration === '' ? undefined : Number(data.examDuration),
          passingScore: data.passingScore === '' ? undefined : Number(data.passingScore),
        },
        squads: data.squads.map(s => ({ squadId: s.squadId, priority: s.priority }))
      };
      
      if (certificationToEdit) {
        return certificationService.updateCertification(certificationToEdit.id, payload);
      } else {
        return certificationService.createCertification(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certifications'] });
      queryClient.invalidateQueries({ queryKey: ['providers'] });
      onSuccess(certificationToEdit ? 'Certification modifiée avec succès' : 'Certification enregistrée avec succès');
      onClose();
    },
    onError: (error: any) => {
      console.error(error);
      alert(error.response?.data?.message || 'Erreur lors de la sauvegarde.');
    }
  });

  const onSubmit = (data: CertificationFormValues) => {
    mutation.mutate(data);
  };

  const handleSquadKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = squadSearch.trim().toLowerCase();
      if (!val) return;
      
      // Find a matching squad
      const sq = squads.find(s => s.name.toLowerCase() === val);
      if (sq) {
        const alreadyAdded = squadFields.some(f => f.squadId === sq.id);
        if (!alreadyAdded) {
          append({ squadId: sq.id, squadName: sq.name, priority: 3 });
        }
      } else {
        alert("Cette squad n'existe pas.");
      }
      setSquadSearch('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#111827]/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-[800px] max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-8 py-5 border-b border-[#f4e2e2] bg-white flex items-start justify-between">
          <div>
            <h2 className="text-[22px] font-semibold text-[#1F2937]">
              {certificationToEdit ? 'Modifier Certification' : 'Ajouter Certification'}
            </h2>
            <p className="text-[#6B7280] text-[13px] mt-1">Saisissez les détails de la certification ci-dessous.</p>
          </div>
          <button type="button" onClick={onClose} className="p-1 hover:bg-[#f3f4f6] rounded-md transition-colors text-[#6B7280]">
            <span className="material-symbols-outlined text-[24px]">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-8 py-6 bg-[#fff8f7]">
          <form id="cert-form" onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            
            {/* Informations de Base */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-[#b3261e] text-[20px]">info</span>
                <h3 className="text-[16px] font-semibold text-[#b3261e]">Informations de Base</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[13px] font-medium text-[#111827] mb-1.5">Code <span className="text-[#b3261e]">*</span></label>
                  <input placeholder="Ex: AWS-SAA-C03" {...register('code')} className={clsx("w-full px-3 py-2 text-[14px] bg-white border rounded-md focus:outline-none focus:ring-1 focus:ring-[#b3261e] focus:border-[#b3261e] transition-all placeholder:text-[#9CA3AF]", errors.code ? "border-[#b3261e]" : "border-[#E5E7EB]")} />
                  {errors.code && <span className="text-[#b3261e] text-[12px] mt-1 block">{errors.code.message}</span>}
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#111827] mb-1.5">Nom <span className="text-[#b3261e]">*</span></label>
                  <input placeholder="Ex: AWS Certified Solutions Architect - Associate" {...register('name')} className={clsx("w-full px-3 py-2 text-[14px] bg-white border rounded-md focus:outline-none focus:ring-1 focus:ring-[#b3261e] focus:border-[#b3261e] transition-all placeholder:text-[#9CA3AF]", errors.name ? "border-[#b3261e]" : "border-[#E5E7EB]")} />
                  {errors.name && <span className="text-[#b3261e] text-[12px] mt-1 block">{errors.name.message}</span>}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[13px] font-medium text-[#111827] mb-1.5">Provider <span className="text-[#b3261e]">*</span></label>
                  <input 
                    type="text" 
                    placeholder="Saisissez un provider (ex: AWS, Microsoft)" 
                    {...register('provider')} 
                    className={clsx("w-full px-3 py-2 text-[14px] bg-white border rounded-md focus:outline-none focus:ring-1 focus:ring-[#b3261e] focus:border-[#b3261e] transition-all placeholder:text-[#9CA3AF]", errors.provider ? "border-[#b3261e]" : "border-[#E5E7EB]")} 
                  />
                  {errors.provider && <span className="text-[#b3261e] text-[12px] mt-1 block">{errors.provider.message}</span>}
                </div>
              </div>
            </div>

            <hr className="border-[#f4e2e2]" />

            {/* Classification & Organisation */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-[#b3261e] text-[20px]">account_tree</span>
                <h3 className="text-[16px] font-semibold text-[#b3261e]">Classification & Organisation</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                <div>
                  <label className="block text-[13px] font-medium text-[#111827] mb-1.5">Difficulté</label>
                  <div className="relative">
                    <select {...register('difficulty')} className="w-full px-3 py-2 text-[14px] bg-white border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-[#b3261e] focus:border-[#b3261e] transition-all appearance-none cursor-pointer">
                      <option value="FOUNDATIONAL">Foundational</option>
                      <option value="INTERMEDIATE">Intermediate</option>
                      <option value="ADVANCED">Advanced</option>
                      <option value="EXPERT">Expert</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none">expand_more</span>
                  </div>
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#111827] mb-1.5">Priorité Interne</label>
                  <div className="relative">
                    <select {...register('priority')} className="w-full px-3 py-2 text-[14px] bg-white border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-[#b3261e] focus:border-[#b3261e] transition-all appearance-none cursor-pointer">
                      <option value="MANDATORY">Mandatory</option>
                      <option value="HIGH">High</option>
                      <option value="NORMAL">Normal</option>
                      <option value="ADVANCED">Advanced</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none">expand_more</span>
                  </div>
                </div>
              </div>

              <div className="mb-5">
                <label className="block text-[13px] font-medium text-[#111827] mb-1.5">Squads Ciblées</label>
                <div className="min-h-[42px] p-1.5 bg-white border border-[#E5E7EB] rounded-md focus-within:ring-1 focus-within:ring-[#b3261e] focus-within:border-[#b3261e] transition-all flex flex-wrap gap-2 items-center">
                  {squadFields.map((field, index) => (
                    <div key={field.id} className="flex items-center bg-[#fceeed] text-[#b3261e] px-2 py-1 rounded-md text-[13px] font-medium gap-1 group">
                      <span>{field.squadName}</span>
                      <select 
                        {...register(`squads.${index}.priority`)} 
                        className="bg-transparent border-none outline-none cursor-pointer text-[#b3261e] font-semibold mx-1 p-0 focus:ring-0 text-[12px]"
                        title="Priorité"
                      >
                        <option value={1}>P1</option>
                        <option value={2}>P2</option>
                        <option value={3}>P3</option>
                        <option value={4}>P4</option>
                        <option value={5}>P5</option>
                      </select>
                      <button type="button" onClick={() => remove(index)} className="hover:text-red-800 focus:outline-none opacity-60 hover:opacity-100">
                        <span className="material-symbols-outlined text-[14px]">close</span>
                      </button>
                    </div>
                  ))}
                  <input 
                    type="text" 
                    value={squadSearch}
                    onChange={(e) => setSquadSearch(e.target.value)}
                    onKeyDown={handleSquadKeyDown}
                    placeholder={squadFields.length === 0 ? "Ajouter une squad..." : "Ajouter..."}
                    className="flex-1 min-w-[150px] bg-transparent border-none outline-none text-[14px] px-2 placeholder:text-[#9CA3AF]"
                    list="squad-list"
                  />
                  <datalist id="squad-list">
                    {squads.map(s => <option key={s.id} value={s.name} />)}
                  </datalist>
                </div>
                <p className="text-[12px] text-[#6B7280] mt-1.5">Appuyez sur Entrée pour ajouter une squad.</p>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#111827] mb-1.5">Description</label>
                <textarea placeholder="Description courte de la certification..." {...register('description')} rows={3} className="w-full px-3 py-2 text-[14px] bg-white border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-[#b3261e] focus:border-[#b3261e] transition-all placeholder:text-[#9CA3AF] resize-y" />
              </div>
            </div>

            <hr className="border-[#f4e2e2]" />

            {/* Modalités d'Examen */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-[#b3261e] text-[20px]">timer</span>
                <h3 className="text-[16px] font-semibold text-[#b3261e]">Modalités d'Examen</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
                <div>
                  <label className="block text-[13px] font-medium text-[#111827] mb-1.5">Durée (min)</label>
                  <input type="number" min="0" {...register('examDuration')} className={clsx("w-full px-3 py-2 text-[14px] bg-white border rounded-md focus:outline-none focus:ring-1 focus:ring-[#b3261e] focus:border-[#b3261e] transition-all", errors.examDuration ? "border-[#b3261e]" : "border-[#E5E7EB]")} />
                  {errors.examDuration && <span className="text-[#b3261e] text-[12px] mt-1 block">{errors.examDuration.message}</span>}
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#111827] mb-1.5">Score de passage</label>
                  <input type="number" min="0" max="100" {...register('passingScore')} className={clsx("w-full px-3 py-2 text-[14px] bg-white border rounded-md focus:outline-none focus:ring-1 focus:ring-[#b3261e] focus:border-[#b3261e] transition-all", errors.passingScore ? "border-[#b3261e]" : "border-[#E5E7EB]")} />
                  {errors.passingScore && <span className="text-[#b3261e] text-[12px] mt-1 block">{errors.passingScore.message}</span>}
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#111827] mb-1.5">Coût Examen (MAD) <span className="text-[#b3261e]">*</span></label>
                  <input type="number" step="0.01" min="0" {...register('examCostUsd')} className={clsx("w-full px-3 py-2 text-[14px] bg-white border rounded-md focus:outline-none focus:ring-1 focus:ring-[#b3261e] focus:border-[#b3261e] transition-all", errors.examCostUsd ? "border-[#b3261e]" : "border-[#E5E7EB]")} />
                  {errors.examCostUsd && <span className="text-[#b3261e] text-[12px] mt-1 block">{errors.examCostUsd.message}</span>}
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#111827] mb-1.5">Coût Formation (MAD)</label>
                  <input type="number" step="0.01" min="0" {...register('trainingCostUsd')} className={clsx("w-full px-3 py-2 text-[14px] bg-white border rounded-md focus:outline-none focus:ring-1 focus:ring-[#b3261e] focus:border-[#b3261e] transition-all", errors.trainingCostUsd ? "border-[#b3261e]" : "border-[#E5E7EB]")} />
                  {errors.trainingCostUsd && <span className="text-[#b3261e] text-[12px] mt-1 block">{errors.trainingCostUsd.message}</span>}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[13px] font-medium text-[#111827] mb-1.5">URL Officielle</label>
                  <input type="url" {...register('officialUrl')} placeholder="https://" className={clsx("w-full px-3 py-2 text-[14px] bg-white border rounded-md focus:outline-none focus:ring-1 focus:ring-[#b3261e] focus:border-[#b3261e] transition-all placeholder:text-[#9CA3AF]", errors.officialUrl ? "border-[#b3261e]" : "border-[#E5E7EB]")} />
                  {errors.officialUrl && <span className="text-[#b3261e] text-[12px] mt-1 block">{errors.officialUrl.message}</span>}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[13px] font-medium text-[#111827] mb-1.5">URL Examen (Provider)</label>
                  <input type="url" {...register('examProviderUrl')} placeholder="https://" className={clsx("w-full px-3 py-2 text-[14px] bg-white border rounded-md focus:outline-none focus:ring-1 focus:ring-[#b3261e] focus:border-[#b3261e] transition-all placeholder:text-[#9CA3AF]", errors.examProviderUrl ? "border-[#b3261e]" : "border-[#E5E7EB]")} />
                  {errors.examProviderUrl && <span className="text-[#b3261e] text-[12px] mt-1 block">{errors.examProviderUrl.message}</span>}
                </div>
                <div className="md:col-span-2 flex flex-col justify-end">
                  <label className="block text-[13px] font-medium text-[#111827] mb-1.5 flex justify-between items-center">
                    Validité (ans)
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" {...register('isPermanent')} className="w-3.5 h-3.5 text-[#b3261e] rounded focus:ring-[#b3261e] cursor-pointer" />
                      <span className="text-[#6B7280] text-[12px] font-normal">Permanente</span>
                    </label>
                  </label>
                  <input type="number" min="1" disabled={watch('isPermanent')} {...register('validityYears')} className={clsx("w-full px-3 py-2 text-[14px] bg-white border rounded-md focus:outline-none focus:ring-1 focus:ring-[#b3261e] focus:border-[#b3261e] transition-all disabled:opacity-50 disabled:bg-[#f9fafb]", errors.validityYears ? "border-[#b3261e]" : "border-[#E5E7EB]")} />
                  {errors.validityYears && !watch('isPermanent') && <span className="text-[#b3261e] text-[12px] mt-1 block">{errors.validityYears.message}</span>}
                </div>
              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-[#f4e2e2] bg-white flex justify-end gap-3">
          <button 
            type="button"
            onClick={onClose} 
            disabled={isSubmitting}
            className="px-5 py-2 text-[14px] font-medium text-[#b3261e] bg-white border border-[#b3261e] rounded-md hover:bg-[#fceeed] transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
          <button 
            form="cert-form" 
            type="submit" 
            disabled={isSubmitting || mutation.isPending}
            className="px-5 py-2 text-[14px] font-medium text-white bg-[#b3261e] rounded-md hover:bg-[#991b1b] transition-colors disabled:opacity-70 flex items-center gap-2 shadow-sm"
          >
            {(isSubmitting || mutation.isPending) && <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>}
            Enregistrer
          </button>
        </div>

      </div>
    </div>
  );
}
