import React, { useEffect, useState } from 'react';
import api from '../api/axios';

const MyAssignmentsPage = () => {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'certifications' | 'trainings'>('certifications');

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const response = await api.get('/assignments/my');
        setAssignments(response.data.content || response.data);
      } catch (err) {
        console.error('Failed to fetch assignments', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAssignments();
  }, []);

  return (
    <div className="max-w-[1200px] mx-auto space-y-stack-lg">
      <div className="mb-stack-lg flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-unit">My Assignments</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">Track your required trainings and certifications.</p>
        </div>
        
        {/* Tabs */}
        <div className="flex p-1 bg-surface-container-low rounded-lg inline-flex border border-outline-variant">
          <button 
            className={`px-4 py-2 rounded-md font-label-md text-label-md transition-colors ${activeTab === 'certifications' ? 'bg-surface text-on-surface shadow-sm' : 'text-on-surface-variant hover:bg-surface-variant'}`}
            onClick={() => setActiveTab('certifications')}
          >
            Certifications
          </button>
          <button 
            className={`px-4 py-2 rounded-md font-label-md text-label-md transition-colors ${activeTab === 'trainings' ? 'bg-surface text-on-surface shadow-sm' : 'text-on-surface-variant hover:bg-surface-variant'}`}
            onClick={() => setActiveTab('trainings')}
          >
            Trainings
          </button>
        </div>
      </div>

      {/* Assignments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-gutter">
        {loading ? (
          <div className="col-span-full text-center text-on-surface-variant py-8">Loading assignments...</div>
        ) : assignments.length === 0 ? (
          <div className="col-span-full text-center text-on-surface-variant py-8">No assignments found.</div>
        ) : (
          assignments.filter(a => activeTab === 'certifications' ? a.certification : a.training).map((assignment) => (
            <div key={assignment.id} className="bg-surface-container-lowest rounded-xl p-container-padding shadow-[0_4px_20px_rgba(0,43,69,0.08)] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,43,69,0.12)] transition-all duration-300 flex flex-col relative overflow-hidden border border-outline-variant">
              {assignment.status === 'COMPLETED' && <div className="absolute top-0 left-0 w-full h-1 bg-tertiary"></div>}
              
              <div className="flex justify-between items-start mb-4">
                <span className={`px-2 py-1 font-label-md text-label-md rounded ${assignment.priority === 'HIGH' ? 'bg-primary-container/10 text-primary-container border border-primary-container/20' : 'bg-surface-container-high text-on-surface-variant'}`}>
                  {assignment.priority} Priority
                </span>
                
                {assignment.status === 'COMPLETED' ? (
                  <span className="flex items-center gap-1 text-tertiary font-label-md text-label-md">
                    <span className="material-symbols-outlined text-[16px]">check_circle</span> Completed
                  </span>
                ) : assignment.status === 'IN_PROGRESS' ? (
                  <span className="flex items-center gap-1 text-error font-label-md text-label-md">
                    <span className="material-symbols-outlined text-[16px]">warning</span> Due in {new Date(assignment.targetDate).toLocaleDateString()}
                  </span>
                ) : (
                  <span className="font-label-md text-label-md text-on-surface-variant">
                    Due {new Date(assignment.targetDate).toLocaleDateString()}
                  </span>
                )}
              </div>
              
              <h3 className="font-headline-sm text-headline-sm mb-2 text-on-surface">
                {activeTab === 'certifications' ? assignment.certification?.name : assignment.training?.title}
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant mb-6 line-clamp-2 flex-grow">
                {activeTab === 'certifications' ? assignment.certification?.description : assignment.training?.description}
              </p>
              
              <div className="mb-6">
                <div className="flex justify-between font-label-md text-label-md mb-2">
                  <span className={assignment.status === 'COMPLETED' ? 'text-tertiary' : assignment.status === 'IN_PROGRESS' ? 'text-secondary' : 'text-on-surface-variant'}>
                    {assignment.status === 'COMPLETED' ? 'Done' : assignment.status === 'IN_PROGRESS' ? 'In Progress' : 'To Start'}
                  </span>
                  <span className={assignment.status === 'COMPLETED' ? 'text-tertiary' : assignment.status === 'IN_PROGRESS' ? 'text-on-surface-variant' : 'text-on-surface-variant'}>
                    {assignment.status === 'COMPLETED' ? '100%' : assignment.status === 'IN_PROGRESS' ? '50%' : '0%'}
                  </span>
                </div>
                <div className="w-full bg-surface-container rounded-full h-2">
                  <div 
                    className={`${assignment.status === 'COMPLETED' ? 'bg-tertiary' : assignment.status === 'IN_PROGRESS' ? 'bg-secondary' : 'bg-surface-container-high'} h-2 rounded-full`} 
                    style={{ width: assignment.status === 'COMPLETED' ? '100%' : assignment.status === 'IN_PROGRESS' ? '50%' : '0%' }}
                  ></div>
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-outline-variant">
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  {assignment.status === 'COMPLETED' ? 'Achieved: ' : 'Target: '}
                  {new Date(assignment.targetDate).toLocaleDateString()}
                </span>
                
                {assignment.status === 'COMPLETED' ? (
                  <button className="border border-secondary text-secondary px-4 py-2 rounded-lg font-label-md text-label-md hover:bg-surface-container-low transition-colors">View Cert</button>
                ) : assignment.status === 'IN_PROGRESS' ? (
                  <button className="bg-secondary text-on-secondary px-4 py-2 rounded-lg font-label-md text-label-md hover:opacity-90 transition-opacity">Continue</button>
                ) : (
                  <button className="bg-primary text-on-primary px-4 py-2 rounded-lg font-label-md text-label-md hover:opacity-90 transition-opacity">Start Now</button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MyAssignmentsPage;
