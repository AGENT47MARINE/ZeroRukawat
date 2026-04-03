import React from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useStore } from '../../store/useStore';
import { Navigation, AlertTriangle, Layers, Radio } from 'lucide-react';

const DisruptionMapPage = () => {
  const { disruptions } = useStore();

  const mockHeatzones = [
    { id: 1, pos: [12.9716, 77.5946], intensity: 80, radius: 40, label: 'MG Road' },
    { id: 2, pos: [12.9352, 77.6245], intensity: 95, radius: 60, label: 'Koramangala' },
    { id: 3, pos: [12.9698, 77.7500], intensity: 60, radius: 30, label: 'Whitefield' },
  ];

  return (
    <div className="h-full flex flex-col gap-4 animate-fade-up">
      {/* Header Bar */}
      <div className="glass-panel p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-ai/10 flex items-center justify-center text-ai">
            <Navigation size={18} />
          </div>
          <div>
            <h1 className="text-title text-txt-primary">Live Disruption Heatmap</h1>
            <p className="text-caption text-txt-muted">Real-time weather & sensor triggers across zones</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 badge-risk">
            <Radio size={10} className="animate-pulse" />
            <span>High Risk Active</span>
          </div>
          <div className="flex items-center gap-2 badge-processing">
            <span>Monitoring</span>
          </div>
          <button className="btn-ghost py-2 text-xs">
            <Layers size={14} />
            <span>Layers</span>
          </button>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 rounded-2xl overflow-hidden border border-bdr shadow-card relative">
        <MapContainer
          center={[12.9716, 77.5946]}
          zoom={12}
          style={{ height: '100%', width: '100%', background: '#09090B' }}
          className="z-0"
        >
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
                fillOpacity: 0.35,
                color: zone.intensity > 80 ? '#EF4444' : '#F59E0B',
                weight: 1.5,
              }}
            >
              <Popup>
                <div style={{ background: '#161821', color: '#f4f4f5', borderRadius: 12, overflow: 'hidden', minWidth: 200 }}>
                  <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AlertTriangle size={14} style={{ color: zone.intensity > 80 ? '#EF4444' : '#F59E0B' }} />
                    <span style={{ fontWeight: 700, fontSize: 13 }}>{zone.label} — Zone Alert</span>
                  </div>
                  <div style={{ padding: '10px 14px', fontSize: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ color: '#71717A' }}>Trigger</span>
                      <span style={{ fontWeight: 600 }}>Rain & Heat</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ color: '#71717A' }}>Impacted</span>
                      <span style={{ fontWeight: 600 }}>~{Math.floor(zone.radius * 3.5)} workers</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#71717A' }}>Status</span>
                      <span style={{ fontWeight: 600, color: zone.intensity > 80 ? '#EF4444' : '#F59E0B' }}>Paying Out</span>
                    </div>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default DisruptionMapPage;
