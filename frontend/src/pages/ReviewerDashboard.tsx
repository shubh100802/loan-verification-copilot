import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getDashboardSummary, getExceptions } from '../services/mock/services.mock';
import { StatCard } from '../components/StatCard';
import {
  Sparkles,
  CheckCircle,
  Clock,
  ArrowRight,
  ShieldAlert,
  ArrowUpRight
} from 'lucide-react';
import { SeverityBadge } from '../components/Badge';

export const ReviewerDashboard: React.FC = () => {
  const navigate = useNavigate();

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['dashboardSummary'],
    queryFn: getDashboardSummary
  });

  const { data: exceptions, isLoading: exceptionsLoading } = useQuery({
    queryKey: ['exceptions', { status: 'open' }],
    queryFn: () => getExceptions({ status: 'open' })
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900/40 p-6 rounded-2xl border border-slate-700">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Reviewer Worklist Control</h1>
          <p className="text-slate-400 text-sm mt-1">
            Analyze exception alerts, verify AI recommended corrections, and sign off verified loan blocks.
          </p>
        </div>
        <button
          onClick={() => navigate('/reviewer/exceptions')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-slate-955 rounded-lg text-sm font-bold transition shadow-lg border-transparent"
        >
          <span>Open Exception Queue</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {/* Stats row */}
      {summaryLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="h-28 bg-slate-900 border border-slate-700 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Pending Exceptions"
            value={summary?.pendingExceptions || 0}
            subtext="Awaiting manual evaluation"
            icon={Clock}
            sparklineData={[8, 7, 6, 5, 5]}
          />
          <StatCard
            title="Critical Errors"
            value={summary?.criticalExceptionsCount || 0}
            subtext="High-risk category flags"
            icon={ShieldAlert}
            trend={{ value: 'Priority', type: 'down' }}
            sparklineData={[3, 2, 2, 1, 1]}
          />
          <StatCard
            title="AI Assisted Reviews"
            value={summary?.pendingExceptions || 0}
            subtext="Available copilot recommendations"
            icon={Sparkles}
            sparklineData={[8, 7, 6, 5, 5]}
          />
          <StatCard
            title="Reviewed Today"
            value={summary?.recordsReviewedToday || 0}
            subtext="Completed action cycles"
            icon={CheckCircle}
            sparklineData={[0, 1, 2, 3, summary?.recordsReviewedToday || 0]}
          />
        </div>
      )}

      {/* Copilot Review Queue */}
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-[1.5px] bg-indigo-500 opacity-80" />
        <div className="flex items-center justify-between border-b border-slate-700 pb-3 mb-4">
          <span className="font-bold text-sm text-slate-200 tracking-wide flex items-center gap-1.5">
            <span className="text-indigo-400">✦</span> AI COPILOT
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
            <span>{(exceptions || []).length} Recommendations Awaiting Human Review</span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center text-xs">
          <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-xl">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Critical Exceptions</span>
            <span className="text-2xl font-extrabold text-slate-200 block mt-1">
              {(exceptions || []).filter(e => e.severity === 'critical' || e.severity === 'high').length}
            </span>
          </div>
          <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-xl">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Source Conflicts</span>
            <span className="text-2xl font-extrabold text-indigo-400 block mt-1">
              {(exceptions || []).filter(e => e.ruleId === 'R015' || e.ruleId === 'R010').length}
            </span>
          </div>
          <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-xl">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Correction Suggestions</span>
            <span className="text-2xl font-extrabold text-emerald-400 block mt-1">
              {(exceptions || []).filter(e => e.affectedField && e.affectedField !== 'loan_id').length}
            </span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={() => navigate('/reviewer/exceptions')}
            className="inline-flex items-center gap-1.5 py-2 px-4 bg-indigo-500 hover:bg-indigo-400 text-slate-955 font-bold rounded-lg text-xs transition"
          >
            <span>Open Review Queue</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Attention Required Worklist table */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4 border-b border-slate-700 pb-4">
          <div>
            <span className="text-slate-100 font-bold text-sm block">Attention Required Worklist</span>
            <span className="text-slate-500 text-[11px] font-semibold uppercase mt-0.5 block">
              Exceptions sorted by severity rank
            </span>
          </div>
          <button
            onClick={() => navigate('/reviewer/exceptions')}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition"
          >
            <span>View Exception Queue</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {exceptionsLoading ? (
          <div className="space-y-3 animate-pulse">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="h-12 bg-slate-850/50 rounded animate-pulse" />
            ))}
          </div>
        ) : exceptions?.length === 0 ? (
          <div className="py-12 text-center text-slate-550 font-semibold text-sm">
            No exceptions currently require your attention.
          </div>
        ) : (
          <div className="divide-y divide-slate-700 max-h-[400px] overflow-y-auto pr-1">
            {exceptions?.map((exc) => (
              <div
                key={exc.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-950/20 px-2 rounded-lg transition"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div className="mt-0.5 sm:mt-0">
                    <SeverityBadge severity={exc.severity} />
                  </div>
                  <div>
                    <span className="font-bold text-slate-200 block text-xs tracking-wide">
                      {exc.loanId} • {exc.ruleName}
                    </span>
                    <p className="text-slate-450 text-xs mt-0.5 max-w-lg leading-relaxed">
                      {exc.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                  <div className="text-right text-xs">
                    <span className="text-slate-500 block font-medium">Field: {exc.affectedField}</span>
                    <span className="text-indigo-400 font-semibold block flex items-center gap-1 justify-end">
                      <Sparkles className="h-3 w-3" />
                      <span>Copilot ready</span>
                    </span>
                  </div>
                  <button
                    onClick={() => navigate(`/reviewer/exceptions/${exc.loanId}`)}
                    className="p-1.5 border border-slate-700 hover:bg-slate-800/50 text-slate-200 rounded-lg transition"
                    title="Review Exception Details"
                  >
                    <ArrowUpRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export default ReviewerDashboard;
