import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { Zap, Lock, Mail, AlertCircle, ShieldAlert } from 'lucide-react';

const LoginPage = () => {
  const { login } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (email === 'admin' && password === '123') {
      login();
    } else {
      setError('Invalid credentials. Hint: admin / 123');
    }
  };

  return (
    <div className="min-h-screen bg-darker flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-ai/20 rounded-full blur-[120px] opacity-20 pointer-events-none"></div>
      
      <div className="w-full max-w-md glass-panel p-8 relative z-10 animate-in fade-in zoom-in duration-500">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-success to-ai flex items-center justify-center shadow-lg shadow-success/20 mb-4">
            <Zap size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
            ZeroRukawat Admin
          </h1>
          <p className="text-gray-400 mt-2 text-sm text-center">Secure command center access</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-risk/10 border border-risk/20 flex items-center space-x-2 text-risk text-sm">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-300 ml-1">Username / Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                <Mail size={18} />
              </div>
              <input 
                type="text" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-ai/50 focus:ring-1 focus:ring-ai/50 transition-all"
                placeholder="admin"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-300 ml-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                <Lock size={18} />
              </div>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-ai/50 focus:ring-1 focus:ring-ai/50 transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full flex items-center justify-center space-x-2 bg-ai text-white rounded-xl py-3 font-bold hover:bg-ai/90 shadow-lg shadow-ai/20 transition-all hover:-translate-y-0.5 mt-2"
          >
            <span>Authenticate</span>
            <ShieldAlert size={18} />
          </button>
        </form>

        <div className="mt-8 text-center border-t border-white/5 pt-6">
          <p className="text-xs text-gray-500">
            Protected by ZeroRukawat Enterprise Security
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
