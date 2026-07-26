import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { certificationService } from '../services/certification.service';
import { Button } from '../components/ui/Button';

export function Certifications() {
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  const { data: certsPage, isLoading, error } = useQuery({
    queryKey: ['certifications', { search: searchTerm, difficulty: difficultyFilter, priority: priorityFilter }],
    queryFn: () => certificationService.getAllCertifications({ 
      search: searchTerm || undefined,
      difficulty: difficultyFilter || undefined,
      priority: priorityFilter || undefined
    })
  });

  return (
    <div className="max-w-[1200px] mx-auto space-y-stack-md pb-12">
      {/* Page Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-stack-md">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-1">Certifications Catalog</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant">Browse, manage, and assign certifications to your teams.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="flex items-center justify-center">
            <span className="material-symbols-outlined mr-2 text-[18px]">download</span> Export Excel
          </Button>
          <Button className="flex items-center justify-center" onClick={() => window.location.href='/certifications/add'}>
            <span className="material-symbols-outlined mr-2 text-[18px]">add</span> Add Certification
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
                placeholder="Search by code, name, provider..." 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="font-label-md text-label-md text-on-surface-variant block">Difficulty</label>
            <div className="relative">
              <select 
                className="w-full bg-surface-container-lowest text-on-surface border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4 py-3 font-body-md text-body-md transition-colors appearance-none cursor-pointer"
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
              >
                <option value="">All Levels</option>
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
                <option value="EXPERT">Expert</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
            </div>
          </div>
          <div className="space-y-1">
            <label className="font-label-md text-label-md text-on-surface-variant block">Priority</label>
            <div className="relative">
              <select 
                className="w-full bg-surface-container-lowest text-on-surface border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4 py-3 font-body-md text-body-md transition-colors appearance-none cursor-pointer"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="">All Priorities</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
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
            <div className="p-8 text-center text-on-surface-variant">Loading certifications...</div>
          ) : error ? (
            <div className="p-8 text-center text-error">Failed to load certifications.</div>
          ) : !certsPage?.content.length ? (
            <div className="p-8 text-center text-on-surface-variant">No certifications found.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low/50 border-b border-outline-variant/30">
                  <th className="p-4 pl-6 text-sm text-on-surface-variant font-semibold">Code & Name</th>
                  <th className="p-4 text-sm text-on-surface-variant font-semibold">Provider</th>
                  <th className="p-4 text-sm text-on-surface-variant font-semibold">Difficulty</th>
                  <th className="p-4 text-sm text-on-surface-variant font-semibold">Priority</th>
                  <th className="p-4 pr-6 text-sm text-on-surface-variant font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-outline-variant/20">
                {certsPage.content.map((cert) => (
                  <tr key={cert.id} className="hover:bg-surface-container-highest/20 transition-colors group cursor-pointer" onClick={() => window.location.href=`/certifications/${cert.id}`}>
                    <td className="p-4 pl-6">
                      <div className="font-semibold text-on-surface">{cert.name}</div>
                      <div className="text-on-surface-variant text-xs">{cert.code}</div>
                    </td>
                    <td className="p-4 text-on-surface-variant">{cert.provider || '-'}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-surface-variant text-on-surface-variant border border-outline-variant/50">
                        {cert.difficulty}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                        cert.priority === 'HIGH' ? 'bg-primary/10 text-primary border-primary/20' : 
                        cert.priority === 'MEDIUM' ? 'bg-secondary-container text-on-secondary-container border-secondary/20' : 
                        'bg-surface-container text-on-surface-variant border-outline-variant/30'
                      }`}>
                        {cert.priority}
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <button className="text-on-surface-variant hover:text-primary transition-colors p-1 opacity-0 group-hover:opacity-100 focus:opacity-100" onClick={(e) => e.stopPropagation()}>
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
