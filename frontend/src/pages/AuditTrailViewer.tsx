import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getAuditTrail, getLoanById } from '../services/mock/services.mock';
import {
  ArrowLeft,
  History,
  FileText,
  AlertTriangle,
  Sparkles,
  CheckCircle,
  Calendar,
  User,
  RefreshCcw
} from 'lucide-react';
import { useToast } from '../hooks/useToast';

export const AuditTrailViewer: React.FC = () => {
  const { loanId } = useParams<{ loanId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const { data: loan, isLoading: loanLoading } = useQuery({
    queryKey: ['auditLoan', loanId],
    queryFn: () => getLoanById(loanId || ''),
    enabled: !!loanId
  });

  const { data: auditTrail, isLoading: auditLoading, refetch } = useQuery({
    queryKey: ['auditTrailDetails', loanId],
    queryFn: () => getAuditTrail(loanId || ''),
    enabled: !!loanId
  });

  const handleRefresh = () => {
    refetch();
    showToast('Audit trail ledger refreshed', 'info');
  };

  if (loanLoading || auditLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-16 bg-slate-900 border border-slate-850 rounded-xl" />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="h-20 bg-slate-900 border border-slate-850 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-xl text-slate-400">
        Loan record "{loanId}" not found in system logs.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header navigations */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-700 pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 border border-slate-700 hover:border-slate-600 bg-slate-900 rounded-lg text-slate-400 hover:text-slate-200 transition"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg font-bold text-slate-100">{loan.loanId}</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 border border-slate-700 text-slate-350">
                <History className="h-3.5 w-3.5 text-slate-500" />
                <span>Auditable Trail Active</span>
              </span>
            </div>
            <span className="text-slate-500 text-xs mt-1 block">
              Full lineage history of loan entries, updates, modifications, and signatures.
            </span>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-700 hover:border-slate-600 rounded-xl text-xs font-bold transition self-start sm:self-auto"
        >
          <RefreshCcw className="h-3.5 w-3.5" />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* Loan properties snapshot */}
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 shadow-lg text-xs grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <span className="text-slate-550 font-bold block uppercase tracking-wider">Borrower Name</span>
          <span className="text-slate-250 font-bold mt-1 block">{loan.borrowerName}</span>
        </div>
        <div>
          <span className="text-slate-550 font-bold block uppercase tracking-wider">Current Status</span>
          <span className="text-slate-250 font-bold mt-1 block uppercase">{loan.verificationStatus}</span>
        </div>
        <div>
          <span className="text-slate-550 font-bold block uppercase tracking-wider">Original Principal</span>
          <span className="text-slate-250 font-bold mt-1 block">₹{loan.originalPrincipal.toLocaleString()}</span>
        </div>
        <div>
          <span className="text-slate-550 font-bold block uppercase tracking-wider">Servicer Name</span>
          <span className="text-slate-250 font-bold mt-1 block">{loan.servicerName}</span>
        </div>
      </div>

      {/* Visual Timeline logs */}
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-xl">
        <h2 className="text-slate-250 font-bold text-sm mb-6 flex items-center gap-1.5 border-b border-slate-700 pb-3">
          <History className="h-4.5 w-4.5 text-indigo-400" />
          <span>Complete Lineage Event History</span>
        </h2>

        {auditTrail && auditTrail.length === 0 ? (
          <div className="py-12 text-center text-slate-550 font-semibold text-sm">
            No audit logs registered for this loan ID.
          </div>
        ) : (
          <div className="flow-root pl-2">
            <ul className="-mb-8">
              {auditTrail?.map((log, idx) => {
                const isLast = idx === auditTrail.length - 1;

                return (
                  <li key={log.id}>
                    <div className="relative pb-8">
                      {!isLast && (
                        <span className="absolute top-4 left-4 -ml-px h-full w-[1.5px] bg-slate-700" aria-hidden="true" />
                      )}
                      <div className="relative flex space-x-4 items-start">
                        <div>
                          <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-4 ring-slate-900 ${
                            (log.action || '').includes('INGEST') || (log.action || '').includes('IMPORT') ? 'bg-slate-800 text-slate-450' :
                            (log.action || '').includes('EXCEPTION') ? 'bg-rose-500/10 text-rose-450 border border-rose-500/20' :
                            (log.action || '').includes('RECOMMEND') ? 'bg-indigo-500/10 text-indigo-450 border border-indigo-500/20 animate-pulse' :
                            (log.action || '').includes('EDIT') ? 'bg-yellow-500/10 text-yellow-450 border border-yellow-500/20' :
                            'bg-emerald-500/10 text-emerald-450 border border-emerald-500/20'
                          }`}>
                            {(log.action || '').includes('INGEST') || (log.action || '').includes('IMPORT') ? <FileText className="h-4 w-4"/> :
                             (log.action || '').includes('EXCEPTION') ? <AlertTriangle className="h-4 w-4"/> :
                             (log.action || '').includes('RECOMMEND') ? <Sparkles className="h-4 w-4"/> :
                             <CheckCircle className="h-4 w-4"/>}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0 pt-1.5 text-xs">
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-slate-200 font-bold block text-xs tracking-wide">
                              {log.changeSummary}
                            </span>
                            <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(log.createdAt).toLocaleString()}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-wider">
                            <User className="h-3.5 w-3.5 text-slate-550" />
                            <span>Actor: {log.actor} • Entity Type: {log.entityType} • Log ID: {log.id}</span>
                          </div>

                          {/* Detail changes box */}
                          {log.diff && (
                            <div className="mt-3 p-3 bg-slate-950 border border-slate-700 rounded-xl max-w-xl font-mono text-[10px]">
                              <span className="text-slate-550 block font-semibold">Field Value Shift</span>
                              <div className="flex items-center gap-3 mt-1.5">
                                <div className="bg-rose-950/20 px-2 py-1 border border-rose-500/10 rounded text-rose-400">
                                  {log.diff.field}: {log.diff.before}
                                </div>
                                <span className="text-slate-600 font-bold">→</span>
                                <div className="bg-emerald-950/20 px-2 py-1 border border-emerald-500/10 rounded text-emerald-400">
                                  {log.diff.field}: {log.diff.after}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
export default AuditTrailViewer;
