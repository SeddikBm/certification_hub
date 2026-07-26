import { Button } from "../components/ui/Button";

export function CertificationDetails() {
  return (
    <div className="max-w-[1200px] mx-auto space-y-stack-lg">
      {/* Header */}
      <div>
        <nav aria-label="Breadcrumb" className="flex text-label-md font-label-md text-on-surface-variant mb-4">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <a className="hover:text-primary transition-colors" href="/certifications">Certifications</a>
            </li>
            <li>
              <div className="flex items-center">
                <span className="material-symbols-outlined text-[16px] mx-1">chevron_right</span>
                <span className="text-on-surface">AWS Certified Developer Associate</span>
              </div>
            </li>
          </ol>
        </nav>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-surface-container-high rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-[32px] text-secondary">cloud</span>
            </div>
            <div>
              <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">Advanced React for Enterprise</h1>
              <p className="font-body-md text-body-md text-on-surface-variant mt-1">TR-REACT-01 • Udemy</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button>Enroll Now</Button>
            <Button variant="outline">Edit</Button>
          </div>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
        {/* General Info */}
        <div className="md:col-span-8 bg-surface-container-lowest rounded-xl p-container-padding shadow-sm border border-outline-variant/30 hover:-translate-y-0.5 transition-transform duration-200">
          <h2 className="font-headline-sm text-headline-sm text-on-surface border-b border-outline-variant/30 pb-3 mb-4">Détails de la Formation</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-stack-md">
            <div>
              <span className="font-label-md text-label-md text-on-surface-variant block mb-1">Type</span>
              <span className="font-body-md text-body-md text-on-surface">External</span>
            </div>
            <div>
              <span className="font-label-md text-label-md text-on-surface-variant block mb-1">Provider</span>
              <span className="font-body-md text-body-md text-on-surface">Udemy</span>
            </div>
            <div>
              <span className="font-label-md text-label-md text-on-surface-variant block mb-1">Level</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary-container text-on-secondary-container">Advanced</span>
            </div>
            <div>
              <span className="font-label-md text-label-md text-on-surface-variant block mb-1">Priority</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary text-on-primary">High</span>
            </div>
          </div>
          <div className="mt-6">
            <span className="font-label-md text-label-md text-on-surface-variant block mb-2">Description</span>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              Validates technical expertise in developing, deploying, and debugging cloud-based applications using AWS. Designed for individuals with one or more years of hands-on experience developing and maintaining an AWS-based application.
            </p>
          </div>
        </div>

        {/* Exam Details */}
        <div className="md:col-span-4 bg-surface-container-lowest rounded-xl p-container-padding shadow-sm border border-outline-variant/30 hover:-translate-y-0.5 transition-transform duration-200">
          <h2 className="font-headline-sm text-headline-sm text-on-surface border-b border-outline-variant/30 pb-3 mb-4">Training Logistics</h2>
          <ul className="space-y-4">
            <li className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[18px]">timer</span>
                </div>
                <span className="font-body-sm text-body-sm text-on-surface-variant">Duration</span>
              </div>
              <span className="font-body-md text-body-md text-on-surface font-semibold">32.5 Hours</span>
            </li>
            <li className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[18px]">devices</span>
                </div>
                <span className="font-body-sm text-body-sm text-on-surface-variant">Platform</span>
              </div>
              <span className="font-body-md text-body-md text-on-surface font-semibold">Web / Mobile App</span>
            </li>
            <li className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[18px]">person</span>
                </div>
                <span className="font-body-sm text-body-sm text-on-surface-variant">Instructor</span>
              </div>
              <span className="font-body-md text-body-md text-on-surface font-semibold">Stephen Grider</span>
            </li>
          </ul>
        </div>

        {/* Training Resources */}
        <div className="md:col-span-6 bg-surface-container-lowest rounded-xl p-container-padding shadow-sm border border-outline-variant/30 hover:-translate-y-0.5 transition-transform duration-200">
          <h2 className="font-headline-sm text-headline-sm text-on-surface border-b border-outline-variant/30 pb-3 mb-4">Certification Resources</h2>
          <div className="space-y-3">
            <a className="block p-3 rounded-lg border border-outline-variant hover:border-primary hover:bg-surface-container-low transition-colors group" href="#">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-secondary">link</span>
                  <span className="font-body-md text-body-md text-on-surface group-hover:text-primary transition-colors">Official Exam URL</span>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant text-[18px]">open_in_new</span>
              </div>
            </a>
            <a className="block p-3 rounded-lg border border-outline-variant hover:border-primary hover:bg-surface-container-low transition-colors group" href="#">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-secondary">link</span>
                  <span className="font-body-md text-body-md text-on-surface group-hover:text-primary transition-colors">Official Certification Link</span>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant text-[18px]">open_in_new</span>
              </div>
            </a>
          </div>
        </div>

        {/* Concerned Squads */}
        <div className="md:col-span-6 bg-surface-container-lowest rounded-xl p-container-padding shadow-sm border border-outline-variant/30 hover:-translate-y-0.5 transition-transform duration-200">
          <h2 className="font-headline-sm text-headline-sm text-on-surface border-b border-outline-variant/30 pb-3 mb-4">Concerned Squads</h2>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1.5 bg-surface-container border border-outline-variant rounded-lg font-body-sm text-body-sm text-on-surface flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-tertiary-container"></span> Cloud Native
            </span>
            <span className="px-3 py-1.5 bg-surface-container border border-outline-variant rounded-lg font-body-sm text-body-sm text-on-surface flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-secondary"></span> DevOps Engineering
            </span>
            <span className="px-3 py-1.5 bg-surface-container border border-outline-variant rounded-lg font-body-sm text-body-sm text-on-surface flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary"></span> Serverless Team
            </span>
            <span className="px-3 py-1.5 bg-surface-container border border-outline-variant rounded-lg font-body-sm text-body-sm text-on-surface flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-outline"></span> Architecture
            </span>
          </div>
        </div>

        {/* Reviews */}
        <div className="md:col-span-12 bg-surface-container-lowest rounded-xl p-container-padding shadow-sm border border-outline-variant/30 hover:-translate-y-0.5 transition-transform duration-200">
          <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3 mb-4">
            <h2 className="font-headline-sm text-headline-sm text-on-surface">Colleague Reviews</h2>
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[20px] text-tertiary-container" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              <span className="font-body-md text-body-md font-semibold text-on-surface">4.5</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant ml-1">(24 reviews)</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-md">
            {/* Review 1 */}
            <div className="p-4 bg-surface-container-low rounded-lg border border-outline-variant/50">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-label-md">SJ</div>
                  <div>
                    <p className="font-label-md text-label-md text-on-surface">Sarah Jenkins</p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant text-[11px]">Cloud Architect</p>
                  </div>
                </div>
                <div className="flex text-tertiary-container">
                  {[1,2,3,4,5].map((_, i) => (
                    <span key={i} className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  ))}
                </div>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface mt-2 line-clamp-3">
                Heavy focus on DynamoDB, API Gateway, and Lambda. Make sure you understand the pricing models and read capacity units calculations. The Stephane Maarek course was spot on for this.
              </p>
            </div>
            {/* Review 2 */}
            <div className="p-4 bg-surface-container-low rounded-lg border border-outline-variant/50">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-label-md">MK</div>
                  <div>
                    <p className="font-label-md text-label-md text-on-surface">Mike Kowalski</p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant text-[11px]">DevOps Engineer</p>
                  </div>
                </div>
                <div className="flex text-tertiary-container">
                  {[1,2,3].map((_, i) => (
                    <span key={i} className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  ))}
                </div>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface mt-2 line-clamp-3">
                Good concepts but could be more practical. I'd recommend doing some hands-on labs before taking the exam.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
