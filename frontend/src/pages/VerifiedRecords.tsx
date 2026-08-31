import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getLoans } from '../services/mock/services.mock';
import { DataTable } from '../components/DataTable';
import { Loan } from '../services/mock/types';
import { Eye, FileDown, History } from 'lucide-react';
import { useToast } from '../hooks/useToast';

export const VerifiedRecords: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [search, setSearch] = useState('');

  const { data: loans, isLoading, isError, refetch } = useQuery({
    queryKey: ['verifiedLoansList'],
    queryFn: () => getLoans({ status: 'verified' })
  });

  const filteredData = React.useMemo(() => {
    if (!loans) return [];
    return loans.filter(
      (loan) =>
        loan.loanId.toLowerCase().includes(search.toLowerCase()) ||
        loan.borrowerName.toLowerCase().includes(search.toLowerCase())
    );
  }, [loans, search]);

  const handleExport = () => {
    showToast('Exporting verified data blocks as CSV...', 'info');
  };

  const columns = [
    {
      header: 'Loan ID',
      accessor: (row: Loan) => <span className="font-mono text-xs font-bold text-slate-350">{row.loanId}</span>
    },
    {
      header: 'Borrower Name',
      accessor: (row: Loan) => <span className="font-semibold text-slate-200">{row.borrowerName}</span>
    },
    {
      header: 'Original Principal',
      accessor: (row: Loan) => <span>₹{row.originalPrincipal.toLocaleString()}</span>,
      className: 'text-right'
    },
    {
      header: 'Current Balance',
      accessor: (row: Loan) => <span>₹{row.currentBalance.toLocaleString()}</span>,
      className: 'text-right'
    },
    {
      header: 'Interest Rate',
      accessor: (row: Loan) => <span>{row.interestRate}%</span>,
      className: 'text-right'
    },
    {
      header: 'Payment Status',
      accessor: (row: Loan) => (
        <span className="text-xs uppercase font-medium bg-slate-800 text-slate-300 px-2 py-0.5 border border-slate-700 rounded">
          {row.paymentStatus}
        </span>
      )
    },
    {
      header: 'Sign-Off Auditor',
      accessor: (_row: Loan) => <span className="text-slate-400 text-xs">Lead Reviewer</span>
    },
    {
      header: 'Actions',
      accessor: (row: Loan) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/consumer/verified/${row.loanId}`)}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 border border-slate-700 hover:bg-slate-750 text-slate-200 rounded text-xs font-bold transition"
            title="View Details & API Payload"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Details</span>
          </button>
          
          <button
            onClick={() => navigate(`/consumer/audit/${row.loanId}`)}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 border border-slate-700 hover:bg-slate-750 text-slate-400 hover:text-indigo-400 rounded text-xs font-bold transition"
            title="View Complete Audit Timeline"
          >
            <History className="h-3.5 w-3.5" />
            <span>Trace</span>
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Certified Verified Records</h1>
          <p className="text-slate-400 text-sm mt-1">
            Data blocks showing resolved exceptions, reviewer sign-off history, and verification tokens.
          </p>
        </div>
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-slate-955 rounded-lg text-sm font-bold transition border-transparent"
        >
          <FileDown className="h-4 w-4" />
          <span>Export Excel Dataset</span>
        </button>
      </div>

      {/* Grid */}
      <DataTable
        data={filteredData}
        columns={columns}
        isLoading={isLoading}
        isError={isError}
        searchPlaceholder="Search Verified ID / Name..."
        searchValue={search}
        onSearchChange={setSearch}
        onRetry={refetch}
      />
    </div>
  );
};
export default VerifiedRecords;
