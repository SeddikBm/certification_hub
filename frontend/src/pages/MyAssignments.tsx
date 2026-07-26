import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { assignmentService } from '../services/assignment.service';
import { Button } from '../components/ui/Button';

export function MyAssignments() {
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: assignmentsPage, isLoading, error } = useQuery({
    queryKey: ['my-assignments', { type: typeFilter, status: statusFilter }],
    queryFn: () => assignmentService.getMyAssignments({
      itemType: typeFilter || undefined,
      status: statusFilter || undefined
    })
  });

  return (
    <div className="max-w-[1200px] mx-auto space-y-stack-md pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-stack-md">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-1">My Assignments</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant">Track your assigned trainings and certifications.</p>
        </div>
      </div>

      <div className="bg-surface rounded-xl shadow-sm border border-outline-variant/30 p-stack-md w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter items-end">
          <div className="space-y-1">
            <label className="font-label-md text-label-md text-on-surface-variant block">Type</label>
            <div className="relative">
              <select 
                className="w-full bg-surface-container-lowest text-on-surface border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4 py-3 font-body-md text-body-md transition-colors appearance-none cursor-pointer"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="">All Types</option>
                <option value="CERTIFICATION">Certification</option>
                <option value="TRAINING">Training</option>
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
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-8 text-center text-on-surface-variant">Loading assignments...</div>
          ) : error ? (
            <div className="p-8 text-center text-error">Failed to load assignments.</div>
          ) : !assignmentsPage?.content.length ? (
            <div className="p-8 text-center text-on-surface-variant">No assignments found.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low/50 border-b border-outline-variant/30">
                  <th className="p-4 pl-6 text-sm text-on-surface-variant font-semibold">Item Name</th>
                  <th className="p-4 text-sm text-on-surface-variant font-semibold">Type</th>
                  <th className="p-4 text-sm text-on-surface-variant font-semibold">Assigned Date</th>
                  <th className="p-4 text-sm text-on-surface-variant font-semibold">Status</th>
                  <th className="p-4 text-sm text-on-surface-variant font-semibold">Progress</th>
                  <th className="p-4 pr-6 text-sm text-on-surface-variant font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-outline-variant/20">
                {assignmentsPage.content.map((assignment) => {
                  const status = assignment.itemType === 'TRAINING' ? assignment.statusTraining : assignment.statusCertification;
                  
                  return (
                    <tr key={assignment.id} className="hover:bg-surface-container-highest/20 transition-colors group">
                      <td className="p-4 pl-6">
                        <div className="font-semibold text-on-surface">{assignment.notes || `Item ID: ${assignment.itemId}`}</div>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-surface-variant text-on-surface-variant border border-outline-variant/50">
                          {assignment.itemType}
                        </span>
                      </td>
                      <td className="p-4 text-on-surface-variant">
                        {assignment.assignedAt ? new Date(assignment.assignedAt).toLocaleDateString() : '-'}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                          status === 'COMPLETED' ? 'bg-primary/10 text-primary border-primary/20' : 
                          status === 'IN_PROGRESS' ? 'bg-secondary-container text-on-secondary-container border-secondary/20' : 
                          'bg-surface-container text-on-surface-variant border-outline-variant/30'
                        }`}>
                          {status}
                        </span>
                      </td>
                      <td className="p-4">
                        {assignment.itemType === 'TRAINING' && (
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-surface-variant rounded-full overflow-hidden">
                              <div className="h-full bg-primary" style={{ width: `${assignment.trainingProgressPercentage || 0}%` }}></div>
                            </div>
                            <span className="text-xs text-on-surface-variant">{assignment.trainingProgressPercentage || 0}%</span>
                          </div>
                        )}
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <Button variant="outline" size="sm" className="text-xs py-1 h-8">Update</Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
