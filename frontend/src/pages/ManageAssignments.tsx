import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";

export function ManageAssignments() {
  return (
    <div className="max-w-[1200px] mx-auto space-y-stack-md pb-12">
      {/* Page Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-stack-md">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-1">Manage Assignments</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant">Oversee and assign training and certification paths for your team.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" className="flex items-center justify-center">
            <span className="material-symbols-outlined mr-2 text-[18px]">download</span> Export Excel
          </Button>
          <Button variant="secondary" className="flex items-center justify-center bg-transparent border-primary text-primary hover:bg-surface-variant">
            <span className="material-symbols-outlined mr-2 text-[18px]">school</span> Assign Training
          </Button>
          <Button className="flex items-center justify-center">
            <span className="material-symbols-outlined mr-2 text-[18px]">verified</span> Assign Certification
          </Button>
        </div>
      </div>

      {/* Filter Card */}
      <div className="bg-surface rounded-xl shadow-sm border border-outline-variant/30 p-stack-md w-full">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter items-end">
          <div className="space-y-1 relative">
            <label className="font-label-md text-label-md text-on-surface-variant block">Collaborator</label>
            <Input leftIcon="person_search" placeholder="Search collaborator..." />
          </div>
          <div className="space-y-1">
            <label className="font-label-md text-label-md text-on-surface-variant block">Type</label>
            <div className="relative">
              <select className="w-full bg-surface-container-lowest text-on-surface border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4 py-3 font-body-md text-body-md transition-colors appearance-none cursor-pointer">
                <option value="">All Types</option>
                <option value="certification">Certification</option>
                <option value="training">Training</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
            </div>
          </div>
          <div className="space-y-1">
            <label className="font-label-md text-label-md text-on-surface-variant block">Status</label>
            <div className="relative">
              <select className="w-full bg-surface-container-lowest text-on-surface border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4 py-3 font-body-md text-body-md transition-colors appearance-none cursor-pointer">
                <option value="">All Statuses</option>
                <option value="in_progress">In Progress</option>
                <option value="not_started">Not Started</option>
                <option value="completed">Completed</option>
                <option value="overdue">Overdue</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
            </div>
          </div>
          <div className="space-y-1">
            <label className="font-label-md text-label-md text-on-surface-variant block">Priority</label>
            <div className="relative">
              <select className="w-full bg-surface-container-lowest text-on-surface border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4 py-3 font-body-md text-body-md transition-colors appearance-none cursor-pointer">
                <option value="">All Priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grouped Collaborator View */}
      <div className="space-y-stack-lg mt-stack-md">
        {/* Collaborator Group 1 */}
        <div className="bg-surface rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden group/collab">
          {/* Collaborator Header */}
          <div className="bg-surface-container-lowest border-b border-outline-variant/30 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between cursor-pointer hover:bg-surface-container-low transition-colors gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold">SJ</div>
              <div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface m-0 leading-tight">Sarah Jenkins</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Senior Cloud Architect • Cloud Practice</p>
              </div>
            </div>
            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
              <div className="flex gap-2 text-label-md">
                <span className="bg-secondary-container text-on-secondary-container px-2 py-1 rounded-md">3 Active</span>
                <span className="bg-error-container text-on-error-container px-2 py-1 rounded-md">1 Overdue</span>
              </div>
              <button className="text-on-surface-variant hover:text-primary transition-colors p-1 rounded-full hover:bg-surface-container">
                <span className="material-symbols-outlined transition-transform duration-200 group-hover/collab:rotate-180">expand_more</span>
              </button>
            </div>
          </div>

          {/* Assignments List */}
          <div className="p-4 bg-surface grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Assignment Card 1 */}
            <div className="bg-surface-container-lowest rounded-lg border border-outline-variant/50 p-4 hover:shadow-md transition-shadow relative overflow-hidden group/card hover:-translate-y-0.5 duration-200 cursor-pointer">
              <div className="absolute top-0 right-0 w-1 h-full bg-error"></div>
              <div className="flex justify-between items-start mb-3">
                <span className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wider font-bold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-sm">
                  <span className="material-symbols-outlined text-[14px]">verified</span> Certification
                </span>
                <span className="inline-flex items-center gap-1 font-label-md text-label-md text-on-error-container bg-error-container px-2 py-1 rounded-md">
                  <span className="material-symbols-outlined text-[14px]">warning</span> Overdue
                </span>
              </div>
              <h4 className="font-headline-sm text-headline-sm text-on-surface mb-1">AWS Certified Solutions Architect - Pro</h4>
              <p className="font-body-sm text-body-sm text-on-surface-variant mb-4 line-clamp-2">Advanced level certification for designing distributed systems on AWS.</p>
              <div className="mt-auto space-y-2">
                <div className="flex justify-between font-label-md text-label-md text-on-surface-variant">
                  <span>Progress</span>
                  <span className="text-error font-bold">80%</span>
                </div>
                <div className="w-full bg-surface-variant rounded-full h-1.5 overflow-hidden">
                  <div className="bg-error h-1.5 rounded-full" style={{ width: "80%" }}></div>
                </div>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-surface-variant text-label-md text-on-surface-variant">
                  <span className="material-symbols-outlined text-[16px] text-primary">priority_high</span>
                  <span>High Priority</span>
                  <span className="ml-auto flex items-center gap-1 text-error"><span className="material-symbols-outlined text-[14px]">calendar_today</span> Due: Oct 15</span>
                </div>
              </div>
            </div>

            {/* Assignment Card 2 */}
            <div className="bg-surface-container-lowest rounded-lg border border-outline-variant/50 p-4 hover:shadow-md transition-shadow relative overflow-hidden group/card hover:-translate-y-0.5 duration-200 cursor-pointer">
              <div className="absolute top-0 right-0 w-1 h-full bg-tertiary"></div>
              <div className="flex justify-between items-start mb-3">
                <span className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wider font-bold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-sm">
                  <span className="material-symbols-outlined text-[14px]">school</span> Training
                </span>
                <span className="inline-flex items-center gap-1 font-label-md text-label-md text-on-tertiary-container bg-tertiary-container px-2 py-1 rounded-md">
                  <span className="material-symbols-outlined text-[14px]">autorenew</span> In Progress
                </span>
              </div>
              <h4 className="font-headline-sm text-headline-sm text-on-surface mb-1">Kubernetes Masterclass</h4>
              <p className="font-body-sm text-body-sm text-on-surface-variant mb-4 line-clamp-2">Deep dive into container orchestration and microservices deployment.</p>
              <div className="mt-auto space-y-2">
                <div className="flex justify-between font-label-md text-label-md text-on-surface-variant">
                  <span>Progress</span>
                  <span className="text-tertiary font-bold">45%</span>
                </div>
                <div className="w-full bg-surface-variant rounded-full h-1.5 overflow-hidden">
                  <div className="bg-tertiary h-1.5 rounded-full" style={{ width: "45%" }}></div>
                </div>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-surface-variant text-label-md text-on-surface-variant">
                  <span className="material-symbols-outlined text-[16px] text-secondary">drag_handle</span>
                  <span>Medium Priority</span>
                  <span className="ml-auto flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">calendar_today</span> Due: Nov 30</span>
                </div>
              </div>
            </div>

            {/* Assignment Card 3 (Assign New) */}
            <div className="bg-surface-container-lowest rounded-lg border border-outline-variant/50 p-4 hover:shadow-md transition-shadow relative overflow-hidden group/card hover:-translate-y-0.5 duration-200 cursor-pointer border-dashed border-2 hover:border-solid flex flex-col items-center justify-center text-center opacity-70 hover:opacity-100 min-h-[220px]">
              <div className="w-12 h-12 bg-surface-container-high rounded-full flex items-center justify-center mb-3 text-on-surface-variant group-hover/card:text-primary group-hover/card:bg-surface-variant transition-colors">
                <span className="material-symbols-outlined text-[24px]">add</span>
              </div>
              <h4 className="font-headline-sm text-headline-sm text-on-surface mb-1">Assign New</h4>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Add training or certification for Sarah</p>
            </div>
          </div>
        </div>

        {/* Collaborator Group 2 */}
        <div className="bg-surface rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden group/collab">
          {/* Collaborator Header */}
          <div className="bg-surface-container-lowest border-b border-outline-variant/30 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between cursor-pointer hover:bg-surface-container-low transition-colors gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-tertiary-container text-on-tertiary-container flex items-center justify-center font-bold">MC</div>
              <div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface m-0 leading-tight">Michael Chen</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Data Engineer • Data Practice</p>
              </div>
            </div>
            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
              <div className="flex gap-2 text-label-md">
                <span className="bg-secondary-container text-on-secondary-container px-2 py-1 rounded-md">2 Active</span>
              </div>
              <button className="text-on-surface-variant hover:text-primary transition-colors p-1 rounded-full hover:bg-surface-container">
                <span className="material-symbols-outlined transition-transform duration-200">expand_more</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
