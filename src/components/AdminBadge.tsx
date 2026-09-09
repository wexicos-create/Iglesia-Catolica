import React from 'react';
import { isUserAdmin } from '../utils/reportsRegistry';

interface AdminBadgeProps {
  userId?: string;
  className?: string;
}

export const AdminBadge: React.FC<AdminBadgeProps> = ({ userId, className = '' }) => {
  if (!isUserAdmin(userId)) return null;
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/60 text-amber-300 font-bold text-[9px] font-mono tracking-widest shadow-[0_0_8px_rgba(245,158,11,0.5)] uppercase ${className}`}>
      ADMIN
    </span>
  );
};
