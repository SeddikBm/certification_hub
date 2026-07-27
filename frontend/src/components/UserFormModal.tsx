import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { squadService } from '../services/squad.service';
import type { UserResponse, UserCreateRequest, UserUpdateRequest } from '../services/user.service';
import { userService } from '../services/user.service';
import clsx from 'clsx';

const schema = z.object({
  email: z.string().min(1, "L'email est requis").email("Format d'email invalide"),
  password: z.string().optional().refine((val) => {
    if (!val) return true;
    return /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/.test(val);
  }, {
    message: "Le mot de passe doit contenir au moins 8 caractères, 1 lettre, 1 chiffre et 1 caractère spécial (@$!%*#?&)"
  }),
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
  role: z.string().min(1, "Le rôle est requis"),
  status: z.string().default('ACTIVE'),
  squadId: z.string().optional(),
  phone: z.string().optional(),
  hireDate: z.string().optional()
}).refine(data => {
  if (data.role === 'COLLABORATOR' && !data.squadId) {
    return false;
  }
  return true;
}, {
  message: "L'affectation à une Squad est obligatoire pour un collaborateur",
  path: ["squadId"]
});

export type UserFormValues = z.infer<typeof schema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userToEdit?: UserResponse | null;
  onSuccess: (message: string) => void;
}

