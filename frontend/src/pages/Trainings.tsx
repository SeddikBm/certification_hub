import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { trainingService } from '../services/training.service';
import { Button } from '../components/ui/Button';

export function Trainings() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const { data: trainingsPage, isLoading, error } = useQuery({
    queryKey: ['trainings', { search: searchTerm, type: typeFilter }],
    queryFn: () => trainingService.getAllTrainings({ 
      search: searchTerm || undefined,
      type: typeFilter || undefined
    })
  });

  return (
    <div className="max-w-[1200px] mx-auto space-y-stack-md pb-12">
      {/* Page Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-stack-md">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-1">Trainings Catalog</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant">Browse and manage available trainings.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="flex items-center justify-center">
            <span className="material-symbols-outlined mr-2 text-[18px]">download</span> Export Excel
          </Button>
          <Button className="flex items-center justify-center" onClick={() => window.location.href='/trainings/add'}>
            <span className="material-symbols-outlined mr-2 text-[18px]">add</span> Add Training
          </Button>
        </div>
      </div>

      {/* Filter Card */}
      <div className="bg-surface rounded-xl shadow-sm border border-outline-variant/30 p-stack-md w-full">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter items-end">
          <div className="space-y-1 relative md:col-span-2">
            <label className="font-label-md text-label-md text-on-surface-variant block">Search</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
              <input 
                className="w-full bg-surface-container-lowest text-on-surface border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded-xl pl-10 pr-4 py-3 font-body-md text-body-md transition-colors placeholder:text-on-surface-variant" 
                placeholder="Search by title, provider..." 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="font-label-md text-label-md text-on-surface-variant block">Type</label>
            <div className="relative">
              <select 
                className="w-full bg-surface-container-lowest text-on-surface border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4 py-3 font-body-md text-body-md transition-colors appearance-none cursor-pointer"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="">All Types</option>
                <option value="INTERNAL">Internal</option>
                <option value="EXTERNAL">External</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-surface rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-8 text-center text-on-surface-variant">Loading trainings...</div>
          ) : error ? (
            <div className="p-8 text-center text-error">Failed to load trainings.</div>
          ) : !trainingsPage?.content.length ? (
            <div className="p-8 text-center text-on-surface-variant">No trainings found.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low/50 border-b border-outline-variant/30">
                  <th className="p-4 pl-6 text-sm text-on-surface-variant font-semibold">Title</th>
                  <th className="p-4 text-sm text-on-surface-variant font-semibold">Provider</th>
                  <th className="p-4 text-sm text-on-surface-variant font-semibold">Type</th>
                  <th className="p-4 text-sm text-on-surface-variant font-semibold">Priority</th>
                  <th className="p-4 pr-6 text-sm text-on-surface-variant font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-outline-variant/20">
                {trainingsPage.content.map((training) => (
                  <tr key={training.id} className="hover:bg-surface-container-highest/20 transition-colors group">
                    <td className="p-4 pl-6">
                      <div className="font-semibold text-on-surface">{training.title}</div>
                    </td>
                    <td className="p-4 text-on-surface-variant">{training.provider || '-'}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-surface-variant text-on-surface-variant border border-outline-variant/50">
                        {training.type}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                        training.priority === 'HIGH' ? 'bg-primary/10 text-primary border-primary/20' : 
                        training.priority === 'MEDIUM' ? 'bg-secondary-container text-on-secondary-container border-secondary/20' : 
                        'bg-surface-container text-on-surface-variant border-outline-variant/30'
                      }`}>
                        {training.priority}
                      </span>
                    </td>
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
