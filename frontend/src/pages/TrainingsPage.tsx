import React, { useEffect, useState } from 'react';
import api from '../api/axios';

const TrainingsPage = () => {
  const [trainings, setTrainings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrainings = async () => {
      try {
        const response = await api.get('/trainings');
        setTrainings(response.data.content || response.data);
      } catch (err) {
        console.error('Failed to fetch trainings', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrainings();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-background">Catalogue des Formations</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">Browse and manage available training courses across platforms.</p>
        </div>
        <button className="bg-primary text-on-primary font-label-md text-label-md px-6 py-3 rounded-lg flex items-center justify-center space-x-2 hover:bg-surface-tint transition-colors shadow-[0_4px_20px_rgba(0,43,69,0.08)] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,43,69,0.12)]">
          <span className="material-symbols-outlined text-sm">add</span>
          <span>Add Training</span>
        </button>
      </div>

      {/* Filters & Controls Bar */}
      <div className="bg-surface rounded-xl p-4 shadow-[0_4px_20px_rgba(0,43,69,0.08)] flex flex-col md:flex-row gap-4 items-end border border-surface-variant">
        <div className="w-full md:w-1/4">
          <label className="block font-label-md text-label-md text-on-surface-variant mb-1 uppercase">Platform</label>
          <div className="relative">
            <select className="w-full appearance-none bg-surface border border-outline-variant rounded-lg px-4 py-2 font-body-sm text-body-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary pr-10">
              <option>All Platforms</option>
              <option>Coursera</option>
              <option>Udemy</option>
              <option>Pluralsight</option>
              <option>Internal</option>
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 transform -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
          </div>
        </div>
        <div className="w-full md:w-1/4">
          <label className="block font-label-md text-label-md text-on-surface-variant mb-1 uppercase">Difficulty</label>
          <div className="relative">
            <select className="w-full appearance-none bg-surface border border-outline-variant rounded-lg px-4 py-2 font-body-sm text-body-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary pr-10">
              <option>All Levels</option>
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 transform -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
          </div>
        </div>
        <div className="w-full md:w-1/4">
          <label className="block font-label-md text-label-md text-on-surface-variant mb-1 uppercase">Search</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 transform -translate-y-1/2 text-on-surface-variant text-sm">search</span>
            <input className="w-full pl-9 pr-4 py-2 bg-surface border border-outline-variant rounded-lg font-body-sm text-body-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" placeholder="Course name or code..." type="text" />
          </div>
        </div>
        <div className="flex-1 flex justify-end">
          <button className="text-secondary border border-outline-variant px-4 py-2 rounded-lg font-label-md text-label-md flex items-center space-x-2 hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined text-sm">filter_list</span>
            <span>More Filters</span>
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-surface rounded-xl shadow-[0_4px_20px_rgba(0,43,69,0.08)] overflow-hidden border border-surface-variant">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-lowest border-b border-outline-variant">
                <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Code</th>
                <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Platform</th>
                <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Duration</th>
                <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Instructor</th>
                <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Rating</th>
                <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-on-surface-variant">Loading...</td>
                </tr>
              ) : trainings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-on-surface-variant">No trainings found.</td>
                </tr>
              ) : (
                trainings.map((trn) => (
                  <tr key={trn.id} className="hover:bg-surface-container-lowest transition-colors group">
                    <td className="px-6 py-4 font-body-sm text-body-sm font-medium text-secondary">{trn.code}</td>
                    <td className="px-6 py-4">
                      <div className="font-body-md text-body-md font-semibold text-on-background">{trn.title}</div>
                      <div className="font-body-sm text-body-sm text-on-surface-variant">{trn.description}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full font-label-md text-[10px] bg-secondary-container text-on-secondary-container">{trn.platform}</span>
                    </td>
                    <td className="px-6 py-4 font-body-sm text-body-sm text-on-surface-variant">{trn.duration}h</td>
                    <td className="px-6 py-4 font-body-sm text-body-sm text-on-background">{trn.instructor}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-1 text-tertiary">
                        <span className="material-symbols-outlined text-[16px]">star</span>
                        <span className="font-body-sm text-body-sm font-semibold">4.8</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-on-surface-variant hover:text-primary transition-colors opacity-0 group-hover:opacity-100 p-1">
                        <span className="material-symbols-outlined">more_vert</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="bg-surface px-6 py-4 border-t border-outline-variant flex items-center justify-between">
          <div className="font-body-sm text-body-sm text-on-surface-variant">
            Showing <span className="font-semibold text-on-background">1</span> to <span className="font-semibold text-on-background">{trainings.length}</span> results
          </div>
          <div className="flex space-x-2">
            <button className="p-2 rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container-high transition-colors disabled:opacity-50" disabled>
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            <button className="p-2 rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container-high transition-colors">
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainingsPage;
