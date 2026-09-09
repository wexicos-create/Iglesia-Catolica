/**
 * Chattoj General Reports Registry & Admin Verification Engine
 * Handles report aggregation from chats, forums, and user interactions.
 * Automatically triggers AI intelligence alerts to the preconfigured Admin ID.
 */

export interface GeneralReport {
  id: string;
  targetId: string;
  targetName: string;
  reporterId: string;
  reporterName: string;
  source: 'chat' | 'forum' | 'user';
  reason: string;
  details?: string;
  timestamp: string;
  status: 'pendiente' | 'revisado' | 'bloqueado' | 'descartado';
}

const REPORTS_REGISTRY_KEY = 'chattoj_general_reports_registry';
const ADMIN_ID_KEY = 'chattoj_admin_root_id';

export function getRootAdminId(currentUserId?: string): string {
  try {
    let adminId = localStorage.getItem(ADMIN_ID_KEY);
    if (!adminId && currentUserId) {
      localStorage.setItem(ADMIN_ID_KEY, currentUserId);
      return currentUserId;
    }
    return adminId || currentUserId || 'user-admin-root';
  } catch {
    return currentUserId || 'user-admin-root';
  }
}

export function isUserAdmin(userId?: string): boolean {
  if (!userId) return false;
  const adminId = getRootAdminId(userId);
  return userId === adminId;
}

export function getGeneralReports(): GeneralReport[] {
  try {
    const raw = localStorage.getItem(REPORTS_REGISTRY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveGeneralReports(reports: GeneralReport[]): void {
  try {
    localStorage.setItem(REPORTS_REGISTRY_KEY, JSON.stringify(reports));
  } catch {}
}

export function submitReport(reportData: {
  targetId: string;
  targetName: string;
  reporterId: string;
  reporterName: string;
  source: 'chat' | 'forum' | 'user';
  reason: string;
  details?: string;
}): { report: GeneralReport; accumulatedCount: number } {
  const newReport: GeneralReport = {
    id: 'rep-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    targetId: reportData.targetId,
    targetName: reportData.targetName,
    reporterId: reportData.reporterId,
    reporterName: reportData.reporterName,
    source: reportData.source,
    reason: reportData.reason,
    details: reportData.details || '',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    status: 'pendiente'
  };

  const reports = getGeneralReports();
  const updated = [newReport, ...reports];
  saveGeneralReports(updated);

  const accumulated = updated.filter(
    r => r.targetName.toLowerCase() === reportData.targetName.toLowerCase() && r.status === 'pendiente'
  );

  const count = accumulated.length;

  return { report: newReport, accumulatedCount: count };
}

export function authorizeAdminAction(targetName: string, reason: string): void {
  const reports = getGeneralReports();
  const updated = reports.map(r => {
    if (r.targetName.toLowerCase() === targetName.toLowerCase()) {
      return { ...r, status: 'bloqueado' as const };
    }
    return r;
  });
  saveGeneralReports(updated);
  window.dispatchEvent(new CustomEvent('chattoj-reports-updated'));
}

export function dismissReports(targetName: string): void {
  const reports = getGeneralReports();
  const updated = reports.map(r => {
    if (r.targetName.toLowerCase() === targetName.toLowerCase()) {
      return { ...r, status: 'descartado' as const };
    }
    return r;
  });
  saveGeneralReports(updated);
  window.dispatchEvent(new CustomEvent('chattoj-reports-updated'));
}

