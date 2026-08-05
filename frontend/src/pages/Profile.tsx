import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService, type UserResponse, type UserUpdateRequest } from '../services/user.service';
import { useAuth } from '../contexts/AuthContext';
import clsx from 'clsx';

export function Profile() {
  const { user: authUser, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Fetch current user details
  const { data: profileUser, isLoading } = useQuery<UserResponse>({
    queryKey: ['my-profile'],
    queryFn: () => userService.getCurrentUser(),
  });

  const currentUser = profileUser || (authUser ? {
    id: authUser.id,
    email: authUser.email,
    firstName: authUser.firstName,
    lastName: authUser.lastName,
    role: authUser.role,
    status: 'ACTIVE',
    phone: '',
    squadName: ''
  } : null);

  // Edit Profile Form State
  const [firstName, setFirstName] = useState(currentUser?.firstName || '');
  const [lastName, setLastName] = useState(currentUser?.lastName || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');

  // Keep state updated when data arrives
  const [isInitialized, setIsInitialized] = useState(false);
  if (profileUser && !isInitialized) {
    setFirstName(profileUser.firstName || '');
    setLastName(profileUser.lastName || '');
    setEmail(profileUser.email || '');
    setPhone(profileUser.phone || '');
    setIsInitialized(true);
  }

  // Change Password Form State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password Error Messages
  const [oldPasswordError, setOldPasswordError] = useState('');
  const [newPasswordError, setNewPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  // Password strength calculation (same logic as UserFormModal for Admin)
  const getPasswordStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (/[A-Za-z]/.test(pwd)) score += 1;
    if (/\d/.test(pwd)) score += 1;
    if (/[@$!%*#?&]/.test(pwd)) score += 1;
    return score;
  };

  const strength = getPasswordStrength(newPassword);

  const getStrengthLabel = (score: number) => {
    if (!newPassword) return { label: 'Requis', color: 'text-gray-400', barBg: 'bg-gray-200' };
    if (score <= 1) return { label: 'Faible', color: 'text-red-600', barBg: 'bg-red-500' };
    if (score === 2) return { label: 'Moyen', color: 'text-amber-600', barBg: 'bg-amber-500' };
    if (score === 3) return { label: 'Bon', color: 'text-blue-600', barBg: 'bg-blue-500' };
    return { label: 'Très fort', color: 'text-emerald-600', barBg: 'bg-emerald-500' };
  };

  const strengthMeta = getStrengthLabel(strength);

  // Profile Update Mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: UserUpdateRequest) => userService.updateUser(currentUser?.id || '', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-profile'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      showToast('success', 'Profil mis à jour avec succès !');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Erreur lors de la mise à jour du profil.';
      showToast('error', msg);
    }
  });

  // Password Change Mutation
  const changePasswordMutation = useMutation({
    mutationFn: () => userService.changePassword({ oldPassword, newPassword }),
    onSuccess: () => {
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setOldPasswordError('');
      setNewPasswordError('');
      setConfirmPasswordError('');
      showToast('success', 'Mot de passe modifié avec succès ! Redirection vers la page de connexion...');
      setTimeout(() => {
        logout();
        navigate('/login', { state: { successMsg: 'Votre mot de passe a été modifié avec succès. Veuillez vous connecter avec votre nouveau mot de passe.' } });
      }, 1500);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.response?.data?.detail || '';
      if (err.response?.status === 400 || msg.toLowerCase().includes('ancien') || msg.toLowerCase().includes('incorrect')) {
        setOldPasswordError("L'ancien mot de passe saisi est incorrect.");
        showToast('error', "L'ancien mot de passe saisi est incorrect.");
      } else {
        showToast('error', msg || 'Erreur lors du changement de mot de passe.');
      }
    }
  });

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    updateProfileMutation.mutate({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone.trim()
    });
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();

    let hasError = false;
    setOldPasswordError('');
    setNewPasswordError('');
    setConfirmPasswordError('');

    // 1. Validate Old Password
    if (!oldPassword) {
      setOldPasswordError("Veuillez saisir votre ancien mot de passe.");
      hasError = true;
    }

    // 2. Validate New Password Complexity
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
    if (!newPassword) {
      setNewPasswordError("Veuillez saisir le nouveau mot de passe.");
      hasError = true;
    } else if (!passwordRegex.test(newPassword)) {
      setNewPasswordError("Le mot de passe doit contenir au moins 8 caractères, 1 lettre, 1 chiffre et 1 caractère spécial (@$!%*#?&).");
      hasError = true;
    }

    // 3. Validate Confirmation Match
    if (!confirmPassword) {
      setConfirmPasswordError("Veuillez confirmer le nouveau mot de passe.");
      hasError = true;
    } else if (newPassword !== confirmPassword) {
      setConfirmPasswordError("La confirmation ne correspond pas au nouveau mot de passe.");
      hasError = true;
    }

    if (hasError) return;

    changePasswordMutation.mutate();
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'ADMIN': return { label: 'Administrateur', bg: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'CAREER_MANAGER': return { label: 'Career Manager', bg: 'bg-[#b70f30]/10 text-[#b70f30] border-red-200' };
      case 'TRAINING_MANAGER': return { label: 'Training Manager', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'DIRECTOR': return { label: 'Directeur', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'SQUAD_LEAD': return { label: 'Squad Lead', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      default: return { label: 'Collaborateur', bg: 'bg-gray-100 text-gray-700 border-gray-200' };
    }
  };

  if (isLoading && !currentUser) {
    return (
      <div className="p-12 text-center space-y-3">
        <div className="w-8 h-8 border-3 border-[#b70f30] border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs text-gray-500 font-semibold">Chargement de votre profil...</p>
      </div>
    );
  }

  const roleInfo = getRoleBadge(currentUser?.role);
  const initials = currentUser
    ? `${currentUser.firstName?.[0] || ''}${currentUser.lastName?.[0] || ''}`.toUpperCase()
    : 'U';

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 relative">
      
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[300] max-w-md w-[90vw] animate-in slide-in-from-top-4 fade-in duration-300">
          <div className={clsx(
            "px-5 py-3 rounded-2xl shadow-xl border flex items-center justify-between gap-3 text-xs font-semibold text-white",
            notification.type === 'success' ? "bg-emerald-600 border-emerald-500" : "bg-[#b70f30] border-red-700"
          )}>
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[20px]">
                {notification.type === 'success' ? 'check_circle' : 'error'}
              </span>
              <span>{notification.message}</span>
            </div>
            <button type="button" onClick={() => setNotification(null)} className="hover:opacity-80 cursor-pointer">
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>
      )}

      {/* Profile Banner Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
          {/* Avatar Initials */}
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#b70f30] to-red-700 text-white font-extrabold text-2xl flex items-center justify-center shadow-xl shadow-red-600/20 shrink-0">
            {initials}
          </div>

          {/* Info */}
          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
              <div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                  {currentUser?.firstName} {currentUser?.lastName}
                </h1>
                <p className="text-xs text-gray-500 font-medium mt-0.5">{currentUser?.email}</p>
              </div>

              <span className={clsx("inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold border self-center sm:self-auto", roleInfo.bg)}>
                <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                <span>{roleInfo.label}</span>
              </span>
            </div>

            {/* Quick Metadata Chips */}
            <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
              {currentUser?.squadName && (
                <span className="px-3 py-1 rounded-xl text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[15px] text-gray-500">groups</span>
                  <span>Squad : {currentUser.squadName}</span>
                </span>
              )}
              <span className="px-3 py-1 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Compte Actif</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Forms */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Form 1: Personal Information */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-100 shadow-sm space-y-5">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-red-50 text-[#b70f30] border border-red-100 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">person</span>
            </div>
            <div>
              <h2 className="text-base font-extrabold text-gray-900">Informations Personnelles</h2>
              <p className="text-xs text-gray-500 font-medium">Mettez à jour vos données de contact.</p>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 block">Prénom</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:border-[#b70f30] focus:ring-2 focus:ring-[#b70f30]/10 outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 block">Nom</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:border-[#b70f30] focus:ring-2 focus:ring-[#b70f30]/10 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 block">Adresse Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:border-[#b70f30] focus:ring-2 focus:ring-[#b70f30]/10 outline-none transition-all"
              />
              <span className="text-[10px] text-gray-400 block font-medium">L'adresse email est votre identifiant de connexion.</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 block">Téléphone (Optionnel)</label>
              <input
                type="tel"
                placeholder="+33 6 12 34 56 78"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:border-[#b70f30] focus:ring-2 focus:ring-[#b70f30]/10 outline-none transition-all"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={updateProfileMutation.isPending}
                className="px-5 py-2.5 text-xs font-bold text-white bg-[#b70f30] hover:bg-red-800 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {updateProfileMutation.isPending ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <span className="material-symbols-outlined text-[16px]">save</span>
                )}
                <span>Enregistrer les modifications</span>
              </button>
            </div>
          </form>
        </div>

        {/* Form 2: Change Password */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-100 shadow-sm space-y-5">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-red-50 text-[#b70f30] border border-red-100 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">lock_reset</span>
            </div>
            <div>
              <h2 className="text-base font-extrabold text-gray-900">Changer de Mot de Passe</h2>
              <p className="text-xs text-gray-500 font-medium">Sécurisez votre compte avec des règles de mot de passe fort.</p>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            
            {/* Old Password Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 block">
                Ancien mot de passe <span className="text-[#b70f30]">*</span>
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={oldPassword}
                onChange={(e) => {
                  setOldPassword(e.target.value);
                  if (oldPasswordError) setOldPasswordError('');
                }}
                className={clsx(
                  "w-full bg-gray-50 border text-gray-900 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:bg-white outline-none transition-all",
                  oldPasswordError
                    ? "border-red-500 ring-2 ring-red-500/10"
                    : "border-gray-200 focus:border-[#b70f30] focus:ring-2 focus:ring-[#b70f30]/10"
                )}
              />
              {oldPasswordError && (
                <span className="text-red-600 text-[11px] font-semibold flex items-center gap-1 mt-1">
                  <span className="material-symbols-outlined text-[14px]">error</span>
                  <span>{oldPasswordError}</span>
                </span>
              )}
            </div>

            {/* New Password Field & Password Strength Meter */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-700 block">
                  Nouveau mot de passe <span className="text-[#b70f30]">*</span>
                </label>
                <span className={clsx("text-[11px] font-extrabold", strengthMeta.color)}>
                  Robustesse : {strengthMeta.label}
                </span>
              </div>

              <input
                type="password"
                placeholder="Ex: Password1!"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (newPasswordError) setNewPasswordError('');
                }}
                className={clsx(
                  "w-full bg-gray-50 border text-gray-900 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:bg-white outline-none transition-all",
                  newPasswordError
                    ? "border-red-500 ring-2 ring-red-500/10"
                    : "border-gray-200 focus:border-[#b70f30] focus:ring-2 focus:ring-[#b70f30]/10"
                )}
              />

              {/* Password Strength Progress Bar (Same as Admin User Creation) */}
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

              {newPasswordError && (
                <span className="text-red-600 text-[11px] font-semibold flex items-center gap-1 mt-1">
                  <span className="material-symbols-outlined text-[14px]">error</span>
                  <span>{newPasswordError}</span>
                </span>
              )}
            </div>

            {/* Confirm New Password Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 block">
                Confirmer le nouveau mot de passe <span className="text-[#b70f30]">*</span>
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (confirmPasswordError) setConfirmPasswordError('');
                }}
                className={clsx(
                  "w-full bg-gray-50 border text-gray-900 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:bg-white outline-none transition-all",
                  confirmPasswordError
                    ? "border-red-500 ring-2 ring-red-500/10"
                    : "border-gray-200 focus:border-[#b70f30] focus:ring-2 focus:ring-[#b70f30]/10"
                )}
              />
              {confirmPasswordError && (
                <span className="text-red-600 text-[11px] font-semibold flex items-center gap-1 mt-1">
                  <span className="material-symbols-outlined text-[14px]">error</span>
                  <span>{confirmPasswordError}</span>
                </span>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={changePasswordMutation.isPending}
                className="px-5 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {changePasswordMutation.isPending ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <span className="material-symbols-outlined text-[16px]">key</span>
                )}
                <span>Mettre à jour le mot de passe</span>
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
