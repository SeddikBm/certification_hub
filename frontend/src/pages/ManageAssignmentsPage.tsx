import React, { useEffect, useState } from 'react';
import api from '../api/axios';

const ManageAssignmentsPage = () => {
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real implementation, this would fetch users and their assignments
    const fetchCollaborators = async () => {
      try {
        const usersRes = await api.get('/users');
        const users = usersRes.data;
        // Mocking the structure for now since backend might not have this aggregation endpoint yet
        const enrichedUsers = users.map((u: any) => ({
          ...u,
          assignments: [],
        }));
        setCollaborators(enrichedUsers);
      } catch (err) {
        console.error('Failed to fetch collaborators', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCollaborators();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-stack-md pb-12">
      {/* Page Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-stack-md">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-background mb-1">Manage Assignments</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant">Oversee and assign training and certification paths for your team.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button className="inline-flex items-center justify-center px-4 py-2 rounded-lg font-label-md text-label-md text-on-surface bg-surface-container border border-outline-variant hover:bg-surface-container-high transition-colors focus:ring-2 focus:ring-primary focus:outline-none">
            <span className="material-symbols-outlined mr-2 text-[18px]">download</span>
            Export Excel
          </button>
          <button className="inline-flex items-center justify-center px-4 py-2 rounded-lg font-label-md text-label-md text-primary border border-primary hover:bg-surface-variant transition-colors focus:ring-2 focus:ring-primary focus:outline-none">
            <span className="material-symbols-outlined mr-2 text-[18px]">school</span>
            Assign Training
          </button>
          <button className="inline-flex items-center justify-center px-4 py-2 rounded-lg font-label-md text-label-md text-on-primary bg-primary hover:bg-surface-tint shadow-sm hover:shadow transition-all focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:outline-none">
            <span className="material-symbols-outlined mr-2 text-[18px]">verified</span>
            Assign Certification
          </button>
        </div>
      </div>

      {/* Filter Card */}
      <div className="bg-surface rounded-xl shadow-[0_4px_20px_rgba(0,43,69,0.08)] border border-surface-variant p-stack-md w-full">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter items-end">
          <div className="space-y-1 relative">
            <label className="font-label-md text-label-md text-on-surface-variant block">Collaborator</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">person_search</span>
              <input className="w-full bg-surface-container-lowest text-on-surface border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded-lg pl-9 pr-3 py-2 font-body-sm transition-colors placeholder:text-outline" placeholder="Search collaborator..." type="text" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="font-label-md text-label-md text-on-surface-variant block">Type</label>
            <select className="w-full bg-surface-container-lowest text-on-surface border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded-lg px-3 py-2 font-body-sm transition-colors appearance-none cursor-pointer">
              <option value="">All Types</option>
              <option value="certification">Certification</option>
              <option value="training">Training</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="font-label-md text-label-md text-on-surface-variant block">Status</label>
            <select className="w-full bg-surface-container-lowest text-on-surface border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded-lg px-3 py-2 font-body-sm transition-colors appearance-none cursor-pointer">
              <option value="">All Statuses</option>
              <option value="in_progress">In Progress</option>
              <option value="not_started">Not Started</option>
              <option value="completed">Completed</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="font-label-md text-label-md text-on-surface-variant block">Priority</label>
            <select className="w-full bg-surface-container-lowest text-on-surface border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded-lg px-3 py-2 font-body-sm transition-colors appearance-none cursor-pointer">
              <option value="">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grouped Collaborator View */}
      <div className="space-y-stack-lg mt-stack-md">
        {loading ? (
          <div className="text-center text-on-surface-variant py-8">Loading collaborators...</div>
        ) : collaborators.length === 0 ? (
          <div className="text-center text-on-surface-variant py-8">No collaborators found.</div>
        ) : (
          collaborators.map((user) => (
            <div key={user.id} className="bg-surface rounded-xl shadow-sm border border-surface-variant overflow-hidden group/collab">
              {/* Collaborator Header */}
              <div className="bg-surface-container-lowest border-b border-surface-variant p-4 flex items-center justify-between cursor-pointer hover:bg-surface-container-low transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full border-2 border-surface-variant bg-surface-container flex items-center justify-center font-bold text-on-surface">
                    {user.firstName[0]}{user.lastName[0]}
                  </div>
                  <div>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface m-0 leading-tight">{user.firstName} {user.lastName}</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">{user.role} • {user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex gap-2 text-label-md">
                    <span className="bg-secondary-container text-on-secondary-container px-2 py-1 rounded-md">{user.assignments.length} Active</span>
                  </div>
                  <button className="text-on-surface-variant hover:text-primary transition-colors p-1 rounded-full hover:bg-surface-container">
                    <span className="material-symbols-outlined transition-transform duration-200">expand_more</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ManageAssignmentsPage;
