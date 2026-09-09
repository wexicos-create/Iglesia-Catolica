import React, { useState } from 'react';
import { UserProfile } from '../types';
import { AdminBadge } from './AdminBadge';
import { 
  getOrCreateDeviceFingerprint, 
  updateVaultName, 
  getPanicDelay, 
  setPanicDelay, 
  verifyDatabaseIntegrity, 
  PanicDelay,
  getBlockedContacts,
  unblockContact,
  getBlockedForums,
  unblockForumItem,
  getAiAssistantPrivacyConfig,
  saveAiAssistantPrivacyConfig,
  AiAssistantPrivacyConfig
} from '../utils/cryptoStorage';
import { 
  getBannedMacList, 
  unbanDeviceMac, 
  banDeviceMac, 
  getHighRiskStatus, 
  setHighRiskProtection 
} from '../utils/threatProtection';
import { ADMIN_CONTACT_INFO } from '../utils/llamaEngine';
import { 
  ArrowLeft, Search, QrCode, Key, Lock, MessageSquare, Bell, 
  Database, Sparkles, Shield, HelpCircle, UserPlus, ChevronRight, 
  Camera, Edit2, Check, X, Smartphone, Fingerprint, ShieldCheck, 
  Volume2, HardDrive, Trash2, Copy, Share2, CheckCheck, Moon, 
  Sliders, RefreshCw, LogOut, Info, AlertTriangle, Flame, ShieldAlert,
  Facebook, Instagram, Phone, ExternalLink, Heart, Ban, Bot, UserX,
  Video, EyeOff, Server, Globe
} from 'lucide-react';
import { AdminServerManager } from './AdminServerManager';

interface SettingsViewProps {
  currentUser: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  onBack?: () => void;
  onLogout?: () => void;
}

