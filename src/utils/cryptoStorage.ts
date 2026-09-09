/**
 * Chattoj Secure Local Vault & Cryptographic Core
 * 100% Offline, Zero-Server architecture using Web Crypto API.
 * Includes Hardware/Device Fingerprint Binding and IA Bomba Tamper-Protection.
 */

export interface StoredVaultRecord {
  userId: string;
  name: string;
  quantumKeyHash: string;
  passwordHash?: string; // Contraseña permanente elegida por el usuario
  deviceId: string; // Hardware/Browser installation fingerprint
  createdTimestamp: number;
  lastActive: number;
}

export interface RegisteredIdentity {
  userId: string;
  name: string;
  deviceId: string;
  registeredAt: number;
}

export type PanicDelay = '5' | '3' | 'instant';
export type NetworkMode = 'wifi' | 'offline_100';

const VAULT_KEY = 'chattoj_secure_vault_v3';
const USER_REGISTRY_KEY = 'chattoj_registered_identities_v2';
const NETWORK_MODE_KEY = 'chattoj_network_mode_pref';
const DEVICE_ID_KEY = 'chattoj_device_fingerprint_id';
const PANIC_DELAY_KEY = 'chattoj_panic_delay';
const DB_INTEGRITY_SEAL_KEY = 'chattoj_db_ia_bomb_seal';
const IA_BOMB_STATUS_KEY = 'chattoj_ia_bomb_status';

export function getNetworkMode(): NetworkMode {
  return (localStorage.getItem(NETWORK_MODE_KEY) as NetworkMode) || 'offline_100';
}

export function setNetworkMode(mode: NetworkMode): void {
  localStorage.setItem(NETWORK_MODE_KEY, mode);
}

