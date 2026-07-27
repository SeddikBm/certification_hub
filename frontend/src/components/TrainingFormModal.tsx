import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { squadService } from '../services/squad.service';
import type { TrainingResponse, TrainingRequest } from '../services/training.service';
import { trainingService } from '../services/training.service';
import clsx from 'clsx';

const schema = z.object({
  title: z.string().min(1, "Le titre est obligatoire"),
  type: z.string().min(1, "Le type de formation est obligatoire"),
  provider: z.string().min(1, "Le provider est obligatoire"),
  priority: z.string().min(1, "La priorité est obligatoire"),
  description: z.string().optional(),
  language: z.string().optional(),
  instructor: z.string().optional(),
  durationHours: z.coerce.number().min(0, "La durée doit être >= 0").default(0),
  costUsd: z.coerce.number().min(0, "Le coût doit être >= 0").default(0),
  isFree: z.boolean().default(false),
  url: z.union([z.literal(""), z.string().url("URL invalide")]).optional(),
  squads: z.array(z.object({
    squadId: z.string().min(1),
    squadName: z.string().optional(),
    priority: z.coerce.number().min(1).max(5)
  })).default([])
});

export type TrainingFormValues = z.infer<typeof schema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  trainingToEdit?: TrainingResponse | null;
  onSuccess: (message: string) => void;
}

