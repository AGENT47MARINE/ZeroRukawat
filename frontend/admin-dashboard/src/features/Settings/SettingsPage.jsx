import React, { useState } from 'react';
import { Settings, Bell, Shield, Globe, Database, Users, ChevronRight, ToggleLeft, ToggleRight } from 'lucide-react';

const Toggle = ({ enabled, onToggle, label, description }) => (
  <div className="flex items-center justify-between py-3">
    <div>
      <div className="text-sm font-medium text-txt-primary">{label}</div>
      {description && <div className="text-caption text-txt-muted mt-0.5">{description}</div>}
    </div>
    <button onClick={onToggle} className="transition-colors">
      {enabled
        ? <ToggleRight size={28} className="text-success" />
        : <ToggleLeft size={28} className="text-txt-muted" />
      }
    </button>
  </div>
);

const SettingsPage = () => {
  const [notifications, setNotifications] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [autoApprove, setAutoApprove] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  const sections = [
    {
      title: 'Notifications',
      icon: Bell,
      items: [
        { type: 'toggle', label: 'Push Notifications', desc: 'Receive real-time alerts for disruptions', value: notifications, onChange: () => setNotifications(!notifications) },
        { type: 'toggle', label: 'Email Alerts', desc: 'Daily summary and critical alerts via email', value: emailAlerts, onChange: () => setEmailAlerts(!emailAlerts) },
      ]
    },
    {
      title: 'Fraud Engine',
      icon: Shield,
      items: [
        { type: 'toggle', label: 'Auto-Approve Low Risk', desc: 'Automatically approve claims with risk score < 30', value: autoApprove, onChange: () => setAutoApprove(!autoApprove) },
        { type: 'display', label: 'Fraud Threshold', value: '65/100' },
        { type: 'display', label: 'GPS Tolerance', value: '500m radius' },
      ]
    },
    {
      title: 'Platform',
      icon: Globe,
      items: [
        { type: 'display', label: 'API Endpoint', value: 'api.zerorukawat.com/v1' },
        { type: 'display', label: 'Region', value: 'ap-south-1 (Mumbai)' },
        { type: 'display', label: 'Model Version', value: 'v2.4.1-prod' },
      ]
    },
    {
      title: 'Data & Storage',
      icon: Database,
      items: [
        { type: 'display', label: 'Worker Records', value: '12,482' },
        { type: 'display', label: 'Claims Processed (YTD)', value: '148,293' },
        { type: 'display', label: 'Storage Used', value: '2.4 GB / 10 GB' },
      ]
    }
  ];

  return (
    <div className="max-w-3xl mx-auto animate-fade-up pb-8">
      <div className="mb-6">
        <h1 className="section-title">Settings</h1>
        <p className="section-subtitle">Manage platform configuration and preferences</p>
      </div>

      <div className="space-y-4">
        {sections.map((section, si) => {
          const Icon = section.icon;
          return (
            <div key={si} className="glass-panel overflow-hidden">
              <div className="px-5 py-4 border-b border-bdr flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-surface-3 border border-bdr flex items-center justify-center text-txt-secondary">
                  <Icon size={16} />
                </div>
                <h3 className="text-title text-txt-primary">{section.title}</h3>
              </div>
              <div className="px-5 divide-y divide-border">
                {section.items.map((item, ii) => (
                  item.type === 'toggle' ? (
                    <Toggle
                      key={ii}
                      enabled={item.value}
                      onToggle={item.onChange}
                      label={item.label}
                      description={item.desc}
                    />
                  ) : (
                    <div key={ii} className="flex items-center justify-between py-3">
                      <span className="text-sm text-txt-secondary">{item.label}</span>
                      <span className="text-sm font-medium text-txt-primary font-mono">{item.value}</span>
                    </div>
                  )
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SettingsPage;