export function UserFormModal({ isOpen, onClose, userToEdit, onSuccess }: Props) {
  const queryClient = useQueryClient();

  const { data: squads = [] } = useQuery({
    queryKey: ['squads'],
    queryFn: squadService.getSquads,
    enabled: isOpen,
    retry: false
  });

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<UserFormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      role: 'COLLABORATOR',
      status: 'ACTIVE',
      hireDate: new Date().toISOString().split('T')[0]
    }
  });

  const roleWatched = watch('role');
  const passwordWatched = watch('password') || '';

  // Password strength calculation
  const getPasswordStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (/[A-Za-z]/.test(pwd)) score += 1;
    if (/\d/.test(pwd)) score += 1;
    if (/[@$!%*#?&]/.test(pwd)) score += 1;
    return score;
  };

  const strength = getPasswordStrength(passwordWatched);

  const getStrengthLabel = (score: number) => {
    if (!passwordWatched) return { label: 'Requis', color: 'text-gray-400', barBg: 'bg-gray-200' };
    if (score <= 1) return { label: 'Faible', color: 'text-red-600', barBg: 'bg-red-500' };
    if (score === 2) return { label: 'Moyen', color: 'text-amber-600', barBg: 'bg-amber-500' };
    if (score === 3) return { label: 'Bon', color: 'text-blue-600', barBg: 'bg-blue-500' };
    return { label: 'Très fort', color: 'text-emerald-600', barBg: 'bg-emerald-500' };
  };

  const strengthMeta = getStrengthLabel(strength);

  useEffect(() => {
    if (isOpen) {
      if (userToEdit) {
        reset({
          email: userToEdit.email || '',
          password: '',
          firstName: userToEdit.firstName || '',
          lastName: userToEdit.lastName || '',
          role: userToEdit.role || 'COLLABORATOR',
          status: userToEdit.status || 'ACTIVE',
          squadId: userToEdit.squadId || '',
          phone: userToEdit.phone || '',
          hireDate: userToEdit.hireDate ? String(userToEdit.hireDate) : new Date().toISOString().split('T')[0]
        });
      } else {
        reset({
          email: '',
          password: '',
          firstName: '',
          lastName: '',
          role: 'COLLABORATOR',
          status: 'ACTIVE',
          squadId: '',
          phone: '',
          hireDate: new Date().toISOString().split('T')[0]
        });
      }
    }
  }, [isOpen, userToEdit, reset]);

  const mutation = useMutation({
    mutationFn: (data: UserFormValues) => {
      if (userToEdit) {
        const payload: UserUpdateRequest = {
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          role: data.role,
          status: data.status,
          squadId: data.squadId || undefined,
          phone: data.phone || undefined,
          hireDate: data.hireDate || undefined
        };
        return userService.updateUser(userToEdit.id, payload);
      } else {
        const payload: UserCreateRequest = {
          email: data.email,
          password: data.password || 'Password1!',
          firstName: data.firstName,
          lastName: data.lastName,
          role: data.role,
          squadId: data.squadId || undefined,
          phone: data.phone || undefined,
          hireDate: data.hireDate || new Date().toISOString().split('T')[0]
        };
        return userService.createUser(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onSuccess(userToEdit ? 'Utilisateur modifié avec succès' : 'Utilisateur créé avec succès');
      onClose();
    },
    onError: (error: any) => {
      console.error(error);
      alert(error.response?.data?.message || 'Erreur lors de la sauvegarde de l\'utilisateur.');
    }
  });

  const onSubmit = (data: UserFormValues) => {
    mutation.mutate(data);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[680px] max-h-[92vh] flex flex-col overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-8 py-5 border-b border-gray-100 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-[#b70f30] flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[22px]">manage_accounts</span>
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-[#111827] tracking-tight">
                {userToEdit ? 'Modifier l\'Utilisateur' : 'Nouvel Utilisateur'}
              </h2>
              <p className="text-gray-500 text-xs mt-0.5">Saisissez les informations et les accès de l'utilisateur.</p>
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
          <form id="user-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Section 1: Identité */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <span className="material-symbols-outlined text-[#b70f30] text-[20px]">person</span>
                <h3 className="text-sm font-bold text-[#111827]">Identité & Contact</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Prénom <span className="text-[#b70f30]">*</span></label>
                  <input placeholder="Prénom" {...register('firstName')} className={clsx("w-full px-3.5 py-2.5 text-xs font-medium bg-gray-50/50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#b70f30]/10 focus:border-[#b70f30] transition-all", errors.firstName ? "border-red-500" : "border-gray-200")} />
                  {errors.firstName && <span className="text-red-600 text-[11px] mt-1 block font-medium">{errors.firstName.message}</span>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Nom <span className="text-[#b70f30]">*</span></label>
                  <input placeholder="Nom" {...register('lastName')} className={clsx("w-full px-3.5 py-2.5 text-xs font-medium bg-gray-50/50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#b70f30]/10 focus:border-[#b70f30] transition-all", errors.lastName ? "border-red-500" : "border-gray-200")} />
                  {errors.lastName && <span className="text-red-600 text-[11px] mt-1 block font-medium">{errors.lastName.message}</span>}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Adresse Email <span className="text-[#b70f30]">*</span></label>
                  <input type="email" placeholder="collaborateur@devoteam.com" {...register('email')} className={clsx("w-full px-3.5 py-2.5 text-xs font-medium bg-gray-50/50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#b70f30]/10 focus:border-[#b70f30] transition-all", errors.email ? "border-red-500" : "border-gray-200")} />
                  {errors.email && <span className="text-red-600 text-[11px] mt-1 block font-medium">{errors.email.message}</span>}
                </div>

                {/* Password & Password Strength Meter */}
                {!userToEdit && (
                  <div className="md:col-span-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-gray-700">Mot de passe <span className="text-[#b70f30]">*</span></label>
                      <span className={clsx("text-[11px] font-bold", strengthMeta.color)}>
                        Robustesse : {strengthMeta.label}
                      </span>
                    </div>
                    <input 
                      type="password" 
                      placeholder="Ex: Password1!" 
                      {...register('password')} 
                      className={clsx("w-full px-3.5 py-2.5 text-xs font-medium bg-gray-50/50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#b70f30]/10 focus:border-[#b70f30] transition-all", errors.password ? "border-red-500" : "border-gray-200")} 
                    />
                    
                    {/* Password Strength Progress Bar */}
                    <div className="grid grid-cols-4 gap-1.5 pt-1">
                      {[1, 2, 3, 4].map(level => (
                        <div 
                          key={level} 
                          className={clsx(
                            "h-1.5 rounded-full transition-all duration-300",
                            strength >= level ? strengthMeta.barBg : "bg-gray-200"
                          )} 
                        />
                      ))}
                    </div>

                    {errors.password && <span className="text-red-600 text-[11px] mt-1 block font-medium">{errors.password.message}</span>}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Téléphone</label>
                  <input placeholder="+212 6..." {...register('phone')} className="w-full px-3.5 py-2.5 text-xs font-medium bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#b70f30]/10 focus:border-[#b70f30] transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Date d'embauche</label>
                  <input type="date" {...register('hireDate')} className="w-full px-3.5 py-2.5 text-xs font-medium bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#b70f30]/10 focus:border-[#b70f30] transition-all" />
                </div>
              </div>
            </div>

            {/* Section 2: Rôle, Statut & Squad */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <span className="material-symbols-outlined text-[#b70f30] text-[20px]">badge</span>
                <h3 className="text-sm font-bold text-[#111827]">Rôle & Affectation</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Rôle <span className="text-[#b70f30]">*</span></label>
                  <div className="relative">
                    <select {...register('role')} className="w-full px-3.5 py-2.5 text-xs font-medium bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#b70f30]/10 focus:border-[#b70f30] transition-all appearance-none cursor-pointer">
                      <option value="COLLABORATOR">Collaborateur</option>
                      <option value="SQUAD_LEAD">Squad Lead</option>
                      <option value="CAREER_MANAGER">Career Manager</option>
                      <option value="TRAINING_MANAGER">Training Manager</option>
                      <option value="DIRECTOR">Directeur</option>
                      <option value="ADMIN">Administrateur</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-[18px]">expand_more</span>
                  </div>
                  {errors.role && <span className="text-red-600 text-[11px] mt-1 block font-medium">{errors.role.message}</span>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Squad {roleWatched === 'COLLABORATOR' && <span className="text-[#b70f30]">*</span>}</label>
                  <div className="relative">
                    <select {...register('squadId')} className={clsx("w-full px-3.5 py-2.5 text-xs font-medium bg-gray-50/50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#b70f30]/10 focus:border-[#b70f30] transition-all appearance-none cursor-pointer", errors.squadId ? "border-red-500" : "border-gray-200")}>
                      <option value="">Aucune squad</option>
                      {squads.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-[18px]">expand_more</span>
                  </div>
                  {errors.squadId && <span className="text-red-600 text-[11px] mt-1 block font-medium">{errors.squadId.message}</span>}
                </div>

                {userToEdit && (
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Statut du Compte</label>
                    <div className="relative">
                      <select {...register('status')} className="w-full px-3.5 py-2.5 text-xs font-medium bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#b70f30]/10 focus:border-[#b70f30] transition-all appearance-none cursor-pointer">
                        <option value="ACTIVE">Actif</option>
                        <option value="INACTIVE">Inactif</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-[18px]">expand_more</span>
                    </div>
                  </div>
                )}
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
            form="user-form" 
            type="submit" 
            disabled={isSubmitting || mutation.isPending}
            className="px-5 py-2 text-xs font-semibold text-white bg-[#b70f30] hover:bg-red-800 rounded-xl transition-colors disabled:opacity-70 flex items-center gap-2 shadow-2xs cursor-pointer"
          >
            {(isSubmitting || mutation.isPending) && <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>}
            {userToEdit ? 'Enregistrer les modifications' : 'Créer l\'utilisateur'}
          </button>
        </div>

      </div>
    </div>
  );
}
