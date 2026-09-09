/**
 * Activist Governance & Local Security Manager
 * Manages bans, forum closures, government propaganda exclusions,
 * and restricted access for expelled users. 100% offline.
 */

const BANNED_CREATORS_KEY = 'chattoj_banned_creators';
const CLOSED_FORUMS_COUNT_KEY = 'chattoj_closed_forums_count';
const BANNED_PANEL_USERS_KEY = 'chattoj_activist_panel_banned_users';

export interface PanelBanRecord {
  userId: string;
  timestamp: number;
  reason: string;
}

/**
 * Checks if a user is banned from creating more forums/photos.
 * "si se cierran varios foros banea al usuario de crear más fotos"
 */
export function isUserBannedFromCreatingForums(userId: string): boolean {
  try {
    const raw = localStorage.getItem(BANNED_CREATORS_KEY);
    if (!raw) return false;
    const list: string[] = JSON.parse(raw);
    return list.includes(userId);
  } catch {
    return false;
  }
}

/**
 * Records that a forum created by `creatorId` was closed due to community reports/IA verdict.
 * If 2 or more forums are closed, the user is permanently banned from creating new forums.
 */
export function recordForumClosure(creatorId: string): { totalClosed: number; isNowBanned: boolean } {
  try {
    const raw = localStorage.getItem(CLOSED_FORUMS_COUNT_KEY) || '{}';
    const counts: Record<string, number> = JSON.parse(raw);
    const newCount = (counts[creatorId] || 0) + 1;
    counts[creatorId] = newCount;
    localStorage.setItem(CLOSED_FORUMS_COUNT_KEY, JSON.stringify(counts));

    if (newCount >= 2) {
      const bannedRaw = localStorage.getItem(BANNED_CREATORS_KEY) || '[]';
      const bannedList: string[] = JSON.parse(bannedRaw);
      if (!bannedList.includes(creatorId)) {
        bannedList.push(creatorId);
        localStorage.setItem(BANNED_CREATORS_KEY, JSON.stringify(bannedList));
      }
      return { totalClosed: newCount, isNowBanned: true };
    }
    return { totalClosed: newCount, isNowBanned: false };
  } catch {
    return { totalClosed: 1, isNowBanned: false };
  }
}

/**
 * Checks if a user is expelled from the Activistas panel for pro-government propaganda.
 * "si alguien está a favor de gobiernos políticos lo sacas de el panel activistas"
 */
export function isUserBannedFromActivistPanel(userId: string): PanelBanRecord | null {
  try {
    const raw = localStorage.getItem(BANNED_PANEL_USERS_KEY);
    if (!raw) return null;
    const records: PanelBanRecord[] = JSON.parse(raw);
    return records.find(r => r.userId === userId) || null;
  } catch {
    return null;
  }
}

/**
 * Bans a user from the entire Activistas panel for government propaganda.
 */
export function banUserFromActivistPanel(userId: string, reason: string): void {
  try {
    const raw = localStorage.getItem(BANNED_PANEL_USERS_KEY) || '[]';
    const records: PanelBanRecord[] = JSON.parse(raw);
    if (!records.some(r => r.userId === userId)) {
      records.push({
        userId,
        timestamp: Date.now(),
        reason
      });
      localStorage.setItem(BANNED_PANEL_USERS_KEY, JSON.stringify(records));
    }
  } catch {
    // offline fallback
  }
}

/**
 * Preset photo gallery for activist causes (100% civil, anti-authoritarian, community focused).
 */
export const ACTIVIST_PRESET_PHOTOS = [
  {
    id: 'cyber-freedom',
    label: 'Ciber-Soberanía',
    url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'eco-action',
    label: 'Ecología y Huertos',
    url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'civil-privacy',
    label: 'Defensa del Anonimato',
    url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'mutual-aid',
    label: 'Ayuda Mutua Barrial',
    url: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'open-knowledge',
    label: 'Conocimiento Libre',
    url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'clean-energy',
    label: 'Energía Descentralizada',
    url: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=600&auto=format&fit=crop&q=80'
  }
];
