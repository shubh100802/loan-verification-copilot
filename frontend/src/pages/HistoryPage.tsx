import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getImportJobs } from '../services/mock/services.mock';
import { DataTable } from '../components/DataTable';
import { ImportJob } from '../services/mock/types';
import {
  FileText,
  User,
  X,
  FileSpreadsheet,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useToast } from '../hooks/useToast';

export const HistoryPage: React.FC = () => {
  const { showToast } = useToast();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedJob, setSelectedJob] = useState<ImportJob | null>(null);

  const { data: jobs, isLoading, isError, refetch } = useQuery({
    queryKey: ['importJobs'],
    queryFn: getImportJobs
  });

  // Client side search/filter application
  const filteredData = React.useMemo(() => {
    if (!jobs) return [];
    return jobs.filter((job) => {
      const matchSearch = job.fileName.toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === 'all' || job.fileType === typeFilter;
      return matchSearch && matchType;
    });
  }, [jobs, search, typeFilter]);

  const columns = [
    {
      header: 'Job ID',
      accessor: (row: ImportJob) => <span className="font-mono text-xs font-bold text-slate-400">{row.id}</span>
    },
    {
      header: 'File Name',
      accessor: (row: ImportJob) => (
        <div className="flex items-center gap-2.5">
          <FileSpreadsheet className="h-4 w-4 text-indigo-400 flex-shrink-0" />
          <span className="font-semibold text-slate-200 truncate max-w-xs">{row.fileName}</span>
        </div>
      )
    },
    {
      header: 'Category',
      accessor: (row: ImportJob) => (
        <span className="text-xs font-medium uppercase tracking-wider bg-slate-800 px-2 py-0.5 rounded text-slate-350 border border-slate-750">
          {row.fileType.replace('_', ' ')}
        </span>
      )
    },
    {
      header: 'Row Records',
      accessor: (row: ImportJob) => <span className="font-bold text-slate-300">{row.totalRecords}</span>,
      className: 'text-right'
    },
    {
      header: 'Exceptions',
      accessor: (row: ImportJob) => (
        <span className={`font-bold ${row.failedRecords > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
          {row.failedRecords}
        </span>
      ),
      className: 'text-right'
    },
    {
      header: 'Uploaded Date',
      accessor: (row: ImportJob) => (
        <span className="text-slate-400 text-xs">{new Date(row.createdAt).toLocaleDateString()}</span>
      )
    },
    {
      header: 'Actions',
      accessor: (row: ImportJob) => (
        <button
          onClick={() => setSelectedJob(row)}
          className="text-xs text-indigo-400 hover:text-indigo-300 font-bold transition flex items-center gap-1"
        >
          <span>View Details</span>
          <ArrowRight className="h-3 w-3" />
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6 relative">
      {/* Header */}
      <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-700">
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">Ingestion Ledger history</h1>
        <p className="text-slate-400 text-sm mt-1">
          Historical log tracking file structures, processed rows, and validation outputs.
        </p>
      </div>

      {/* Main Table View */}
      <DataTable
        data={filteredData}
        columns={columns}
        isLoading={isLoading}
        isError={isError}
        searchPlaceholder="Search files..."
        searchValue={search}
        onSearchChange={setSearch}
        onRetry={refetch}
        filters={
          <div className="flex items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-700 rounded bg-slate-950 text-slate-300 focus:outline-none text-xs font-semibold"
            >
              <option value="all">All Categories</option>
              <option value="loan_tape">Primary Tape</option>
              <option value="servicer_update">Servicer Update</option>
              <option value="document_manifest">Doc Manifest</option>
            </select>
          </div>
        }
      />

      {/* Import Detail Drawer overlay */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-955/85 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-slate-900 border-l border-slate-700 p-6 relative flex flex-col justify-between shadow-2xl animate-slide-left">
            
            {/* Header info */}
            <div>
              <div className="flex items-center justify-between border-b border-slate-700 pb-4 mb-5">
                <div className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-indigo-400" />
                  <span className="font-bold text-slate-100 uppercase tracking-wider text-sm">
                    Ingestion job details
                  </span>
                </div>
                <button
                  onClick={() => setSelectedJob(null)}
                  className="p-1 text-slate-400 hover:text-slate-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Ingest Properties layout */}
              <div className="space-y-5 text-sm">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">File Name</span>
                  <div className="flex items-center gap-2 mt-1.5 p-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-300 font-semibold truncate">
                    <FileText className="h-4 w-4 text-slate-400" />
                    <span>{selectedJob.fileName}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Job Type</span>
                    <span className="mt-1.5 inline-block text-xs font-bold uppercase bg-slate-800 px-2 py-1 rounded text-slate-350 border border-slate-700">
                      {selectedJob.fileType.replace('_', ' ')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Uploaded By</span>
                    <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-300">
                      <User className="h-3.5 w-3.5 text-slate-500" />
                      <span>{selectedJob.uploadedBy}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center border-y border-slate-700 py-4 bg-slate-950/20">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Rows</span>
                    <span className="text-lg font-extrabold text-slate-200 block mt-1">{selectedJob.totalRecords}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Valid Rows</span>
                    <span className="text-lg font-extrabold text-emerald-400 block mt-1">{selectedJob.processedRecords}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Exceptions</span>
                    <span className="text-lg font-extrabold text-rose-400 block mt-1">{selectedJob.failedRecords}</span>
                  </div>
                </div>

                {/* Lineage Trace details */}
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Lineage Audit Trails</span>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2.5 text-xs">
                      <div className="h-4.5 w-4.5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] text-slate-400 mt-0.5">1</div>
                      <div>
                        <span className="text-slate-250 font-bold block">File Read Operations Ingested</span>
                        <span className="text-slate-500">{new Date(selectedJob.createdAt).toLocaleString()} • Checked signatures successfully</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5 text-xs">
                      <div className="h-4.5 w-4.5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] text-slate-400 mt-0.5">2</div>
                      <div>
                        <span className="text-slate-250 font-bold block">Normalized Schema Ingestion Complete</span>
                        <span className="text-slate-500">Auto-mapped variables: {selectedJob.processedRecords} rows written</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="border-t border-slate-700 pt-4 flex gap-2">
              <button
                onClick={() => {
                  setSelectedJob(null);
                  showToast('Exporting metadata CSV...', 'info');
                }}
                className="flex-1 py-2 px-4 border border-slate-700 rounded-lg text-slate-200 hover:bg-slate-800/50 text-xs font-semibold text-center transition"
              >
                Export CSV Metadata
              </button>
              <button
                onClick={() => setSelectedJob(null)}
                className="flex-1 py-2 px-4 bg-slate-800 hover:bg-slate-750 rounded-lg text-slate-200 text-xs font-semibold text-center transition border border-slate-700"
              >
                Close Drawer
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
export default HistoryPage;
