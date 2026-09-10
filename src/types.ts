export interface UserProfile {
  userId: string; // 11 digits
  quantumKey: string;
  name: string;
  statusMessage: string;
  avatar: string;
  nodeStatus: 'online' | 'mesh-relay' | 'quantum-sync';
  isRegistered: boolean;
  publicKeyE2EE?: string; // Clave Pública ECDH P-256 (Base64) generada en dispositivo
  publicKeyFingerprint?: string; // SHA-256 Huella de la Clave Pública
  hasPrivateKeyE2EE?: boolean; // Confirmación de que la Clave Privada está sellada en el dispositivo
  duckDnsServer?: string; // Servidor DuckDNS configurado para relay ciego
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  isEncrypted: boolean;
  quantumHash: string;
  status: 'sent' | 'delivered' | 'read' | 'verified';
  attachment?: {
    type: 'image' | 'video' | 'audio' | 'file';
    url: string;
    name: string;
    duration?: string;
  };
  isViewOnce?: boolean; // Una sola reproducción
  isViewed?: boolean;   // Ya abierto / reproducido
  deletedForEveryone?: boolean; // Eliminado para todos
  deletedForUserIds?: string[];  // Eliminado solo para ciertos usuarios
  e2eeEnvelope?: {
    envelopeId: string;
    senderEphemeralPublicKey: string;
    recipientKeyFingerprint: string;
    iv: string;
    ciphertext: string;
    relayServer: string;
    tamperSeal: string;
  };
}

export interface ChatParticipant {
  id: string;
  name: string;
  role: 'admin' | 'member';
  bannedUntil?: number; // timestamp when 3-day ban expires
}

export interface Chat {
  id: string;
  name: string;
  avatar: string;
  isGroup: boolean;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  online: boolean;
  secureId: string;
  recipientPublicKey?: string; // Clave pública del destinatario para cifrado E2EE
  adminId?: string;
  participantsList?: ChatParticipant[];
  messagesEnabled?: boolean; // WhatsApp style: if false, only admins can send messages
  isBlocked?: boolean;       // Bloqueado
  messages: Message[];
}

export interface CallLog {
  id: string;
  contactName: string;
  avatar: string;
  type: 'voice' | 'video';
  direction: 'incoming' | 'outgoing' | 'missed';
  timestamp: string;
  duration: string;
  quantumSecure: boolean;
}

export interface ForumReport {
  id: string;
  reporterId: string;
  reporterName: string;
  reason: string;
  userComment: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  aiVerdict: string;
  timestamp: string;
}

export interface ForumReply {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  text: string;
  timestamp: string;
  isFlaggedByAi?: boolean;
  isOpposingView?: boolean; // Espacio garantizado para posturas contrarias
  attachment?: {
    type: 'image' | 'audio' | 'file';
    url: string;
    name: string;
    fileSize?: string;
  };
  viewedBy?: {
    userId: string;
    userName: string;
    timestamp: string;
  }[];
}

export interface ForumTopic {
  id: string;
  title: string;
  photoUrl: string; // Foto de perfil/portada del foro
  ideology: string; // Ideología civil o causa que representa
  opposingViewpoint?: string; // Espacio y postura contraria para incluir a quienes piensan lo contrario
  category: 'community' | 'social-debate' | 'thematic' | 'activist';
  creatorId: string;
  creatorName: string;
  creatorAvatar?: string;
  timestamp: string;
  content: string;
  repliesCount: number;
  tags: string[];
  quantumVerified: boolean;
  aiSummary?: string;
  messagesEnabled?: boolean; // Control de administración
  isClosed?: boolean; // Clausurado por demandas/reportes
  closureReason?: string;
  reports?: ForumReport[];
  joinedUserIds?: string[]; // Miembros unidos
  bannedUserIds?: string[]; // Miembros expulsados permanentemente
  activeViewersCount?: number; // Cuántos están activos en ese momento viendo
  participants?: { id: string; name: string; avatar?: string; role: 'admin' | 'member' }[];
  bannedUsers?: { userId: string; unbanTimestamp: number; reason: string }[];
  replies: ForumReply[];
}

export interface ExclusiveResource {
  id: string;
  title: string;
  description: string;
  category: 'apk' | 'mesh' | 'quantum' | 'security';
  fileSize: string;
  version: string;
  downloadUrl: string;
  requiresRegistration: boolean;
}

export interface SystemAnnouncement {
  id: string;
  title: string; // "AVISO IMPORTANTE"
  content: string;
  authorName: string;
  timestamp: string;
  createdAt: number;
}

export interface AiTaskSchedule {
  id: string;
  title: string;
  scheduledTime: string;
  type: 'message' | 'report' | 'customer_support' | 'automation';
  targetContactOrForum?: string;
  promptOrText: string;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface AiChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: {
    id: string;
    sender: 'user' | 'ai';
    text: string;
    timestamp: string;
    hash?: string;
    timeMs?: number;
    isAnnouncementAlert?: boolean;
    attachment?: {
      name: string;
      type: string;
      size: string;
      url?: string;
    };
  }[];
}


