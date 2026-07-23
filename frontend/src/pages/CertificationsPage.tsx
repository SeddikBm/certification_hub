import React, { useEffect, useState } from 'react';
import api from '../api/axios';

const CertificationsPage = () => {
  const [certifications, setCertifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCertifications = async () => {
      try {
        const response = await api.get('/certifications');
        setCertifications(response.data.content || response.data);
      } catch (err) {
        console.error('Failed to fetch certifications', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCertifications();
  }, []);

  return (
    <div className="max-w-[1280px] mx-auto space-y-stack-lg">
      {/* Breadcrumbs & Header */}
      <div>
        <nav aria-label="Breadcrumb" className="flex text-label-md font-label-md text-on-surface-variant mb-4">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <a className="hover:text-primary transition-colors" href="#">Home</a>
            </li>
            <li>
              <div className="flex items-center">
                <span className="material-symbols-outlined text-[16px] mx-1">chevron_right</span>
                <span className="text-on-surface">Certifications</span>
              </div>
            </li>
          </ol>
        </nav>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">Catalogue of Certifications</h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-6 py-2.5 bg-primary text-white rounded-lg font-label-md text-label-md hover:brightness-110 transition-colors flex items-center gap-2 uppercase shadow-md shadow-primary/20">
              <span className="material-symbols-outlined text-[18px]">add</span>
              Add Certification
            </button>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-surface-container-lowest p-container-padding rounded-xl border border-outline-variant shadow-[0_4px_20px_rgba(0,43,69,0.08)] flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-4 flex-1">
          <div className="min-w-[200px]">
            <label className="font-label-md text-label-md text-on-surface-variant block mb-1">Provider</label>
            <select className="w-full border border-outline-variant rounded-lg px-3 py-2 text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-surface-container-lowest text-on-surface">
              <option>All Providers</option>
              <option>AWS</option>
              <option>Google Cloud</option>
              <option>Microsoft</option>
            </select>
          </div>
          <div className="min-w-[150px]">
            <label className="font-label-md text-label-md text-on-surface-variant block mb-1">Difficulty</label>
            <select className="w-full border border-outline-variant rounded-lg px-3 py-2 text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-surface-container-lowest text-on-surface">
              <option>All Levels</option>
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>
          </div>
          <div className="min-w-[150px]">
            <label className="font-label-md text-label-md text-on-surface-variant block mb-1">Priority</label>
            <select className="w-full border border-outline-variant rounded-lg px-3 py-2 text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-surface-container-lowest text-on-surface">
              <option>Any Priority</option>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
          </div>
        </div>
        <div className="flex gap-2 self-end mt-2 md:mt-0">
          <button className="text-secondary border border-outline-variant px-6 py-2 rounded-lg font-label-md text-label-md hover:bg-surface-container-low transition-colors uppercase">Clear</button>
          <button className="bg-secondary text-white px-6 py-2 rounded-lg font-label-md text-label-md hover:brightness-110 transition-all uppercase shadow-md">Apply Filters</button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-[0_4px_20px_rgba(0,43,69,0.08)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant">
                <th className="p-4 font-label-md text-on-surface-variant uppercase text-xs">Code</th>
                <th className="p-4 font-label-md text-on-surface-variant uppercase text-xs">Name</th>
                <th className="p-4 font-label-md text-on-surface-variant uppercase text-xs">Provider</th>
                <th className="p-4 font-label-md text-on-surface-variant uppercase text-xs">Difficulty</th>
                <th className="p-4 font-label-md text-on-surface-variant uppercase text-xs">Priority</th>
                <th className="p-4 font-label-md text-on-surface-variant uppercase text-xs">Cost</th>
                <th className="p-4 font-label-md text-on-surface-variant uppercase text-xs text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-on-surface-variant">Loading...</td>
                </tr>
              ) : certifications.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-on-surface-variant">No certifications found.</td>
                </tr>
              ) : (
                certifications.map((cert) => (
                  <tr key={cert.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="p-4 text-body-sm font-semibold text-secondary">{cert.code}</td>
                    <td className="p-4 text-body-md font-medium text-on-surface">{cert.name}</td>
                    <td className="p-4 text-body-sm text-on-surface-variant flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary">cloud</span> {cert.provider}
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary-container text-on-secondary-container">
                        {cert.level}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-fixed text-primary">
                        High
                      </span>
                    </td>
                    <td className="p-4 text-body-sm text-on-surface">${cert.cost}</td>
                    <td className="p-4 text-right">
                      <button className="text-secondary hover:text-primary transition-colors p-1 rounded hover:bg-surface-variant">
                        <span className="material-symbols-outlined text-sm">more_vert</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-4 border-t border-outline-variant flex justify-between items-center bg-surface-container-lowest">
          <span className="text-body-sm text-on-surface-variant">Showing 1 to {certifications.length} results</span>
          <div className="flex gap-2">
            <button className="px-3 py-1 border border-outline-variant rounded text-on-surface-variant hover:bg-surface-container transition-colors text-body-sm disabled:opacity-50" disabled>Previous</button>
            <button className="px-3 py-1 border border-primary bg-primary text-white rounded transition-colors text-body-sm">1</button>
            <button className="px-3 py-1 border border-outline-variant rounded text-on-surface-variant hover:bg-surface-container transition-colors text-body-sm">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificationsPage;
