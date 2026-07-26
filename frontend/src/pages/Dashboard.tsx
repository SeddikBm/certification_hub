import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboard.service';

export function Dashboard() {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardService.getStats()
  });

  return (
    <div className="max-w-[1200px] mx-auto space-y-stack-md pb-12">
      <div>
        <h1 className="font-headline-lg text-headline-lg text-on-surface mb-1">Dashboard</h1>
        <p className="font-body-sm text-body-sm text-on-surface-variant">Overview of your certification hub statistics.</p>
      </div>

      {isLoading ? (
        <div className="text-on-surface-variant p-8 text-center bg-surface rounded-xl shadow-sm border border-outline-variant/30">Loading stats...</div>
      ) : error ? (
        <div className="text-error p-8 text-center bg-surface rounded-xl shadow-sm border border-outline-variant/30">Failed to load stats.</div>
      ) : !stats ? (
        <div className="text-on-surface-variant p-8 text-center bg-surface rounded-xl shadow-sm border border-outline-variant/30">No stats available.</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
            {/* KPI Cards */}
            <div className="bg-surface p-stack-sm rounded-xl shadow-sm border border-outline-variant/30 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">workspace_premium</span>
              </div>
              <div>
                <div className="font-body-sm text-body-sm text-on-surface-variant">Certifications</div>
                <div className="font-headline-md text-headline-md text-on-surface">{stats.totalCertifications}</div>
              </div>
            </div>

            <div className="bg-surface p-stack-sm rounded-xl shadow-sm border border-outline-variant/30 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">school</span>
              </div>
              <div>
                <div className="font-body-sm text-body-sm text-on-surface-variant">Trainings</div>
                <div className="font-headline-md text-headline-md text-on-surface">{stats.totalTrainings}</div>
              </div>
            </div>

            <div className="bg-surface p-stack-sm rounded-xl shadow-sm border border-outline-variant/30 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-tertiary/10 text-tertiary flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">group</span>
              </div>
              <div>
                <div className="font-body-sm text-body-sm text-on-surface-variant">Users</div>
                <div className="font-headline-md text-headline-md text-on-surface">{stats.totalUsers}</div>
              </div>
            </div>

            <div className="bg-surface p-stack-sm rounded-xl shadow-sm border border-outline-variant/30 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">groups</span>
              </div>
              <div>
                <div className="font-body-sm text-body-sm text-on-surface-variant">Squads</div>
                <div className="font-headline-md text-headline-md text-on-surface">{stats.totalSquads}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
            {/* Chart placeholders - normally you'd use Recharts or Chart.js here */}
            <div className="bg-surface p-stack-md rounded-xl shadow-sm border border-outline-variant/30 min-h-[300px]">
              <h2 className="font-title-md text-title-md text-on-surface mb-stack-sm">Certifications by Provider</h2>
              <div className="flex flex-col gap-2">
                {stats.certificationsByProvider.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-on-surface-variant text-sm">{item.label}</span>
                    <span className="font-medium text-on-surface">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-surface p-stack-md rounded-xl shadow-sm border border-outline-variant/30 min-h-[300px]">
              <h2 className="font-title-md text-title-md text-on-surface mb-stack-sm">Certifications by Difficulty</h2>
              <div className="flex flex-col gap-2">
                {stats.certificationsByDifficulty.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-on-surface-variant text-sm">{item.label}</span>
                    <span className="font-medium text-on-surface">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
