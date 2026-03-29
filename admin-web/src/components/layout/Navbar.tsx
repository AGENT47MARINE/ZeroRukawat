import React from 'react';
import { 
  Bell, 
  Search, 
  CircleUserRound, 
  ChevronRight 
} from 'lucide-react';
import { useLocation } from 'react-router-dom';

const Navbar: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-10 px-8 flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-slate-500 font-medium">ZeroRukawat</span>
        <ChevronRight className="w-4 h-4 text-slate-400" />
        {pathnames.length === 0 ? (
          <span className="text-slate-900 font-semibold">Dashboard</span>
        ) : (
          pathnames.map((name, index) => {
            const isLast = index === pathnames.length - 1;
            const displayName = name.charAt(0).toUpperCase() + name.slice(1);
            return (
              <React.Fragment key={name}>
                <span className={`${isLast ? 'text-slate-900 font-semibold' : 'text-slate-500 font-medium'}`}>
                  {displayName}
                </span>
                {!isLast && <ChevronRight className="w-4 h-4 text-slate-400" />}
              </React.Fragment>
            );
          })
        )}
      </div>

      <div className="flex items-center gap-6">
        <div className="relative group hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search claims, workers..." 
            className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full text-sm focus:ring-2 focus:ring-primary-500 w-64 transition-all duration-200"
          />
        </div>
        
        <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 border-2 border-white rounded-full"></span>
        </button>
        
        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-slate-900">Admin Team</p>
            <p className="text-[10px] text-slate-500 font-medium italic">Operations Lead</p>
          </div>
          <CircleUserRound className="w-8 h-8 text-primary-600 cursor-pointer" />
        </div>
      </div>
    </header>
  );
};

export default Navbar;
