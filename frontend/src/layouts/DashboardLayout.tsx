import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';

export function DashboardLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard', icon: 'dashboard', path: '/dashboard' },
    { name: 'Certifications', icon: 'verified', path: '/certifications' },
    { name: 'Trainings', icon: 'school', path: '/trainings' },
    { name: 'Users', icon: 'group', path: '/users' },
    { name: 'Hierarchy', icon: 'account_tree', path: '/hierarchy' },
    { name: 'My Assignments', icon: 'assignment_ind', path: '/my-assignments' },
    { name: 'Manage Assignments', icon: 'assignment_turned_in', path: '/manage-assignments' },
  ];

  return (
    <div className="bg-background text-on-background font-body-md h-full flex overflow-hidden min-h-screen">
      {/* SideNavBar */}
      <aside className={`fixed left-0 top-0 h-full w-64 shadow-md bg-surface flex flex-col z-50 transition-transform duration-200 ease-in-out md:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:flex`}>
        <div className="px-container-padding py-stack-lg border-b border-outline-variant/30 flex flex-col gap-4">
          <img alt="Devoteam Logo" className="h-10 object-contain w-auto max-w-[150px]" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD8P959-H660oXsHEsr0hj50FyfxDsXWtX_57a3dnlLZzAtO8cCW-Lpv2te7_LgnPGnd5xHrS5z7T6KX4mNzTf0zIis2f1dKiqgg9c95wI5CuI6yc8hvA9aCJSYr1Hy-haGkSdGayGDoiSawl0-HS_ou0ZG8Kq7v_4CO6WU4u6nl1hly16CuedfGdxvtEbpQcRRzY2VSxVqtyrX7AAO28EUKLisDgkEtqDcZo0xrPNMMNMkHCkTJwrci4cfwM8XkKXWsAQ"/>
          <div>
            <h1 className="font-headline-sm text-headline-sm font-bold text-primary">Devoteam</h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Enterprise Portal</p>
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-stack-md px-container-padding flex flex-col gap-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ease-in-out group ${
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
                  <span>{item.name}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-container-padding border-t border-outline-variant/30 flex flex-col gap-2">
          <a className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded-lg transition-colors duration-200 ease-in-out cursor-pointer">
            <span className="material-symbols-outlined">settings</span>
            <span>Settings</span>
          </a>
          <NavLink to="/login" className="flex items-center gap-3 px-4 py-3 text-error hover:bg-error-container rounded-lg transition-colors duration-200 ease-in-out">
            <span className="material-symbols-outlined">logout</span>
            <span>Logout</span>
          </NavLink>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col md:pl-64 h-full relative w-full">
        {/* TopNavBar */}
        <header className="fixed top-0 right-0 w-full md:w-[calc(100%-16rem)] h-16 shadow-sm bg-surface flex justify-between items-center px-container-padding z-40 transition-all duration-200 border-b border-outline-variant/20 md:border-none">
          <button 
            className="md:hidden text-on-surface p-2 rounded-full hover:bg-surface-container-low"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          
          <div className="flex items-center gap-4 hidden md:flex flex-1 max-w-md">
            <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-3 top-1/2 transform -translate-y-1/2 text-on-surface-variant">search</span>
              <input className="w-full pl-10 pr-4 py-2 bg-surface-container-lowest border border-outline-variant/50 rounded-full focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-body-sm font-body-sm transition-all" placeholder="Search..." type="text"/>
            </div>
          </div>
          
          <div className="font-headline-sm text-headline-sm font-bold text-primary md:hidden">
            Enterprise Portal
          </div>
          
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container-low hover:text-primary transition-all duration-200">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container-low hover:text-primary transition-all duration-200">
              <span className="material-symbols-outlined">help</span>
            </button>
            <div className="ml-4 h-8 w-8 rounded-full bg-secondary-container overflow-hidden border border-outline-variant cursor-pointer">
              <img alt="User profile" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuARvBI7DxBDmzb3f-dHD_BkFg2MErlVOpZmdpT6ChzyDW8EFS8m4q8nq2nTN10uXa0PCwlIg11TEeMVcE2Abr2oxOi2SrRBDTwELr4_7WmILkdsyRAwk9C6I1f_5lRkzdL-_-a__rZyLune-9XF3QQjqeJZuC9bFNnq89nuKW9iGf7QV1LWUnFd_6gsmI3JgnUXO3Xi-KRGaeXmnTFJuTp8gqbrGqh-sEgok2cj2mVc0iE1IPXFulMW7g"/>
            </div>
          </div>
        </header>

        {/* Canvas / Dashboard Content */}
        <main className="flex-1 overflow-y-auto pt-20 pb-10 px-4 md:px-margin-desktop bg-background min-h-[calc(100vh-4rem)]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
