import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboard.service';

export function Dashboard() {
  const [hoveredSlice, setHoveredSlice] = useState<{ label: string; value: number; percentage: number; color: string } | null>(null);

  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardService.getStats()
  });

  if (isLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="material-symbols-outlined animate-spin text-4xl text-[#b70f30]">progress_activity</span>
          <span className="text-[#6B7280] font-medium text-sm">Chargement du tableau de bord...</span>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="bg-red-50 border border-red-200 text-[#b70f30] px-6 py-4 rounded-xl flex items-center gap-3">
          <span className="material-symbols-outlined">error</span>
          <span className="font-medium text-sm">Échec du chargement des données analytiques.</span>
        </div>
      </div>
    );
  }

  // Provider colors palette
  const providerColors = ['#b70f30', '#40627e', '#006949', '#f39c12', '#8e44ad', '#3498db'];
  const totalProviders = stats.certificationsByProvider.reduce((sum, item) => sum + item.value, 0) || 1;
  const CIRCUMFERENCE = 2 * Math.PI * 40; // ~251.327

  // Calculate max for bar chart
  const rawMax = Math.max(...stats.certificationsBySquad.map(s => s.value), 0);
  const maxSquadVal = rawMax > 0 ? Math.max(Math.ceil(rawMax * 1.2), 5) : 5;

  const difficultyMap: Record<string, string> = {
    'FOUNDATIONAL': 'Débutant',
    'INTERMEDIATE': 'Intermédiaire',
    'ADVANCED': 'Avancé',
    'EXPERT': 'Expert'
  };

  const totalDiff = stats.certificationsByDifficulty.reduce((sum, item) => sum + item.value, 0) || 1;

  const squadData = stats.certificationsBySquad.length > 0 
    ? stats.certificationsBySquad 
    : [
        { label: 'Alpha', value: 0 },
        { label: 'Beta', value: 0 },
        { label: 'Gamma', value: 0 },
        { label: 'Delta', value: 0 },
        { label: 'Epsilon', value: 0 }
      ];

  const metrics = [
    {
      title: 'Total Certifications',
      value: stats.totalCertifications,
      icon: 'verified',
      iconBg: 'bg-[#b70f30] text-white shadow-sm shadow-rose-900/20',
      cardBg: 'bg-white border-gray-100 hover:bg-gradient-to-br hover:from-[#fff5f5] hover:to-white hover:border-red-200 hover:shadow-red-500/10'
    },
    {
      title: 'Total Formations',
      value: stats.totalTrainings,
      icon: 'school',
      iconBg: 'bg-[#40627e] text-white shadow-sm shadow-blue-900/20',
      cardBg: 'bg-white border-gray-100 hover:bg-gradient-to-br hover:from-[#f4f8fa] hover:to-white hover:border-blue-200 hover:shadow-blue-500/10'
    },
    {
      title: 'Total Utilisateurs',
      value: stats.totalUsers,
      icon: 'group',
      iconBg: 'bg-[#006949] text-white shadow-sm shadow-emerald-900/20',
      cardBg: 'bg-white border-gray-100 hover:bg-gradient-to-br hover:from-[#f2f9f6] hover:to-white hover:border-emerald-200 hover:shadow-emerald-500/10'
    },
    {
      title: 'Total Squads',
      value: stats.totalSquads,
      icon: 'hub',
      iconBg: 'bg-amber-600 text-white shadow-sm shadow-amber-900/20',
      cardBg: 'bg-white border-gray-100 hover:bg-gradient-to-br hover:from-[#fffdf5] hover:to-white hover:border-amber-200 hover:shadow-amber-500/10'
    }
  ];

  let cumulativePercent = 0;

  return (
    <div className="max-w-[1280px] mx-auto flex flex-col gap-6 pb-10">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">Tableau de Bord</h1>
        <p className="text-xs text-gray-500 mt-1">Vue d'ensemble des certifications, formations et squads de l'entreprise.</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {metrics.map((m, idx) => (
          <div 
            key={idx}
            className={`rounded-xl p-5 border shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between ${m.cardBg}`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">{m.title}</span>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${m.iconBg}`}>
                <span className="material-symbols-outlined text-[18px]">{m.icon}</span>
              </div>
            </div>

            <div>
              <p className="text-3xl font-extrabold text-[#111827] tracking-tight">{m.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Donut Chart: Providers */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg hover:shadow-red-500/10 hover:border-red-200 hover:bg-gradient-to-br hover:from-[#fffcfc] hover:to-white hover:-translate-y-1 transition-all duration-300 flex flex-col">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-100">
            <div>
              <h2 className="text-base font-bold text-[#111827]">Répartition par Provider</h2>
              <p className="text-xs text-gray-500 mt-0.5">Part de chaque fournisseur</p>
            </div>
            <div className="p-2 bg-gray-50 rounded-lg text-[#b70f30]">
              <span className="material-symbols-outlined text-[18px]">pie_chart</span>
            </div>
          </div>

          {stats.certificationsByProvider.length > 0 ? (
            <div className="flex items-center justify-center my-auto py-4">
              
              {/* SVG Donut Chart */}
              <div className="relative flex-shrink-0 flex items-center justify-center">
                {/* Tooltip when hovering slice */}
                {hoveredSlice && (
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#111827] text-white text-[10px] font-bold px-2.5 py-1 rounded shadow-xl transition-opacity duration-200 pointer-events-none whitespace-nowrap z-40">
                    {hoveredSlice.label}: {hoveredSlice.value} certif{hoveredSlice.value > 1 ? 's' : ''} ({hoveredSlice.percentage}%)
                  </div>
                )}

                <svg className="w-52 h-52 -rotate-90 transform" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" stroke="#f3f4f6" strokeWidth="12" fill="none" />
                  {stats.certificationsByProvider.map((item, i) => {
                    const percentage = Math.round((item.value / totalProviders) * 100);
                    const color = providerColors[i % providerColors.length];
                    const strokeDasharray = `${(percentage / 100) * CIRCUMFERENCE} ${CIRCUMFERENCE}`;
                    const strokeDashoffset = - (cumulativePercent / 100) * CIRCUMFERENCE;
                    cumulativePercent += percentage;
                    const isHovered = hoveredSlice?.label === item.label;

                    return (
                      <circle
                        key={i}
                        cx="50"
                        cy="50"
                        r="40"
                        stroke={color}
                        strokeWidth={isHovered ? "15" : "11"}
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        fill="none"
                        className="transition-all duration-300 cursor-pointer hover:opacity-90"
                        onMouseEnter={() => setHoveredSlice({ label: item.label, value: item.value, percentage, color })}
                        onMouseLeave={() => setHoveredSlice(null)}
                      />
                    );
                  })}
                </svg>

                {/* Donut Center Hole */}
                <div className="absolute inset-0 m-auto w-32 h-32 bg-white rounded-full shadow-md flex flex-col items-center justify-center border border-gray-100 pointer-events-none transition-all">
                  {hoveredSlice ? (
                    <>
                      <span className="text-xs font-bold truncate max-w-[100px] text-center" style={{ color: hoveredSlice.color }}>
                        {hoveredSlice.label}
                      </span>
                      <span className="text-2xl font-extrabold text-[#111827]">
                        {hoveredSlice.value}
                      </span>
                      <span className="text-[10px] font-semibold text-gray-400">
                        {hoveredSlice.percentage}% du total
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Providers</span>
                      <span className="text-2xl font-extrabold text-[#111827]">{stats.certificationsByProvider.length}</span>
                    </>
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="my-auto py-12 text-center text-gray-400 text-sm">Aucune donnée disponible</div>
          )}
        </div>

        {/* Bar Chart: Squads */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg hover:shadow-blue-500/10 hover:border-blue-200 hover:bg-gradient-to-br hover:from-[#f8fbfd] hover:to-white hover:-translate-y-1 transition-all duration-300 flex flex-col">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-100">
            <div>
              <h2 className="text-base font-bold text-[#111827]">Certifications par Squad</h2>
              <p className="text-xs text-gray-500 mt-0.5">Engagement par équipe</p>
            </div>
            <div className="p-2 bg-gray-50 rounded-lg text-[#40627e]">
              <span className="material-symbols-outlined text-[18px]">bar_chart</span>
            </div>
          </div>

          <div className="relative h-[220px] mt-2 flex flex-col justify-end">
            
            {/* Grid Y-Axis Lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-6">
              {[maxSquadVal, Math.round(maxSquadVal / 2), 0].map((val, idx) => (
                <div key={idx} className="flex items-center gap-2 w-full">
                  <span className="text-[10px] font-medium text-gray-400 w-5 text-right">{val}</span>
                  <div className="h-[1px] bg-gray-100 flex-1"></div>
                </div>
              ))}
            </div>

            {/* Bars */}
            <div className="flex justify-around items-end h-[170px] ml-7 z-10 border-b border-gray-200 pb-0.5">
              {squadData.map((item, i) => {
                const heightPercent = Math.max((item.value / maxSquadVal) * 100, item.value > 0 ? 8 : 2);
                return (
                  <div key={i} className="flex flex-col items-center justify-end h-full group flex-1 max-w-[56px]">
                    <div 
                      className="w-8 sm:w-10 bg-gradient-to-t from-[#40627e] to-[#5a82a6] rounded-t-lg relative transition-all duration-300 group-hover:from-[#b70f30] group-hover:to-[#d92348] group-hover:shadow-lg cursor-pointer flex items-start justify-center"
                      style={{ 
                        height: `${heightPercent}%`,
                        opacity: item.value === 0 ? 0.2 : 1 
                      }}
                    >
                      {item.value > 0 && (
                        <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-[#111827] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-lg transition-opacity duration-200 pointer-events-none whitespace-nowrap z-20">
                          {item.value} certif{item.value > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                    <span className="text-[11px] font-medium text-gray-600 truncate w-full text-center mt-2 group-hover:text-gray-900 transition-colors" title={item.label}>
                      {item.label.split(' ')[0]}
                    </span>
                  </div>
                );
              })}
            </div>

          </div>
        </div>

      </div>

      {/* Difficulty Breakdown Row */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg hover:shadow-emerald-500/10 hover:border-emerald-200 hover:bg-gradient-to-br hover:from-[#f6fcf8] hover:to-white hover:-translate-y-1 transition-all duration-300">
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-[#111827]">Répartition par Difficulté</h2>
            <p className="text-xs text-gray-500 mt-0.5">Niveaux d'expertise requis</p>
          </div>
          <div className="p-2 bg-gray-50 rounded-lg text-[#006949]">
            <span className="material-symbols-outlined text-[18px]">trending_up</span>
          </div>
        </div>

        {stats.certificationsByDifficulty.length > 0 ? (
          <div className="flex flex-col gap-5 py-2">
            {stats.certificationsByDifficulty.map((item, i) => {
              const percentage = Math.round((item.value / totalDiff) * 100);
              const frenchLabel = difficultyMap[item.label] || item.label;
              const hexColorMap: Record<string, string> = {
                'FOUNDATIONAL': '#40627e',
                'INTERMEDIATE': '#b70f30',
                'ADVANCED': '#006949',
                'EXPERT': '#523b3b',
                'Débutant': '#40627e',
                'Intermédiaire': '#b70f30',
                'Avancé': '#006949',
                'Expert': '#523b3b'
              };
              const colorHex = hexColorMap[item.label] || hexColorMap[frenchLabel] || '#b70f30';

              return (
                <div 
                  key={i} 
                  className="flex items-center gap-4 group relative py-1 cursor-pointer"
                  title={`${frenchLabel}: ${item.value} certification(s)`}
                >
                  {/* Hover Tooltip */}
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-7 left-1/2 -translate-x-1/2 bg-[#111827] text-white text-[10px] font-bold px-2.5 py-1 rounded shadow-lg transition-opacity duration-200 pointer-events-none whitespace-nowrap z-30">
                    {frenchLabel}: {item.value} certif{item.value > 1 ? 's' : ''} ({percentage}%)
                  </div>

                  <span className="text-xs sm:text-sm font-medium text-gray-700 w-28 sm:w-32 flex-shrink-0">
                    {frenchLabel}
                  </span>
                  <div className="flex-1 h-3 bg-[#fceeed] rounded-full overflow-hidden relative">
                    <div 
                      className="h-full rounded-full transition-all duration-700 ease-out group-hover:brightness-95"
                      style={{ width: `${percentage}%`, backgroundColor: colorHex }}
                    ></div>
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-gray-700 w-12 text-right flex-shrink-0">
                    {percentage}%
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center text-gray-400 text-sm">Aucune donnée de difficulté disponible</div>
        )}
      </div>

    </div>
  );
}

