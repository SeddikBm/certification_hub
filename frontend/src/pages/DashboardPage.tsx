const DashboardPage = () => {
  return (
    <div className="max-w-[1200px] mx-auto flex flex-col gap-stack-lg">
      {/* Header */}
      <div>
        <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg font-bold text-on-surface tracking-tight">Tableau de Bord</h2>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">Vue d'ensemble des certifications et formations de l'entreprise.</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
        {/* Metric 1 */}
        <div className="bg-surface-container-lowest rounded-xl p-container-padding shadow-sm border border-outline-variant/20 hover:-translate-y-1 hover:shadow-md transition-all duration-200">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-primary-container/20 rounded-lg text-primary">
              <span className="material-symbols-outlined icon-fill">verified</span>
            </div>
            <span className="font-label-md text-label-md text-tertiary bg-tertiary-container/10 px-2 py-1 rounded-full flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">arrow_upward</span> 12%
            </span>
          </div>
          <h3 className="font-body-sm text-body-sm text-on-surface-variant">Total Certifications</h3>
          <p className="font-headline-lg text-headline-lg font-bold text-on-surface mt-1">158</p>
        </div>

        {/* Metric 2 */}
        <div className="bg-surface-container-lowest rounded-xl p-container-padding shadow-sm border border-outline-variant/20 hover:-translate-y-1 hover:shadow-md transition-all duration-200">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-secondary-container/40 rounded-lg text-secondary">
              <span className="material-symbols-outlined icon-fill">school</span>
            </div>
          </div>
          <h3 className="font-body-sm text-body-sm text-on-surface-variant">Total Trainings</h3>
          <p className="font-headline-lg text-headline-lg font-bold text-on-surface mt-1">842</p>
        </div>

        {/* Metric 3 */}
        <div className="bg-surface-container-lowest rounded-xl p-container-padding shadow-sm border border-outline-variant/20 hover:-translate-y-1 hover:shadow-md transition-all duration-200">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-tertiary-container/20 rounded-lg text-tertiary">
              <span className="material-symbols-outlined icon-fill">group</span>
            </div>
          </div>
          <h3 className="font-body-sm text-body-sm text-on-surface-variant">Total Users</h3>
          <p className="font-headline-lg text-headline-lg font-bold text-on-surface mt-1">1,240</p>
        </div>

        {/* Metric 4 */}
        <div className="bg-surface-container-lowest rounded-xl p-container-padding shadow-sm border border-outline-variant/20 hover:-translate-y-1 hover:shadow-md transition-all duration-200">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-outline-variant/40 rounded-lg text-on-surface-variant">
              <span className="material-symbols-outlined icon-fill">hub</span>
            </div>
          </div>
          <h3 className="font-body-sm text-body-sm text-on-surface-variant">Total Squads</h3>
          <p className="font-headline-lg text-headline-lg font-bold text-on-surface mt-1">42</p>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
        {/* Pie Chart Card */}
        <div className="bg-surface-container-lowest rounded-xl p-container-padding shadow-sm border border-outline-variant/20">
          <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface mb-6 border-b border-outline-variant/20 pb-4">Certifications par Provider</h3>
          <div className="flex flex-col sm:flex-row items-center gap-8 justify-center min-h-[250px]">
            {/* Static CSS Pie Chart */}
            <div 
              className="w-48 h-48 rounded-full shadow-inner relative"
              style={{
                background: 'conic-gradient(#b70f30 0% 45%, #40627e 45% 75%, #006949 75% 90%, #e3bebd 90% 100%)'
              }}
            ></div>
            {/* Legend */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-primary"></span>
                <span className="font-body-sm text-body-sm text-on-surface-variant w-24">AWS</span>
                <span className="font-label-md text-label-md font-bold text-on-surface">45%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-secondary"></span>
                <span className="font-body-sm text-body-sm text-on-surface-variant w-24">Azure</span>
                <span className="font-label-md text-label-md font-bold text-on-surface">30%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-tertiary"></span>
                <span className="font-body-sm text-body-sm text-on-surface-variant w-24">Google Cloud</span>
                <span className="font-label-md text-label-md font-bold text-on-surface">15%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-outline-variant"></span>
                <span className="font-body-sm text-body-sm text-on-surface-variant w-24">Oracle</span>
                <span className="font-label-md text-label-md font-bold text-on-surface">10%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bar Chart Card */}
        <div className="bg-surface-container-lowest rounded-xl p-container-padding shadow-sm border border-outline-variant/20">
          <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface mb-6 border-b border-outline-variant/20 pb-4">Certifications par Squad</h3>
          <div className="flex items-end justify-between h-[200px] mt-8 gap-2 relative">
            <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-on-surface-variant font-label-md text-label-md text-xs -ml-2">
              <span>50</span>
              <span>25</span>
              <span>0</span>
            </div>
            <div className="w-full flex justify-around items-end h-full ml-6 border-b border-outline-variant/30 pb-1 relative z-10">
              {/* Bars */}
              <div className="flex flex-col items-center gap-2 group">
                <div className="bg-primary rounded-t-[4px] w-8 sm:w-12 h-[90%] relative transition-all duration-300 hover:bg-primary-fixed-variant cursor-pointer">
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-inverse-surface text-inverse-on-surface font-label-md text-[10px] px-2 py-1 rounded transition-opacity">45</div>
                </div>
                <span className="font-label-md text-[10px] sm:text-xs text-on-surface-variant truncate w-12 text-center" title="Squad Alpha">Alpha</span>
              </div>
              <div className="flex flex-col items-center gap-2 group">
                <div className="bg-primary rounded-t-[4px] w-8 sm:w-12 h-[76%] relative transition-all duration-300 hover:bg-primary-fixed-variant cursor-pointer">
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-inverse-surface text-inverse-on-surface font-label-md text-[10px] px-2 py-1 rounded transition-opacity">38</div>
                </div>
                <span className="font-label-md text-[10px] sm:text-xs text-on-surface-variant truncate w-12 text-center" title="Squad Beta">Beta</span>
              </div>
              <div className="flex flex-col items-center gap-2 group">
                <div className="bg-primary rounded-t-[4px] w-8 sm:w-12 h-[64%] relative transition-all duration-300 hover:bg-primary-fixed-variant cursor-pointer">
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-inverse-surface text-inverse-on-surface font-label-md text-[10px] px-2 py-1 rounded transition-opacity">32</div>
                </div>
                <span className="font-label-md text-[10px] sm:text-xs text-on-surface-variant truncate w-12 text-center" title="Squad Gamma">Gamma</span>
              </div>
              <div className="flex flex-col items-center gap-2 group">
                <div className="bg-primary rounded-t-[4px] w-8 sm:w-12 h-[56%] relative transition-all duration-300 hover:bg-primary-fixed-variant cursor-pointer">
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-inverse-surface text-inverse-on-surface font-label-md text-[10px] px-2 py-1 rounded transition-opacity">28</div>
                </div>
                <span className="font-label-md text-[10px] sm:text-xs text-on-surface-variant truncate w-12 text-center" title="Squad Delta">Delta</span>
              </div>
              <div className="flex flex-col items-center gap-2 group">
                <div className="bg-primary rounded-t-[4px] w-8 sm:w-12 h-[40%] relative transition-all duration-300 hover:bg-primary-fixed-variant cursor-pointer opacity-70">
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-inverse-surface text-inverse-on-surface font-label-md text-[10px] px-2 py-1 rounded transition-opacity">20</div>
                </div>
                <span className="font-label-md text-[10px] sm:text-xs text-on-surface-variant truncate w-12 text-center" title="Squad Epsilon">Epsilon</span>
              </div>
            </div>
            {/* Background Grid Lines */}
            <div className="absolute inset-0 ml-6 pointer-events-none flex flex-col justify-between border-l border-outline-variant/30">
              <div className="border-b border-outline-variant/10 w-full h-0"></div>
              <div className="border-b border-outline-variant/10 w-full h-0"></div>
              <div className="border-b border-transparent w-full h-0"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="bg-surface-container-lowest rounded-xl p-container-padding shadow-sm border border-outline-variant/20 mb-8">
        <div className="flex justify-between items-center mb-6 border-b border-outline-variant/20 pb-4">
          <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">Répartition par Difficulté</h3>
          <button className="text-primary font-label-md text-label-md hover:bg-surface-container-low px-3 py-1.5 rounded-md transition-colors">View Details</button>
        </div>
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <span className="font-body-sm text-body-sm text-on-surface font-medium w-24">Beginner</span>
            <div className="flex-1 h-3 bg-surface-container-high rounded-full overflow-hidden">
              <div className="h-full bg-secondary rounded-full w-[25%] transition-all duration-500"></div>
            </div>
            <span className="font-label-md text-label-md text-on-surface-variant w-12 text-right">25%</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-body-sm text-body-sm text-on-surface font-medium w-24">Intermediate</span>
            <div className="flex-1 h-3 bg-surface-container-high rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full w-[45%] transition-all duration-500"></div>
            </div>
            <span className="font-label-md text-label-md text-on-surface-variant w-12 text-right">45%</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-body-sm text-body-sm text-on-surface font-medium w-24">Advanced</span>
            <div className="flex-1 h-3 bg-surface-container-high rounded-full overflow-hidden">
              <div className="h-full bg-tertiary rounded-full w-[20%] transition-all duration-500"></div>
            </div>
            <span className="font-label-md text-label-md text-on-surface-variant w-12 text-right">20%</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-body-sm text-body-sm text-on-surface font-medium w-24">Expert</span>
            <div className="flex-1 h-3 bg-surface-container-high rounded-full overflow-hidden">
              <div className="h-full bg-on-surface-variant rounded-full w-[10%] transition-all duration-500"></div>
            </div>
            <span className="font-label-md text-label-md text-on-surface-variant w-12 text-right">10%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