export function TrainingFormModal({ isOpen, onClose, trainingToEdit, onSuccess }: Props) {
  const queryClient = useQueryClient();
  const [squadSearch, setSquadSearch] = useState('');

  const { data: squads = [] } = useQuery({
    queryKey: ['squads'],
    queryFn: squadService.getSquads,
    enabled: isOpen,
    retry: false
  });

  const { register, handleSubmit, control, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<TrainingFormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      squads: [],
      isFree: false
    }
  });

  const isFreeWatched = watch('isFree');

  const { fields: squadFields, append, remove } = useFieldArray({
    control,
    name: "squads"
  });

  useEffect(() => {
    if (isOpen) {
      if (trainingToEdit) {
        const isFreeVal = trainingToEdit.costUsd === 0 || trainingToEdit.costUsd == null;
        reset({
          title: trainingToEdit.title || '',
          type: trainingToEdit.type || 'UDEMY_BUSINESS',
          provider: trainingToEdit.provider || '',
          priority: trainingToEdit.priority || 'MANDATORY',
          description: trainingToEdit.metadata?.description || trainingToEdit.description || '',
          language: trainingToEdit.metadata?.language || trainingToEdit.language || '',
          instructor: trainingToEdit.metadata?.instructor || '',
          durationHours: trainingToEdit.durationHours || 0,
          costUsd: trainingToEdit.costUsd || 0,
          isFree: isFreeVal,
          url: trainingToEdit.url || '',
          squads: (trainingToEdit.associatedSquads || []).map(s => ({
            squadId: s.id,
            squadName: s.name,
            priority: s.priority || 3
          }))
        });
      } else {
        reset({
          title: '',
          type: 'UDEMY_BUSINESS',
          provider: '',
          priority: 'MANDATORY',
          description: '',
          language: 'Français',
          instructor: '',
          durationHours: 0,
          costUsd: 0,
          isFree: false,
          url: '',
          squads: []
        });
      }
    }
  }, [isOpen, trainingToEdit, reset]);

  const mutation = useMutation({
    mutationFn: (data: TrainingFormValues) => {
      const payload: TrainingRequest = {
        title: data.title,
        type: data.type,
        provider: data.provider,
        priority: data.priority,
        durationHours: Number(data.durationHours),
        costUsd: data.isFree ? 0 : Number(data.costUsd),
        url: data.url || undefined,
        description: data.description || undefined,
        language: data.language || undefined,
        metadata: {
          instructor: data.instructor || undefined,
          description: data.description || undefined,
          language: data.language || undefined
        },
        squads: data.squads.map(s => ({ squadId: s.squadId, priority: s.priority }))
      };

      if (trainingToEdit) {
        return trainingService.updateTraining(trainingToEdit.id, payload);
      } else {
        return trainingService.createTraining(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainings'] });
      queryClient.invalidateQueries({ queryKey: ['providers'] });
      onSuccess(trainingToEdit ? 'Formation modifiée avec succès' : 'Formation enregistrée avec succès');
      onClose();
    },
    onError: (error: any) => {
      console.error(error);
      alert(error.response?.data?.message || 'Erreur lors de la sauvegarde de la formation.');
    }
  });

  const onSubmit = (data: TrainingFormValues) => {
    mutation.mutate(data);
  };

  const handleSquadKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = squadSearch.trim().toLowerCase();
      if (!val) return;

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
              <span className="material-symbols-outlined text-[22px]">school</span>
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-[#111827] tracking-tight">
                {trainingToEdit ? 'Modifier la Formation' : 'Nouvelle Formation'}
              </h2>
              <p className="text-gray-500 text-xs mt-0.5">Saisissez les informations techniques et pédagogiques de la formation.</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors text-gray-400 hover:text-gray-700 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-8 py-6 bg-gray-50/50">
          <form id="training-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Section 1: Informations Générales */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <span className="material-symbols-outlined text-[#b70f30] text-[20px]">info</span>
                <h3 className="text-sm font-bold text-[#111827]">Informations Générales</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Titre de la formation <span className="text-[#b70f30]">*</span></label>
                  <input placeholder="Ex: Architecting on AWS & Cloud Native Patterns" {...register('title')} className={clsx("w-full px-3.5 py-2.5 text-xs font-medium bg-gray-50/50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#b70f30]/10 focus:border-[#b70f30] transition-all placeholder:text-gray-400", errors.title ? "border-red-500" : "border-gray-200")} />
                  {errors.title && <span className="text-red-600 text-[11px] mt-1 block font-medium">{errors.title.message}</span>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Type <span className="text-[#b70f30]">*</span></label>
                  <div className="relative">
                    <select {...register('type')} className="w-full px-3.5 py-2.5 text-xs font-medium bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#b70f30]/10 focus:border-[#b70f30] transition-all appearance-none cursor-pointer">
                      <option value="UDEMY_BUSINESS">Udemy Business</option>
                      <option value="INTERNAL">Interne</option>
                      <option value="EXTERNAL">Externe</option>
                      <option value="CONFERENCE">Conférence</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-[18px]">expand_more</span>
                  </div>
                  {errors.type && <span className="text-red-600 text-[11px] mt-1 block font-medium">{errors.type.message}</span>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Provider <span className="text-[#b70f30]">*</span></label>
                  <input 
                    type="text" 
                    placeholder="Ex: AWS, Udemy, Microsoft, Pluralsight..." 
                    {...register('provider')} 
                    className={clsx("w-full px-3.5 py-2.5 text-xs font-medium bg-gray-50/50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#b70f30]/10 focus:border-[#b70f30] transition-all placeholder:text-gray-400", errors.provider ? "border-red-500" : "border-gray-200")} 
                  />
                  {errors.provider && <span className="text-red-600 text-[11px] mt-1 block font-medium">{errors.provider.message}</span>}
                </div>
              </div>
            </div>

            {/* Section 2: Classification, Formateur & Squads */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <span className="material-symbols-outlined text-[#b70f30] text-[20px]">tune</span>
                <h3 className="text-sm font-bold text-[#111827]">Organisation & Squads</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Priorité</label>
                  <div className="relative">
                    <select {...register('priority')} className="w-full px-3.5 py-2.5 text-xs font-medium bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#b70f30]/10 focus:border-[#b70f30] transition-all appearance-none cursor-pointer">
                      <option value="MANDATORY">MANDATORY</option>
                      <option value="OPTIONAL">OPTIONAL</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-[18px]">expand_more</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Instructeur / Formateur</label>
                  <input placeholder="Ex: Stephane Maarek, Stéphane..." {...register('instructor')} className="w-full px-3.5 py-2.5 text-xs font-medium bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#b70f30]/10 focus:border-[#b70f30] transition-all placeholder:text-gray-400" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Langue</label>
                  <input placeholder="Ex: Français, Anglais..." {...register('language')} className="w-full px-3.5 py-2.5 text-xs font-medium bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#b70f30]/10 focus:border-[#b70f30] transition-all placeholder:text-gray-400" />
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
                      <button type="button" onClick={() => remove(index)} className="hover:text-red-900 focus:outline-none opacity-70 hover:opacity-100 cursor-pointer">
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
                    list="training-squad-list"
                  />
                  <datalist id="training-squad-list">
                    {squads.map(s => <option key={s.id} value={s.name} />)}
                  </datalist>
                </div>
                <p className="text-[11px] text-gray-500 mt-3.5 mb-5 leading-relaxed">Saisissez le nom d'une squad et appuyez sur <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-mono border border-gray-200 shadow-2xs font-semibold">Entrée</kbd> pour l'ajouter.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                <textarea placeholder="Description du programme et compétences visées..." {...register('description')} rows={3} className="w-full px-3.5 py-2.5 text-xs font-medium bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#b70f30]/10 focus:border-[#b70f30] transition-all placeholder:text-gray-400 resize-y" />
              </div>
            </div>

            {/* Section 3: Modalités, Durée & Coûts */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <span className="material-symbols-outlined text-[#b70f30] text-[20px]">timer</span>
                <h3 className="text-sm font-bold text-[#111827]">Durée, Coût & Lien</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Durée (heures)</label>
                  <input type="number" step="0.5" min="0" placeholder="Ex: 24.5" {...register('durationHours')} className={clsx("w-full px-3.5 py-2.5 text-xs font-medium bg-gray-50/50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#b70f30]/10 focus:border-[#b70f30] transition-all", errors.durationHours ? "border-red-500" : "border-gray-200")} />
                  {errors.durationHours && <span className="text-red-600 text-[11px] mt-1 block font-medium">{errors.durationHours.message}</span>}
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-gray-700">Coût Formation (MAD) {!isFreeWatched && <span className="text-[#b70f30]">*</span>}</label>
                    <label className="inline-flex items-center gap-1.5 text-xs text-gray-600 font-semibold cursor-pointer">
                      <input 
                        type="checkbox" 
                        {...register('isFree')} 
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setValue('isFree', checked);
                          if (checked) setValue('costUsd', 0);
                        }}
                        className="rounded text-[#b70f30] focus:ring-[#b70f30] w-3.5 h-3.5 cursor-pointer"
                      />
                      <span>Gratuit</span>
                    </label>
                  </div>
                  <input 
                    type="number" 
                    step="0.01" 
                    min="0" 
                    disabled={isFreeWatched}
                    placeholder={isFreeWatched ? "Gratuit (0 MAD)" : "2500"} 
                    {...register('costUsd')} 
                    className={clsx(
                      "w-full px-3.5 py-2.5 text-xs font-medium border rounded-xl transition-all",
                      isFreeWatched ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed" : "bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#b70f30]/10 focus:border-[#b70f30]",
                      errors.costUsd && !isFreeWatched ? "border-red-500" : "border-gray-200"
                    )} 
                  />
                  {errors.costUsd && !isFreeWatched && <span className="text-red-600 text-[11px] mt-1 block font-medium">{errors.costUsd.message}</span>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Lien de la Formation (URL)</label>
                  <input type="url" {...register('url')} placeholder="https://..." className={clsx("w-full px-3.5 py-2.5 text-xs font-medium bg-gray-50/50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#b70f30]/10 focus:border-[#b70f30] transition-all placeholder:text-gray-400", errors.url ? "border-red-500" : "border-gray-200")} />
                  {errors.url && <span className="text-red-600 text-[11px] mt-1 block font-medium">{errors.url.message}</span>}
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
            className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
          >
            Annuler
          </button>
          <button 
            form="training-form" 
            type="submit" 
            disabled={isSubmitting || mutation.isPending}
            className="px-5 py-2 text-xs font-semibold text-white bg-[#b70f30] hover:bg-red-800 rounded-xl transition-colors disabled:opacity-70 flex items-center gap-2 shadow-2xs cursor-pointer"
          >
            {(isSubmitting || mutation.isPending) && <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>}
            {trainingToEdit ? 'Enregistrer les modifications' : 'Créer la formation'}
          </button>
        </div>

      </div>
    </div>
  );
}
