import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { Zap, Lock, Mail, AlertCircle, ShieldAlert, Eye, EyeOff } from 'lucide-react';

const LoginPage = () => {
  const { login } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Simulate network delay
    await new Promise(r => setTimeout(r, 800));
    
    if (email === 'admin' && password === '123') {
      login();
    } else {
      setError('Invalid credentials. Hint: admin / 123');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-0 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient background */}
      <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] bg-ai/8 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] bg-success/5 rounded-full blur-[80px] pointer-events-none"></div>

      <div className="w-full max-w-[420px] relative z-10 animate-fade-up">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-ai to-ai-dark flex items-center justify-center shadow-glow-ai mb-5">
            <Zap size={28} className="text-white" />
          </div>
          <h1 className="text-display font-display bg-clip-text text-transparent bg-gradient-to-b from-txt-primary to-txt-secondary">
            ZeroRukawat
          </h1>
          <p className="text-body text-txt-tertiary mt-2">Admin Command Center</p>
        </div>

        {/* Login Card */}
        <div className="glass-panel p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="p-3 rounded-xl bg-risk/10 border border-risk/15 flex items-center gap-2.5 text-risk text-sm animate-fade-up">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="login-email" className="text-caption text-txt-secondary ml-0.5">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-txt-muted">
                  <Mail size={16} />
                </div>
                <input
                  id="login-email"
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-10"
                  placeholder="Enter username"
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="login-password" className="text-caption text-txt-secondary ml-0.5">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-txt-muted">
                  <Lock size={16} />
                </div>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-10 pr-11"
                  placeholder="Enter password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-txt-muted hover:text-txt-secondary transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="btn-primary w-full py-3 mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Authenticate</span>
                  <ShieldAlert size={16} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-overline text-txt-muted mt-6">
          Protected by ZeroRukawat Enterprise Security
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
