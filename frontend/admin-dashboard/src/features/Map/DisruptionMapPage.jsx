import React from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useStore } from '../../store/useStore';
import { Navigation, AlertTriangle, Layers } from 'lucide-react';

const DisruptionMapPage = () => {
  const { disruptions } = useStore();

  const mockHeatzones = [
    { id: 1, pos: [12.9716, 77.5946], intensity: 80, radius: 40 },
    { id: 2, pos: [12.9352, 77.6245], intensity: 95, radius: 60 }, // Koramangala
    { id: 3, pos: [12.9698, 77.7500], intensity: 60, radius: 30 }  // Whitefield
  ];

  return (
    <div className="h-full flex flex-col space-y-4 animate-in fade-in zoom-in duration-700">
      <div className="flex justify-between items-center bg-card p-4 rounded-xl border border-white/5">
        <div>
          <h1 className="text-2xl font-bold flex items-center space-x-2">
            <Navigation className="text-ai" />
            <span>Live Disruption Heatmap</span>
          </h1>
          <p className="text-gray-400 text-sm mt-1">Real-time weather & sensor triggers across zones</p>
        </div>
        <div className="flex space-x-4">
          <div className="flex items-center space-x-2 text-sm bg-darker px-4 py-2 rounded-lg border border-white/5">
            <span className="w-3 h-3 rounded-full bg-risk opacity-80"></span>
            <span className="text-gray-300">High Risk Active</span>
          </div>
          <div className="flex items-center space-x-2 text-sm bg-darker px-4 py-2 rounded-lg border border-white/5">
            <span className="w-3 h-3 rounded-full bg-processing opacity-80"></span>
            <span className="text-gray-300">Monitoring Zone</span>
          </div>
          <button className="flex items-center space-x-2 px-4 py-2 bg-ai/10 text-ai rounded-lg hover:bg-ai hover:text-white transition-colors border border-ai/20">
            <Layers size={16} />
            <span>Toggle Layers</span>
          </button>
        </div>
      </div>

      <div className="flex-1 rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative">
        <MapContainer 
          center={[12.9716, 77.5946]} 
          zoom={12} 
          style={{ height: '100%', width: '100%', background: '#0F172A' }}
          className="z-0"
        >
          {/* Dark theme tile layer */}
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          />
          
          {mockHeatzones.map((zone) => (
            <CircleMarker 
              key={zone.id}
              center={zone.pos}
              radius={zone.radius}
              pathOptions={{
                fillColor: zone.intensity > 80 ? '#EF4444' : '#F59E0B',
                fillOpacity: 0.4,
                color: zone.intensity > 80 ? '#EF4444' : '#F59E0B',
                weight: 1
              }}
            >
              <Popup className="bg-card text-white border border-white/10 p-0 rounded-lg overflow-hidden w-64">
                <div className="bg-darker p-3 border-b border-white/10">
                  <div className="font-bold text-white flex items-center space-x-2">
                    <AlertTriangle size={16} className={zone.intensity > 80 ? 'text-risk' : 'text-processing'} />
                    <span>Zone Alert Activated</span>
                  </div>
                </div>
                <div className="p-3 text-sm">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-400">Trigger:</span>
                    <span className="font-semibold text-white">Rain & Heat</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-400">Impacted:</span>
                    <span className="font-semibold text-white">~{Math.floor(zone.radius * 3.5)} workers</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status:</span>
                    <span className={`font-semibold ${zone.intensity > 80 ? 'text-risk' : 'text-processing'}`}>Paying Out</span>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
        
        {/* Overlay pulse effect to make it feel alive */}
        <div className="absolute inset-0 pointer-events-none mix-blend-screen bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-ai/10 via-transparent to-transparent opacity-50 animate-pulse"></div>
      </div>
    </div>
  );
};

export default DisruptionMapPage;
