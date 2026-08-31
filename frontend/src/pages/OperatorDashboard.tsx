import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getDashboardSummary, getImportJobs, getExceptions } from '../services/mock/services.mock';
import { StatCard } from '../components/StatCard';
import { DonutChart, BarChart, LineChart } from '../components/SVGCharts';
import {
  FileText,
  AlertTriangle,
  Activity,
  Award,
  UploadCloud,
  ChevronRight,
  ArrowRight
} from 'lucide-react';

export const OperatorDashboard: React.FC = () => {
  const navigate = useNavigate();

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['dashboardSummary'],
    queryFn: getDashboardSummary
  });

  const { data: jobs, isLoading: jobsLoading } = useQuery({
    queryKey: ['importJobs'],
    queryFn: getImportJobs
  });

  const { data: exceptions, isLoading: exceptionsLoading } = useQuery({
    queryKey: ['exceptions', { status: 'all' }],
    queryFn: () => getExceptions({ status: 'all' })
  });

  const correctionsNeeded = exceptions?.filter(e => e.status === 'open' || e.status === 'investigating') || [];

  // Static mock chart coordinates
  const qualityTrendData = [
    { label: 'Q1 2026', value: 82.5 },
    { label: 'May', value: 84.1 },
    { label: 'Jun', value: 85.6 },
    { label: 'Jul', value: 86.2 },
    { label: 'Aug (Current)', value: 87.1 }
  ];

  const validVsInvalidData = [
    { label: 'Tape Ingest', valueA: 1982, valueB: 18 },
    { label: 'Servicer Up', valueA: 698, valueB: 2 },
    { label: 'Doc Ingest', valueA: 120, valueB: 0 }
  ];

  const severityData = [
    { label: 'Critical', value: 43, color: '#f43f5e' },
    { label: 'High', value: 110, color: '#f97316' },
    { label: 'Medium', value: 85, color: '#facc15' },
    { label: 'Low', value: 20, color: '#10b981' }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900/40 p-6 rounded-2xl border border-slate-700">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">
            Operator Verification Deck
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Upload loan tapes, reconcile servicers updates, and verify validation rules.
          </p>
        </div>
        <button
          onClick={() => navigate('/operator/upload')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-slate-950 rounded-lg text-sm font-bold transition shadow-lg"
        >
          <UploadCloud className="h-4 w-4" />
          <span>Import Loan Tape</span>
        </button>
      </div>

      {/* Metrics Row */}
      {summaryLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="h-28 bg-slate-900 border border-slate-850 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Ingested Records"
            value={summary?.totalRecords || 0}
            subtext="Across active upload files"
            icon={FileText}
            sparklineData={[1800, 1850, 1920, 1980, 2000]}
          />
          <StatCard
            title="Valid Records"
            value={summary?.validRecords || 0}
            subtext="Clean of exceptions"
            icon={Activity}
            trend={{ value: '87.1%', type: 'up' }}
            sparklineData={[1600, 1620, 1680, 1720, 1742]}
          />
          <StatCard
            title="Records with Exceptions"
            value={summary?.exceptionsCount || 0}
            subtext="Pending human/AI action"
            icon={AlertTriangle}
            trend={{ value: '12.9%', type: 'down' }}
            sparklineData={[300, 290, 270, 260, 258]}
          />
          <StatCard
            title="Calculated Quality Score"
            value={`${summary?.qualityScore || 0}%`}
            subtext="Target threshold: 95.0%"
            icon={Award}
            sparklineData={[82, 84, 85, 86, 87]}
          />
        </div>
      )}

      {/* AI Copilot Insights */}
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-[1.5px] bg-indigo-500 opacity-80" />
        <div className="flex items-center justify-between border-b border-slate-700 pb-3 mb-4">
          <span className="font-bold text-sm text-slate-200 tracking-wide flex items-center gap-1.5">
            <span className="text-indigo-400">✦</span> AI COPILOT INSIGHTS
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Copilot Ready</span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div className="space-y-3">
            <p className="text-slate-400 font-medium">
              Latest import analysis: <strong className="text-slate-200 font-bold">43 critical exceptions</strong> require review.
            </p>
            <div className="space-y-1.5 bg-slate-950/40 p-3 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Copilot Identified:</span>
              <div className="flex items-center gap-2 text-slate-300">
                <span className="h-1 w-1 bg-indigo-400 rounded-full" />
                <span>18 likely source conflicts</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <span className="h-1 w-1 bg-indigo-400 rounded-full" />
                <span>11 balance-related anomalies</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <span className="h-1 w-1 bg-indigo-400 rounded-full" />
                <span>7 payment-status inconsistencies</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between space-y-4">
            <div className="p-3 bg-indigo-500/5 border border-indigo-500/15 rounded-lg">
              <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block">Top Recommendation</span>
              <p className="text-slate-200 mt-1 font-semibold">
                Review conflicting servicer balances first.
              </p>
            </div>
            <div className="flex gap-2.5">
              <button
                onClick={() => navigate('/operator/history')}
                className="flex-1 py-2 px-3 bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-bold rounded-lg text-xs transition"
              >
                Review Exceptions
              </button>
              <button
                onClick={() => {
                  alert("AI Copilot Insights Modal Simulation:\n\n- Active Ingestion Check completed: loan_tape_20260825_final.csv\n- Verified document links: 95.8% match rate.\n- System recommended action: Run Servicer balance check script LN-10024.");
                }}
                className="flex-1 py-2 px-3 border border-slate-700 hover:bg-slate-800/50 text-slate-300 font-bold rounded-lg text-xs transition"
              >
                View AI Insights
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <DonutChart data={severityData} title="Exceptions by Severity" />
        <BarChart data={validVsInvalidData} title="Valid vs Exceptions Ingests" />
        <LineChart data={qualityTrendData} title="Data Quality Trend (Q2 22026)" valueSuffix="%" />
      </div>

      {/* Corrections Needed Section */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-slate-100 font-bold text-sm">Corrections Needed</h2>
            <p className="text-slate-500 text-xs mt-0.5">Exceptions requiring operational updates and re-validation</p>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 border border-rose-500/20 text-rose-400">
            {correctionsNeeded.length} Pending
          </span>
        </div>

        {exceptionsLoading ? (
          <div className="space-y-3 animate-pulse">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="h-12 bg-slate-850/50 rounded" />
            ))}
          </div>
        ) : correctionsNeeded.length === 0 ? (
          <div className="p-6 text-center bg-slate-950/20 border border-slate-800 rounded-lg text-slate-400 text-xs font-medium">
            ✓ All tape records are validated and clear of active exceptions.
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto pr-1">
            <table className="w-full text-left text-xs relative">
              <thead className="sticky top-0 bg-slate-900 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-700 z-10 shadow-sm">
                <tr>
                  <th className="p-3">Loan ID</th>
                  <th className="p-3">Validation Failure Rule</th>
                  <th className="p-3">Severity</th>
                  <th className="p-3">Affected Field</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-950/10">
                {correctionsNeeded.map((exc) => (
                  <tr key={exc.id} className="hover:bg-slate-850/20 transition">
                    <td className="p-3 font-semibold text-slate-355">{exc.loanId}</td>
                    <td className="p-3 font-medium text-slate-200">{exc.ruleName}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                        exc.severity === 'critical' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20' :
                        exc.severity === 'high' ? 'bg-orange-500/15 text-orange-400 border border-orange-500/20' :
                        exc.severity === 'medium' ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20' :
                        'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {exc.severity}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-450">{exc.affectedField}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        exc.status === 'investigating' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                        'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {exc.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => navigate(`/operator/exceptions/${exc.loanId}`)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-500 hover:bg-indigo-400 text-slate-955 font-bold rounded text-[11px] transition border-transparent"
                      >
                        <span>Review & Correct</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Imports list */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <span className="text-slate-100 font-bold text-sm">Recent File Ingestion Jobs</span>
          <button
            onClick={() => navigate('/operator/history')}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition"
          >
            <span>View All Logs</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {jobsLoading ? (
          <div className="space-y-3 animate-pulse">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="h-12 bg-slate-850/50 rounded" />
            ))}
          </div>
        ) : (
          <div className="divide-y divide-slate-700">
            {jobs?.slice(0, 3).map((job) => (
              <div key={job.id} className="py-3 flex items-center justify-between text-sm hover:bg-slate-950/20 px-2 rounded-lg transition duration-150">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-200 block truncate max-w-xs sm:max-w-md">{job.fileName}</span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5 block">
                      {job.fileType.replace('_', ' ')} • Uploaded by {job.uploadedBy}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="font-bold text-slate-300 block">{job.totalRecords} Rows</span>
                    <span className="text-[10px] text-rose-400 block font-semibold">{job.failedRecords} exceptions</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-650" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export default OperatorDashboard;
