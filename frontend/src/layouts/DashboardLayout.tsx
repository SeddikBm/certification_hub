import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

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
    { name: 'Tableau de Bord', icon: 'dashboard', path: '/dashboard', roles: ['ADMIN', 'MANAGER', 'USER'] },
    { name: 'Certifications', icon: 'verified', path: '/certifications', roles: ['ADMIN', 'MANAGER', 'USER'] },
    { name: 'Formations', icon: 'school', path: '/trainings', roles: ['ADMIN', 'MANAGER', 'USER'] },
    { name: 'Utilisateurs', icon: 'group', path: '/users', roles: ['ADMIN'] },
    { name: 'Hiérarchie', icon: 'account_tree', path: '/hierarchy', roles: ['ADMIN', 'MANAGER'] },
    { name: 'Assignations', icon: 'assignment', path: '/manage-assignments', roles: ['ADMIN', 'MANAGER'] },
  ];

  const visibleNavItems = navItems.filter(item => !item.roles || item.roles.includes(user?.role || 'USER'));

  return (
    <div className="bg-background text-on-background font-body-md h-full flex overflow-hidden min-h-screen">
      {/* SideNavBar */}
      <aside 
        className={`fixed left-0 top-0 h-full shadow-md bg-surface flex flex-col z-50 transition-all duration-300 ease-in-out
          ${sidebarOpen ? 'w-64' : 'w-20'} 
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className={`px-4 py-4 h-16 border-b border-outline-variant/30 flex items-center ${sidebarOpen ? 'justify-between' : 'justify-center'}`}>
          {sidebarOpen && (
            <div className="font-headline-sm text-headline-sm font-bold text-primary truncate max-w-[150px]">
               Devoteam
            </div>
          )}
          <button 
            className="text-on-surface p-2 rounded-full hover:bg-surface-container-low transition-colors"
            onClick={() => {
               setSidebarOpen(!sidebarOpen);
            }}
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-stack-md px-2 flex flex-col gap-2">
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
                `flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 ease-in-out group ${
                  !sidebarOpen ? 'justify-center' : ''
                } ${
                  isActive
                    ? 'text-primary bg-surface-container-high font-bold'
                    : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-low'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className="material-symbols-outlined transition-all" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>
                    {item.icon}
                  </span>
                  {sidebarOpen && <span className="whitespace-nowrap">{item.name}</span>}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content Wrapper */}
      <div 
        className={`flex-1 flex flex-col h-full relative w-full transition-all duration-300 ease-in-out ${sidebarOpen ? 'md:ml-64' : 'md:ml-20'}`}
      >
        {/* TopNavBar */}
        <header className={`fixed top-0 right-0 h-16 shadow-sm bg-surface flex justify-between items-center px-container-padding z-40 transition-all duration-300 border-b border-outline-variant/20 md:border-none w-full ${sidebarOpen ? 'md:w-[calc(100%-16rem)]' : 'md:w-[calc(100%-5rem)]'}`}>
          {/* Mobile Menu Button & Logo */}
          <div className="flex items-center gap-4 w-full md:w-auto">
            <button 
              className="md:hidden text-on-surface p-2 rounded-full hover:bg-surface-container-low"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <img alt="Devoteam Logo" className="h-12 object-contain" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD8P959-H660oXsHEsr0hj50FyfxDsXWtX_57a3dnlLZzAtO8cCW-Lpv2te7_LgnPGnd5xHrS5z7T6KX4mNzTf0zIis2f1dKiqgg9c95wI5CuI6yc8hvA9aCJSYr1Hy-haGkSdGayGDoiSawl0-HS_ou0ZG8Kq7v_4CO6WU4u6nl1hly16CuedfGdxvtEbpQcRRzY2VSxVqtyrX7AAO28EUKLisDgkEtqDcZo0xrPNMMNMkHCkTJwrci4cfwM8XkKXWsAQ"/>
            <div className="font-headline-sm text-headline-sm font-bold text-primary md:hidden">
              Devoteam
            </div>
          </div>
          
          <div className="flex items-center gap-4 ml-auto">
            <div className="flex items-center gap-3">
               <div className="flex flex-col items-end hidden sm:flex">
                  <span className="font-label-md text-label-md text-on-surface font-semibold">{user?.firstName} {user?.lastName || user?.name || user?.email}</span>
                  <span className="font-body-sm text-[11px] text-on-surface-variant font-medium">{user?.role}</span>
               </div>
               <div className="h-8 w-8 rounded-full bg-secondary-container overflow-hidden border border-outline-variant flex items-center justify-center text-primary font-bold">
                 {/* Fallback avatar if no image */}
                 {(user?.firstName?.[0] || user?.email?.[0] || 'U').toUpperCase()}
               </div>
               <div className="h-6 border-l border-outline-variant/50 mx-1 hidden sm:block"></div>
               <button 
                  onClick={handleLogout}
                  className="p-2 rounded-full text-error hover:bg-error-container transition-all duration-200 flex items-center gap-1"
                  title="Logout"
               >
                 <span className="material-symbols-outlined">logout</span>
                 <span className="hidden sm:block text-sm font-medium pr-1">Logout</span>
               </button>
            </div>
          </div>
        </header>

        {/* Canvas / Dashboard Content */}
        <main className="flex-1 overflow-y-auto pt-20 pb-10 px-4 md:px-margin-desktop bg-background min-h-[calc(100vh-4rem)]">
          <Outlet />
        </main>
      </div>
      
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
