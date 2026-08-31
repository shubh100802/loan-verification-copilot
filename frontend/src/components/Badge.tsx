import React from 'react';

interface SeverityBadgeProps {
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity }) => {
  const styles = {
    low: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    medium: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
    high: 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
    critical: 'bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse'
  };

  const labels = {
    low: 'Low Severity',
    medium: 'Medium Severity',
    high: 'High Severity',
    critical: 'Critical Error'
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider ${styles[severity] || styles.low}`}>
      {labels[severity]}
    </span>
  );
};

interface StatusBadgeProps {
  status: 'unverified' | 'in_review' | 'verified' | 'exception';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const styles = {
    unverified: 'bg-slate-700/30 text-slate-300 border border-slate-700/50',
    in_review: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
    verified: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    exception: 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
  };

  const labels = {
    unverified: 'Unverified',
    in_review: 'In Review',
    verified: 'Verified',
    exception: 'Exception'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[status] || styles.unverified}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
        status === 'verified' ? 'bg-emerald-400' :
        status === 'exception' ? 'bg-rose-400' :
        status === 'in_review' ? 'bg-indigo-400' : 'bg-slate-400'
      }`}></span>
      {labels[status]}
    </span>
  );
};
