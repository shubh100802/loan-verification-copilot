import React from 'react';
import { Search, RotateCcw, AlertCircle, FileSpreadsheet } from 'lucide-react';

interface Column<T> {
  header: string;
  accessor: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  isError?: boolean;
  errorMsg?: string;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  filters?: React.ReactNode;
  emptyMessage?: string;
  onRetry?: () => void;
  pagination?: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
}

export function DataTable<T>({
  data,
  columns,
  isLoading = false,
  isError = false,
  errorMsg = 'Failed to load records.',
  searchPlaceholder = 'Search records...',
  searchValue,
  onSearchChange,
  filters,
  emptyMessage = 'No records found matching criteria.',
  onRetry,
  pagination
}: DataTableProps<T>) {
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-xl">
      {/* Header controls: Search & Filters */}
      {(onSearchChange || filters) && (
        <div className="p-4 border-b border-slate-700 bg-slate-950/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {onSearchChange && (
            <div className="relative max-w-sm w-full">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                value={searchValue || ''}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="block w-full pl-9 pr-3 py-2 border border-slate-700 rounded-lg bg-slate-950 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              />
            </div>
          )}
          {filters && <div className="flex items-center flex-wrap gap-2 md:ml-auto">{filters}</div>}
        </div>
      )}

      {/* Primary Table container */}
      <div className="overflow-x-auto max-h-[480px] overflow-y-auto pr-1">
        <table className="min-w-full divide-y divide-slate-700 text-left text-sm relative">
          <thead className="sticky top-0 bg-slate-900 text-slate-400 font-semibold text-xs uppercase tracking-wider z-10 border-b border-slate-700 shadow-sm">
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} scope="col" className={`px-6 py-4 ${col.className || ''}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {isLoading ? (
              // Loading Skeleton State
              Array.from({ length: 5 }).map((_, rIdx) => (
                <tr key={rIdx} className="animate-pulse">
                  {columns.map((_, cIdx) => (
                    <td key={cIdx} className="px-6 py-4">
                      <div className="h-4 bg-slate-800/85 rounded w-4/5" />
                    </td>
                  ))}
                </tr>
              ))
            ) : isError ? (
              // Error State
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                    <AlertCircle className="h-10 w-10 text-rose-500 mb-3" />
                    <span className="text-slate-200 font-semibold mb-1">Retrieval Failed</span>
                    <p className="text-slate-400 text-xs text-center mb-4">{errorMsg}</p>
                    {onRetry && (
                      <button
                        onClick={onRetry}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-slate-200 rounded-lg border border-slate-700 text-xs font-semibold hover:bg-slate-750 transition"
                      >
                        <RotateCcw className="h-3 w-3" />
                        <span>Retry</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              // Empty State
              <tr>
                <td colSpan={columns.length} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                    <FileSpreadsheet className="h-12 w-12 text-slate-650 mb-3" />
                    <span className="text-slate-300 font-semibold text-sm mb-1">No Records Available</span>
                    <p className="text-slate-500 text-xs text-center">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              // Table Rows
              data.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-850/30 transition duration-150">
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} className={`px-6 py-4 text-slate-300 ${col.className || ''}`}>
                      {col.accessor(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {!isLoading && !isError && data.length > 0 && pagination && (
        <div className="p-4 border-t border-slate-700 bg-slate-950/20 flex items-center justify-between text-xs font-medium text-slate-400">
          <span>
            Page <strong className="text-slate-350">{pagination.currentPage}</strong> of{' '}
            <strong className="text-slate-350">{pagination.totalPages}</strong>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage <= 1}
              className="px-3 py-1.5 border border-slate-700 rounded bg-slate-950 hover:bg-slate-850 disabled:opacity-40 disabled:hover:bg-slate-950 transition"
            >
              Previous
            </button>
            <button
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage >= pagination.totalPages}
              className="px-3 py-1.5 border border-slate-700 rounded bg-slate-950 hover:bg-slate-850 disabled:opacity-40 disabled:hover:bg-slate-950 transition"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
export default DataTable;
