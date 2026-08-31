import React from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  ShieldCheck,
  FileSpreadsheet,
  Upload,
  History,
  AlertOctagon,
  CheckCircle,
  FileCode,
  LogOut,
  ChevronRight,
  User,
  Menu,
  X
} from 'lucide-react';
import { useToast } from '../hooks/useToast';

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

const ROLE_NAVIGATION: Record<'operator' | 'reviewer' | 'consumer', NavItem[]> = {
  operator: [
    { label: 'Overview', path: '/operator', icon: FileSpreadsheet },
    { label: 'Ingest Tape', path: '/operator/upload', icon: Upload },
    { label: 'Import History', path: '/operator/history', icon: History }
  ],
  reviewer: [
    { label: 'Worklist', path: '/reviewer', icon: FileSpreadsheet },
    { label: 'Exception Queue', path: '/reviewer/exceptions', icon: AlertOctagon }
  ],
  consumer: [
    { label: 'Summary', path: '/consumer', icon: FileSpreadsheet },
    { label: 'Verified Records', path: '/consumer/verified', icon: CheckCircle }
  ]
};

export const AppShell: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Retrieve auth role
  const rawRole = localStorage.getItem('user_role') || 'operator';
  const role = (['operator', 'reviewer', 'consumer'].includes(rawRole) ? rawRole : 'operator') as
    | 'operator'
    | 'reviewer'
    | 'consumer';

  const userName = localStorage.getItem('user_name') || 'Demo Operational Account';

  const navItems = ROLE_NAVIGATION[role] || [];

  const handleLogout = () => {
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_name');
    showToast('Logged out successfully', 'info');
    navigate('/login');
  };



  // Build Breadcrumbs from pathname
  const pathParts = location.pathname.split('/').filter(Boolean);
  const breadcrumbs = pathParts.map((part, idx) => {
    const path = '/' + pathParts.slice(0, idx + 1).join('/');
    const label = part.charAt(0).toUpperCase() + part.slice(1).replace('-', ' ');
    const isLast = idx === pathParts.length - 1;

    return (
      <React.Fragment key={path}>
        <ChevronRight className="h-3 w-3 text-slate-600 flex-shrink-0" />
        {isLast ? (
          <span className="text-slate-350 font-semibold truncate max-w-[120px] sm:max-w-xs">{label}</span>
        ) : (
          <Link to={path} className="text-slate-500 hover:text-slate-300 transition truncate">
            {label}
          </Link>
        )}
      </React.Fragment>
    );
  });

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100 font-sans">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-950 border-r border-slate-700 shrink-0">
        {/* Brand Header */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-700 bg-slate-950">
          <ShieldCheck className="h-6 w-6 text-indigo-400" />
          <span className="font-bold text-sm tracking-wide text-slate-100 uppercase">
            Loan Verification
          </span>
        </div>

        {/* User Identity widget */}
        <div className="p-4 border-b border-slate-700 bg-slate-950/20">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <User className="h-4 w-4" />
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-slate-200 truncate">{userName}</div>
              <div className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider mt-0.5">
                {role.replace('_', ' ')}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.path ||
              (item.path !== '/' &&
                item.path !== '/operator' &&
                item.path !== '/reviewer' &&
                item.path !== '/consumer' &&
                location.pathname.startsWith(item.path));

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 border-l-2 text-sm font-medium transition duration-150 ${
                  isActive
                    ? 'border-indigo-500 bg-slate-900/45 text-slate-100 font-semibold'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/15'
                }`}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>



        {/* Logout bar */}
        <div className="p-4 border-t border-slate-850">
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full px-3 py-2 border border-slate-800 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-850 transition duration-150 text-xs font-semibold"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Panel Content container */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Navbar */}
        <header className="h-16 border-b border-slate-850 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-1 text-slate-400 hover:text-slate-200 lg:hidden focus:outline-none"
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* Breadcrumb line */}
            <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <span className="text-indigo-400 font-semibold uppercase tracking-wider text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 mr-1">
                {role}
              </span>
              <Link to={`/${role}`} className="hover:text-slate-300 transition">
                Home
              </Link>
              {breadcrumbs}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick API Response link */}
            <span className="hidden sm:inline-flex items-center gap-1 bg-slate-900 px-2.5 py-1 rounded border border-slate-800 text-[10px] font-bold text-slate-400">
              <FileCode className="h-3 w-3 text-slate-500" />
              <span>API Server Active</span>
            </span>
          </div>
        </header>

        {/* Mobile Menu Panel Drawer overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden bg-slate-950/80 backdrop-blur-sm">
            <div className="relative flex flex-col w-72 max-w-xs bg-slate-950 border-r border-slate-700 animate-slide-right">
              {/* Close Button */}
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Mobile Sidebar Head */}
              <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-700">
                <ShieldCheck className="h-6 w-6 text-indigo-400" />
                <span className="font-bold text-sm tracking-wide text-slate-100 uppercase">
                  Loan Verification
                </span>
              </div>

              {/* Mobile user state */}
              <div className="p-4 border-b border-slate-700">
                <div className="text-xs font-bold text-slate-200">{userName}</div>
                <div className="text-[10px] font-semibold text-indigo-400 uppercase mt-0.5 tracking-wider">
                  {role}
                </div>
              </div>

              {/* Mobile links */}
              <nav className="flex-1 px-3 py-4 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    location.pathname === item.path ||
                    (item.path !== '/' &&
                      item.path !== '/operator' &&
                      item.path !== '/reviewer' &&
                      item.path !== '/consumer' &&
                      location.pathname.startsWith(item.path));

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 border-l-2 text-sm font-medium transition duration-150 ${
                        isActive
                          ? 'border-indigo-500 bg-slate-900/45 text-slate-100 font-semibold'
                          : 'border-transparent text-slate-400 hover:bg-slate-900/15'
                      }`}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* Mobile Logout */}
              <div className="p-4 border-t border-slate-700">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="flex items-center justify-center gap-2 w-full px-3 py-2 border border-slate-700 rounded-lg text-slate-400 hover:text-slate-200 text-xs font-semibold"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content Outlet Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
export default AppShell;
