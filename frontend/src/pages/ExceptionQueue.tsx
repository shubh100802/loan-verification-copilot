import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getExceptions } from '../services/mock/services.mock';
import { DataTable } from '../components/DataTable';
import { Exception } from '../services/mock/types';
import { SeverityBadge } from '../components/Badge';
import { Sparkles, Eye, Filter } from 'lucide-react';

export const ExceptionQueue: React.FC = () => {
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [severity, setSeverity] = useState('all');
  const [status, setStatus] = useState('all');

  const { data: exceptions, isLoading, isError, refetch } = useQuery({
    queryKey: ['exceptions'],
    queryFn: () => getExceptions()
  });

  const filteredData = React.useMemo(() => {
    if (!exceptions) return [];
    return exceptions.filter((exc) => {
      const matchSearch =
        exc.loanId.toLowerCase().includes(search.toLowerCase()) ||
        exc.ruleName.toLowerCase().includes(search.toLowerCase());
      const matchSeverity = severity === 'all' || exc.severity === severity;
      const matchStatus = status === 'all' || exc.status === status;
      return matchSearch && matchSeverity && matchStatus;
    });
  }, [exceptions, search, severity, status]);

  const columns = [
    {
      header: 'Severity',
      accessor: (row: Exception) => <SeverityBadge severity={row.severity} />
    },
    {
      header: 'Loan ID',
      accessor: (row: Exception) => <span className="font-mono text-xs font-bold text-slate-350">{row.loanId}</span>
    },
    {
      header: 'Exception Rule',
      accessor: (row: Exception) => (
        <div>
          <span className="font-semibold text-slate-200 text-xs block">{row.ruleName}</span>
          <span className="text-[10px] text-slate-550 mt-0.5 block truncate max-w-xs">{row.description}</span>
        </div>
      )
    },
    {
      header: 'Affected Field',
      accessor: (row: Exception) => (
        <span className="font-mono text-[11px] bg-slate-950/60 px-2 py-1 rounded text-slate-400 border border-slate-700">
          {row.affectedField}
        </span>
      )
    },
    {
      header: 'AI Copilot',
      accessor: (_row: Exception) => (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-400">
          <Sparkles className="h-3 w-3 text-indigo-450 animate-pulse" />
          <span>Suggestion Ready</span>
        </span>
      )
    },
    {
      header: 'Status',
      accessor: (row: Exception) => {
        const styles = {
          open: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
          investigating: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
          resolved: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
          waived: 'bg-slate-700/30 text-slate-300 border border-slate-700/50'
        };
        const val = row.status;
        return (
          <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${styles[val] || styles.open}`}>
            {val}
          </span>
        );
      }
    },
    {
      header: 'Created At',
      accessor: (row: Exception) => (
        <span className="text-[11px] text-slate-500">{new Date(row.createdAt).toLocaleDateString()}</span>
      )
    },
    {
      header: 'Action',
      accessor: (row: Exception) => (
        <button
          onClick={() => navigate(`/reviewer/exceptions/${row.loanId}`)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-slate-200 border border-slate-700 rounded-lg text-xs font-bold hover:bg-slate-750 transition"
        >
          <Eye className="h-3.5 w-3.5" />
          <span>Review</span>
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-700">
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">Verification Exception Queue</h1>
        <p className="text-slate-400 text-sm mt-1">
          Perform line-item reviews, adjust anomalous values, or apply AI-guided recommendations.
        </p>
      </div>

      {/* Ingestion Table */}
      <DataTable
        data={filteredData}
        columns={columns}
        isLoading={isLoading}
        isError={isError}
        searchPlaceholder="Search Loan ID / Rules..."
        searchValue={search}
        onSearchChange={setSearch}
        onRetry={refetch}
        filters={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-slate-500">
              <Filter className="h-3 w-3" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Severity:</span>
            </div>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="px-2.5 py-1 border border-slate-700 rounded bg-slate-950 text-slate-300 focus:outline-none text-xs font-semibold"
            >
              <option value="all">All</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <div className="flex items-center gap-1 bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-slate-500">
              <Filter className="h-3 w-3" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Status:</span>
            </div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-2.5 py-1 border border-slate-700 rounded bg-slate-950 text-slate-300 focus:outline-none text-xs font-semibold"
            >
              <option value="all">All</option>
              <option value="open">Open</option>
              <option value="investigating">Investigating</option>
              <option value="resolved">Resolved</option>
              <option value="waived">Waived</option>
            </select>
          </div>
        }
      />
    </div>
  );
};
export default ExceptionQueue;
