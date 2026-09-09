export interface SystemAnnouncement {
  id: string;
  title: string; // "AVISO IMPORTANTE"
  content: string;
  authorName: string;
  timestamp: string;
  createdAt: number;
}

const STORAGE_KEY_ACTIVE = 'chattoj_active_announcement';
const STORAGE_KEY_DISMISSED = 'chattoj_dismissed_announcements';

// Default initial announcement if none exists
const DEFAULT_ANNOUNCEMENT: SystemAnnouncement = {
  id: 'ann-init-1',
  title: 'AVISO IMPORTANTE',
  content: 'Bienvenidos a Chattoj. Plataforma 100% descentralizada y civil. Prohibida la propaganda estatal o de gobiernos políticos en foros activistas.',
  authorName: 'Josué Cervantes Alvarado (Admin)',
  timestamp: 'Hoy',
  createdAt: Date.now() - 3600000
};

export function getActiveAnnouncement(): SystemAnnouncement | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ACTIVE);
    let announcement: SystemAnnouncement | null = null;
    if (raw) {
      announcement = JSON.parse(raw);
    } else {
      // Return default initial announcement if user hasn't dismissed it
      announcement = DEFAULT_ANNOUNCEMENT;
    }

    if (!announcement) return null;

    // Check if dismissed
    const dismissedRaw = localStorage.getItem(STORAGE_KEY_DISMISSED);
    const dismissedIds: string[] = dismissedRaw ? JSON.parse(dismissedRaw) : [];

    if (dismissedIds.includes(announcement.id)) {
      return null;
    }

    return announcement;
  } catch {
    return null;
  }
}

export function publishAnnouncement(content: string, authorName: string = 'Josué Cervantes Alvarado'): SystemAnnouncement {
  const newAnnouncement: SystemAnnouncement = {
    id: 'ann-' + Date.now(),
    title: 'AVISO IMPORTANTE',
    content: content.trim(),
    authorName: authorName.trim(),
    timestamp: 'Justo ahora',
    createdAt: Date.now()
  };

  try {
    localStorage.setItem(STORAGE_KEY_ACTIVE, JSON.stringify(newAnnouncement));

    // Remove from dismissed list if re-published or new
    const dismissedRaw = localStorage.getItem(STORAGE_KEY_DISMISSED);
    let dismissedIds: string[] = dismissedRaw ? JSON.parse(dismissedRaw) : [];
    dismissedIds = dismissedIds.filter(id => id !== newAnnouncement.id);
    localStorage.setItem(STORAGE_KEY_DISMISSED, JSON.stringify(dismissedIds));

    // Dispatch global event for reactive UI updates across all tabs
    window.dispatchEvent(new CustomEvent('chattoj-announcement-updated'));
  } catch (e) {
    console.error('Error al guardar comunicado:', e);
  }

  return newAnnouncement;
}

export function dismissAnnouncement(announcementId: string): void {
  try {
    const dismissedRaw = localStorage.getItem(STORAGE_KEY_DISMISSED);
    const dismissedIds: string[] = dismissedRaw ? JSON.parse(dismissedRaw) : [];
    if (!dismissedIds.includes(announcementId)) {
      dismissedIds.push(announcementId);
      localStorage.setItem(STORAGE_KEY_DISMISSED, JSON.stringify(dismissedIds));
    }
    window.dispatchEvent(new CustomEvent('chattoj-announcement-updated'));
  } catch (e) {
    console.error('Error al descartar comunicado:', e);
  }
}

export function resetAnnouncementsForTesting(): void {
  localStorage.removeItem(STORAGE_KEY_DISMISSED);
  localStorage.setItem(STORAGE_KEY_ACTIVE, JSON.stringify(DEFAULT_ANNOUNCEMENT));
  window.dispatchEvent(new CustomEvent('chattoj-announcement-updated'));
}