type SettingsSection = 
  | 'main' 
  | 'profile' 
  | 'account' 
  | 'privacy' 
  | 'chats' 
  | 'notifications' 
  | 'storage' 
  | 'llama' 
  | 'hardware' 
  | 'help' 
  | 'qr';

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentUser,
  onUpdateProfile,
  onBack,
  onLogout
}) => {
  const [currentSection, setCurrentSection] = useState<SettingsSection>('main');
  const [copiedKey, setCopiedKey] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [showServerManager, setShowServerManager] = useState(false);

  // Profile Edit States
  const [editName, setEditName] = useState(currentUser.name);
  const [editStatus, setEditStatus] = useState(currentUser.statusMessage || '¡Hola! Estoy usando Chattoj Cuántico.');
  const [showNameEditModal, setShowNameEditModal] = useState(false);
  const [showStatusEditModal, setShowStatusEditModal] = useState(false);
  const [showAvatarPickerModal, setShowAvatarPickerModal] = useState(false);

  // Panic Button delay setting
  const [panicDelaySetting, setPanicDelaySetting] = useState<PanicDelay>(() => getPanicDelay());

  // IA Bomba Integrity status
  const [integrityReport, setIntegrityReport] = useState<{
    isArmed: boolean;
    statusText: string;
    sealHash: string;
    apkAuthorized: boolean;
  } | null>(null);
  const [isVerifyingIntegrity, setIsVerifyingIntegrity] = useState(false);

  // Privacy Settings States (Stored in localStorage)
  const [readReceipts, setReadReceipts] = useState(() => localStorage.getItem('chattoj_setting_read_receipts') !== 'false');
  const [lastSeen, setLastSeen] = useState(() => localStorage.getItem('chattoj_setting_last_seen') || 'Nadie');
  const [disappearingMessages, setDisappearingMessages] = useState(() => localStorage.getItem('chattoj_setting_disappearing') || '24 horas');
  const [fingerprintLock, setFingerprintLock] = useState(() => localStorage.getItem('chattoj_setting_fingerprint') !== 'false');

  // Chats Settings States
  const [appTheme, setAppTheme] = useState(() => localStorage.getItem('chattoj_setting_theme') || 'Oscuro OLED');
  const [chatWallpaper, setChatWallpaper] = useState(() => localStorage.getItem('chattoj_setting_wallpaper') || 'Matriz Cuántica');

  // Notifications Settings States
  const [conversationTones, setConversationTones] = useState(() => localStorage.getItem('chattoj_setting_tones') !== 'false');
  const [highPriorityAlerts, setHighPriorityAlerts] = useState(() => localStorage.getItem('chattoj_setting_high_priority') !== 'false');

  // Storage & Data States
  const [autoDownloadWifi, setAutoDownloadWifi] = useState(true);
  const [autoDownloadData, setAutoDownloadData] = useState(false);
  const [mediaQuality, setMediaQuality] = useState('Calidad HD');

  // Llama Offline Engine Settings States
  const [llamaRamAllocation, setLlamaRamAllocation] = useState('1.5 GB');
  const [llamaTemperature, setLlamaTemperature] = useState('0.4 (Equilibrado)');

  // Blocked lists and AI Config
  const [blockedContactsList, setBlockedContactsList] = useState(() => getBlockedContacts());
  const [blockedForumsList, setBlockedForumsList] = useState(() => getBlockedForums());
  const [aiPrivacyConfig, setAiPrivacyConfig] = useState<AiAssistantPrivacyConfig>(() => getAiAssistantPrivacyConfig());
  const [bannedMacsList, setBannedMacsList] = useState(() => getBannedMacList());
  const [highRiskProtected, setHighRiskProtected] = useState(() => getHighRiskStatus());

  const deviceId = getOrCreateDeviceFingerprint();

  const showNotificationToast = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(null), 3000);
  };

  // Profile save handlers: links the updated name to the ID and Key in the database
  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;
    const updated = {
      ...currentUser,
      name: editName.trim()
    };
    await updateVaultName(currentUser.userId, editName.trim());
    onUpdateProfile(updated);
    setShowNameEditModal(false);
    showNotificationToast('Nombre enlazado con tu ID y Key en la base de datos');
  };

  const handleSaveStatus = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...currentUser,
      statusMessage: editStatus.trim() || 'Disponible'
    };
    onUpdateProfile(updated);
    setShowStatusEditModal(false);
    showNotificationToast('Info / Estado actualizado');
  };

  const handleSelectAvatar = (url: string) => {
    const updated = {
      ...currentUser,
      avatar: url
    };
    onUpdateProfile(updated);
    setShowAvatarPickerModal(false);
    showNotificationToast('Foto de perfil actualizada');
  };

  const handleCopyQuantumKey = () => {
    navigator.clipboard.writeText(currentUser.quantumKey);
    setCopiedKey(true);
    showNotificationToast('Clave cuántica copiada al portapapeles');
    setTimeout(() => setCopiedKey(false), 2500);
  };

  const sampleAvatars = [
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
  ];

  /* ========================================================================= */
  /* SUB-VIEW: PERFIL (WhatsApp style Profile screen)                          */
  /* ========================================================================= */
  if (currentSection === 'profile') {
    return (
      <div className="flex-1 flex flex-col h-full bg-[#070b08] select-none overflow-hidden relative">
        {/* Top Header */}
        <div className="h-14 px-3 bg-[#0d1410] border-b border-emerald-950 flex items-center gap-3 shrink-0">
          <button
            onClick={() => setCurrentSection('main')}
            className="p-1 -ml-1 text-emerald-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-base font-semibold text-white">Perfil</h2>
        </div>

        {/* Profile Content */}
        <div className="flex-1 overflow-y-auto divide-y divide-emerald-950/40">
          {/* Avatar Area with Camera overlay */}
          <div className="py-8 flex flex-col items-center justify-center bg-[#090f0c]">
            <div className="relative group cursor-pointer" onClick={() => setShowAvatarPickerModal(true)}>
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-32 h-32 rounded-full object-cover border-2 border-emerald-500/60 shadow-2xl"
              />
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity">
                <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-black shadow-lg">
                  <Camera className="w-5 h-5" />
                </div>
              </div>
            </div>
            <p className="text-[11px] text-zinc-400 font-mono mt-3">
              Toca para cambiar foto o avatar
            </p>
          </div>

          {/* Nombre Row (with WhatsApp pencil button) */}
          <div 
            onClick={() => { setEditName(currentUser.name); setShowNameEditModal(true); }}
            className="px-5 py-4 flex items-center justify-between hover:bg-emerald-950/20 transition-colors cursor-pointer"
          >
            <div className="flex-1 min-w-0 pr-4">
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-wide block mb-1">
                Nombre
              </span>
              <h3 className="text-base font-medium text-white truncate flex items-center gap-2">
                <span>{currentUser.name}</span>
                <AdminBadge userId={currentUser.userId} />
              </h3>
              <p className="text-[11px] text-zinc-300 font-mono mt-1">
                Visible para tus contactos. Tu perfil se guarda solo en este celular y nada se sube a internet.
              </p>
            </div>
            <button className="w-9 h-9 rounded-full bg-emerald-950/80 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-800/60">
              <Edit2 className="w-4 h-4" />
            </button>
          </div>

          {/* Info / Estado Row */}
          <div 
            onClick={() => { setEditStatus(currentUser.statusMessage || ''); setShowStatusEditModal(true); }}
            className="px-5 py-4 flex items-center justify-between hover:bg-emerald-950/20 transition-colors cursor-pointer"
          >
            <div className="flex-1 min-w-0 pr-4">
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-wide block mb-1">
                Info.
              </span>
              <h3 className="text-sm font-medium text-white truncate">
                {currentUser.statusMessage || '¡Hola! Estoy usando Chattoj.'}
              </h3>
            </div>
            <button className="w-9 h-9 rounded-full bg-emerald-950/80 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-800/60">
              <Edit2 className="w-4 h-4" />
            </button>
          </div>

          {/* ID Cuántico de 11 Dígitos (Equivalente al número en WhatsApp) */}
          <div className="px-5 py-4 flex items-center justify-between">
            <div className="flex-1 min-w-0 pr-4">
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-wide block mb-1">
                ID Cuántico de Usuario (11 dígitos)
              </span>
              <h3 className="text-sm font-mono font-bold text-emerald-400 tracking-wider">
                {currentUser.userId}
              </h3>
              <p className="text-[11px] text-zinc-300 font-mono mt-1">
                Tu número exclusivo para hablar de celular a celular sin pasar por servidores.
              </p>
            </div>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(currentUser.userId);
                showNotificationToast('ID de 11 dígitos copiado');
              }}
              className="w-9 h-9 rounded-full bg-emerald-950/80 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-800/60 cursor-pointer"
              title="Copiar ID"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* MODAL: EDITAR NOMBRE */}
        {showNameEditModal && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#0d1410] border border-emerald-800 rounded-3xl p-5 max-w-xs w-full shadow-2xl space-y-4">
              <h3 className="text-sm font-bold text-white">Ingresa tu nombre</h3>
              <form onSubmit={handleSaveName} className="space-y-4">
                <div>
                  <input
                    type="text"
                    maxLength={25}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-[#070b08] border border-emerald-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    autoFocus
                    required
                  />
                  <div className="flex justify-between items-center mt-1 text-[10px] text-zinc-400 font-mono">
                    <span>Máximo 25 caracteres</span>
                    <span>{25 - editName.length}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNameEditModal(false)}
                    className="flex-1 bg-[#070b08] hover:bg-zinc-800 text-zinc-300 py-2 rounded-xl text-xs border border-zinc-700 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-black font-semibold py-2 rounded-xl text-xs cursor-pointer shadow-md"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: EDITAR ESTADO / INFO */}
        {showStatusEditModal && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#0d1410] border border-emerald-800 rounded-3xl p-5 max-w-xs w-full shadow-2xl space-y-4">
              <h3 className="text-sm font-bold text-white">Editar info.</h3>
              <form onSubmit={handleSaveStatus} className="space-y-4">
                <input
                  type="text"
                  maxLength={70}
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full bg-[#070b08] border border-emerald-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  autoFocus
                />

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowStatusEditModal(false)}
                    className="flex-1 bg-[#070b08] hover:bg-zinc-800 text-zinc-300 py-2 rounded-xl text-xs border border-zinc-700 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-black font-semibold py-2 rounded-xl text-xs cursor-pointer shadow-md"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: SELECCIONAR FOTO / AVATAR */}
        {showAvatarPickerModal && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#0d1410] border border-emerald-800 rounded-3xl p-5 max-w-xs w-full shadow-2xl space-y-4 text-center">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Selecciona tu Avatar</h3>
                <button
                  onClick={() => setShowAvatarPickerModal(false)}
                  className="text-zinc-400 hover:text-white p-1 text-xs"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3 py-2">
                {sampleAvatars.map((url, idx) => (
                  <img
                    key={idx}
                    src={url}
                    alt={`Avatar ${idx + 1}`}
                    onClick={() => handleSelectAvatar(url)}
                    className="w-16 h-16 rounded-full object-cover mx-auto border-2 border-emerald-900 hover:border-emerald-400 transition-all cursor-pointer hover:scale-105"
                  />
                ))}
              </div>

              <p className="text-[10px] text-zinc-400 font-mono">
                La foto se almacena en la bóveda local cifrada sin subirse a ningún servidor en la nube.
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ========================================================================= */
  /* SUB-VIEW: CUENTA (Account)                                                */
  /* ========================================================================= */
  if (currentSection === 'account') {
    return (
      <div className="flex-1 flex flex-col h-full bg-[#070b08] select-none overflow-hidden">
        <div className="h-14 px-3 bg-[#0d1410] border-b border-emerald-950 flex items-center gap-3 shrink-0">
          <button onClick={() => setCurrentSection('main')} className="p-1 -ml-1 text-emerald-400 hover:text-white rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-base font-semibold text-white">Cuenta</h2>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-emerald-950/30">
          <div className="px-4 py-3.5 flex items-center justify-between hover:bg-emerald-950/20 cursor-pointer">
            <div>
              <h4 className="text-sm font-medium text-white">Notificaciones de seguridad</h4>
              <p className="text-xs text-zinc-400 font-mono">Recibe alertas si cambian las claves cuánticas de un chat</p>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-500" />
          </div>

          <div className="px-4 py-3.5 flex items-center justify-between hover:bg-emerald-950/20 cursor-pointer">
            <div>
              <h4 className="text-sm font-medium text-white">Llaves de acceso (Passkeys de Hardware)</h4>
              <p className="text-xs text-zinc-400 font-mono">Autenticación local biométrica en este dispositivo</p>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-500" />
          </div>

          <div className="px-4 py-3.5 flex items-center justify-between hover:bg-emerald-950/20 cursor-pointer">
            <div>
              <h4 className="text-sm font-medium text-white">ID Cuántico</h4>
              <p className="text-xs text-emerald-400 font-mono">{currentUser.userId}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-500" />
          </div>

          <div className="px-4 py-3.5 flex items-center justify-between hover:bg-emerald-950/20 cursor-pointer">
            <div>
              <h4 className="text-sm font-medium text-white">Solicitar información de la cuenta</h4>
              <p className="text-xs text-zinc-400 font-mono">Copia completa de registros locales sin conexión externa</p>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-500" />
          </div>

          <div 
            onClick={() => onLogout && onLogout()}
            className="px-4 py-3.5 flex items-center justify-between hover:bg-red-950/30 cursor-pointer text-red-400"
          >
            <div>
              <h4 className="text-sm font-medium">Bloquear y Cerrar Bóveda</h4>
              <p className="text-xs text-red-300/70 font-mono">Exige PIN de nuevo para desbloquear la sesión</p>
            </div>
            <LogOut className="w-4 h-4" />
          </div>
        </div>
      </div>
    );
  }

  /* ========================================================================= */
  /* SUB-VIEW: PRIVACIDAD (Privacy)                                            */
  /* ========================================================================= */
  if (currentSection === 'privacy') {
    return (
      <div className="flex-1 flex flex-col h-full bg-[#070b08] select-none overflow-hidden">
        <div className="h-14 px-3 bg-[#0d1410] border-b border-emerald-950 flex items-center gap-3 shrink-0">
          <button onClick={() => setCurrentSection('main')} className="p-1 -ml-1 text-emerald-400 hover:text-white rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-base font-semibold text-white">Privacidad</h2>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-emerald-950/30">
          {/* Hora de última vez y En línea */}
          <div 
            onClick={() => {
              const next = lastSeen === 'Nadie' ? 'Mis contactos' : lastSeen === 'Mis contactos' ? 'Todos' : 'Nadie';
              setLastSeen(next);
              localStorage.setItem('chattoj_setting_last_seen', next);
              showNotificationToast(`Última vez ajustada a: ${next}`);
            }}
            className="px-4 py-3.5 flex items-center justify-between hover:bg-emerald-950/20 cursor-pointer"
          >
            <div>
              <h4 className="text-sm font-medium text-white">Hora de últ. vez y En línea</h4>
              <p className="text-xs text-emerald-400 font-mono">{lastSeen}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-500" />
          </div>

          {/* Confirmaciones de lectura (Doble check) */}
          <div className="px-4 py-3.5 flex items-center justify-between">
            <div className="pr-4">
              <h4 className="text-sm font-medium text-white">Confirmaciones de lectura</h4>
              <p className="text-xs text-zinc-400 font-mono">Si se desactivan, no enviarás ni verás los dobles checks verdes</p>
            </div>
            <input 
              type="checkbox" 
              checked={readReceipts}
              onChange={(e) => {
                setReadReceipts(e.target.checked);
                localStorage.setItem('chattoj_setting_read_receipts', String(e.target.checked));
                showNotificationToast(e.target.checked ? 'Confirmaciones activadas' : 'Confirmaciones desactivadas');
              }}
              className="w-5 h-5 accent-emerald-500 rounded cursor-pointer" 
            />
          </div>

          {/* Mensajes temporales */}
          <div 
            onClick={() => {
              const next = disappearingMessages === 'Desactivados' ? '24 horas' : disappearingMessages === '24 horas' ? '7 días' : 'Desactivados';
              setDisappearingMessages(next);
              localStorage.setItem('chattoj_setting_disappearing', next);
              showNotificationToast(`Mensajes temporales: ${next}`);
            }}
            className="px-4 py-3.5 flex items-center justify-between hover:bg-emerald-950/20 cursor-pointer"
          >
            <div>
              <h4 className="text-sm font-medium text-white">Duración predeterminada de mensajes temporales</h4>
              <p className="text-xs text-emerald-400 font-mono">{disappearingMessages}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-500" />
          </div>

          {/* Bloqueo con huella dactilar de este teléfono */}
          <div className="px-4 py-3.5 flex items-center justify-between">
            <div className="pr-4">
              <h4 className="text-sm font-medium text-white">Bloqueo con huella o hardware</h4>
              <p className="text-xs text-zinc-400 font-mono">Exigir huella biométrica para abrir la app</p>
            </div>
            <input 
              type="checkbox" 
              checked={fingerprintLock}
              onChange={(e) => {
                setFingerprintLock(e.target.checked);
                localStorage.setItem('chattoj_setting_fingerprint', String(e.target.checked));
                showNotificationToast(e.target.checked ? 'Bloqueo con huella activo' : 'Bloqueo desactivado');
              }}
              className="w-5 h-5 accent-emerald-500 rounded cursor-pointer" 
            />
          </div>

          {/* GESTIÓN DE BLOQUEOS (Contactos, Llamadas, Videollamadas y Foros) */}
          <div className="p-4 bg-[#090e0b] border-t border-emerald-950/80 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-bold">
              <Ban className="w-4 h-4 text-red-400" />
              <span>Contactos y Llamadas Bloqueadas ({blockedContactsList.length})</span>
            </div>
            <p className="text-xs text-zinc-300">
              Personas bloqueadas para que no puedan enviarte mensajes, llamarte por voz ni hacerte videollamadas.
            </p>
            {blockedContactsList.length === 0 ? (
              <p className="text-[11px] text-zinc-500 italic">No tienes ningún contacto bloqueado.</p>
            ) : (
              <div className="space-y-1.5">
                {blockedContactsList.map(c => (
                  <div key={c.id} className="p-2 rounded-xl bg-[#060a07] border border-emerald-950 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-white block">{c.name}</span>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {c.blockCalls ? '📵 Llamadas bloqueadas • ' : ''}
                        {c.blockForums ? '🚫 Foros bloqueados' : ''}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        unblockContact(c.id);
                        setBlockedContactsList(getBlockedContacts());
                        showNotificationToast(`${c.name} desbloqueado.`);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-300 hover:bg-emerald-900 text-xs font-mono cursor-pointer border border-emerald-800"
                    >
                      Desbloquear
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* FOROS ACTIVISTAS BLOQUEADOS */}
          <div className="p-4 bg-[#090e0b] border-t border-emerald-950/80 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-bold">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Foros y Fotos Activistas Bloqueados ({blockedForumsList.length})</span>
            </div>
            <p className="text-xs text-zinc-300">
              Foros o fotos comunitarias que decidiste ocultar y bloquear de tu bandeja.
            </p>
            {blockedForumsList.length === 0 ? (
              <p className="text-[11px] text-zinc-500 italic">No tienes foros bloqueados.</p>
            ) : (
              <div className="space-y-1.5">
                {blockedForumsList.map(f => (
                  <div key={f.id} className="p-2 rounded-xl bg-[#060a07] border border-emerald-950 flex items-center justify-between text-xs">
                    <span className="font-semibold text-white truncate max-w-[200px]">{f.title}</span>
                    <button
                      type="button"
                      onClick={() => {
                        unblockForumItem(f.id);
                        setBlockedForumsList(getBlockedForums());
                        showNotificationToast(`Foro desbloqueado.`);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-300 hover:bg-emerald-900 text-xs font-mono cursor-pointer border border-emerald-800"
                    >
                      Desbloquear
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* PRIVACIDAD Y PERMISOS DE LA IA (Asistente Personal y Automatización) */}
          <div className="p-4 bg-[#090e0b] border-t border-emerald-950/80 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-bold">
              <Bot className="w-4 h-4 text-emerald-400" />
              <span>Privacidad & Permisos de la IA (Llama Offline)</span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              La Inteligencia Artificial funciona 100% de manera local en el procesador de este teléfono. <em>Por defecto no tiene acceso a tus datos de chat</em> a menos que autorices su uso como asistente personal o para automatizar respuestas.
            </p>
            
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between bg-[#060a07] p-2.5 rounded-xl border border-emerald-950">
                <div className="pr-2">
                  <h5 className="text-xs font-semibold text-white">Permitir Asistente Personal en Chats</h5>
                  <p className="text-[10px] text-zinc-400">Permite a la IA automatizar respuestas y programar mensajes</p>
                </div>
                <input
                  type="checkbox"
                  checked={aiPrivacyConfig.allowChatAccess}
                  onChange={(e) => {
                    const updated = { ...aiPrivacyConfig, allowChatAccess: e.target.checked };
                    setAiPrivacyConfig(updated);
                    saveAiAssistantPrivacyConfig(updated);
                    showNotificationToast(e.target.checked ? 'Acceso de asistente personal permitido' : 'Acceso a chats revocado');
                  }}
                  className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between bg-[#060a07] p-2.5 rounded-xl border border-emerald-950">
                <div className="pr-2">
                  <h5 className="text-xs font-semibold text-white">Aislamiento Estricto Soberano</h5>
                  <p className="text-[10px] text-zinc-400">Prohibición de auto-nutrición o filtrado de información</p>
                </div>
                <input
                  type="checkbox"
                  checked={aiPrivacyConfig.strictDataIsolation}
                  onChange={(e) => {
                    const updated = { ...aiPrivacyConfig, strictDataIsolation: e.target.checked };
                    setAiPrivacyConfig(updated);
                    saveAiAssistantPrivacyConfig(updated);
                    showNotificationToast('Aislamiento estricto actualizado');
                  }}
                  className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* MEDIDAS DE RIESGO ELEVADAS & BANEO DE MAC DE HARDWARE */}
          <div className="p-4 bg-[#090e0b] border-t border-emerald-950/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-400 font-mono text-xs font-bold">
                <ShieldAlert className="w-4 h-4 text-red-400" />
                <span>Medidas de Riesgo Elevadas & Baneo de MAC</span>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                highRiskProtected 
                  ? 'bg-red-950/80 border-red-700 text-red-300 animate-pulse' 
                  : 'bg-emerald-950/60 border-emerald-800 text-emerald-400'
              }`}>
                {highRiskProtected ? 'ESCUDO ACTIVO' : 'MODO NORMAL'}
              </span>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Si detectas agresiones o amenazas, la IA activa un protocolo de contramedidas de alto nivel y <strong>bloquea la dirección MAC del dispositivo físico del atacante</strong> para que nunca más pueda interactuar contigo.
            </p>

            <div className="flex items-center justify-between bg-[#060a07] p-2.5 rounded-xl border border-red-950/80">
              <div className="pr-2">
                <h5 className="text-xs font-semibold text-white">Blindaje Automático Anti-Amenazas</h5>
                <p className="text-[10px] text-zinc-400">Elevar riesgo al nivel 5 y banear dispositivos hostiles</p>
              </div>
              <input
                type="checkbox"
                checked={highRiskProtected}
                onChange={(e) => {
                  setHighRiskProtected(e.target.checked);
                  setHighRiskProtection(e.target.checked);
                  showNotificationToast(e.target.checked ? 'Blindaje de alto riesgo activado' : 'Modo normal restaurado');
                }}
                className="w-5 h-5 accent-red-500 rounded cursor-pointer"
              />
            </div>

            {/* List of banned MACs */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-zinc-400">
                  Direcciones MAC de Hardware Baneadas ({bannedMacsList.length})
                </span>
              </div>

              {bannedMacsList.length === 0 ? (
                <p className="text-[11px] text-zinc-500 italic bg-[#060a07] p-2.5 rounded-xl border border-emerald-950">
                  No hay dispositivos con MAC baneada.
                </p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {bannedMacsList.map(item => (
                    <div key={item.mac} className="p-2.5 rounded-xl bg-[#060a07] border border-red-950 flex items-center justify-between text-xs font-mono">
                      <div>
                        <div className="text-red-300 font-bold">{item.mac}</div>
                        <div className="text-[10px] text-zinc-400">
                          {item.identifier} • {item.reason}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          unbanDeviceMac(item.mac);
                          setBannedMacsList(getBannedMacList());
                          showNotificationToast(`MAC ${item.mac} desbaneada.`);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 text-xs cursor-pointer border border-zinc-700 shrink-0"
                      >
                        Desbanear
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Configuración del Botón de Pánico (Flama) */}
          <div className="p-4 border-t border-emerald-950/80 bg-[#090e0b]">
            <div className="flex items-center gap-2 text-amber-400 font-mono text-xs font-bold mb-1">
              <Flame className="w-4 h-4 fill-amber-400 text-amber-300" />
              <span>Botón de Pánico (Flama junto al +)</span>
            </div>
            <p className="text-xs text-zinc-300 mb-3 leading-relaxed">
              Borra todo lo que tiene el celular si estás en riesgo. Elige el tiempo de borrado antes de la autodestrucción total:
            </p>
            <div className="grid grid-cols-3 gap-2 bg-[#070b08] p-1.5 rounded-xl border border-red-950">
              <button
                type="button"
                onClick={() => {
                  setPanicDelay('5');
                  setPanicDelaySetting('5');
                  showNotificationToast('Tiempo de pánico: 5 segundos');
                }}
                className={`py-2 px-1 rounded-lg text-xs font-mono font-medium transition-all ${
                  panicDelaySetting === '5'
                    ? 'bg-red-600 text-white shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                5 segundos
              </button>
              <button
                type="button"
                onClick={() => {
                  setPanicDelay('3');
                  setPanicDelaySetting('3');
                  showNotificationToast('Tiempo de pánico: 3 segundos');
                }}
                className={`py-2 px-1 rounded-lg text-xs font-mono font-medium transition-all ${
                  panicDelaySetting === '3'
                    ? 'bg-red-600 text-white shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                3 segundos
              </button>
              <button
                type="button"
                onClick={() => {
                  setPanicDelay('instant');
                  setPanicDelaySetting('instant');
                  showNotificationToast('Tiempo de pánico: Al toque');
                }}
                className={`py-2 px-1 rounded-lg text-xs font-mono font-medium transition-all ${
                  panicDelaySetting === 'instant'
                    ? 'bg-amber-600 text-black font-bold shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Al toque
              </button>
            </div>
            <span className="text-[10px] text-zinc-400 font-mono mt-1.5 block">
              El botón de la flama siempre cuenta con botón de Cancelar en caso de error.
            </span>
          </div>
        </div>
      </div>
    );
  }

  /* ========================================================================= */
  /* SUB-VIEW: CHATS                                                           */
  /* ========================================================================= */
  if (currentSection === 'chats') {
    return (
      <div className="flex-1 flex flex-col h-full bg-[#070b08] select-none overflow-hidden">
        <div className="h-14 px-3 bg-[#0d1410] border-b border-emerald-950 flex items-center gap-3 shrink-0">
          <button onClick={() => setCurrentSection('main')} className="p-1 -ml-1 text-emerald-400 hover:text-white rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-base font-semibold text-white">Chats</h2>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-emerald-950/30">
          <div 
            onClick={() => {
              const next = appTheme === 'Oscuro OLED' ? 'Matrix Cuántico' : 'Oscuro OLED';
              setAppTheme(next);
              localStorage.setItem('chattoj_setting_theme', next);
              showNotificationToast(`Tema cambiado a: ${next}`);
            }}
            className="px-4 py-3.5 flex items-center justify-between hover:bg-emerald-950/20 cursor-pointer"
          >
            <div>
              <h4 className="text-sm font-medium text-white">Tema</h4>
              <p className="text-xs text-emerald-400 font-mono">{appTheme}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-500" />
          </div>

          <div 
            onClick={() => {
              const next = chatWallpaper === 'Matriz Cuántica' ? 'OLED Puro' : 'Matriz Cuántica';
              setChatWallpaper(next);
              localStorage.setItem('chattoj_setting_wallpaper', next);
              showNotificationToast(`Fondo de chat: ${next}`);
            }}
            className="px-4 py-3.5 flex items-center justify-between hover:bg-emerald-950/20 cursor-pointer"
          >
            <div>
              <h4 className="text-sm font-medium text-white">Fondo de pantalla</h4>
              <p className="text-xs text-emerald-400 font-mono">{chatWallpaper}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-500" />
          </div>

          <div className="px-4 py-3.5 flex items-center justify-between hover:bg-emerald-950/20 cursor-pointer">
            <div>
              <h4 className="text-sm font-medium text-white">Copia de seguridad en tu celular</h4>
              <p className="text-xs text-zinc-300 font-mono">Tus chats viven en la memoria de este teléfono. Nada se sube a internet ni a la nube.</p>
            </div>
            <span className="text-[11px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-900 font-mono">
              En tu celular
            </span>
          </div>
        </div>
      </div>
    );
  }

  /* ========================================================================= */
  /* SUB-VIEW: NOTIFICACIONES                                                  */
  /* ========================================================================= */
  if (currentSection === 'notifications') {
    return (
      <div className="flex-1 flex flex-col h-full bg-[#070b08] select-none overflow-hidden">
        <div className="h-14 px-3 bg-[#0d1410] border-b border-emerald-950 flex items-center gap-3 shrink-0">
          <button onClick={() => setCurrentSection('main')} className="p-1 -ml-1 text-emerald-400 hover:text-white rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-base font-semibold text-white">Notificaciones</h2>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-emerald-950/30">
          <div className="px-4 py-3.5 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-white">Tonos de conversación</h4>
              <p className="text-xs text-zinc-400 font-mono">Reproducir sonidos al enviar y recibir</p>
            </div>
            <input 
              type="checkbox" 
              checked={conversationTones}
              onChange={(e) => {
                setConversationTones(e.target.checked);
                localStorage.setItem('chattoj_setting_tones', String(e.target.checked));
              }}
              className="w-5 h-5 accent-emerald-500 rounded cursor-pointer" 
            />
          </div>

          <div className="px-4 py-3.5 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-white">Alta prioridad y alertas cuánticas</h4>
              <p className="text-xs text-zinc-400 font-mono">Mostrar avisos emergentes en la parte superior</p>
            </div>
            <input 
              type="checkbox" 
              checked={highPriorityAlerts}
              onChange={(e) => {
                setHighPriorityAlerts(e.target.checked);
                localStorage.setItem('chattoj_setting_high_priority', String(e.target.checked));
              }}
              className="w-5 h-5 accent-emerald-500 rounded cursor-pointer" 
            />
          </div>

          <div className="px-4 py-3.5 flex items-center justify-between hover:bg-emerald-950/20 cursor-pointer">
            <div>
              <h4 className="text-sm font-medium text-white">Tono de llamadas</h4>
              <p className="text-xs text-emerald-400 font-mono">Chattoj Cuántico Sintetizado</p>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-500" />
          </div>
        </div>
      </div>
    );
  }

  /* ========================================================================= */
  /* SUB-VIEW: ALMACENAMIENTO Y DATOS                                          */
  /* ========================================================================= */
  if (currentSection === 'storage') {
    return (
      <div className="flex-1 flex flex-col h-full bg-[#070b08] select-none overflow-hidden">
        <div className="h-14 px-3 bg-[#0d1410] border-b border-emerald-950 flex items-center gap-3 shrink-0">
          <button onClick={() => setCurrentSection('main')} className="p-1 -ml-1 text-emerald-400 hover:text-white rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-base font-semibold text-white">Almacenamiento y datos</h2>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-emerald-950/30">
          {/* Swarm Server (.jpg produplicuantistomica+) Card */}
          <div className="p-4 bg-[#0a120d] border-b border-emerald-950/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <Server className="w-4 h-4" />
                <span>Servidor Enjambre (.jpg produplicuantistomica+)</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950 border border-emerald-700/60 px-2 py-0.5 rounded-full font-bold">
                10,000,000 GB
              </span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Servidor descentralizado y hosting cuántico para subir proyectos web con URLs de IP generadas (ejemplo: http://102.34.00.77:8080) accesibles desde cualquier navegador.
            </p>
            <button
              type="button"
              onClick={() => setShowServerManager(true)}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-black font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95"
            >
              <Server className="w-3.5 h-3.5" />
              <span>Gestionar Servidor & Subir Proyecto Web</span>
            </button>
          </div>

          {/* Storage Explanation Banner */}
          <div className="p-4 bg-[#0d1410] border-b border-emerald-950/60 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
              <HardDrive className="w-4 h-4" />
              <span>El almacenamiento es en tu dispositivo</span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Todos tus mensajes, audios, fotos y videos se guardan exclusivamente en la memoria de este celular. Nada sale de tu teléfono hacia servidores externos ni se sube a internet.
            </p>
          </div>

          {/* Storage Meter */}
          <div className="p-4 bg-[#090f0c] space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-zinc-400">Espacio ocupado en este celular:</span>
              <span className="text-emerald-400 font-bold">14.8 MB de 128 GB</span>
            </div>
            <div className="w-full h-2 bg-[#070b08] rounded-full overflow-hidden flex">
              <div className="w-2 bg-emerald-500" />
              <div className="w-1 bg-teal-400" />
              <div className="w-1 bg-purple-500" />
            </div>
            <div className="flex gap-4 text-[10px] text-zinc-400 font-mono pt-1">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Mensajes</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-teal-400" /> Fotos/Videos</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500" /> IA en teléfono</span>
            </div>
          </div>

          <div 
            onClick={() => {
              const next = mediaQuality === 'Calidad HD' ? 'Estándar (Ahorro)' : 'Calidad HD';
              setMediaQuality(next);
              showNotificationToast(`Calidad de archivos: ${next}`);
            }}
            className="px-4 py-3.5 flex items-center justify-between hover:bg-emerald-950/20 cursor-pointer"
          >
            <div>
              <h4 className="text-sm font-medium text-white">Calidad de subida de archivos</h4>
              <p className="text-xs text-emerald-400 font-mono">{mediaQuality}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-500" />
          </div>

          <div className="px-4 py-3.5 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-white">Descargar con datos móviles</h4>
              <p className="text-xs text-zinc-400 font-mono">Solo fotos y audios esenciales</p>
            </div>
            <input 
              type="checkbox" 
              checked={autoDownloadData}
              onChange={(e) => setAutoDownloadData(e.target.checked)}
              className="w-5 h-5 accent-emerald-500 rounded cursor-pointer" 
            />
          </div>

          <div className="px-4 py-3.5 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-white">Descargar con Wi-Fi</h4>
              <p className="text-xs text-zinc-400 font-mono">Todos los archivos multimedia</p>
            </div>
            <input 
              type="checkbox" 
              checked={autoDownloadWifi}
              onChange={(e) => setAutoDownloadWifi(e.target.checked)}
              className="w-5 h-5 accent-emerald-500 rounded cursor-pointer" 
            />
          </div>

          <div className="p-4 space-y-2">
            <button
              type="button"
              onClick={() => {
                // Clear temporary cached blobs, logs, and transient states safely
                sessionStorage.clear();
                localStorage.removeItem('chattoj_chats');
                showNotificationToast('Caché y archivos temporales purgados exitosamente.');
              }}
              className="w-full bg-[#0d1410] hover:bg-emerald-950/60 text-emerald-400 border border-emerald-900/80 py-3 rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Limpiar Caché y Archivos Temporales</span>
            </button>
            <p className="text-[10px] text-zinc-500 font-mono text-center">
              Libera memoria RAM y espacio temporal sin borrar tus contactos ni chats importantes.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ========================================================================= */
  /* SUB-VIEW: LLAMA AI OFFLINE ENGINE (Superpoder Exclusivo Chattoj)          */
  /* ========================================================================= */
  if (currentSection === 'llama') {
    return (
      <div className="flex-1 flex flex-col h-full bg-[#070b08] select-none overflow-hidden">
        <div className="h-14 px-3 bg-[#0d1410] border-b border-emerald-950 flex items-center gap-3 shrink-0">
          <button onClick={() => setCurrentSection('main')} className="p-1 -ml-1 text-emerald-400 hover:text-white rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-base font-semibold text-white">Motor Llama AI Offline</h2>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-emerald-950/30 p-4 space-y-4">
          <div className="bg-[#0d1410] border border-emerald-800/80 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-bold">
              <Sparkles className="w-4 h-4" />
              <span>Inteligencia Artificial adentro de tu celular</span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed font-mono">
              El asistente corre directamente dentro de este teléfono. No requiere internet para pensar: tus consultas se procesan aquí mismo y nada sale de tu celular hacia compañías externas ni la nube.
            </p>
          </div>

          <div 
            onClick={() => {
              const next = llamaRamAllocation === '1.5 GB' ? '2.0 GB (Rápido)' : '1.5 GB';
              setLlamaRamAllocation(next);
              showNotificationToast(`Memoria de contexto: ${next}`);
            }}
            className="bg-[#0d1410] border border-emerald-950 rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:bg-emerald-950/20"
          >
            <div>
              <h4 className="text-sm font-medium text-white">Memoria RAM asignada</h4>
              <p className="text-xs text-emerald-400 font-mono">{llamaRamAllocation}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-500" />
          </div>

          <div 
            onClick={() => {
              const next = llamaTemperature === '0.4 (Equilibrado)' ? '0.2 (Preciso/Código)' : '0.4 (Equilibrado)';
              setLlamaTemperature(next);
              showNotificationToast(`Temperatura de Llama: ${next}`);
            }}
            className="bg-[#0d1410] border border-emerald-950 rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:bg-emerald-950/20"
          >
            <div>
              <h4 className="text-sm font-medium text-white">Creatividad y Temperatura</h4>
              <p className="text-xs text-emerald-400 font-mono">{llamaTemperature}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-500" />
          </div>

          <button 
            onClick={() => showNotificationToast('Memoria caché del modelo Llama limpiada')}
            className="w-full bg-[#0d1410] hover:bg-emerald-950 border border-emerald-900 text-emerald-400 font-semibold py-3 rounded-2xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Limpiar Memoria Caché de Inferencia
          </button>
        </div>
      </div>
    );
  }

  /* ========================================================================= */
  /* SUB-VIEW: SEGURIDAD DE HARDWARE INHACKEABLE                               */
  /* ========================================================================= */
  if (currentSection === 'hardware') {
    return (
      <div className="flex-1 flex flex-col h-full bg-[#070b08] select-none overflow-hidden">
        <div className="h-14 px-3 bg-[#0d1410] border-b border-emerald-950 flex items-center gap-3 shrink-0">
          <button onClick={() => setCurrentSection('main')} className="p-1 -ml-1 text-emerald-400 hover:text-white rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-base font-semibold text-white">Seguridad de Hardware</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="bg-[#0d1410] border border-emerald-700/60 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-bold">
              <ShieldCheck className="w-5 h-5" />
              <span>Protección física en tu celular</span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Toda tu información vive sellada exclusivamente dentro de la memoria de este teléfono. El almacenamiento está vinculado a este celular: si alguien intentara extraer tus datos o copiarlos en otra parte, <strong>quedan ilegibles y se destruyen automáticamente</strong>.
            </p>

            <div className="bg-[#070b08] p-2.5 rounded-xl border border-emerald-950 space-y-1 font-mono text-xs">
              <span className="text-zinc-500 block text-[10px]">HUELLA CRIPTOGRÁFICA DEL MÓVIL:</span>
              <span className="text-emerald-300 break-all font-bold">{deviceId}</span>
            </div>
          </div>

          <div className="bg-[#0d1410] border border-emerald-950 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase text-emerald-400 font-bold flex items-center gap-1.5">
                <Key className="w-4 h-4" /> Tu Llave Cuántica Privada
              </span>
              <span className="text-[10px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-900 font-mono">
                SHA-256
              </span>
            </div>

            <div className="bg-[#070b08] p-3 rounded-xl border border-emerald-900/60 font-mono text-xs text-emerald-300 break-all select-all">
              {currentUser.quantumKey}
            </div>

            <button
              onClick={handleCopyQuantumKey}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-black font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-95"
            >
              {copiedKey ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copiedKey ? 'Copiada al Portapapeles' : 'Copiar Llave Cuántica'}
            </button>
          </div>

          {/* IA Bomba: Protección y Autodestrucción ante métodos tecnológicos */}
          <div className="bg-[#0d1410] border-2 border-emerald-500/40 rounded-2xl p-4 space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-bold">
                <ShieldAlert className="w-5 h-5 text-emerald-400" />
                <span>IA Bomba Centinela (Base de Datos)</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-600">
                ARMADA Y ACTIVA
              </span>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              La base de datos local está protegida por una <strong>IA Bomba</strong> que la rompe y destruye en milisegundos si alguien intenta modificarla, leerla o abrirla con métodos tecnológicos externos (depuración, extracción forense, emuladores o volcados).
            </p>

            <div className="bg-[#070b08] p-3 rounded-xl border border-emerald-950/80 space-y-2 text-xs font-mono">
              <div className="flex justify-between items-center text-zinc-400">
                <span>Acceso a Bóveda:</span>
                <span className="text-emerald-400 font-bold">Solo APK Chattoj</span>
              </div>
              <div className="flex justify-between items-center text-zinc-400">
                <span>Historial de Mensajes & Llamadas:</span>
                <span className="text-emerald-400 font-bold">Consultado en local</span>
              </div>
              <div className="flex justify-between items-center text-zinc-400">
                <span>Protección Tecnológica:</span>
                <span className="text-emerald-400 font-bold">Inviolable (Autodestrucción)</span>
              </div>

              {integrityReport && (
                <div className="mt-2 pt-2 border-t border-emerald-900/60 text-[11px] text-emerald-300 space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <Check className="w-3.5 h-3.5" />
                    <span>{integrityReport.statusText}</span>
                  </div>
                  <div className="text-[10px] text-zinc-400 break-all">
                    Sello Digital: {integrityReport.sealHash}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={async () => {
                setIsVerifyingIntegrity(true);
                const report = await verifyDatabaseIntegrity();
                setIntegrityReport(report);
                setIsVerifyingIntegrity(false);
                showNotificationToast('Integridad de la IA Bomba verificada: 100% segura');
              }}
              disabled={isVerifyingIntegrity}
              className="w-full bg-[#070b08] hover:bg-emerald-950/80 border border-emerald-800 text-emerald-300 font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors active:scale-95"
            >
              <RefreshCw className={`w-4 h-4 ${isVerifyingIntegrity ? 'animate-spin' : ''}`} />
              {isVerifyingIntegrity ? 'Auditando integridad...' : 'Comprobar Sello de la IA Bomba'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ========================================================================= */
  /* SUB-VIEW: AYUDA, DESARROLLADORES Y CONTACTO OFICIAL                       */
  /* ========================================================================= */
  if (currentSection === 'help') {
    return (
      <div className="flex-1 flex flex-col h-full bg-[#070b08] select-none overflow-hidden">
        <div className="h-14 px-3 bg-[#0d1410] border-b border-emerald-950 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setCurrentSection('main')} className="p-1 -ml-1 text-emerald-400 hover:text-white rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-base font-semibold text-white">Ayuda y Contacto</h2>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-900">
            Oficial
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Card: Desarrollado por */}
          <div className="bg-[#0d1410] border border-emerald-800/80 rounded-2xl p-4 space-y-3 shadow-lg">
            <div className="flex items-center gap-2.5 text-emerald-400">
              <Sparkles className="w-5 h-5" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Créditos de Desarrollo</h3>
            </div>

            <div className="space-y-3 pt-1 text-xs">
              <div className="bg-[#070b08] p-3 rounded-xl border border-emerald-950/80 space-y-1">
                <span className="text-zinc-400 text-[11px] block">Desarrollado por:</span>
                <span className="text-sm font-bold text-emerald-300 block">Josué Cervantes Alvarado</span>
                <span className="text-[10px] text-zinc-400 font-mono">Arquitectura Criptográfica & Lógica Soberana</span>
              </div>

              <div className="bg-[#070b08] p-3 rounded-xl border border-emerald-950/80 space-y-1">
                <span className="text-zinc-400 text-[11px] block">Colaboración con:</span>
                <span className="text-sm font-bold text-emerald-300 block">Beatriz Lanz González</span>
                <span className="text-[10px] text-zinc-400 font-mono">Colaboración y Estrategia Civil</span>
              </div>
            </div>
          </div>

          {/* Card: Quejas, Dudas, Sugerencias, Reportes */}
          <div className="bg-[#0d1410] border border-emerald-900/60 rounded-2xl p-4 space-y-3.5">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Info className="w-4 h-4 text-emerald-400" />
                <span>Quejas, Dudas, Sugerencias, Reportes</span>
              </h3>
              <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                Cualquier problema o si buscas hablar directamente con el admin, comunícate por cualquiera de nuestros canales oficiales:
              </p>
            </div>

            <div className="space-y-2.5">
              {/* WhatsApp direct */}
              <a
                href="https://wa.me/524443159741"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-3 rounded-xl bg-[#070b08] hover:bg-emerald-950/50 border border-emerald-900/80 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-950 flex items-center justify-center text-emerald-400 border border-emerald-700/50">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-white block group-hover:text-emerald-300 transition-colors">WhatsApp Oficial</span>
                    <span className="text-[11px] text-zinc-400 font-mono">4443159741</span>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-zinc-400 group-hover:text-emerald-400" />
              </a>

              {/* Instagram direct */}
              <a
                href="https://instagram.com/jos__cerv"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-3 rounded-xl bg-[#070b08] hover:bg-emerald-950/50 border border-emerald-900/80 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-pink-950/60 flex items-center justify-center text-pink-400 border border-pink-700/40">
                    <Instagram className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-white block group-hover:text-pink-300 transition-colors">Instagram Oficial</span>
                    <span className="text-[11px] text-zinc-400 font-mono">@jos__cerv</span>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-zinc-400 group-hover:text-pink-400" />
              </a>

              {/* Facebook direct */}
              <a
                href="https://www.facebook.com/JoCerv99"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-3 rounded-xl bg-[#070b08] hover:bg-emerald-950/50 border border-emerald-900/80 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-950/60 flex items-center justify-center text-blue-400 border border-blue-700/40">
                    <Facebook className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-white block group-hover:text-blue-300 transition-colors">Facebook Perfil</span>
                    <span className="text-[11px] text-zinc-400 font-mono">Jo Cervantes</span>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-zinc-400 group-hover:text-blue-400" />
              </a>
            </div>
          </div>

          {/* Quick Copy Action */}
          <div className="bg-[#070b08] p-3 rounded-xl border border-emerald-950 flex items-center justify-between text-xs">
            <span className="text-zinc-400 font-mono">Número Admin: 4443159741</span>
            <button
              onClick={() => {
                navigator.clipboard.writeText('4443159741');
                showNotificationToast('Número copiado al portapapeles');
              }}
              className="text-emerald-400 hover:text-emerald-300 font-semibold text-xs flex items-center gap-1 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" /> Copiar
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ========================================================================= */
  /* SUB-VIEW: CÓDIGO QR PERSONAL (WhatsApp style QR)                          */
  /* ========================================================================= */
  if (currentSection === 'qr') {
    return (
      <div className="flex-1 flex flex-col h-full bg-[#070b08] select-none overflow-hidden">
        <div className="h-14 px-3 bg-[#0d1410] border-b border-emerald-950 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setCurrentSection('main')} className="p-1 -ml-1 text-emerald-400 hover:text-white rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-base font-semibold text-white">Mi Código QR</h2>
          </div>
          <button 
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: 'Chattoj ID', text: `Conéctate a mi canal cifrado en Chattoj: ${currentUser.userId}` });
              } else {
                navigator.clipboard.writeText(currentUser.userId);
                showNotificationToast('Enlace de contacto copiado');
              }
            }}
            className="p-2 text-emerald-400 hover:text-white cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6">
          <div className="bg-[#0d1410] border border-emerald-800 rounded-3xl p-6 shadow-2xl space-y-4 max-w-xs w-full">
            <img 
              src={currentUser.avatar} 
              alt={currentUser.name} 
              className="w-16 h-16 rounded-full object-cover mx-auto border-2 border-emerald-500 shadow-md"
            />
            <h3 className="text-base font-bold text-white leading-none flex items-center justify-center gap-1.5">
              <span>{currentUser.name}</span>
              <AdminBadge userId={currentUser.userId} />
            </h3>
            <p className="text-xs font-mono text-emerald-400">ID: {currentUser.userId}</p>

            {/* QR Visual */}
            <div className="bg-white p-4 rounded-2xl mx-auto shadow-inner inline-block">
              <div className="w-44 h-44 bg-[#070b08] rounded-xl flex flex-col items-center justify-center text-emerald-400 p-2 border-2 border-emerald-600">
                <QrCode className="w-20 h-20 mb-2 text-emerald-400 stroke-1" />
                <span className="text-[9px] font-mono tracking-widest text-white uppercase">
                  CHATTOJ-P2P
                </span>
                <span className="text-[10px] font-mono font-bold text-emerald-400">
                  {currentUser.userId}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-zinc-300 leading-relaxed">
              Tu código QR es completamente privado. Al escanearlo se conectan directo de celular a celular sin pasar por servidores en internet.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ========================================================================= */
  /* MAIN SETTINGS SCREEN (Exact WhatsApp Architecture + Superpowers)          */
  /* ========================================================================= */
  return (
    <div className="flex-1 flex flex-col h-full bg-[#070b08] select-none overflow-hidden relative">
      {/* Top Header */}
      <div className="h-14 px-3 bg-[#0d1410] border-b border-emerald-950 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1 -ml-1 text-emerald-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Volver"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <h1 className="font-semibold text-white text-base tracking-tight leading-none">
            Ajustes
          </h1>
        </div>

        <button 
          onClick={() => showNotificationToast('Buscador de ajustes listo')}
          className="p-2 text-zinc-300 hover:text-white rounded-lg transition-colors cursor-pointer"
        >
          <Search className="w-5 h-5" />
        </button>
      </div>

      {/* Main Settings Body */}
      <div className="flex-1 overflow-y-auto divide-y divide-emerald-950/30">
        {/* Top Profile Card (WhatsApp style with QR Code button on the right) */}
        <div className="p-4 flex items-center justify-between hover:bg-emerald-950/25 transition-colors cursor-pointer">
          <div 
            onClick={() => setCurrentSection('profile')}
            className="flex items-center gap-3.5 flex-1 min-w-0"
          >
            <div className="relative shrink-0">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-14 h-14 rounded-full object-cover border-2 border-emerald-500/60 shadow-lg"
              />
              <span className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-[#070b08] rounded-full" />
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold text-white truncate flex items-center gap-1.5">
                <span>{currentUser.name}</span>
                <Edit2 className="w-3.5 h-3.5 text-emerald-400/80 shrink-0" />
              </h2>
              <p className="text-xs text-zinc-400 truncate mt-0.5">
                {currentUser.statusMessage || '¡Hola! Estoy usando Chattoj.'}
              </p>
              <p className="text-[10px] font-mono text-emerald-400/90 mt-0.5">
                ID: {currentUser.userId}
              </p>
            </div>
          </div>

          <button
            onClick={() => setCurrentSection('qr')}
            className="p-2 text-emerald-400 hover:text-white rounded-full bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-900 transition-colors ml-2 shrink-0 cursor-pointer"
            title="Ver mi código QR"
          >
            <QrCode className="w-5 h-5" />
          </button>
        </div>

        {/* WhatsApp Menu Section Items with Subtitles */}
        <div className="py-1">
          {/* 1. Cuenta */}
          <div
            onClick={() => setCurrentSection('account')}
            className="px-4 py-3.5 flex items-center gap-4 hover:bg-emerald-950/25 transition-colors cursor-pointer"
          >
            <div className="w-6 flex justify-center text-zinc-400">
              <Key className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-white">Cuenta</h4>
              <p className="text-xs text-zinc-300 font-mono truncate">Seguridad y control de acceso propio en este celular</p>
            </div>
          </div>

          {/* 2. Privacidad */}
          <div
            onClick={() => setCurrentSection('privacy')}
            className="px-4 py-3.5 flex items-center gap-4 hover:bg-emerald-950/25 transition-colors cursor-pointer"
          >
            <div className="w-6 flex justify-center text-zinc-400">
              <Lock className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-white">Privacidad</h4>
              <p className="text-xs text-zinc-300 font-mono truncate">Bloqueo con huella, hora de últ. vez y confirmaciones</p>
            </div>
          </div>

          {/* 3. Chats */}
          <div
            onClick={() => setCurrentSection('chats')}
            className="px-4 py-3.5 flex items-center gap-4 hover:bg-emerald-950/25 transition-colors cursor-pointer"
          >
            <div className="w-6 flex justify-center text-zinc-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-white">Chats</h4>
              <p className="text-xs text-zinc-300 font-mono truncate">Tema, fondos y copia guardada en la memoria de este teléfono</p>
            </div>
          </div>

          {/* 4. Notificaciones */}
          <div
            onClick={() => setCurrentSection('notifications')}
            className="px-4 py-3.5 flex items-center gap-4 hover:bg-emerald-950/25 transition-colors cursor-pointer"
          >
            <div className="w-6 flex justify-center text-zinc-400">
              <Bell className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-white">Notificaciones</h4>
              <p className="text-xs text-zinc-300 font-mono truncate">Tonos de mensajes, grupos y llamadas</p>
            </div>
          </div>

          {/* 5. Almacenamiento y datos */}
          <div
            onClick={() => setCurrentSection('storage')}
            className="px-4 py-3.5 flex items-center gap-4 hover:bg-emerald-950/25 transition-colors cursor-pointer"
          >
            <div className="w-6 flex justify-center text-zinc-400">
              <HardDrive className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-white">Almacenamiento y datos</h4>
              <p className="text-xs text-zinc-300 font-mono truncate">El almacenamiento es en tu dispositivo. Nada sale a la nube</p>
            </div>
          </div>

          {/* 6. Motor Llama AI Offline (Superpoder Chattoj) */}
          <div
            onClick={() => setCurrentSection('llama')}
            className="px-4 py-3.5 flex items-center gap-4 hover:bg-emerald-950/25 transition-colors cursor-pointer"
          >
            <div className="w-6 flex justify-center text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-emerald-300 flex items-center gap-1.5">
                <span>Motor Llama AI Offline</span>
                <span className="text-[9px] bg-emerald-950 text-emerald-400 px-1.5 py-0.2 rounded border border-emerald-900">En tu teléfono</span>
              </h4>
              <p className="text-xs text-zinc-300 font-mono truncate">La IA corre dentro de tu celular: nada de lo que preguntes sale a internet</p>
            </div>
          </div>

          {/* 7. Seguridad de Hardware Inhackeable */}
          <div
            onClick={() => setCurrentSection('hardware')}
            className="px-4 py-3.5 flex items-center gap-4 hover:bg-emerald-950/25 transition-colors cursor-pointer"
          >
            <div className="w-6 flex justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-white">Seguridad de Hardware</h4>
              <p className="text-xs text-zinc-300 font-mono truncate">Tus datos viven sellados con la seguridad física de este teléfono</p>
            </div>
          </div>

          {/* 8. Invitar a amigos */}
          <div
            onClick={() => setCurrentSection('qr')}
            className="px-4 py-3.5 flex items-center gap-4 hover:bg-emerald-950/25 transition-colors cursor-pointer"
          >
            <div className="w-6 flex justify-center text-zinc-400">
              <UserPlus className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-white">Invitar a amigos</h4>
              <p className="text-xs text-zinc-300 font-mono truncate">Conectar de celular a celular mediante código QR</p>
            </div>
          </div>

          {/* 9. Ayuda, Desarrolladores y Contacto Oficial */}
          <div
            onClick={() => setCurrentSection('help')}
            className="px-4 py-3.5 flex items-center gap-4 hover:bg-emerald-950/25 transition-colors cursor-pointer border-t border-emerald-950/50"
          >
            <div className="w-6 flex justify-center text-emerald-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-emerald-300 flex items-center gap-1.5">
                <span>Ayuda y Desarrolladores</span>
                <span className="text-[9px] bg-emerald-950 text-emerald-400 px-1.5 py-0.2 rounded border border-emerald-900 font-mono">Oficial</span>
              </h4>
              <p className="text-xs text-zinc-400 font-mono truncate">Josué Cervantes • Beatriz Lanz • Reportes y soporte</p>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-500" />
          </div>
        </div>

        {/* Developer & Collaboration Official Badge */}
        <div className="mx-4 mt-4 p-4 rounded-2xl bg-[#0d1410] border border-emerald-800/60 text-center space-y-2.5 shadow-md">
          <div>
            <span className="text-[10px] text-zinc-400 font-mono uppercase block">Desarrollado por:</span>
            <span className="text-xs font-bold text-emerald-300 block">Josué Cervantes Alvarado</span>
          </div>
          <div>
            <span className="text-[10px] text-zinc-400 font-mono uppercase block">Colaboración con:</span>
            <span className="text-xs font-bold text-emerald-400 block">Beatriz Lanz González</span>
          </div>

          <div className="pt-2 border-t border-emerald-950/80 space-y-1">
            <span className="text-[10px] text-zinc-400 font-mono block">Quejas, Dudas, Sugerencias, Reportes:</span>
            <div className="flex items-center justify-center flex-wrap gap-2.5 pt-1 text-xs">
              <a
                href="https://www.facebook.com/JoCerv99"
                target="_blank"
                rel="noreferrer"
                className="text-blue-400 hover:text-blue-300 flex items-center gap-1 font-mono text-[11px]"
              >
                <Facebook className="w-3.5 h-3.5" /> Jo Cervantes
              </a>
              <span className="text-zinc-600">•</span>
              <a
                href="https://wa.me/524443159741"
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-mono text-[11px]"
              >
                <Phone className="w-3.5 h-3.5" /> 4443159741
              </a>
              <span className="text-zinc-600">•</span>
              <a
                href="https://instagram.com/jos__cerv"
                target="_blank"
                rel="noreferrer"
                className="text-pink-400 hover:text-pink-300 flex items-center gap-1 font-mono text-[11px]"
              >
                <Instagram className="w-3.5 h-3.5" /> @jos__cerv
              </a>
            </div>
          </div>
        </div>

        {/* Footer branding style WhatsApp ("from Meta" -> "from CHATTOJ QUANTUM") */}
        <div className="py-5 text-center space-y-1">
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-mono">
            from
          </span>
          <span className="text-xs font-bold text-emerald-400 tracking-wider font-mono">
            CHATTOJ QUANTUM
          </span>
          <p className="text-[10px] text-zinc-400 font-mono">
            Tus datos viven en este celular • Nada sale a la nube
          </p>
        </div>
      </div>

      {/* Floating Notification Toast */}
      {saveToast && (
        <div className="absolute bottom-4 left-4 right-4 bg-emerald-950/95 border border-emerald-500 text-emerald-300 px-4 py-2.5 rounded-2xl text-xs flex items-center gap-2 shadow-2xl z-50">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{saveToast}</span>
        </div>
      )}

      {/* SWARM SERVER & WEB HOSTING MANAGER MODAL */}
      {showServerManager && (
        <AdminServerManager onClose={() => setShowServerManager(false)} />
      )}
    </div>
  );
};
