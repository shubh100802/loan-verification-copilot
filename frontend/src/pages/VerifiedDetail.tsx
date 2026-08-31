import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getLoanById } from '../services/mock/services.mock';
import {
  ArrowLeft,
  ShieldCheck,
  Code,
  Copy,
  Lock,
  Calendar,
  User,
  CheckCircle,
  ClipboardList
} from 'lucide-react';
import { useToast } from '../hooks/useToast';

export const VerifiedDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const { data: loan, isLoading } = useQuery({
    queryKey: ['verifiedLoanDetail', id],
    queryFn: () => getLoanById(id || '')
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-16 bg-slate-900 border border-slate-700 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-[400px] bg-slate-900 border border-slate-700 rounded-xl" />
          <div className="h-[400px] bg-slate-900 border border-slate-700 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="p-8 text-center bg-slate-900 border border-slate-700 rounded-xl text-slate-400">
        Loan record not found.
      </div>
    );
  }

  // Mock SHA-256 hash derived from the record
  const recordHash = 'SHA-256 8f2b4d9c7e1a3b5f6a9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a';

  // Format dynamic API response mock payload
  const mockApiResponse = {
    status: 'success',
    data: {
      loanId: loan.loanId,
      borrowerName: loan.borrowerName,
      borrowerId: loan.borrowerId,
      originalPrincipal: loan.originalPrincipal,
      currentBalance: loan.currentBalance,
      interestRate: loan.interestRate,
      paymentStatus: loan.paymentStatus,
      dpd: loan.dpd,
      propertyState: loan.propertyState,
      verificationStatus: 'verified',
      audit: {
        hash: recordHash,
        verifiedBy: 'Lead Reviewer',
        verifiedAt: '2026-08-26T17:03:13.414Z',
        chainIntegrityMatched: true
      }
    }
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(mockApiResponse, null, 2));
    showToast('API JSON payload copied to clipboard', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header navigations */}
      <div className="flex items-center justify-between border-b border-slate-700 pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/consumer/verified')}
            className="p-2 border border-slate-700 hover:border-slate-600 bg-slate-900 rounded-lg text-slate-400 hover:text-slate-200 transition"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg font-bold text-slate-100">{loan.loanId}</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle className="h-3 w-3 text-emerald-400" />
                <span>Verified Asset</span>
              </span>
            </div>
            <span className="text-slate-500 text-xs mt-1 block">
              Certified Borrower Name: {loan.borrowerName}
            </span>
          </div>
        </div>
      </div>

      {/* Main panels layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left pane: Canonical values */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-emerald-500/30 to-emerald-500/0" />
            <h2 className="text-slate-220 font-bold text-sm mb-4 flex items-center gap-1.5 border-b border-slate-700 pb-3">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Certified Canonical Data Attributes</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {[
                { label: 'Borrower ID', val: loan.borrowerId },
                { label: 'Loan Category', val: loan.loanType },
                { label: 'Origination Date', val: loan.originationDate },
                { label: 'Maturity Date', val: loan.maturityDate },
                { label: 'Original Principal', val: `₹${loan.originalPrincipal.toLocaleString()}` },
                { label: 'Current Balance', val: `₹${loan.currentBalance.toLocaleString()}` },
                { label: 'Interest Rate', val: `${loan.interestRate}%` },
                { label: 'Payment Status', val: loan.paymentStatus },
                { label: 'Property State', val: loan.propertyState },
                { label: 'Authorizing Servicer', val: loan.servicerName }
              ].map((field, idx) => (
                <div key={idx} className="p-3 bg-slate-950/20 border border-slate-700 rounded-lg">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    {field.label}
                  </span>
                  <span className="text-slate-200 font-bold mt-1 block">{field.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Cryptographic block verification signatures */}
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-indigo-500/30 to-indigo-500/0" />
            <h2 className="text-slate-250 font-bold text-sm mb-3 flex items-center gap-1.5">
              <Lock className="h-4 w-4 text-indigo-400" />
              <span>Cryptographic Block Signatures</span>
            </h2>

            <div className="space-y-4 text-xs leading-relaxed">
              <div className="p-3 bg-slate-950 border border-slate-700 rounded-lg">
                <span className="text-[10px] font-bold text-slate-550 uppercase tracking-wider block">SHA-256 Ledger Signature</span>
                <span className="font-mono text-slate-350 font-bold mt-1.5 block break-all text-[11px]">
                  {recordHash}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-[11px] text-slate-400">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-slate-500" />
                  <div>
                    <span className="block font-bold text-slate-500 text-[9px] uppercase tracking-wider">Signed By</span>
                    <span className="text-slate-300 font-semibold">Lead Reviewer Account</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-500" />
                  <div>
                    <span className="block font-bold text-slate-500 text-[9px] uppercase tracking-wider">Verification Date</span>
                    <span className="text-slate-300 font-semibold">{new Date(loan.lastUpdated).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right pane: API Response code viewer */}
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-700 pb-3 mb-4">
              <span className="font-bold text-sm text-slate-200 tracking-wide flex items-center gap-1.5">
                <Code className="h-4 w-4 text-indigo-400" />
                <span>Verified Asset API Endpoint</span>
              </span>
              <button
                onClick={handleCopyJson}
                className="p-1.5 border border-slate-700 hover:border-slate-600 bg-slate-950 text-slate-400 hover:text-slate-200 rounded transition flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider"
              >
                <Copy className="h-3 w-3" />
                <span>Copy Payload</span>
              </button>
            </div>

            {/* Simulated GET header path */}
            <div className="bg-slate-950 border border-slate-700 px-3 py-1.5 rounded-lg text-slate-400 font-mono text-[11px] mb-3 flex items-center justify-between">
              <span>GET /api/v1/verified-loans/{loan.loanId}</span>
              <span className="text-green-400 font-bold">200 OK</span>
            </div>

            {/* Formatted JSON output */}
            <div className="bg-slate-950 border border-slate-700 rounded-lg p-4 font-mono text-[10.5px] text-indigo-300 overflow-y-auto max-h-[360px] leading-relaxed shadow-inner">
              <pre>{JSON.stringify(mockApiResponse, null, 2)}</pre>
            </div>
          </div>

          <div className="mt-4 border-t border-slate-700 pt-4 flex gap-2">
            <button
              onClick={() => navigate(`/consumer/audit/${loan.loanId}`)}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-4 bg-slate-800 hover:bg-slate-750 text-slate-250 font-bold border border-slate-700 rounded-lg text-xs transition"
            >
              <ClipboardList className="h-4 w-4 text-slate-400" />
              <span>Inspect History Logs</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
export default VerifiedDetail;
