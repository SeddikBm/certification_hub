import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { userService } from '../services/user.service';
import { Button } from '../components/ui/Button';

export function Users() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: usersPage, isLoading, error } = useQuery({
    queryKey: ['users', { search: searchTerm, role: roleFilter, status: statusFilter }],
    queryFn: () => userService.getUsers({
      search: searchTerm || undefined,
      role: roleFilter || undefined,
      status: statusFilter || undefined
    })
  });

  return (
    <div className="max-w-[1200px] mx-auto space-y-stack-md pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-stack-md">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-1">User Management</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant">Manage platform users, roles, and squad assignments.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="flex items-center justify-center">
            <span className="material-symbols-outlined mr-2 text-[18px]">download</span> Export Excel
          </Button>
          <Button className="flex items-center justify-center">
            <span className="material-symbols-outlined mr-2 text-[18px]">person_add</span> Add User
          </Button>
        </div>
      </div>

      <div className="bg-surface rounded-xl shadow-sm border border-outline-variant/30 p-stack-md w-full">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter items-end">
          <div className="space-y-1 relative md:col-span-2">
            <label className="font-label-md text-label-md text-on-surface-variant block">Search</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
              <input 
                className="w-full bg-surface-container-lowest text-on-surface border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded-xl pl-10 pr-4 py-3 font-body-md text-body-md transition-colors placeholder:text-on-surface-variant" 
                placeholder="Search by name, email..." 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="font-label-md text-label-md text-on-surface-variant block">Role</label>
            <div className="relative">
              <select 
                className="w-full bg-surface-container-lowest text-on-surface border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4 py-3 font-body-md text-body-md transition-colors appearance-none cursor-pointer"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="">All Roles</option>
                <option value="ADMIN">Admin</option>
                <option value="CAREER_MANAGER">Career Manager</option>
                <option value="TRAINING_MANAGER">Training Manager</option>
                <option value="COLLABORATOR">Collaborator</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
            </div>
          </div>
          <div className="space-y-1">
            <label className="font-label-md text-label-md text-on-surface-variant block">Status</label>
            <div className="relative">
              <select 
                className="w-full bg-surface-container-lowest text-on-surface border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4 py-3 font-body-md text-body-md transition-colors appearance-none cursor-pointer"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-8 text-center text-on-surface-variant">Loading users...</div>
          ) : error ? (
            <div className="p-8 text-center text-error">Failed to load users.</div>
          ) : !usersPage?.content.length ? (
            <div className="p-8 text-center text-on-surface-variant">No users found.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low/50 border-b border-outline-variant/30">
                  <th className="p-4 pl-6 text-sm text-on-surface-variant font-semibold">User</th>
                  <th className="p-4 text-sm text-on-surface-variant font-semibold">Role</th>
                  <th className="p-4 text-sm text-on-surface-variant font-semibold">Status</th>
                  <th className="p-4 text-sm text-on-surface-variant font-semibold">Squad</th>
                  <th className="p-4 pr-6 text-sm text-on-surface-variant font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-outline-variant/20">
                {usersPage.content.map((user) => (
                  <tr key={user.id} className="hover:bg-surface-container-highest/20 transition-colors group">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                          {user.firstName[0]}{user.lastName[0]}
                        </div>
                        <div>
                          <div className="font-semibold text-on-surface">{user.firstName} {user.lastName}</div>
                          <div className="text-xs text-on-surface-variant">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-surface-variant text-on-surface-variant border border-outline-variant/50">
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                        user.status === 'ACTIVE' ? 'bg-primary/10 text-primary border-primary/20' : 
                        'bg-error/10 text-error border-error/20'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="p-4 text-on-surface-variant">{user.squadName || '-'}</td>
                    <td className="p-4 pr-6 text-right">
                      <button className="text-on-surface-variant hover:text-primary transition-colors p-1 opacity-0 group-hover:opacity-100 focus:opacity-100">
                        <span className="material-symbols-outlined text-[20px]">more_vert</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
