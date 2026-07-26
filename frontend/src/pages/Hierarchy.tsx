export function Hierarchy() {
  return (
    <div className="max-w-[1200px] mx-auto space-y-stack-lg">
      <div>
        <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">Hierarchy</h1>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">Manage team structures and reporting lines.</p>
      </div>
      <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/30 flex flex-col items-center justify-center min-h-[400px]">
        <span className="material-symbols-outlined text-[48px] text-on-surface-variant mb-4">account_tree</span>
        <h2 className="font-headline-sm text-headline-sm text-on-surface">Coming Soon</h2>
        <p className="text-on-surface-variant text-center mt-2 max-w-md">The organizational hierarchy view is currently under development. Check back later for updates.</p>
      </div>
    </div>
  );
}
