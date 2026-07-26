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
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[840px] max-h-[92vh] flex flex-col overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-8 py-5 border-b border-gray-100 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-[#b70f30] flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[22px]">workspace_premium</span>
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-[#111827] tracking-tight">
                {certificationToEdit ? 'Modifier la Certification' : 'Nouvelle Certification'}
              </h2>
              <p className="text-gray-500 text-xs mt-0.5">Saisissez les informations techniques et logistiques de la certification.</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors text-gray-400 hover:text-gray-700"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-8 py-6 bg-gray-50/50">
          <form id="cert-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Section 1: Informations Générales */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <span className="material-symbols-outlined text-[#b70f30] text-[20px]">info</span>
                <h3 className="text-sm font-bold text-[#111827]">Informations Générales</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Code Certification <span className="text-[#b70f30]">*</span></label>
                  <input placeholder="Ex: AWS-SAA-C03" {...register('code')} className={clsx("w-full px-3.5 py-2.5 text-xs font-medium bg-gray-50/50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#b70f30]/10 focus:border-[#b70f30] transition-all placeholder:text-gray-400", errors.code ? "border-red-500" : "border-gray-200")} />
                  {errors.code && <span className="text-red-600 text-[11px] mt-1 block font-medium">{errors.code.message}</span>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Nom / Titre <span className="text-[#b70f30]">*</span></label>
                  <input placeholder="Ex: AWS Certified Solutions Architect" {...register('name')} className={clsx("w-full px-3.5 py-2.5 text-xs font-medium bg-gray-50/50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#b70f30]/10 focus:border-[#b70f30] transition-all placeholder:text-gray-400", errors.name ? "border-red-500" : "border-gray-200")} />
                  {errors.name && <span className="text-red-600 text-[11px] mt-1 block font-medium">{errors.name.message}</span>}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Provider <span className="text-[#b70f30]">*</span></label>
                  <input 
                    type="text" 
                    placeholder="Ex: AWS, Microsoft, GCP, Oracle, Cisco..." 
                    {...register('provider')} 
                    className={clsx("w-full px-3.5 py-2.5 text-xs font-medium bg-gray-50/50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#b70f30]/10 focus:border-[#b70f30] transition-all placeholder:text-gray-400", errors.provider ? "border-red-500" : "border-gray-200")} 
                  />
                  {errors.provider && <span className="text-red-600 text-[11px] mt-1 block font-medium">{errors.provider.message}</span>}
                </div>
              </div>
            </div>

            {/* Section 2: Classification & Squads */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <span className="material-symbols-outlined text-[#b70f30] text-[20px]">tune</span>
                <h3 className="text-sm font-bold text-[#111827]">Classification & Squads</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Difficulté</label>
                  <div className="relative">
                    <select {...register('difficulty')} className="w-full px-3.5 py-2.5 text-xs font-medium bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#b70f30]/10 focus:border-[#b70f30] transition-all appearance-none cursor-pointer">
                      <option value="FOUNDATIONAL">Foundational</option>
                      <option value="INTERMEDIATE">Intermediate</option>
                      <option value="ADVANCED">Advanced</option>
                      <option value="EXPERT">Expert</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-[18px]">expand_more</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Priorité Interne</label>
                  <div className="relative">
                    <select {...register('priority')} className="w-full px-3.5 py-2.5 text-xs font-medium bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#b70f30]/10 focus:border-[#b70f30] transition-all appearance-none cursor-pointer">
                      <option value="MANDATORY">Mandatory</option>
                      <option value="HIGH">High</option>
                      <option value="NORMAL">Normal</option>
                      <option value="ADVANCED">Advanced</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-[18px]">expand_more</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Squads Ciblées & Priorité Squad</label>
                <div className="min-h-[46px] p-2 bg-gray-50/50 border border-gray-200 rounded-xl focus-within:bg-white focus-within:ring-2 focus-within:ring-[#b70f30]/10 focus-within:border-[#b70f30] transition-all flex flex-wrap gap-2 items-center">
                  {squadFields.map((field, index) => (
                    <div key={field.id} className="flex items-center bg-red-50/80 border border-red-100 text-[#b70f30] px-2.5 py-1 rounded-lg text-xs font-semibold gap-1.5 shadow-2xs">
                      <span>{field.squadName}</span>
                      <select 
                        {...register(`squads.${index}.priority`)} 
                        className="bg-white border border-red-200 rounded px-1 text-[#b70f30] font-bold text-[11px] outline-none cursor-pointer"
                        title="Priorité squad"
                      >
                        <option value={1}>P1</option>
                        <option value={2}>P2</option>
                        <option value={3}>P3</option>
                        <option value={4}>P4</option>
                        <option value={5}>P5</option>
                      </select>
                      <button type="button" onClick={() => remove(index)} className="hover:text-red-900 focus:outline-none opacity-70 hover:opacity-100">
                        <span className="material-symbols-outlined text-[15px]">close</span>
                      </button>
                    </div>
                  ))}
                  <input 
                    type="text" 
                    value={squadSearch}
                    onChange={(e) => setSquadSearch(e.target.value)}
                    onKeyDown={handleSquadKeyDown}
                    placeholder={squadFields.length === 0 ? "Rechercher et ajouter une squad (ex: Cloud Native, DevOps...)" : "Ajouter..."}
                    className="flex-1 min-w-[180px] bg-transparent border-none outline-none text-xs px-2 placeholder:text-gray-400"
                    list="squad-list"
                  />
                  <datalist id="squad-list">
                    {squads.map(s => <option key={s.id} value={s.name} />)}
                  </datalist>
                </div>
                <p className="text-[11px] text-gray-500 mt-3.5 mb-5 leading-relaxed">Saisissez le nom d'une squad et appuyez sur <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-mono border border-gray-200 shadow-2xs font-semibold">Entrée</kbd> pour l'ajouter.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                <textarea placeholder="Description courte et objectifs de la certification..." {...register('description')} rows={3} className="w-full px-3.5 py-2.5 text-xs font-medium bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#b70f30]/10 focus:border-[#b70f30] transition-all placeholder:text-gray-400 resize-y" />
              </div>
            </div>

            {/* Section 3: Modalités & Coûts */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <span className="material-symbols-outlined text-[#b70f30] text-[20px]">timer</span>
                <h3 className="text-sm font-bold text-[#111827]">Modalités, Coûts & Liens</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Durée Examen (min)</label>
                  <input type="number" min="0" placeholder="Ex: 130" {...register('examDuration')} className={clsx("w-full px-3.5 py-2.5 text-xs font-medium bg-gray-50/50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#b70f30]/10 focus:border-[#b70f30] transition-all", errors.examDuration ? "border-red-500" : "border-gray-200")} />
                  {errors.examDuration && <span className="text-red-600 text-[11px] mt-1 block font-medium">{errors.examDuration.message}</span>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Score Passage (%)</label>
                  <input type="number" min="0" max="100" placeholder="Ex: 72" {...register('passingScore')} className={clsx("w-full px-3.5 py-2.5 text-xs font-medium bg-gray-50/50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#b70f30]/10 focus:border-[#b70f30] transition-all", errors.passingScore ? "border-red-500" : "border-gray-200")} />
                  {errors.passingScore && <span className="text-red-600 text-[11px] mt-1 block font-medium">{errors.passingScore.message}</span>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Coût Examen (MAD) <span className="text-[#b70f30]">*</span></label>
                  <input type="number" step="0.01" min="0" placeholder="1500" {...register('examCostUsd')} className={clsx("w-full px-3.5 py-2.5 text-xs font-medium bg-gray-50/50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#b70f30]/10 focus:border-[#b70f30] transition-all", errors.examCostUsd ? "border-red-500" : "border-gray-200")} />
                  {errors.examCostUsd && <span className="text-red-600 text-[11px] mt-1 block font-medium">{errors.examCostUsd.message}</span>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Coût Formation (MAD)</label>
                  <input type="number" step="0.01" min="0" placeholder="3000" {...register('trainingCostUsd')} className={clsx("w-full px-3.5 py-2.5 text-xs font-medium bg-gray-50/50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#b70f30]/10 focus:border-[#b70f30] transition-all", errors.trainingCostUsd ? "border-red-500" : "border-gray-200")} />
                  {errors.trainingCostUsd && <span className="text-red-600 text-[11px] mt-1 block font-medium">{errors.trainingCostUsd.message}</span>}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Site Officiel URL</label>
                  <input type="url" {...register('officialUrl')} placeholder="https://aws.amazon.com/..." className={clsx("w-full px-3.5 py-2.5 text-xs font-medium bg-gray-50/50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#b70f30]/10 focus:border-[#b70f30] transition-all placeholder:text-gray-400", errors.officialUrl ? "border-red-500" : "border-gray-200")} />
                  {errors.officialUrl && <span className="text-red-600 text-[11px] mt-1 block font-medium">{errors.officialUrl.message}</span>}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Centre d'Examen URL</label>
                  <input type="url" {...register('examProviderUrl')} placeholder="https://home.pearsonvue.com/..." className={clsx("w-full px-3.5 py-2.5 text-xs font-medium bg-gray-50/50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#b70f30]/10 focus:border-[#b70f30] transition-all placeholder:text-gray-400", errors.examProviderUrl ? "border-red-500" : "border-gray-200")} />
                  {errors.examProviderUrl && <span className="text-red-600 text-[11px] mt-1 block font-medium">{errors.examProviderUrl.message}</span>}
                </div>
                <div className="md:col-span-2 flex flex-col justify-end">
                  <label className="block text-xs font-semibold text-gray-700 mb-1 flex justify-between items-center">
                    <span>Validité (ans)</span>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" {...register('isPermanent')} className="w-3.5 h-3.5 text-[#b70f30] rounded focus:ring-[#b70f30] cursor-pointer" />
                      <span className="text-gray-500 text-xs font-normal">Permanente</span>
                    </label>
                  </label>
                  <input type="number" min="1" disabled={watch('isPermanent')} {...register('validityYears')} className={clsx("w-full px-3.5 py-2.5 text-xs font-medium bg-gray-50/50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#b70f30]/10 focus:border-[#b70f30] transition-all disabled:opacity-50 disabled:bg-gray-100", errors.validityYears ? "border-red-500" : "border-gray-200")} />
                  {errors.validityYears && !watch('isPermanent') && <span className="text-red-600 text-[11px] mt-1 block font-medium">{errors.validityYears.message}</span>}
                </div>
              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 border-t border-gray-100 bg-white flex justify-end gap-2.5">
          <button 
            type="button"
            onClick={onClose} 
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
          <button 
            form="cert-form" 
            type="submit" 
            disabled={isSubmitting || mutation.isPending}
            className="px-5 py-2 text-xs font-semibold text-white bg-[#b70f30] hover:bg-red-800 rounded-xl transition-colors disabled:opacity-70 flex items-center gap-2 shadow-2xs"
          >
            {(isSubmitting || mutation.isPending) && <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>}
            {certificationToEdit ? 'Enregistrer les modifications' : 'Créer la certification'}
          </button>
        </div>

      </div>
    </div>
  );
}
