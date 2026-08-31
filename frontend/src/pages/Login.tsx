import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, FileSpreadsheet, Layers, ShieldAlert, ArrowRight } from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();

  const workspaces = [
    {
      role: 'operator',
      title: 'Data Operator',
      description: 'Import loan data, monitor ingestion, and review validation summaries.',
      bullets: [
        'Import loan tape data',
        'Monitor ingestion progress',
        'Review validation summary logs'
      ],
      cta: 'Continue as Data Operator',
      path: '/login/operator',
      icon: FileSpreadsheet,
      accentColor: 'text-indigo-400'
    },
    {
      role: 'reviewer',
      title: 'Exception Reviewer',
      description: 'Review validation exceptions, analyze AI recommendations, and approve or request corrections.',
      bullets: [
        'Review active exceptions list',
        'Validate AI recommendations',
        'Approve or request corrections'
      ],
      cta: 'Continue as Reviewer',
      path: '/login/reviewer',
      icon: ShieldAlert,
      accentColor: 'text-emerald-400'
    },
    {
      role: 'consumer',
      title: 'Data Consumer',
      description: 'View verified records, inspect ledger audit history, and access canonical loan data payloads.',
      bullets: [
        'Inspect verified canonical loans',
        'View full audit history trace log',
        'Access cryptographic blocks API'
      ],
      cta: 'Continue as Data Consumer',
      path: '/login/consumer',
      icon: Layers,
      accentColor: 'text-blue-400'
    }
  ] as const;

  return (
    <div className="min-h-screen bg-slate-955 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="text-center max-w-xl mx-auto mb-10">
        <div className="inline-flex h-10 w-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 items-center justify-center text-indigo-400 mb-4 shadow-sm">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-100">
          Loan Verification Copilot
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Intain Campus FinTech Challenge 2026
        </p>
      </div>

      <div className="max-w-4xl mx-auto w-full">
        <div className="bg-slate-900 border border-slate-700 shadow-xl rounded-xl p-6 md:p-8 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-[1.5px] bg-indigo-500 opacity-80" />

          <h2 className="text-lg font-bold text-slate-200 text-center mb-2">
            Choose your workspace
          </h2>
          <p className="text-xs text-slate-400 text-center mb-8">
            Access role-specific workflows to manage, verify, or audit canonical loan records
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {workspaces.map((ws) => {
              const Icon = ws.icon;
              return (
                <div
                  key={ws.role}
                  className="bg-slate-950/40 border border-slate-700 rounded-xl p-5 flex flex-col justify-between hover:border-slate-600 transition group"
                >
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded bg-slate-900 border border-slate-700">
                        <Icon className={`h-4.5 w-4.5 ${ws.accentColor}`} />
                      </div>
                      <span className="font-bold text-sm text-slate-200 tracking-wide">
                        {ws.title}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {ws.description}
                    </p>

                    <ul className="space-y-1.5 pt-2">
                      {ws.bullets.map((b, i) => (
                        <li key={i} className="text-[10px] text-slate-500 flex items-center gap-1.5 font-medium">
                          <span className="h-1 w-1 bg-indigo-400 rounded-full" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={() => navigate(ws.path)}
                    className="w-full mt-6 py-2 px-3 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white font-bold rounded-lg text-xs transition flex items-center justify-center gap-1 border border-slate-700 group-hover:border-slate-600"
                  >
                    <span>{ws.cta}</span>
                    <ArrowRight className="h-3 w-3 text-slate-400 group-hover:text-indigo-400 transition" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
export default Login;
