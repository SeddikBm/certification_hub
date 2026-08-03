import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function Unauthorized() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleGoHome = () => {
    if (user?.role === 'COLLABORATOR' || user?.role === 'USER') {
      navigate('/my-assignments');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 sm:p-10 max-w-[460px] w-full text-center space-y-6">
        
        {/* Clean Static SVG Icon Badge */}
        <div className="w-16 h-16 rounded-2xl bg-red-50 text-[#b70f30] border border-red-100 flex items-center justify-center mx-auto shadow-2xs">
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <rect x="9.5" y="11.5" width="5" height="4" rx="1" />
            <path d="M10.5 11.5V9.5a1.5 1.5 0 0 1 3 0v2" />
          </svg>
        </div>

        {/* Title & Subtitle */}
        <div className="space-y-2">
          <span className="inline-block px-3 py-1 rounded-full text-[11px] font-mono font-bold text-red-700 bg-red-50 border border-red-100 uppercase tracking-widest">
            Erreur 403
          </span>
          
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight pt-1">
            Accès Non Autorisé
          </h1>
          
          <p className="text-gray-500 text-xs sm:text-sm leading-relaxed max-w-sm mx-auto">
            Vous ne possédez pas les autorisations nécessaires pour accéder à cette page ou effectuer cette action.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button 
            type="button" 
            onClick={handleLogout} 
            className="w-full sm:w-1/2 px-5 py-2.5 text-xs font-extrabold text-white bg-[#b70f30] hover:bg-red-800 rounded-xl transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            <span>Se Déconnecter</span>
          </button>

          <button 
            type="button"
            onClick={handleGoHome} 
            className="w-full sm:w-1/2 px-5 py-2.5 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors border border-gray-200/80 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">home</span>
            <span>Mon Espace</span>
          </button>
        </div>

      </div>
    </div>
  );
}
