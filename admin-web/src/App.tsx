import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';

// Placeholder Components for now
const Dashboard = () => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <h1 className="text-2xl font-bold text-slate-900">System Overview</h1>
      <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition">
        Export Report
      </button>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[
        { label: 'Active Disruptions', value: '12', color: 'bg-amber-100 text-amber-700' },
        { label: 'Pending Reviews', value: '148', color: 'bg-blue-100 text-blue-700' },
        { label: 'Total Payouts (Today)', value: '₹42,850', color: 'bg-green-100 text-green-700' },
        { label: 'System Health', value: '99.9%', color: 'bg-purple-100 text-purple-700' },
      ].map((stat) => (
        <div key={stat.label} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{stat.label}</p>
          <p className={`mt-2 text-3xl font-bold ${stat.color} inline-block px-2 py-1 rounded`}>{stat.value}</p>
        </div>
      ))}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 h-80 flex items-center justify-center text-slate-400 font-medium">
        Disruption Heatmap Placeholder
      </div>
      <div className="bg-white p-6 rounded-xl border border-slate-200 h-80 flex items-center justify-center text-slate-400 font-medium">
        Payout Volume Chart Placeholder
      </div>
    </div>
  </div>
);

const ClaimsQueue = () => (
  <div className="space-y-6">
    <h1 className="text-2xl font-bold text-slate-900">Claims Review Queue</h1>
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
        <div className="flex gap-4">
          <button className="px-3 py-1 bg-white border border-slate-200 rounded text-sm font-medium text-primary-600">All Claims</button>
          <button className="px-3 py-1 text-sm font-medium text-slate-500 hover:text-slate-900">Amber Flags</button>
          <button className="px-3 py-1 text-sm font-medium text-slate-500 hover:text-slate-900">Red Flags</button>
        </div>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">148 Records Found</span>
      </div>
      <div className="h-96 flex items-center justify-center text-slate-400 font-medium italic">
        Table framework initialized. Waiting for backend data...
      </div>
    </div>
  </div>
);

const Disruptions = () => (
  <div className="space-y-6 px-4">
    <h1 className="text-2xl font-bold text-slate-900">Active Disruptions</h1>
    {/* Implementation detailed in Phase 3 */}
    <div className="p-8 bg-amber-50 rounded-xl border border-amber-200 border-dashed text-center">
      <p className="text-amber-800 font-semibold italic text-lg opacity-75 leading-relaxed">
        Live disruption monitoring framework initialized.<br />
        <span className="text-sm font-normal">System currently awaiting real-time weather & traffic triggers from the FastAPI backend.</span>
      </p>
    </div>
  </div>
);

const Placeholder = ({ name }: { name: string }) => (
  <div className="p-12 bg-white rounded-xl border border-slate-200 border-dashed text-center">
    <h1 className="text-2xl font-bold text-slate-300">{name} Framework</h1>
    <p className="text-slate-400 mt-2 italic">Infrastructure ready for business logic integration.</p>
  </div>
);

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="claims" element={<ClaimsQueue />} />
          <Route path="disruptions" element={<Disruptions />} />
          <Route path="workers" element={<Placeholder name="Workers Directory" />} />
          <Route path="settings" element={<Placeholder name="System Settings" />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
