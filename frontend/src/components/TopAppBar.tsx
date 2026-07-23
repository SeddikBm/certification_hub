const TopAppBar = () => {
  return (
    <header className="fixed top-0 right-0 w-full md:w-[calc(100%-16rem)] h-16 shadow-sm bg-surface flex justify-between items-center px-container-padding z-40 transition-all duration-200 border-b border-outline-variant/20 md:border-none">
      {/* Mobile Menu Button */}
      <button className="md:hidden text-on-surface p-2 rounded-full hover:bg-surface-container-low">
        <span className="material-symbols-outlined">menu</span>
      </button>
      
      <div className="flex items-center gap-4 hidden md:flex flex-1 max-w-md">
        <div className="relative w-full">
          <span className="material-symbols-outlined absolute left-3 top-1/2 transform -translate-y-1/2 text-on-surface-variant">search</span>
          <input 
            className="w-full pl-10 pr-4 py-2 bg-surface-container-lowest border border-outline-variant/50 rounded-full focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-body-sm font-body-sm transition-all" 
            placeholder="Search..." 
            type="text"
          />
        </div>
      </div>
      
      <div className="font-headline-sm text-headline-sm font-bold text-primary md:hidden">
        Enterprise Portal
      </div>
      
      <div className="flex items-center gap-2">
        <button className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container-low hover:text-primary transition-all duration-200">
          <span className="material-symbols-outlined">notifications</span>
        </button>
        <button className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container-low hover:text-primary transition-all duration-200">
          <span className="material-symbols-outlined">help</span>
        </button>
        <div className="ml-4 h-8 w-8 rounded-full bg-secondary-container overflow-hidden border border-outline-variant cursor-pointer">
          <img 
            alt="User profile" 
            className="w-full h-full object-cover" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuARvBI7DxBDmzb3f-dHD_BkFg2MErlVOpZmdpT6ChzyDW8EFS8m4q8nq2nTN10uXa0PCwlIg11TEeMVcE2Abr2oxOi2SrRBDTwELr4_7WmILkdsyRAwk9C6I1f_5lRkzdL-_-a__rZyLune-9XF3QQjqeJZuC9bFNnq89nuKW9iGf7QV1LWUnFd_6gsmI3JgnUXO3Xi-KRGaeXmnTFJuTp8gqbrGqh-sEgok2cj2mVc0iE1IPXFulMW7g"
          />
        </div>
      </div>
    </header>
  );
};

export default TopAppBar;
