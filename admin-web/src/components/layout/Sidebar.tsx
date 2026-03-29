import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ClipboardList, 
  MapPin, 
  Users, 
  Settings,
  ShieldCheck
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Claims Queue', path: '/claims', icon: ClipboardList },
    { name: 'Active Disruptions', path: '/disruptions', icon: MapPin },
    { name: 'Workers', path: '/workers', icon: Users },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-white h-screen fixed left-0 top-0 overflow-y-auto">
      <div className="p-6 flex items-center gap-3">
        <ShieldCheck className="w-8 h-8 text-secondary-500" />
        <span className="text-xl font-bold tracking-tight">ZeroRukawat</span>
      </div>
      
      <nav className="mt-8 px-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive 
                  ? 'bg-primary-600 text-white shadow-lg' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.name}</span>
          </NavLink>
        ))}
      </nav>
      
      <div className="absolute bottom-8 left-0 w-full px-6">
        <div className="p-4 bg-slate-800 rounded-xl border border-slate-700">
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">System Status</p>
          <div className="mt-2 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-slate-300 font-medium">All Systems Operational</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
