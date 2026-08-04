import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { NotificationDropdown } from '../components/NotificationDropdown';
import clsx from 'clsx';

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Tableau de Bord', icon: 'dashboard', path: '/dashboard', roles: ['ADMIN', 'DIRECTOR', 'TRAINING_MANAGER', 'CAREER_MANAGER', 'SQUAD_LEAD'] },
    { name: 'Certifications', icon: 'verified', path: '/certifications', roles: ['ADMIN', 'DIRECTOR', 'TRAINING_MANAGER', 'CAREER_MANAGER', 'SQUAD_LEAD', 'COLLABORATOR', 'USER'] },
    { name: 'Formations', icon: 'school', path: '/trainings', roles: ['ADMIN', 'DIRECTOR', 'TRAINING_MANAGER', 'CAREER_MANAGER', 'SQUAD_LEAD', 'COLLABORATOR', 'USER'] },
    { name: 'Mes Assignations', icon: 'task_alt', path: '/my-assignments', roles: ['COLLABORATOR', 'USER'] },
    { name: 'Hiérarchie', icon: 'account_tree', path: '/hierarchy', roles: ['ADMIN'] },
    { name: 'Gestion des Assignations', icon: 'assignment', path: '/manage-assignments', roles: ['ADMIN', 'DIRECTOR', 'TRAINING_MANAGER', 'CAREER_MANAGER', 'SQUAD_LEAD'] },
    { name: 'Utilisateurs', icon: 'group', path: '/users', roles: ['ADMIN'] },
  ];

  const visibleNavItems = navItems.filter(item => !item.roles || item.roles.includes(user?.role || 'USER'));

  return (
    <div className="bg-[#fcf8f8] text-gray-900 font-sans h-full flex overflow-hidden min-h-screen">
      {/* SideNavBar */}
      <aside 
        className={`fixed left-0 top-0 h-full bg-white border-r border-gray-100 flex flex-col z-50 transition-all duration-300 ease-in-out shadow-sm
          ${sidebarOpen ? 'w-64' : 'w-20'} 
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Brand Header */}
        <div className={`px-4 py-4 h-16 border-b border-gray-100 flex items-center ${sidebarOpen ? 'justify-between' : 'justify-center'}`}>
          {sidebarOpen && (
            <div className="flex items-center justify-center flex-1">
              <span className="text-base font-black text-gray-900 tracking-tight">
                Certification<span className="text-[#b70f30]">Hub</span>
              </span>
            </div>
          )}
          <button 
            type="button"
            className="text-gray-500 hover:text-gray-900 p-2 rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title={sidebarOpen ? "Réduire le menu" : "Agrandir le menu"}
          >
            <span className="material-symbols-outlined text-[22px]">
              {sidebarOpen ? 'menu_open' : 'menu'}
            </span>
          </button>
        </div>
        
        {/* Nav Links */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1.5">
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              title={!sidebarOpen ? item.name : undefined}
              onClick={() => {
                if (window.innerWidth < 768) {
                  setMobileMenuOpen(false);
                }
              }}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs transition-all duration-200 group ${
                  !sidebarOpen ? 'justify-center' : ''
                } ${
                  isActive
                    ? 'bg-red-50 text-[#b70f30] font-bold border-r-4 border-[#b70f30] shadow-2xs'
                    : 'text-gray-600 font-medium hover:text-[#b70f30] hover:bg-gray-50'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span 
                    className={clsx("material-symbols-outlined text-[20px] transition-transform group-hover:scale-110", isActive ? "text-[#b70f30]" : "text-gray-400 group-hover:text-[#b70f30]")}
                    style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    {item.icon}
                  </span>
                  {sidebarOpen && <span className="truncate">{item.name}</span>}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Footer User Card */}
        {sidebarOpen && user && (
          <div 
            onClick={() => navigate('/profile')}
            className="py-2.5 px-3 border border-gray-100 bg-gray-50/80 hover:bg-red-50/40 hover:border-red-100 transition-all mx-2.5 my-2 rounded-xl flex items-center justify-between cursor-pointer group shadow-2xs"
            title="Consulter et modifier mon profil"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#b70f30] text-white flex items-center justify-center text-xs font-bold shadow-2xs flex-shrink-0 group-hover:scale-105 transition-transform">
                {(user?.firstName?.[0] || user?.email?.[0] || 'U').toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-gray-900 truncate leading-tight group-hover:text-[#b70f30] transition-colors">{user?.firstName} {user?.lastName || ''}</p>
                <span className="inline-block text-[9px] font-semibold px-1.5 py-0 rounded bg-red-100 text-[#b70f30] leading-tight">
                  {user?.role}
                </span>
              </div>
            </div>
            <span className="material-symbols-outlined text-[16px] text-gray-400 group-hover:text-[#b70f30] transition-colors">chevron_right</span>
          </div>
        )}
      </aside>

      {/* Main Content Wrapper */}
      <div 
        className={`flex-1 flex flex-col h-full relative w-full transition-all duration-300 ease-in-out ${sidebarOpen ? 'md:ml-64' : 'md:ml-20'}`}
      >
        {/* TopNavBar */}
        <header className={`fixed top-0 right-0 h-16 bg-white/90 backdrop-blur-md flex justify-between items-center px-6 z-40 transition-all duration-300 border-b border-gray-100 w-full ${sidebarOpen ? 'md:w-[calc(100%-16rem)]' : 'md:w-[calc(100%-5rem)]'}`}>
          {/* Mobile Toggle & Brand Logo */}
          <div className="flex items-center gap-3">
            <button 
              type="button"
              className="md:hidden text-gray-700 p-2 rounded-xl hover:bg-gray-100 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="material-symbols-outlined text-[22px]">menu</span>
            </button>
            <img alt="Devoteam Logo" className="h-10 object-contain" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD8P959-H660oXsHEsr0hj50FyfxDsXWtX_57a3dnlLZzAtO8cCW-Lpv2te7_LgnPGnd5xHrS5z7T6KX4mNzTf0zIis2f1dKiqgg9c95wI5CuI6yc8hvA9aCJSYr1Hy-haGkSdGayGDoiSawl0-HS_ou0ZG8Kq7v_4CO6WU4u6nl1hly16CuedfGdxvtEbpQcRRzY2VSxVqtyrX7AAO28EUKLisDgkEtqDcZo0xrPNMMNMkHCkTJwrci4cfwM8XkKXWsAQ"/>
          </div>
          
          {/* User Section & Actions */}
          <div className="flex items-center gap-4 ml-auto">
            <div className="flex items-center gap-3">
               {/* Notification Bell Dropdown */}
               <NotificationDropdown />

               <div className="h-5 border-l border-gray-200 mx-0.5 hidden sm:block"></div>

               {/* Clickable Profile Card */}
               <div 
                 onClick={() => navigate('/profile')}
                 className="flex items-center gap-2.5 cursor-pointer hover:bg-gray-100/70 p-1.5 rounded-xl transition-all group"
                 title="Consulter et modifier mon profil"
               >
                 <div className="flex flex-col items-end hidden sm:flex">
                    <span className="text-xs font-bold text-gray-900 group-hover:text-[#b70f30] transition-colors">{user?.firstName} {user?.lastName || user?.name || user?.email}</span>
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{user?.role}</span>
                 </div>
                 
                 <div className="w-8 h-8 rounded-full bg-red-50 text-[#b70f30] border border-red-100 flex items-center justify-center font-bold text-xs shadow-2xs group-hover:bg-[#b70f30] group-hover:text-white transition-all">
                   {(user?.firstName?.[0] || user?.email?.[0] || 'U').toUpperCase()}
                 </div>
               </div>

               <div className="h-5 border-l border-gray-200 mx-1 hidden sm:block"></div>

               <button 
                  type="button"
                  onClick={handleLogout}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[#b70f30] hover:bg-red-50 transition-all duration-200 flex items-center gap-1.5 border border-red-100 shadow-2xs"
                  title="Se déconnecter"
               >
                 <span className="material-symbols-outlined text-[16px]">logout</span>
                 <span className="hidden sm:inline">Déconnexion</span>
               </button>
            </div>
          </div>
        </header>

        {/* Canvas / Page Content */}
        <main className="flex-1 overflow-y-auto pt-20 pb-10 px-4 md:px-8 bg-[#fcf8f8] min-h-[calc(100vh-4rem)]">
          <Outlet />
        </main>
      </div>
      
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 md:hidden backdrop-blur-2xs"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
