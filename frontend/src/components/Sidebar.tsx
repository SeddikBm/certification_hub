import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

const Sidebar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    navigate('/login');
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-4 py-3 mx-2 rounded-lg flex items-center gap-3 transition-all duration-200 ${
      isActive
        ? 'bg-secondary-container text-on-secondary-container font-bold shadow-sm'
        : 'text-on-surface-variant hover:bg-surface-container-high'
    }`;

  return (
    <nav aria-label="Sidebar Navigation" className="hidden md:flex bg-surface-container-low shadow-md fixed left-0 top-0 h-screen w-64 flex-col z-50 overflow-y-auto">
      <div className="px-container-padding py-stack-lg border-b border-outline-variant/30 flex flex-col gap-4">
        <img 
          alt="Devoteam Logo" 
          className="h-10 object-contain w-auto max-w-[150px]" 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuD8P959-H660oXsHEsr0hj50FyfxDsXWtX_57a3dnlLZzAtO8cCW-Lpv2te7_LgnPGnd5xHrS5z7T6KX4mNzTf0zIis2f1dKiqgg9c95wI5CuI6yc8hvA9aCJSYr1Hy-haGkSdGayGDoiSawl0-HS_ou0ZG8Kq7v_4CO6WU4u6nl1hly16CuedfGdxvtEbpQcRRzY2VSxVqtyrX7AAO28EUKLisDgkEtqDcZo0xrPNMMNMkHCkTJwrci4cfwM8XkKXWsAQ" 
        />
        <div>
          <h1 className="font-headline-sm text-headline-sm font-bold text-primary">Devoteam</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant">Enterprise Portal</p>
        </div>
      </div>
      
      <div className="flex-1 mt-6">
        <ul className="space-y-1">
          <li>
            <NavLink to="/" end className={navLinkClass}>
              <span className="material-symbols-outlined">dashboard</span>
              <span className="font-label-md text-label-md">Dashboard</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/certifications" className={navLinkClass}>
              <span className="material-symbols-outlined">verified</span>
              <span className="font-label-md text-label-md">Certifications</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/trainings" className={navLinkClass}>
              <span className="material-symbols-outlined">school</span>
              <span className="font-label-md text-label-md">Trainings</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/users" className={navLinkClass}>
              <span className="material-symbols-outlined">group</span>
              <span className="font-label-md text-label-md">Users</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/hierarchy" className={navLinkClass}>
              <span className="material-symbols-outlined">account_tree</span>
              <span className="font-label-md text-label-md">Hierarchy</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/my-assignments" className={navLinkClass}>
              <span className="material-symbols-outlined">assignment_ind</span>
              <span className="font-label-md text-label-md">My Assignments</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/manage-assignments" className={navLinkClass}>
              <span className="material-symbols-outlined">assignment_turned_in</span>
              <span className="font-label-md text-label-md">Manage Assignments</span>
            </NavLink>
          </li>
        </ul>
      </div>
      
      <div className="p-container-padding border-t border-outline-variant/30">
        <button onClick={handleLogout} className="w-full text-on-surface-variant px-4 py-3 mx-2 rounded-lg flex items-center gap-3 hover:bg-surface-container-high transition-all duration-200">
          <span className="material-symbols-outlined text-primary">logout</span>
          <span className="font-label-md text-label-md text-primary">Logout</span>
        </button>
      </div>
    </nav>
  );
};

export default Sidebar;
