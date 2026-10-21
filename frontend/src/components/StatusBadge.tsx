import React from 'react';
import { LeaveStatus, LEAVE_STATUS_LABELS } from '../types';

interface StatusBadgeProps {
  status: LeaveStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const styles: Record<LeaveStatus, string> = {
    PENDING: 'bg-amber-50 text-amber-700 border-amber-200 ring-1 ring-amber-600/10',
    PENDING_DIRECTOR: 'bg-purple-50 text-purple-700 border-purple-200 ring-1 ring-purple-600/10',
    APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-600/10',
    REJECTED: 'bg-rose-50 text-rose-700 border-rose-200 ring-1 ring-rose-600/10',
    CANCEL_REQUESTED: 'bg-orange-50 text-orange-700 border-orange-200 ring-1 ring-orange-600/10',
    CANCELLED: 'bg-slate-50 text-slate-600 border-slate-200 ring-1 ring-slate-600/10',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
        styles[status] || 'bg-gray-50 text-gray-700 border-gray-200'
      }`}
    >
      {LEAVE_STATUS_LABELS[status] || status}
    </span>
  );
};
