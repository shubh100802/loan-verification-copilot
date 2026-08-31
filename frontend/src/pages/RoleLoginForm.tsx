import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, AlertCircle, Key, Mail, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useToast } from '../hooks/useToast';

interface RoleLoginFormProps {
  role: 'operator' | 'reviewer' | 'consumer';
  title: string;
  description: string;
  redirect: string;
}

export const RoleLoginForm: React.FC<RoleLoginFormProps> = ({ role, title, description, redirect }) => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const cleanedEmail = email.trim().toLowerCase();

    // Field-level validation checks
    if (!cleanedEmail) {
      setError('Please enter your email.');
      setIsLoading(false);
      showToast('Email is required', 'error');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      setIsLoading(false);
      showToast('Password is required', 'error');
      return;
    }

    try {
      const { loginUser } = await import('../services/api/api.service');
      const user = await loginUser(cleanedEmail, password);

      if (user.role !== role) {
        setError(`Access denied. Active workspace requires a ${role} role.`);
        showToast('Invalid role authorization', 'error');
        setIsLoading(false);
        return;
      }

      localStorage.setItem('user_role', user.role);
      localStorage.setItem('user_email', user.email);
      localStorage.setItem('user_name', user.name);
      localStorage.setItem('user', JSON.stringify(user));

      showToast(`Logged in successfully as ${user.name}`, 'success');
      navigate(redirect);
    } catch (err: any) {
      setError(err.message || 'Authentication failed.');
      showToast(err.message || 'Authentication failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseDemoCreds = () => {
    if (role === 'operator') {
      setEmail('operator@demo.local');
      setPassword('Operator@123');
    } else if (role === 'reviewer') {
      setEmail('reviewer@demo.local');
      setPassword('Reviewer@123');
    } else {
      setEmail('consumer@demo.local');
      setPassword('Consumer@123');
    }
    setError(null);
    showToast('Populated demo credentials', 'info');
  };

  return (
    <div className="min-h-screen bg-slate-955 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
        <div className="inline-flex h-10 w-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 items-center justify-center text-indigo-400 mb-4 shadow-sm">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h2 className="text-[11px] font-extrabold tracking-widest text-slate-500 uppercase">
          Loan Verification Copilot
        </h2>
        <h1 className="text-2xl font-bold tracking-tight text-slate-100 mt-1">
          {title}
        </h1>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900 py-8 px-4 border border-slate-700 shadow-xl rounded-xl sm:px-10 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-[1.5px] bg-indigo-500 opacity-80" />

          <p className="text-xs text-slate-400 mb-6 text-center">
            {description}
          </p>

          {error && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-start gap-2.5 text-xs text-rose-350">
              <AlertCircle className="h-4 w-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Email
              </label>
              <div className="mt-1.5 relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 pointer-events-none">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={`${role}@demo.local`}
                  className="block w-full pl-9 pr-3 py-2 border border-slate-700 rounded-lg bg-slate-950 text-slate-100 placeholder-slate-650 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Password
              </label>
              <div className="mt-1.5 relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 pointer-events-none">
                  <Key className="h-4 w-4" />
                </span>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-9 pr-10 py-2 border border-slate-700 rounded-lg bg-slate-950 text-slate-100 placeholder-slate-650 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-slate-955 bg-indigo-500 hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 disabled:opacity-50"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Demo access helper button */}
          <div className="mt-6 pt-5 border-t border-slate-800 text-center">
            <button
              type="button"
              onClick={handleUseDemoCreds}
              className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-750 hover:border-slate-600 bg-slate-950/60 rounded text-[10px] text-slate-400 hover:text-slate-200 transition font-bold uppercase tracking-wider"
            >
              <span>Use demo credentials</span>
            </button>
          </div>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-300 transition font-semibold"
            >
              <ArrowLeft className="h-3 w-3" />
              <span>Back to workspace selection</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default RoleLoginForm;
