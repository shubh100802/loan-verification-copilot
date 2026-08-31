import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getDashboardSummary, getLoans } from '../services/mock/services.mock';
import { StatCard } from '../components/StatCard';
import { LineChart } from '../components/SVGCharts';
import {
  FileCheck2,
  TrendingUp,
  Activity,
  Award,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Database
} from 'lucide-react';
import { useToast } from '../hooks/useToast';

export const ConsumerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['dashboardSummary'],
    queryFn: getDashboardSummary
  });

  const { data: verifiedLoans, isLoading: loansLoading } = useQuery({
    queryKey: ['verifiedLoans'],
    queryFn: () => getLoans({ status: 'verified' })
  });

  const trendData = [
    { label: 'Week 1', value: 55.4 },
    { label: 'Week 2', value: 59.8 },
    { label: 'Week 3', value: 62.1 },
    { label: 'Week 4', value: 65.0 },
    { label: 'Week 5 (Current)', value: 68.5 }
  ];

  const handleExportAll = () => {
    showToast('Preparing final verified loan tape CSV export...', 'info');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900/40 p-6 rounded-2xl border border-slate-700">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Consumer Audit Center</h1>
          <p className="text-slate-400 text-sm mt-1">
            Access certified data pools, export authorized financial assets, and verify record hashes.
          </p>
        </div>
        <button
          onClick={handleExportAll}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-slate-955 rounded-lg text-sm font-bold transition border-transparent"
        >
          <Database className="h-4 w-4" />
          <span>Export Verified Tape</span>
        </button>
      </div>

      {/* Metrics Row */}
      {summaryLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="h-28 bg-slate-900 border border-slate-700 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Verified Loan Blocks"
            value={verifiedLoans?.length || 0}
            subtext="Certified and signed records"
            icon={ShieldCheck}
            sparklineData={[1, 1, 2, 2, verifiedLoans?.length || 1]}
          />
          <StatCard
            title="Verification Rate"
            value={`${summary?.verificationRate || 0}%`}
            subtext="Of total imported loans"
            icon={TrendingUp}
            trend={{ value: '68.5%', type: 'up' }}
            sparklineData={[55, 59, 62, 65, 68]}
          />
          <StatCard
            title="System Quality Score"
            value={`${summary?.qualityScore || 0}%`}
            subtext="Consolidated rule metrics"
            icon={Award}
            sparklineData={[82, 84, 85, 86, 87]}
          />
          <StatCard
            title="Records Ingested Today"
            value={summary?.totalRecords || 0}
            subtext="Available active tapes"
            icon={Activity}
            sparklineData={[1800, 1850, 1920, 1980, 2000]}
          />
        </div>
      )}

      {/* Trends Graph */}
      <LineChart data={trendData} title="Verification rate trends (rolling weeks)" valueSuffix="%" />

      {/* Recent Verified Records */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4 border-b border-slate-700 pb-4">
          <div>
            <span className="text-slate-100 font-bold text-sm block">Recent Certified Assets</span>
            <span className="text-slate-500 text-[11px] font-semibold uppercase mt-0.5 block">
              Immutable hashes matched and signed by reviewer
            </span>
          </div>
          <button
            onClick={() => navigate('/consumer/verified')}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition"
          >
            <span>View All Verified Records</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {loansLoading ? (
          <div className="space-y-3 animate-pulse">
            {Array.from({ length: 2 }).map((_, idx) => (
              <div key={idx} className="h-12 bg-slate-850/50 rounded" />
            ))}
          </div>
        ) : !verifiedLoans || verifiedLoans.length === 0 ? (
          <div className="py-12 text-center text-slate-550 font-semibold text-sm">
            No records have been signed off as verified yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-700">
            {verifiedLoans.slice(0, 3).map((loan) => (
              <div
                key={loan.loanId}
                className="py-3 flex items-center justify-between text-sm hover:bg-slate-950/20 px-2 rounded-lg transition"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <FileCheck2 className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-200 block">{loan.loanId}</span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mt-0.5">
                      Borrower: {loan.borrowerName} • Principal: ₹{loan.originalPrincipal.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-xs text-slate-450 block font-bold">SHA-256 Block Match</span>
                    <span className="text-[10px] text-slate-550 font-mono block">
                      {/* Short mock hash */}
                      {Math.random().toString(16).substring(2, 8).toUpperCase()}...
                      {Math.random().toString(16).substring(2, 6).toUpperCase()}
                    </span>
                  </div>
                  <button
                    onClick={() => navigate(`/consumer/verified/${loan.loanId}`)}
                    className="p-1 text-slate-400 hover:text-slate-200 transition"
                  >
                    <ChevronRight className="h-5 w-5" />
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
export default ConsumerDashboard;