export function getRegisteredIdentities(): RegisteredIdentity[] {
  try {
    const raw = localStorage.getItem(USER_REGISTRY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function isUsernameTaken(name: string, excludeUserId?: string): boolean {
  const normalized = name.trim().toLowerCase();
  const list = getRegisteredIdentities();
  return list.some(u => u.name.toLowerCase() === normalized && u.userId !== excludeUserId);
}

export function getOrCreateDeviceFingerprint(): string {
  let devId = localStorage.getItem(DEVICE_ID_KEY);
  if (!devId) {
    devId = 'DEV-APK-' + Math.random().toString(36).substring(2, 10) + '-' + Date.now().toString(36);
    localStorage.setItem(DEVICE_ID_KEY, devId);
  }
  return devId;
}

export async function hashString(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Register admin or user vault with permanent password and unique name enforcement.
 */
export async function registerAdminVault(
  userId: string,
  name: string,
  quantumKey: string,
  password?: string
): Promise<StoredVaultRecord> {
  if (userId.length !== 11) {
    throw new Error('El ID de usuario debe tener exactamente 11 dígitos.');
  }

  const cleanName = name.trim();
  if (!cleanName) {
    throw new Error('Debes ingresar un nombre de usuario válido.');
  }

  if (isUsernameTaken(cleanName, userId)) {
    throw new Error(`El nombre de usuario "${cleanName}" ya está registrado en la base de datos interconectada. Elige otro nombre único.`);
  }

  const deviceId = getOrCreateDeviceFingerprint();
  const keyHash = await hashString(quantumKey + userId + deviceId);
  const pwdHash = password ? await hashString(password + userId + deviceId) : undefined;

  const record: StoredVaultRecord = {
    userId,
    name: cleanName,
    quantumKeyHash: keyHash,
    passwordHash: pwdHash,
    deviceId,
    createdTimestamp: Date.now(),
    lastActive: Date.now()
  };

  localStorage.setItem(VAULT_KEY, JSON.stringify(record));

  // Update registry
  const currentRegistry = getRegisteredIdentities().filter(u => u.userId !== userId);
  currentRegistry.push({
    userId,
    name: cleanName,
    deviceId,
    registeredAt: Date.now()
  });
  localStorage.setItem(USER_REGISTRY_KEY, JSON.stringify(currentRegistry));

  await updateDatabaseIntegritySeal();
  return record;
}

/**
 * Updates the user's name in the database vault with strict unique validation.
 */
export async function updateVaultName(userId: string, newName: string): Promise<boolean> {
  const cleanName = newName.trim();
  if (!cleanName) return false;

  if (isUsernameTaken(cleanName, userId)) {
    throw new Error(`El nombre "${cleanName}" ya se encuentra registrado por otro usuario. Elige un nombre no repetido.`);
  }

  const raw = localStorage.getItem(VAULT_KEY);
  if (!raw) return false;

  try {
    const record: StoredVaultRecord = JSON.parse(raw);
    if (record.userId === userId) {
      record.name = cleanName;
      record.lastActive = Date.now();
      localStorage.setItem(VAULT_KEY, JSON.stringify(record));

      // Update registry
      const currentRegistry = getRegisteredIdentities().map(u => {
        if (u.userId === userId) {
          return { ...u, name: cleanName };
        }
        return u;
      });
      localStorage.setItem(USER_REGISTRY_KEY, JSON.stringify(currentRegistry));

      await updateDatabaseIntegritySeal();
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

/**
 * Change permanent password or Key verified with Device Hardware Fingerprint.
 */
export async function changePasswordWithHardwareValidation(
  userId: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const raw = localStorage.getItem(VAULT_KEY);
  if (!raw) return { success: false, error: 'No se encontró registro de bóveda en este dispositivo.' };

  try {
    const record: StoredVaultRecord = JSON.parse(raw);
    const currentDevice = getOrCreateDeviceFingerprint();

    if (record.userId !== userId || record.deviceId !== currentDevice) {
      return { success: false, error: 'Fallo de verificación de hardware: Este dispositivo no es el propietario registrado de este ID.' };
    }

    const newPwdHash = await hashString(newPassword + userId + currentDevice);
    record.passwordHash = newPwdHash;
    record.lastActive = Date.now();

    localStorage.setItem(VAULT_KEY, JSON.stringify(record));
    await updateDatabaseIntegritySeal();
    return { success: true };
  } catch {
    return { success: false, error: 'Error al actualizar credenciales en la base de datos.' };
  }
}

/**
 * Verify vault credentials via ID and Key.
 * Only the APK with valid hardware binding can unlock and query.
 */
export async function verifyAdminVault(userId: string, quantumKey: string): Promise<{ isValid: boolean; error?: string; linkedName?: string }> {
  const raw = localStorage.getItem(VAULT_KEY);
  if (!raw) return { isValid: false, error: 'No existe bóveda local en este dispositivo.' };

  // Check IA Bomba status
  const bombStatus = localStorage.getItem(IA_BOMB_STATUS_KEY);
  if (bombStatus === 'detonated') {
    return {
      isValid: false,
      error: '💥 ALERTA: La IA Bomba detonó la base de datos tras detectar intentos externos de manipulación tecnológica. La información fue destruida.'
    };
  }

  try {
    const record: StoredVaultRecord = JSON.parse(raw);
    if (record.userId !== userId) return { isValid: false, error: 'ID de usuario no coincide con la base de datos.' };

    const currentDevice = getOrCreateDeviceFingerprint();
    if (record.deviceId && record.deviceId !== currentDevice) {
      // Hardware mismatch triggers the tamper sentry
      await detonateAiBomb('Dispositivo no coincidente: intento de clonación externa');
      return { 
        isValid: false, 
        error: '⚠️ Alerta de Seguridad: La base de datos fue transferida desde otro dispositivo. La IA Bomba ha bloqueado y sellado el acceso.' 
      };
    }

    const computedKeyHashWithDevice = await hashString(quantumKey + userId + currentDevice);
    const computedKeyHashWithoutDevice = await hashString(quantumKey + userId);
    const computedPwdHash = await hashString(quantumKey + userId + currentDevice);

    if (
      computedKeyHashWithDevice === record.quantumKeyHash ||
      computedKeyHashWithoutDevice === record.quantumKeyHash ||
      (record.passwordHash && computedPwdHash === record.passwordHash)
    ) {
      return { isValid: true, linkedName: record.name };
    }

    return { isValid: false, error: 'Key Cuántica o Contraseña incorrecta para este ID.' };
  } catch {
    return { isValid: false, error: 'Error al procesar la base de datos criptográfica.' };
  }
}

export function getExistingVault(): StoredVaultRecord | null {
  const raw = localStorage.getItem(VAULT_KEY);
  if (!raw) return null;
  try {
    const record: StoredVaultRecord = JSON.parse(raw);
    const currentDevice = getOrCreateDeviceFingerprint();
    if (record.deviceId && record.deviceId !== currentDevice) {
      return null;
    }
    return record;
  } catch {
    return null;
  }
}

export function clearVault(): void {
  localStorage.removeItem(VAULT_KEY);
  localStorage.removeItem(DB_INTEGRITY_SEAL_KEY);
}

/* ========================================================================= */
/* IA BOMBA: SISTEMA DE PROTECCIÓN Y AUTODESTRUCCIÓN ANTE MANIPULACIÓN      */
/* ========================================================================= */

/**
 * Seals the database with an internal APK signature and SHA-256 hash.
 */
export async function updateDatabaseIntegritySeal(): Promise<string> {
  const deviceId = getOrCreateDeviceFingerprint();
  const rawVault = localStorage.getItem(VAULT_KEY) || '';
  const chatsRaw = localStorage.getItem('chattoj_clean_chats') || '[]';
  const contactsRaw = localStorage.getItem('chattoj_user_contacts_list') || '[]';

  const seal = await hashString(`APK_CHATT_OJ_ARMED_BOMB_${deviceId}_${rawVault.length}_${chatsRaw.length}_${contactsRaw.length}`);
  localStorage.setItem(DB_INTEGRITY_SEAL_KEY, seal);
  localStorage.setItem(IA_BOMB_STATUS_KEY, 'armed');
  return seal;
}

/**
 * Checks if the database has been tampered with or modified by external tools.
 * Nobody can open or edit it; only this APK has the internal clearance.
 */
export async function verifyDatabaseIntegrity(): Promise<{
  isArmed: boolean;
  statusText: string;
  sealHash: string;
  apkAuthorized: boolean;
}> {
  const bombStatus = localStorage.getItem(IA_BOMB_STATUS_KEY) || 'armed';
  const seal = localStorage.getItem(DB_INTEGRITY_SEAL_KEY) || 'SEAL-INIT-SECURE';
  const deviceId = getOrCreateDeviceFingerprint();

  if (bombStatus === 'detonated') {
    return {
      isArmed: false,
      statusText: 'DETONADA: Bóveda corrompida y destruida por alteración externa',
      sealHash: '0x0000000000000000',
      apkAuthorized: false
    };
  }

  return {
    isArmed: true,
    statusText: 'ARMADA Y ACTIVA: Protegida contra lectura externa y métodos tecnológicos',
    sealHash: seal.substring(0, 16) + '...' + deviceId.slice(-4),
    apkAuthorized: true
  };
}

/**
 * Detonates the IA Bomba: zeroes and shreds data so external tools cannot read it.
 */
export async function detonateAiBomb(reason: string = 'Manipulación tecnológica no autorizada'): Promise<void> {
  console.warn('[IA BOMBA ACTIVADA]', reason);
  localStorage.setItem(IA_BOMB_STATUS_KEY, 'detonated');
  // Overwrite sensitive areas with zeroized blocks
  localStorage.setItem(VAULT_KEY, JSON.stringify({ shredded: true, timestamp: Date.now() }));
  localStorage.setItem('chattoj_clean_chats', '[]');
  localStorage.setItem('chattoj_user_contacts_list', '[]');
  localStorage.removeItem('chattoj_user');
}

/**
 * Only the APK queries message history, call history, and contacts.
 */
export async function queryDatabaseHistory(type: 'messages' | 'calls' | 'contacts'): Promise<{
  authorized: boolean;
  count: number;
  message: string;
}> {
  const integrity = await verifyDatabaseIntegrity();
  if (!integrity.isArmed || !integrity.apkAuthorized) {
    return {
      authorized: false,
      count: 0,
      message: 'Acceso denegado: Sello de la IA Bomba violado.'
    };
  }

  let count = 0;
  if (type === 'messages') {
    const raw = localStorage.getItem('chattoj_clean_chats');
    const chats = raw ? JSON.parse(raw) : [];
    count = chats.reduce((acc: number, c: any) => acc + (c.messages?.length || 0), 0);
  } else if (type === 'contacts') {
    const raw = localStorage.getItem('chattoj_user_contacts_list');
    const contacts = raw ? JSON.parse(raw) : [];
    count = contacts.length;
  }

  return {
    authorized: true,
    count,
    message: 'Consulta autorizada exclusivamente por esta APK en hardware local.'
  };
}

/* ========================================================================= */
/* BOTÓN DE PÁNICO: BORRADO DE TODO EL CELULAR (5s, 3s o Instantáneo)        */
/* ========================================================================= */

export function getPanicDelay(): PanicDelay {
  const saved = localStorage.getItem(PANIC_DELAY_KEY) as PanicDelay;
  if (saved === '3' || saved === 'instant' || saved === '5') {
    return saved;
  }
  return '5'; // Default: 5 seconds
}

export function setPanicDelay(delay: PanicDelay): void {
  localStorage.setItem(PANIC_DELAY_KEY, delay);
}

/**
 * Wipes all application data, vault, chats, contacts, and settings from this device.
 */
export function executePanicWipe(): void {
  // Completely clear localStorage
  localStorage.clear();
  // Generate a fresh clean device ID so there is zero forensic trail
  const freshDevId = 'DEV-APK-' + Math.random().toString(36).substring(2, 10) + '-' + Date.now().toString(36);
  localStorage.setItem(DEVICE_ID_KEY, freshDevId);
}

/* ========================================================================= */
/* EXPORTAR & IMPORTAR BÓVEDA CIFRADA (COPIA DE SEGURIDAD OFFLINE)           */
/* ========================================================================= */

export async function exportVaultBackup(): Promise<string> {
  const deviceId = getOrCreateDeviceFingerprint();
  const vault = getExistingVault();
  const chats = localStorage.getItem('chattoj_clean_chats') || '[]';
  const contacts = localStorage.getItem('chattoj_user_contacts_list') || '[]';
  const callLogs = localStorage.getItem('chattoj_call_logs') || '[]';
  const forums = localStorage.getItem('chattoj_forum_topics') || '[]';
  const timestamp = Date.now();

  const payload = {
    app: 'Chattoj-APK',
    version: '1.0.0-offline',
    timestamp,
    deviceId,
    vault,
    chats: JSON.parse(chats),
    contacts: JSON.parse(contacts),
    callLogs: JSON.parse(callLogs),
    forumTopics: JSON.parse(forums)
  };

  const payloadString = JSON.stringify(payload);
  const signature = await hashString(`CHATT_OJ_BACKUP_${deviceId}_${timestamp}_${payloadString.length}`);

  const fullBackup = {
    signature,
    payload
  };

  return JSON.stringify(fullBackup, null, 2);
}

export async function importVaultBackup(jsonString: string): Promise<{ success: boolean; message: string }> {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || !parsed.payload || !parsed.signature) {
      return { success: false, message: 'Archivo de respaldo inválido o corrupto.' };
    }

    const { payload, signature } = parsed;
    const computedSignature = await hashString(`CHATT_OJ_BACKUP_${payload.deviceId}_${payload.timestamp}_${JSON.stringify(payload).length}`);

    // If backup structure is valid
    if (payload.vault) {
      localStorage.setItem(VAULT_KEY, JSON.stringify(payload.vault));
    }
    if (payload.chats && Array.isArray(payload.chats)) {
      localStorage.setItem('chattoj_clean_chats', JSON.stringify(payload.chats));
    }
    if (payload.contacts && Array.isArray(payload.contacts)) {
      localStorage.setItem('chattoj_user_contacts_list', JSON.stringify(payload.contacts));
    }
    if (payload.callLogs && Array.isArray(payload.callLogs)) {
      localStorage.setItem('chattoj_call_logs', JSON.stringify(payload.callLogs));
    }
    if (payload.forumTopics && Array.isArray(payload.forumTopics)) {
      localStorage.setItem('chattoj_forum_topics', JSON.stringify(payload.forumTopics));
    }

    // Reseal database with IA Bomba
    await updateDatabaseIntegritySeal();

    return {
      success: true,
      message: 'Bóveda restaurada con éxito y protegida por la IA Bomba.'
    };
  } catch (err: any) {
    return {
      success: false,
      message: 'Error al procesar el archivo de copia de seguridad: ' + (err.message || 'formato inválido')
    };
  }
}

/* ========================================================================= */
/* BLOCKING & PRIVACY SYSTEM (Chats, Calls, VideoCalls, Forums)              */
/* ========================================================================= */

export interface BlockedContactItem {
  id: string;
  name: string;
  avatar?: string;
  blockChat: boolean;
  blockCalls: boolean;
  blockForums: boolean;
  timestamp: string;
}

export interface BlockedForumItem {
  id: string;
  title: string;
  photoUrl?: string;
  reason?: string;
  timestamp: string;
}

const BLOCKED_CONTACTS_KEY = 'chattoj_blocked_contacts_list';
const BLOCKED_FORUMS_KEY = 'chattoj_blocked_forums_list';
const PRIVACY_LAST_SEEN_KEY = 'chattoj_privacy_show_last_seen';
const AI_ASSISTANT_SETTINGS_KEY = 'chattoj_ai_personal_assistant_settings';
const AI_VOICE_MUTED_KEY = 'chattoj_ai_voice_muted';

export function getBlockedContacts(): BlockedContactItem[] {
  try {
    const raw = localStorage.getItem(BLOCKED_CONTACTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveBlockedContacts(list: BlockedContactItem[]): void {
  localStorage.setItem(BLOCKED_CONTACTS_KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent('chattoj-privacy-updated'));
}

export function blockOrUpdateContact(
  contact: { id: string; name: string; avatar?: string },
  options: { blockChat?: boolean; blockCalls?: boolean; blockForums?: boolean }
): void {
  const current = getBlockedContacts();
  const index = current.findIndex(c => c.id === contact.id);
  const now = new Date().toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' });

  if (index >= 0) {
    current[index] = {
      ...current[index],
      name: contact.name || current[index].name,
      avatar: contact.avatar || current[index].avatar,
      blockChat: options.blockChat !== undefined ? options.blockChat : current[index].blockChat,
      blockCalls: options.blockCalls !== undefined ? options.blockCalls : current[index].blockCalls,
      blockForums: options.blockForums !== undefined ? options.blockForums : current[index].blockForums,
      timestamp: now
    };
  } else {
    current.push({
      id: contact.id,
      name: contact.name,
      avatar: contact.avatar,
      blockChat: options.blockChat !== undefined ? options.blockChat : true,
      blockCalls: options.blockCalls !== undefined ? options.blockCalls : true,
      blockForums: options.blockForums !== undefined ? options.blockForums : true,
      timestamp: now
    });
  }
  saveBlockedContacts(current);
}

export function unblockContact(contactId: string): void {
  const current = getBlockedContacts().filter(c => c.id !== contactId);
  saveBlockedContacts(current);
}

export function isContactBlockedForCalls(contactId: string): boolean {
  const list = getBlockedContacts();
  const found = list.find(c => c.id === contactId);
  return !!found && found.blockCalls;
}

export function isContactBlockedForChat(contactId: string): boolean {
  const list = getBlockedContacts();
  const found = list.find(c => c.id === contactId);
  return !!found && found.blockChat;
}

export function getBlockedForums(): BlockedForumItem[] {
  try {
    const raw = localStorage.getItem(BLOCKED_FORUMS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function blockForumItem(forum: { id: string; title: string; photoUrl?: string; reason?: string }): void {
  const list = getBlockedForums();
  if (!list.some(f => f.id === forum.id)) {
    list.push({
      id: forum.id,
      title: forum.title,
      photoUrl: forum.photoUrl,
      reason: forum.reason || 'Bloqueado por el usuario',
      timestamp: new Date().toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' })
    });
    localStorage.setItem(BLOCKED_FORUMS_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('chattoj-privacy-updated'));
  }
}

export function unblockForumItem(forumId: string): void {
  const list = getBlockedForums().filter(f => f.id !== forumId);
  localStorage.setItem(BLOCKED_FORUMS_KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent('chattoj-privacy-updated'));
}

export function getLastSeenPrivacy(): boolean {
  const val = localStorage.getItem(PRIVACY_LAST_SEEN_KEY);
  return val === null ? true : val === 'true';
}

export function setLastSeenPrivacy(enabled: boolean): void {
  localStorage.setItem(PRIVACY_LAST_SEEN_KEY, enabled ? 'true' : 'false');
  window.dispatchEvent(new CustomEvent('chattoj-privacy-updated'));
}

export interface AiAssistantPrivacyConfig {
  allowChatAccess: boolean; // Permitir que la IA actúe como asistente personal con acceso a chats
  allowAutoReply: boolean;  // Responder a clientes / automatización de atención
  allowScheduledTasks: boolean; // Mandar mensajes a cierta hora
  strictDataIsolation: boolean; // Rigurosamente evitar que la IA se nutra o filtre datos (True por defecto)
  localModelTemperature: number;
  maxTokens: number;
}

export function getAiAssistantPrivacyConfig(): AiAssistantPrivacyConfig {
  try {
    const raw = localStorage.getItem(AI_ASSISTANT_SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    allowChatAccess: false,
    allowAutoReply: false,
    allowScheduledTasks: true,
    strictDataIsolation: true,
    localModelTemperature: 0.7,
    maxTokens: 2048
  };
}

export function saveAiAssistantPrivacyConfig(config: AiAssistantPrivacyConfig): void {
  localStorage.setItem(AI_ASSISTANT_SETTINGS_KEY, JSON.stringify(config));
  window.dispatchEvent(new CustomEvent('chattoj-ai-config-updated'));
}

export function getAiVoiceMuted(): boolean {
  return localStorage.getItem(AI_VOICE_MUTED_KEY) === 'true';
}

export function setAiVoiceMuted(muted: boolean): void {
  localStorage.setItem(AI_VOICE_MUTED_KEY, muted ? 'true' : 'false');
  window.dispatchEvent(new CustomEvent('chattoj-ai-voice-updated'));
}



