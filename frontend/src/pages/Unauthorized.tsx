import { Link, useNavigate } from 'react-router-dom';

export function Unauthorized() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-[480px] w-full text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-red-50 text-[#b70f30] flex items-center justify-center mx-auto shadow-2xs">
          <span className="material-symbols-outlined text-[36px]">shield_lock</span>
        </div>
        <div>
          <span className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest">Erreur 403</span>
          <h1 className="text-2xl font-extrabold text-gray-900 mt-1 tracking-tight">Accès Non Autorisé</h1>
          <p className="text-gray-500 text-xs mt-2 leading-relaxed">
            Vous ne possédez pas les privilèges requis pour accéder à cette page ou effectuer cette action. Seuls les Administrateurs et Training Managers ont cet accès.
          </p>
        </div>
        <div className="pt-2 flex items-center justify-center gap-3">
          <button 
            type="button" 
            onClick={() => navigate(-1)} 
            className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
          >
            Retour
          </button>
          <Link 
            to="/dashboard" 
            className="px-4 py-2 text-xs font-semibold text-white bg-[#b70f30] hover:bg-red-800 rounded-xl transition-colors shadow-2xs"
          >
            Tableau de bord
          </Link>
        </div>
      </div>
    </div>
  );
}
