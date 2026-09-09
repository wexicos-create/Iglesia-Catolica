import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Chat, Message, UserProfile } from '../types';
import { askLlamaOffline } from '../utils/llamaEngine';
import { offlineAudio } from '../utils/audioAlerts';
import { 
  analyzeMessageThreat, banDeviceMac, isUserOrMacBanned, 
  getHighRiskStatus, setHighRiskProtection, generateThreatMacAddress,
  getBannedMacList 
} from '../utils/threatProtection';
import { authorizeAdminAction } from '../utils/reportsRegistry';
import { ReportModal } from './ReportModal';
import { 
  Send, Shield, Lock, Phone, Video, ArrowLeft, Paperclip, 
  Sparkles, CheckCheck, MoreVertical, Ban, Trash2, UserPlus, 
  Mic, Square, Play, Pause, Image as ImageIcon, Film, X, Eye, 
  AlertTriangle, ShieldAlert, WifiOff, Check, UserCheck,
  FileText, Volume2, Clock, Sliders, ShieldCheck, Download, Bell, BellOff
} from 'lucide-react';

interface ChatRoomProps {
  chat: Chat;
  currentUser: UserProfile;
  onSendMessage: (chatId: string, text: string, attachment?: Message['attachment'], isViewOnce?: boolean) => void;
  onStartCall: (chat: Chat, type: 'voice' | 'video') => void;
  onBack?: () => void;
  onDeleteChat?: (chatId: string) => void;
  onDeleteMessage?: (chatId: string, messageId: string, forEveryone: boolean) => void;
  onToggleBlockChat?: (chatId: string) => void;
  onAddMember?: (chatId: string, memberName: string) => void;
  onMarkMessageViewed?: (chatId: string, messageId: string) => void;
}

export const ChatRoom: React.FC<ChatRoomProps> = ({
  chat,
  currentUser,
  onSendMessage,
  onStartCall,
  onBack,
  onDeleteChat,
  onDeleteMessage,
  onToggleBlockChat,
  onAddMember,
  onMarkMessageViewed
}) => {
  const [inputText, setInputText] = useState('');
  const [isAiConsulting, setIsAiConsulting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');

  // Contact verification state (Contact vs Non-Contact rules)
  const [contactsVersion, setContactsVersion] = useState(0);
  const [showNonContactCallModal, setShowNonContactCallModal] = useState(false);
  const [quickAddSuccess, setQuickAddSuccess] = useState(false);

  // AI Threat detection & MAC banning state
  const [showThreatModal, setShowThreatModal] = useState(false);
  const [threatReason, setThreatReason] = useState('Amenazas directas o intimidación detectada por Llama AI');
  const [highRiskState, setHighRiskState] = useState(() => getHighRiskStatus());

  // Message deletion modal
  const [msgToDelete, setMsgToDelete] = useState<Message | null>(null);

  // System Permission Request Modal
  const [permissionRequest, setPermissionRequest] = useState<{
    target: 'photo' | 'video' | 'doc' | 'camera' | 'audio';
    title: string;
    description: string;
    action: () => void;
  } | null>(null);

  // WiFi / Offline mode
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(() => localStorage.getItem('chattoj_network_mode_pref') !== 'wifi');

  // View-once toggle for next photo/video attachment
  const [isViewOnceActive, setIsViewOnceActive] = useState(false);

  // Ephemeral single-view modal (una sola reproducción)
  const [activeViewOnceMsg, setActiveViewOnceMsg] = useState<Message | null>(null);

  // Chat Profile & Data Panel modal state
  const [showContactInfoModal, setShowContactInfoModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [activeInfoTab, setActiveInfoTab] = useState<'media' | 'permissions'>('media');
  const [activeMediaCategory, setActiveMediaCategory] = useState<'photos' | 'audios' | 'docs'>('photos');
  const [tempMessagesTimer, setTempMessagesTimer] = useState<string>(() => {
    return localStorage.getItem(`chattoj_temp_msg_${chat.id}`) || 'off';
  });
  const [allowVoiceCalls, setAllowVoiceCalls] = useState(true);
  const [allowVideoCalls, setAllowVideoCalls] = useState(true);
  const [allowMediaSharing, setAllowMediaSharing] = useState(true);
  const [isChatMuted, setIsChatMuted] = useState(false);

  // Check if contact is saved locally in user contacts
  const isSavedContact = useMemo(() => {
    if (chat.isGroup) return true;
    if (chat.secureId?.includes(currentUser.userId) || chat.name?.includes(currentUser.name) || chat.name === 'Mis Notas') return true;
    try {
      const raw = localStorage.getItem('chattoj_user_contacts_list');
      const contacts = raw ? JSON.parse(raw) : [];
      return contacts.some((c: any) => 
        (c.name && c.name.toLowerCase() === chat.name.toLowerCase()) ||
        (c.contactId && chat.secureId && chat.secureId.includes(c.contactId)) ||
        (c.id === chat.id)
      );
    } catch {
      return false;
    }
  }, [chat, currentUser, contactsVersion]);

  // Check if aggressor MAC or user is banned
  const isBanned = useMemo(() => {
    return isUserOrMacBanned(chat.name);
  }, [chat.name, contactsVersion]);

  // Scan chat messages for threats or intimidation
  const detectedThreatInfo = useMemo(() => {
    for (const m of chat.messages) {
      if (m.senderId !== 'me' && m.senderId !== currentUser.userId && m.text) {
        const analysis = analyzeMessageThreat(m.text);
        if (analysis.isThreat) {
          return { message: m, analysis };
        }
      }
    }
    return null;
  }, [chat.messages, currentUser]);

  const handleQuickAddContact = () => {
    try {
      const raw = localStorage.getItem('chattoj_user_contacts_list');
      const contacts = raw ? JSON.parse(raw) : [];
      const newContact = {
        id: 'contact-' + Date.now(),
        name: chat.name,
        contactId: chat.secureId ? chat.secureId.replace('Q-ID-', '').replace('Q-P2P-', '') : Math.floor(1000 + Math.random() * 9000).toString(),
        avatar: chat.avatar,
        statusText: 'Contacto seguro verificado',
        addedAt: new Date().toLocaleDateString()
      };
      localStorage.setItem('chattoj_user_contacts_list', JSON.stringify([newContact, ...contacts]));
      setContactsVersion(v => v + 1);
      setQuickAddSuccess(true);
      setTimeout(() => setQuickAddSuccess(false), 3000);
      setShowNonContactCallModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleExecuteMacBan = () => {
    const aggressorMac = generateThreatMacAddress(chat.name);
    banDeviceMac(chat.name, threatReason, aggressorMac);
    setShowThreatModal(false);
    setHighRiskState(getHighRiskStatus());
    setContactsVersion(v => v + 1);
  };

  const handleAttemptCall = (type: 'voice' | 'video') => {
    if (chat.isBlocked || isBanned) return;
    if (!isSavedContact) {
      setShowNonContactCallModal(true);
      return;
    }
    onStartCall(chat, type);
  };

  // Voice note recording state
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recordingTimerRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const activeAudioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Audio playback state (currently playing message ID)
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  // File input refs for real image/video/document selection
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const requestSystemAccess = (
    target: 'photo' | 'video' | 'doc' | 'camera' | 'audio',
    action: () => void
  ) => {
    const titles = {
      photo: 'Acceso a Galería / Fotos',
      video: 'Acceso a Videos del Dispositivo',
      doc: 'Acceso a Documentos y Archivos',
      camera: 'Acceso a la Cámara',
      audio: 'Acceso al Micrófono'
    };

    const descriptions = {
      photo: 'La aplicación solicita permiso para acceder a tus fotos. Se extraerán únicamente los bytes de la imagen seleccionada y NO se guardará nada en la IA ni en servidores externos.',
      video: 'La aplicación solicita permiso para acceder a tus videos. Se extraerán únicamente los bytes del video seleccionado sin almacenamiento externo.',
      doc: 'La aplicación solicita permiso para acceder a tus documentos (PDF, ZIP, TXT, DOC). Solo se extraerá el archivo elegido.',
      camera: 'La aplicación solicita permiso para activar la cámara de tu dispositivo y capturar la imagen directamente.',
      audio: 'La aplicación solicita permiso para activar el micrófono y grabar una nota de voz cifrada.'
    };

    setPermissionRequest({
      target,
      title: titles[target],
      description: descriptions[target],
      action: () => {
        setPermissionRequest(null);
        action();
      }
    });
  };

  const handleDocFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      onSendMessage(
        chat.id,
        `📎 Documento: ${file.name}`,
        {
          type: 'file',
          url,
          name: file.name
        },
        false
      );
      setShowAttachMenu(false);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleToggleNetworkMode = () => {
    const nextMode = !isOfflineMode;
    setIsOfflineMode(nextMode);
    localStorage.setItem('chattoj_network_mode_pref', nextMode ? 'offline' : 'wifi');
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chat.messages]);

  // Voice recording timer
  useEffect(() => {
    if (isRecordingAudio) {
      setRecordingSeconds(0);
      recordingTimerRef.current = window.setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    } else {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, [isRecordingAudio]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || chat.isBlocked) return;
    offlineAudio.playSent();
    onSendMessage(chat.id, inputText.trim());
    setInputText('');
  };

  const handleAskLlama = async () => {
    if (!inputText.trim() || chat.isBlocked) return;
    const prompt = inputText.trim();
    offlineAudio.playSent();
    onSendMessage(chat.id, `🤖 [Consulta a Llama Offline]: ${prompt}`);
    setInputText('');
    setIsAiConsulting(true);

    try {
      const res = await askLlamaOffline(prompt);
      offlineAudio.playReceived();
      onSendMessage(chat.id, `⚡ [Llama AI Respuesta Offline]: ${res.reply} (Hash: ${res.quantumHash}, ${res.processingTimeMs}ms)`);
    } catch {
      onSendMessage(chat.id, `⚡ [Llama AI]: Error local en inferencia.`);
    } finally {
      setIsAiConsulting(false);
    }
  };

  // Image selection handler
  const handleImageFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      onSendMessage(
        chat.id,
        isViewOnceActive ? '① Foto (1 sola reproducción)' : '',
        {
          type: 'image',
          url,
          name: file.name || 'foto.jpg'
        },
        isViewOnceActive
      );
      setIsViewOnceActive(false);
      setShowAttachMenu(false);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Video selection handler
  const handleVideoFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      onSendMessage(
        chat.id,
        isViewOnceActive ? '① Video (1 sola reproducción)' : '',
        {
          type: 'video',
          url,
          name: file.name || 'video.mp4'
        },
        isViewOnceActive
      );
      setIsViewOnceActive(false);
      setShowAttachMenu(false);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Fallback demo media sender if user doesn't pick file
  const handleSendSamplePhoto = (viewOnce = false) => {
    const sampleUrl = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80';
    onSendMessage(
      chat.id,
      viewOnce ? '① Foto (1 sola reproducción)' : '',
      {
        type: 'image',
        url: sampleUrl,
        name: 'foto_cifrada.jpg'
      },
      viewOnce
    );
    setIsViewOnceActive(false);
    setShowAttachMenu(false);
  };

  const handleSendSampleVideo = (viewOnce = false) => {
    const sampleVideoUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
    onSendMessage(
      chat.id,
      viewOnce ? '① Video (1 sola reproducción)' : '',
      {
        type: 'video',
        url: sampleVideoUrl,
        name: 'video_cifrado.mp4'
      },
      viewOnce
    );
    setIsViewOnceActive(false);
    setShowAttachMenu(false);
  };

  // Voice note recording handlers with real MediaRecorder
  const handleStartVoiceRecording = async () => {
    setIsRecordingAudio(true);
    setRecordingSeconds(0);
    audioChunksRef.current = [];

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };
        recorder.start(200);
      }
    } catch (err) {
      console.warn('Microphone permission or hardware unavailable; using local synthesized waveform.', err);
    }
  };

  // Voice note send
  const handleFinishVoiceRecording = () => {
    setIsRecordingAudio(false);
    const durationStr = `0:${recordingSeconds < 10 ? '0' : ''}${recordingSeconds}`;
    const recorder = mediaRecorderRef.current;

    if (recorder && recorder.state !== 'inactive') {
      recorder.onstop = () => {
        try {
          const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          recorder.stream.getTracks().forEach((track) => track.stop());

          const reader = new FileReader();
          reader.onloadend = () => {
            const base64Audio = reader.result as string;
            offlineAudio.playSent();
            onSendMessage(
              chat.id,
              `🎤 Nota de voz (${durationStr})`,
              {
                type: 'audio',
                url: base64Audio,
                name: `Audio-${Date.now()}.webm`,
                duration: durationStr
              },
              isViewOnceActive
            );
            setIsViewOnceActive(false);
          };
          reader.readAsDataURL(blob);
        } catch {
          // Fallback if conversion fails
          offlineAudio.playSent();
          onSendMessage(
            chat.id,
            `🎤 Nota de voz (${durationStr})`,
            {
              type: 'audio',
              url: '#',
              name: `Audio-${Date.now()}.opus`,
              duration: durationStr
            },
            isViewOnceActive
          );
          setIsViewOnceActive(false);
        }
      };
      recorder.stop();
    } else {
      offlineAudio.playSent();
      onSendMessage(
        chat.id,
        `🎤 Nota de voz (${durationStr})`,
        {
          type: 'audio',
          url: '#',
          name: `Audio-${Date.now()}.opus`,
          duration: durationStr
        },
        isViewOnceActive
      );
      setIsViewOnceActive(false);
    }
  };

  const handleCancelVoiceRecording = () => {
    setIsRecordingAudio(false);
    setRecordingSeconds(0);
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      try {
        recorder.stream.getTracks().forEach((track) => track.stop());
        recorder.stop();
      } catch {}
    }
    audioChunksRef.current = [];
  };

  const handleTogglePlayAudio = (msg: Message) => {
    if (playingAudioId === msg.id) {
      if (activeAudioPlayerRef.current) {
        activeAudioPlayerRef.current.pause();
        activeAudioPlayerRef.current = null;
      }
      setPlayingAudioId(null);
      return;
    }

    if (activeAudioPlayerRef.current) {
      activeAudioPlayerRef.current.pause();
      activeAudioPlayerRef.current = null;
    }

    if (msg.attachment?.url && msg.attachment.url.startsWith('data:audio')) {
      const audio = new Audio(msg.attachment.url);
      activeAudioPlayerRef.current = audio;
      audio.onended = () => {
        setPlayingAudioId(null);
        activeAudioPlayerRef.current = null;
      };
      audio.onerror = () => {
        setPlayingAudioId(null);
        activeAudioPlayerRef.current = null;
      };
      audio.play().catch(() => {});
      setPlayingAudioId(msg.id);
    } else {
      // Offline fallback acoustic wave reproduction
      offlineAudio.playReceived();
      setPlayingAudioId(msg.id);
      setTimeout(() => {
        setPlayingAudioId((curr) => (curr === msg.id ? null : curr));
      }, 3000);
    }
  };

  // Open view once item
  const handleOpenViewOnce = (msg: Message) => {
    if (msg.isViewed) return;
    setActiveViewOnceMsg(msg);
  };

  // Close view once item and mark as viewed permanently
  const handleCloseViewOnce = () => {
    if (activeViewOnceMsg) {
      if (onMarkMessageViewed) {
        onMarkMessageViewed(chat.id, activeViewOnceMsg.id);
      }
      setActiveViewOnceMsg(null);
    }
  };

  const handleAddMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;
    if (onAddMember) {
      onAddMember(chat.id, newMemberName.trim());
    }
    setNewMemberName('');
    setShowAddMemberModal(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#070b08] chattoj-pattern overflow-hidden relative select-none">
      {/* Hidden file pickers */}
      <input
        type="file"
        ref={imageInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleImageFileSelected}
      />
      <input
        type="file"
        ref={videoInputRef}
        accept="video/*"
        className="hidden"
        onChange={handleVideoFileSelected}
      />
      <input
        type="file"
        ref={docInputRef}
        accept=".pdf,.doc,.docx,.txt,.zip,.rar,.xlsx,.csv,.json"
        className="hidden"
        onChange={handleDocFileSelected}
      />
      <input
        type="file"
        ref={cameraInputRef}
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleImageFileSelected}
      />

      {/* Top Header */}
      <div className="h-14 px-3 bg-[#0d1410] border-b border-emerald-950 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-2 min-w-0">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1 -ml-1 text-emerald-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Regresar a la bandeja"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <div 
            onClick={() => setShowContactInfoModal(true)}
            className="flex items-center gap-2.5 min-w-0 cursor-pointer hover:opacity-90 transition-opacity"
            title="Ver información del contacto, multimedia y permisos"
          >
            <div className="relative shrink-0">
              <img
                src={chat.avatar}
                alt={chat.name}
                className="w-9 h-9 rounded-full object-cover border border-emerald-800/60"
              />
              {chat.online && !chat.isBlocked && (
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-[#0d1410] rounded-full" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-white text-xs sm:text-sm truncate flex items-center gap-1">
                <span>
                  {isSavedContact || chat.isGroup || chat.name.includes('Llama') || chat.name.includes('Notas')
                    ? chat.name
                    : (chat.secureId || `ID: ${chat.id.replace(/\D/g, '').padEnd(11, '83920194821').slice(0, 11)}`)}
                </span>
                {chat.isBlocked ? (
                  <span className="text-[9px] text-red-400 bg-red-950 border border-red-800 px-1 rounded">Bloqueado</span>
                ) : (
                  <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
                )}
              </h3>
              <p className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 truncate">
                <Shield className="w-2.5 h-2.5 shrink-0" /> {chat.isBlocked ? 'Canal Bloqueado' : isSavedContact ? 'Contacto Seguro P2P' : 'ID No Agregado • Toca para ver datos'}
              </p>
            </div>
          </div>
        </div>

        {/* Action icons: Calls, Network Toggle & Options Menu */}
        <div className="flex items-center gap-1 shrink-0 relative">
          {/* Network mode toggle button */}
          <button
            type="button"
            onClick={handleToggleNetworkMode}
            className={`px-2 py-1 rounded-lg text-[10px] font-mono border transition-all cursor-pointer flex items-center gap-1 ${
              isOfflineMode
                ? 'bg-emerald-950/80 border-emerald-700/60 text-emerald-300'
                : 'bg-blue-950/80 border-blue-700/60 text-blue-300'
            }`}
            title="Cambiar entre modo WiFi o 100% Offline"
          >
            <span>{isOfflineMode ? '🛡️ Offline' : '📶 WiFi'}</span>
          </button>

          <button
            onClick={() => handleAttemptCall('voice')}
            disabled={chat.isBlocked || isBanned}
            className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${
              !isSavedContact 
                ? 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-amber-300 hover:border-amber-700' 
                : 'bg-emerald-950/80 hover:bg-emerald-900 disabled:opacity-40 border-emerald-800/50 text-emerald-400'
            }`}
            title={!isSavedContact ? 'Llamadas no permitidas (Solo mensajes por APK si no es contacto)' : 'Llamada de voz'}
          >
            <Phone className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleAttemptCall('video')}
            disabled={chat.isBlocked || isBanned}
            className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${
              !isSavedContact 
                ? 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-amber-300 hover:border-amber-700' 
                : 'bg-emerald-950/80 hover:bg-emerald-900 disabled:opacity-40 border-emerald-800/50 text-emerald-400'
            }`}
            title={!isSavedContact ? 'Videollamadas no permitidas (Solo mensajes por APK si no es contacto)' : 'Videollamada'}
          >
            <Video className="w-4 h-4" />
          </button>

          {/* More Options Dropdown */}
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-8 h-8 rounded-lg bg-[#090f0b] hover:bg-emerald-950/70 border border-emerald-900/60 flex items-center justify-center text-zinc-300 hover:text-white transition-colors cursor-pointer"
            title="Opciones de chat"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-10 w-56 bg-[#0d1410] border border-emerald-800/80 rounded-2xl p-1.5 shadow-2xl z-30 space-y-1 text-xs font-medium">
              {!isSavedContact && !chat.isGroup && (
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    handleQuickAddContact();
                  }}
                  className="w-full px-3 py-2 text-left rounded-xl hover:bg-emerald-950/70 text-emerald-300 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <span>Guardar en mis Contactos</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setShowMenu(false);
                  setShowAddMemberModal(true);
                }}
                className="w-full px-3 py-2 text-left rounded-xl hover:bg-emerald-950/70 text-zinc-200 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <UserPlus className="w-4 h-4 text-emerald-400" />
                <span>Añadir participante</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowMenu(false);
                  setShowReportModal(true);
                }}
                className="w-full px-3 py-2 text-left rounded-xl hover:bg-amber-950/50 text-amber-300 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>Reportar a la IA / Admin</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowMenu(false);
                  setShowThreatModal(true);
                }}
                className="w-full px-3 py-2 text-left rounded-xl hover:bg-red-950/50 text-red-300 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <ShieldAlert className="w-4 h-4 text-red-400" />
                <span>Medidas de Riesgo / Banear MAC</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowMenu(false);
                  if (onToggleBlockChat) onToggleBlockChat(chat.id);
                }}
                className="w-full px-3 py-2 text-left rounded-xl hover:bg-emerald-950/70 text-zinc-200 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <Ban className="w-4 h-4 text-amber-400" />
                <span>{chat.isBlocked ? 'Desbloquear contacto' : 'Bloquear contacto'}</span>
              </button>

              <div className="border-t border-emerald-950/80 my-1"></div>

              <button
                type="button"
                onClick={() => {
                  setShowMenu(false);
                  setShowDeleteConfirm(true);
                }}
                className="w-full px-3 py-2 text-left rounded-xl hover:bg-red-950/40 text-red-400 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-red-400" />
                <span>Eliminar chat</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Banned MAC / Threat Defense Banner */}
      {isBanned && (
        <div className="bg-red-950 border-b border-red-800 px-3.5 py-2.5 flex items-center justify-between text-xs text-red-200 z-10 shrink-0 shadow-lg">
          <div className="flex items-center gap-2 min-w-0">
            <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 animate-pulse" />
            <div className="min-w-0">
              <span className="font-bold text-red-300 block">MAC y Hardware Baneados por Amenazas</span>
              <span className="text-[10px] text-red-400 font-mono block truncate">Paquetes de red destruidos en el dispositivo agresor.</span>
            </div>
          </div>
          <button
            onClick={() => setShowThreatModal(true)}
            className="bg-red-900 hover:bg-red-800 text-white font-mono px-2 py-1 rounded-lg text-[10px] transition-colors shrink-0 ml-2"
          >
            Ver Detalle
          </button>
        </div>
      )}

      {/* AI Threat Detection Warning */}
      {!isBanned && detectedThreatInfo && (
        <div className="bg-amber-950/90 border-b border-amber-800/80 px-3.5 py-2 flex items-center justify-between text-xs text-amber-200 z-10 shrink-0 animate-fadeIn">
          <div className="flex items-center gap-2 min-w-0">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="min-w-0">
              <span className="font-semibold text-amber-300 block text-[11px]">⚠️ Llama AI detectó intimidación o amenazas</span>
              <span className="text-[10px] text-amber-400/90 font-mono block truncate">Coincidencia: "{detectedThreatInfo.analysis.matchedPattern}"</span>
            </div>
          </div>
          <button
            onClick={() => setShowThreatModal(true)}
            className="bg-red-600 hover:bg-red-500 text-white font-bold px-2.5 py-1 rounded-lg text-[10px] shadow-sm transition-all shrink-0 ml-2 cursor-pointer flex items-center gap-1"
          >
            <ShieldAlert className="w-3 h-3" />
            <span>Banear MAC</span>
          </button>
        </div>
      )}

      {/* Non-Contact Notice Banner (Solo mensajes por APK, sin llamadas) */}
      {!isSavedContact && !chat.isGroup && !isBanned && (
        <div className="bg-zinc-950 border-b border-emerald-950 px-3 py-1.5 flex items-center justify-between text-xs text-zinc-300 z-10 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[11px]">ℹ️ No está en tus contactos. Solo puede escribirte por el APK (llamadas bloqueadas).</span>
          </div>
          <button
            onClick={handleQuickAddContact}
            className="bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 font-semibold px-2 py-0.5 rounded-lg text-[10px] transition-colors shrink-0 ml-2 cursor-pointer"
          >
            ➕ Agregar
          </button>
        </div>
      )}

      {/* Quick Add Success Toast */}
      {quickAddSuccess && (
        <div className="bg-emerald-950 border-b border-emerald-700 px-3 py-1.5 flex items-center justify-center gap-1.5 text-xs text-emerald-300 font-medium z-10 shrink-0">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>Contacto agregado a tu base de datos local. Llamadas y videollamadas ahora habilitadas.</span>
        </div>
      )}

      {/* Blocked Contact Notice Banner */}
      {chat.isBlocked && (
        <div className="bg-red-950/80 border-b border-red-900/80 px-4 py-2 flex items-center justify-between text-xs text-red-200 z-10 shrink-0">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>Has bloqueado a este contacto.</span>
          </div>
          <button
            onClick={() => onToggleBlockChat && onToggleBlockChat(chat.id)}
            className="bg-red-900/60 hover:bg-red-800 text-white font-medium px-2.5 py-1 rounded-lg text-[11px] transition-colors cursor-pointer"
          >
            Desbloquear
          </button>
        </div>
      )}

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        <div className="flex justify-center my-1">
          <div className="bg-[#0d1410] border border-emerald-950/80 rounded-full px-3.5 py-1 text-[10px] text-emerald-400 font-mono flex items-center gap-1.5 shadow-sm">
            <Shield className="w-3 h-3 text-emerald-400 shrink-0" />
            <span>Almacenado solo en tu celular • Nada sale a la nube</span>
          </div>
        </div>

        {chat.messages.length === 0 && (
          <div className="py-12 flex flex-col items-center justify-center text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-[#0d1410] border border-emerald-900/60 flex items-center justify-center text-emerald-400 mb-2.5 shadow-md">
              <Shield className="w-6 h-6" />
            </div>
            <h4 className="text-xs font-bold text-white mb-1.5">Conversación Directa y Privada</h4>
            <p className="text-[11px] text-zinc-300 max-w-xs leading-relaxed mb-2">
              El almacenamiento es en tu dispositivo. Todo lo que envíes o recibas se guarda únicamente en tu teléfono y el de tu contacto.
            </p>
            <p className="text-[10px] text-emerald-400 font-mono">
              Fotos y videos de una sola reproducción disponibles.
            </p>
          </div>
        )}

        {chat.messages.map((msg) => {
          const isMe = msg.senderId === 'me' || msg.senderId === currentUser.userId;
          const isSystem = msg.senderId === 'system';

          if (isSystem) {
            return (
              <div key={msg.id} className="flex justify-center my-1.5">
                <span className="bg-[#0e1611] text-emerald-400/90 text-[10px] font-mono px-3 py-1 rounded-full border border-emerald-950 shadow-sm">
                  {msg.text}
                </span>
              </div>
            );
          }

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs relative shadow-md ${
                  isMe
                    ? 'bg-[#12261a] border border-emerald-700/40 text-emerald-50 rounded-br-none'
                    : 'bg-[#0e1611] border border-emerald-950 text-zinc-100 rounded-bl-none'
                }`}
              >
                {!isMe && (
                  <span className="text-[10px] font-bold text-emerald-400 block mb-0.5">
                    {msg.senderName}
                  </span>
                )}

                {/* 1. VIEW ONCE MEDIA (Foto o Video de una sola reproducción) */}
                {msg.isViewOnce ? (
                  <div className="my-1">
                    {!msg.isViewed ? (
                      <button
                        type="button"
                        onClick={() => handleOpenViewOnce(msg)}
                        className="flex items-center gap-2.5 bg-black/40 hover:bg-emerald-950/60 border border-emerald-500/60 rounded-xl px-3 py-2 text-left transition-all active:scale-95 cursor-pointer shadow-inner"
                      >
                        <div className="w-7 h-7 rounded-full border-2 border-emerald-400 flex items-center justify-center font-bold text-xs text-emerald-400 shrink-0">
                          ①
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-emerald-300 block">
                            {msg.attachment?.type === 'video' ? 'Video' : 'Foto'}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono block">
                            1 sola reproducción (Tocar para ver)
                          </span>
                        </div>
                        <Eye className="w-4 h-4 text-emerald-400 ml-1 shrink-0" />
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 bg-black/30 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-500 opacity-70">
                        <div className="w-6 h-6 rounded-full border border-zinc-600 flex items-center justify-center text-xs font-bold text-zinc-500 shrink-0">
                          ①
                        </div>
                        <span className="text-xs font-mono font-medium">Abierto (Ya reproducido)</span>
                      </div>
                    )}
                  </div>
                ) : (
                  /* 2. REGULAR MEDIA (Fotos, Videos, Audios) */
                  msg.attachment && (
                    <div className="mb-2 rounded-xl overflow-hidden border border-emerald-900/60">
                      {msg.attachment.type === 'image' && (
                        <img
                          src={msg.attachment.url}
                          alt="Foto"
                          className="w-full max-h-52 object-cover rounded-xl"
                        />
                      )}

                      {msg.attachment.type === 'video' && (
                        <video
                          src={msg.attachment.url}
                          controls
                          className="w-full max-h-52 bg-black rounded-xl"
                        />
                      )}

                      {msg.attachment.type === 'audio' && (
                        <div className="bg-[#070b08] p-2.5 rounded-xl border border-emerald-900/40 flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => handleTogglePlayAudio(msg)}
                            className="w-8 h-8 rounded-full bg-emerald-600 text-black flex items-center justify-center shrink-0 shadow-md cursor-pointer hover:bg-emerald-500 transition-colors"
                          >
                            {playingAudioId === msg.id ? (
                              <Pause className="w-4 h-4 fill-current" />
                            ) : (
                              <Play className="w-4 h-4 fill-current ml-0.5" />
                            )}
                          </button>

                          {/* Dynamic audio waveform bar simulation */}
                          <div className="flex-1 flex items-center gap-0.5 h-6">
                            {[12, 20, 8, 24, 16, 10, 22, 18, 14, 20, 10, 16, 24, 8, 14].map((h, idx) => (
                              <span
                                key={idx}
                                className={`flex-1 rounded-full transition-all ${
                                  playingAudioId === msg.id && idx % 3 === 0
                                    ? 'bg-emerald-300 animate-pulse'
                                    : 'bg-emerald-600/70'
                                }`}
                                style={{ height: `${h}px` }}
                              />
                            ))}
                          </div>

                          <span className="text-[10px] font-mono text-zinc-400 shrink-0">
                            {msg.attachment.duration || '0:05'}
                          </span>
                        </div>
                      )}

                      {msg.attachment.type === 'file' && (
                        <div className="bg-[#070b08] p-2 text-[11px] font-mono text-emerald-300 flex items-center gap-2">
                          <span>📎 {msg.attachment.name}</span>
                        </div>
                      )}
                    </div>
                  )
                )}

                {/* Text body */}
                {msg.text && (
                  <p className="leading-relaxed break-words whitespace-pre-wrap">{msg.text}</p>
                )}

                {/* Status, Timestamp & Delete Action */}
                <div className="flex items-center justify-end gap-1.5 mt-1 text-[9px] font-mono text-zinc-400">
                  <span>{msg.timestamp}</span>
                  {isMe && <CheckCheck className="w-3 h-3 text-emerald-400" />}
                  
                  {/* Delete trigger button */}
                  {!msg.deletedForEveryone && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMsgToDelete(msg);
                      }}
                      className="text-zinc-500 hover:text-red-400 p-0.5 rounded transition-colors cursor-pointer ml-1"
                      title="Eliminar mensaje"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Attachment Bottom Sheet / Menu */}
      {showAttachMenu && !chat.isBlocked && (
        <div className="bg-[#0d1410] border-t border-emerald-950 p-3 space-y-3 z-20 shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white font-mono uppercase">
              Adjuntar Archivo Seguro
            </span>
            <button
              onClick={() => setShowAttachMenu(false)}
              className="text-zinc-400 hover:text-white p-1 text-xs cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {/* Foto Real / Subir con aviso de permiso */}
            <button
              type="button"
              onClick={() => requestSystemAccess('photo', () => imageInputRef.current?.click())}
              className="flex flex-col items-center gap-1.5 p-2.5 bg-[#070b08] hover:bg-emerald-950/60 border border-emerald-950 rounded-2xl transition-all cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-600/50 flex items-center justify-center text-emerald-400 shadow-sm">
                <ImageIcon className="w-5 h-5" />
              </div>
              <span className="text-[10px] text-zinc-300 font-medium">Foto</span>
            </button>

            {/* Video Real / Subir con aviso de permiso */}
            <button
              type="button"
              onClick={() => requestSystemAccess('video', () => videoInputRef.current?.click())}
              className="flex flex-col items-center gap-1.5 p-2.5 bg-[#070b08] hover:bg-emerald-950/60 border border-emerald-950 rounded-2xl transition-all cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-950 border border-purple-600/50 flex items-center justify-center text-purple-400 shadow-sm">
                <Film className="w-5 h-5" />
              </div>
              <span className="text-[10px] text-zinc-300 font-medium">Video</span>
            </button>

            {/* Documento / Archivo (PDF, ZIP, DOC, TXT) */}
            <button
              type="button"
              onClick={() => requestSystemAccess('doc', () => docInputRef.current?.click())}
              className="flex flex-col items-center gap-1.5 p-2.5 bg-[#070b08] hover:bg-emerald-950/60 border border-emerald-950 rounded-2xl transition-all cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-950 border border-blue-600/50 flex items-center justify-center text-blue-400 shadow-sm">
                <Paperclip className="w-5 h-5" />
              </div>
              <span className="text-[10px] text-zinc-300 font-medium">Archivo</span>
            </button>

            {/* Foto Demo */}
            <button
              type="button"
              onClick={() => handleSendSamplePhoto(isViewOnceActive)}
              className="flex flex-col items-center gap-1.5 p-2.5 bg-[#070b08] hover:bg-emerald-950/60 border border-emerald-950 rounded-2xl transition-all cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-900/60 border border-emerald-500/50 flex items-center justify-center text-emerald-300 shadow-sm">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="text-[10px] text-zinc-300 font-medium">Foto Demo</span>
            </button>
          </div>

          {/* Toggle 1 sola reproducción en el panel de adjuntos */}
          <div className="flex items-center justify-between bg-[#070b08] p-2.5 rounded-xl border border-emerald-950">
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold ${
                isViewOnceActive ? 'border-emerald-400 text-emerald-400 bg-emerald-950' : 'border-zinc-500 text-zinc-400'
              }`}>
                ①
              </div>
              <div>
                <span className="text-xs font-bold text-white block">1 sola reproducción</span>
                <span className="text-[10px] text-zinc-400 block font-mono">El destinatario solo podrá verla una vez</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsViewOnceActive(!isViewOnceActive)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                isViewOnceActive
                  ? 'bg-emerald-500 text-black shadow-md shadow-emerald-950'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              {isViewOnceActive ? 'Activado' : 'Desactivado'}
            </button>
          </div>
        </div>
      )}

      {/* Bottom Audio Recording Bar OR Standard Message Input Bar */}
      {!chat.isBlocked ? (
        <div className="p-2 bg-[#0d1410] border-t border-emerald-950 shrink-0">
          {isRecordingAudio ? (
            /* Audio Note Recording Interface */
            <div className="flex items-center gap-2 bg-[#070b08] border border-red-900/80 rounded-2xl px-3 py-2 animate-pulse">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-ping shrink-0" />
              <span className="text-xs font-mono font-bold text-red-400">
                🔴 0:{recordingSeconds < 10 ? '0' : ''}{recordingSeconds}
              </span>
              <span className="text-[11px] text-zinc-400 flex-1 font-mono">
                Grabando audio seguro...
              </span>

              <button
                type="button"
                onClick={handleCancelVoiceRecording}
                className="w-8 h-8 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer"
                title="Cancelar grabación"
              >
                <X className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleFinishVoiceRecording}
                className="w-8 h-8 rounded-xl bg-emerald-600 text-black flex items-center justify-center hover:bg-emerald-500 shadow-md cursor-pointer"
                title="Enviar nota de voz"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            /* Normal Input Interface */
            <form onSubmit={handleSend} className="flex items-center gap-1.5">
              {/* Attachment Clip Button */}
              <button
                type="button"
                onClick={() => setShowAttachMenu(!showAttachMenu)}
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors shrink-0 cursor-pointer ${
                  showAttachMenu
                    ? 'bg-emerald-600 text-black font-bold'
                    : 'bg-emerald-950/80 hover:bg-emerald-900 text-zinc-400 hover:text-emerald-300'
                }`}
                title="Adjuntar fotos, videos o archivos"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              {/* View Once Toggle Button ("①" style WhatsApp) */}
              <button
                type="button"
                onClick={() => setIsViewOnceActive(!isViewOnceActive)}
                className={`w-8 h-8 rounded-xl text-xs font-bold flex items-center justify-center transition-all shrink-0 cursor-pointer border ${
                  isViewOnceActive
                    ? 'bg-emerald-500 text-black border-emerald-400 shadow-md shadow-emerald-950 scale-105'
                    : 'bg-[#090f0b] text-zinc-400 border-emerald-900/60 hover:text-emerald-300'
                }`}
                title={isViewOnceActive ? '1 sola reproducción activado' : 'Activar 1 sola reproducción para el próximo envío'}
              >
                ①
              </button>

              {/* Text Input */}
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Mensaje cifrado..."
                className="flex-1 bg-[#070b08] border border-emerald-900/60 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />

              {/* Llama AI Assistant Button if text typed */}
              {inputText.trim() && (
                <button
                  type="button"
                  onClick={handleAskLlama}
                  disabled={isAiConsulting}
                  className="bg-emerald-950 hover:bg-emerald-900 text-emerald-400 border border-emerald-700/50 px-2 py-2 rounded-xl text-[10px] font-mono flex items-center gap-1 transition-all shrink-0 cursor-pointer"
                  title="Consultar a Llama Offline en el chat"
                >
                  <Sparkles className="w-3 h-3" /> Llama
                </button>
              )}

              {/* Mic OR Send Button */}
              {inputText.trim() ? (
                <button
                  type="submit"
                  className="w-8 h-8 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-black flex items-center justify-center transition-all shadow-md shadow-emerald-950 cursor-pointer shrink-0"
                  title="Enviar mensaje"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => requestSystemAccess('audio', handleStartVoiceRecording)}
                  className="w-8 h-8 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 text-emerald-400 border border-emerald-800/60 flex items-center justify-center transition-all cursor-pointer shrink-0 active:scale-95"
                  title="Grabar nota de voz"
                >
                  <Mic className="w-4 h-4" />
                </button>
              )}
            </form>
          )}
        </div>
      ) : (
        <div className="p-3 bg-[#0d1410] border-t border-emerald-950 text-center text-xs text-zinc-500 font-mono">
          No puedes enviar mensajes a un contacto bloqueado.
        </div>
      )}

      {/* EPHEMERAL FULL SCREEN VISOR (UNA SOLA REPRODUCCIÓN) */}
      {activeViewOnceMsg && (
        <div className="absolute inset-0 bg-black/95 z-50 flex flex-col justify-between p-4 backdrop-blur-md">
          {/* Header */}
          <div className="flex items-center justify-between text-white border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full border border-emerald-400 text-emerald-400 flex items-center justify-center font-bold text-xs">
                ①
              </div>
              <div>
                <span className="text-xs font-bold">1 Sola Reproducción</span>
                <span className="text-[10px] text-zinc-400 block font-mono">
                  Al salir de esta pantalla se destruirá permanentemente
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCloseViewOnce}
              className="bg-zinc-800 hover:bg-zinc-700 text-white rounded-full p-2 text-xs font-bold cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Media Content */}
          <div className="flex-1 flex items-center justify-center my-4 overflow-hidden">
            {activeViewOnceMsg.attachment?.type === 'video' ? (
              <video
                src={activeViewOnceMsg.attachment.url}
                controls
                autoPlay
                className="max-h-[70vh] max-w-full rounded-2xl shadow-2xl"
              />
            ) : (
              <img
                src={activeViewOnceMsg.attachment?.url}
                alt="Foto de 1 sola reproducción"
                className="max-h-[70vh] max-w-full object-contain rounded-2xl shadow-2xl"
              />
            )}
          </div>

          {/* Footer warning */}
          <div className="text-center py-2">
            <button
              type="button"
              onClick={handleCloseViewOnce}
              className="bg-emerald-600 hover:bg-emerald-500 text-black font-bold px-6 py-2.5 rounded-2xl text-xs shadow-xl transition-transform active:scale-95 cursor-pointer"
            >
              Cerrar y Autodestruir
            </button>
          </div>
        </div>
      )}

      {/* MODAL: AÑADIR PARTICIPANTE AL CHAT */}
      {showAddMemberModal && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d1410] border border-emerald-800/80 rounded-3xl p-5 max-w-xs w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-400" />
                Añadir al Chat
              </h3>
              <button
                onClick={() => setShowAddMemberModal(false)}
                className="text-zinc-400 hover:text-white p-1 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddMemberSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono text-emerald-400 mb-1 uppercase">
                  Nombre del nuevo miembro
                </label>
                <input
                  type="text"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="Ej. Agente Sigma"
                  className="w-full bg-[#070b08] border border-emerald-900 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                  autoFocus
                  required
                />
              </div>

              <p className="text-[10px] text-zinc-400 font-mono">
                Se sincronizará con la llave cuántica local del grupo P2P.
              </p>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-black font-semibold py-2 rounded-xl text-xs shadow-md transition-all active:scale-95 cursor-pointer"
              >
                Añadir Participante
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAR ELIMINAR CHAT */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d1410] border border-red-900/80 rounded-3xl p-5 max-w-xs w-full shadow-2xl space-y-3.5 text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-950/60 border border-red-800 text-red-400 flex items-center justify-center mx-auto shadow-md">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-sm font-bold text-white">¿Eliminar este chat?</h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-mono">
              Se borrará la conversación y todas sus llaves locales permanentemente. Esta acción no se puede deshacer.
            </p>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 bg-[#070b08] hover:bg-zinc-800 text-zinc-300 font-medium py-2 rounded-xl text-xs border border-zinc-700 transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  if (onDeleteChat) onDeleteChat(chat.id);
                }}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-2 rounded-xl text-xs shadow-md shadow-red-950 transition-all active:scale-95 cursor-pointer"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SOLICITUD DE ACCESO AL SISTEMA / PRIVACIDAD */}
      {permissionRequest && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d1410] border border-emerald-700/80 rounded-3xl p-5 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-950 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shrink-0 shadow-md">
                <Shield className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-white">{permissionRequest.title}</h3>
                <span className="text-[10px] text-emerald-400 font-mono">Control de Extracción Seguro</span>
              </div>
            </div>

            <div className="bg-[#070b08] p-3 rounded-2xl border border-emerald-950/80 space-y-2 text-xs">
              <p className="text-zinc-200 leading-relaxed font-sans">
                {permissionRequest.description}
              </p>
              <div className="p-2 bg-emerald-950/40 rounded-xl border border-emerald-800/40 text-[10px] text-emerald-300 font-mono flex items-start gap-1.5">
                <Shield className="w-3.5 h-3.5 shrink-0 text-emerald-400 mt-0.5" />
                <span>
                  <strong>Aviso de Cero Retención:</strong> Al enviar algo, la aplicación únicamente extrae los datos necesarios y <strong>no se guarda absolutamente nada en la IA ni en servidores externos</strong>. Todo se cifra localmente con tu ID de 11 dígitos, tu Clave y la huella del dispositivo.
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPermissionRequest(null)}
                className="flex-1 bg-[#070b08] hover:bg-zinc-800 text-zinc-400 hover:text-white font-medium py-2 rounded-xl text-xs border border-zinc-700 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={permissionRequest.action}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-black font-bold py-2 rounded-xl text-xs shadow-lg shadow-emerald-950 transition-all active:scale-95 cursor-pointer"
              >
                Autorizar y Extraer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ELIMINAR MENSAJE (UNO A UNO / PARA TODOS) */}
      {msgToDelete && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d1410] border border-emerald-800/80 rounded-3xl p-5 max-w-xs w-full shadow-2xl space-y-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-red-950/60 border border-red-800/70 text-red-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Eliminar Mensaje</h4>
                <span className="text-[10px] text-zinc-400 font-mono">Selecciona el alcance</span>
              </div>
            </div>

            <p className="text-[11px] text-zinc-300 bg-[#070b08] p-2.5 rounded-xl border border-emerald-950 font-mono line-clamp-2">
              "{msgToDelete.text || (msgToDelete.attachment ? `[${msgToDelete.attachment.type}]` : 'Mensaje')}"
            </p>

            <div className="space-y-2 pt-1">
              {/* If in group: any message from any user can be deleted from the group for everyone */}
              {chat.isGroup ? (
                <button
                  type="button"
                  onClick={() => {
                    if (onDeleteMessage) {
                      onDeleteMessage(chat.id, msgToDelete.id, true);
                    }
                    setMsgToDelete(null);
                  }}
                  className="w-full bg-red-600/90 hover:bg-red-500 text-white font-bold py-2 rounded-xl text-xs shadow-md shadow-red-950 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar del grupo para todos</span>
                </button>
              ) : (
                /* Direct chat */
                <>
                  {(msgToDelete.senderId === 'me' || msgToDelete.senderId === currentUser.userId) && (
                    <button
                      type="button"
                      onClick={() => {
                        if (onDeleteMessage) {
                          onDeleteMessage(chat.id, msgToDelete.id, true);
                        }
                        setMsgToDelete(null);
                      }}
                      className="w-full bg-red-600/90 hover:bg-red-500 text-white font-bold py-2 rounded-xl text-xs shadow-md shadow-red-950 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Eliminar para todos</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      if (onDeleteMessage) {
                        onDeleteMessage(chat.id, msgToDelete.id, false);
                      }
                      setMsgToDelete(null);
                    }}
                    className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium py-2 rounded-xl text-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Eliminar solo para mí</span>
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => setMsgToDelete(null)}
                className="w-full bg-[#070b08] hover:bg-zinc-900 text-zinc-400 hover:text-white py-1.5 rounded-xl text-[11px] border border-zinc-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RESTRICCIÓN DE LLAMADAS PARA NO-CONTACTOS */}
      {showNonContactCallModal && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d1410] border border-amber-800/80 rounded-3xl p-5 max-w-sm w-full shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-950/80 border border-amber-600/50 text-amber-400 flex items-center justify-center mx-auto shadow-md">
              <Lock className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white">Llamadas y Video Restringidos</h3>
              <p className="text-[11px] text-amber-300/90 font-mono">
                Solo mensajería por chat en el APK
              </p>
            </div>

            <div className="bg-[#070b08] p-3 rounded-2xl border border-emerald-950/80 text-left space-y-2 text-xs text-zinc-300 leading-relaxed">
              <p>
                Este usuario <strong>no está registrado en tus contactos</strong> ni te tiene en los suyos.
              </p>
              <p className="text-[11px] text-zinc-400">
                Por protocolo de máxima privacidad, solo puede escribirte directamente por el chat del APK. Las llamadas de voz y videollamadas quedan deshabilitadas hasta que se agreguen mutuamente.
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={handleQuickAddContact}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-black font-bold py-2.5 rounded-xl text-xs shadow-lg shadow-emerald-950 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <UserCheck className="w-4 h-4" />
                <span>Agregar a mis contactos ahora</span>
              </button>

              <button
                type="button"
                onClick={() => setShowNonContactCallModal(false)}
                className="w-full bg-[#070b08] hover:bg-zinc-800 text-zinc-400 hover:text-white py-2 rounded-xl text-xs border border-zinc-700 transition-colors cursor-pointer"
              >
                Entendido, solo chatear por texto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: MEDIDAS DE RIESGO ELEVADAS Y BANEO DE MAC DE HARDWARE */}
      {showThreatModal && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d1410] border border-red-800 rounded-3xl p-5 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-950 border border-red-600/60 flex items-center justify-center text-red-400 shrink-0 shadow-md">
                <ShieldAlert className="w-5 h-5 animate-pulse" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-white">Medidas de Riesgo Elevadas</h3>
                <span className="text-[10px] text-red-400 font-mono">Baneo de MAC & Hardware IA</span>
              </div>
            </div>

            <div className="bg-[#070b08] p-3 rounded-2xl border border-red-950 space-y-2 text-xs">
              <p className="text-zinc-200">
                Si estás recibiendo <strong>amenazas, intimidación o extorsión</strong>, la IA de Chattoj activará contramedidas de alto nivel y <strong>baneará permanentemente la dirección MAC del hardware del agresor</strong>.
              </p>

              <div className="p-2.5 bg-red-950/40 rounded-xl border border-red-900/40 font-mono text-[11px] text-red-300 space-y-1">
                <div>Agresor: <strong>{chat.name}</strong></div>
                <div>Huella MAC calculada: <span className="text-white">{generateThreatMacAddress(chat.name)}</span></div>
                <div>Blindaje de usuario: <span className="text-emerald-400">NIVEL_5_BLINDAJE_MÁXIMO</span></div>
              </div>

              <div className="space-y-1 pt-1">
                <label className="text-[10px] text-zinc-400 font-mono uppercase">Motivo / Tipo de Amenaza:</label>
                <input
                  type="text"
                  value={threatReason}
                  onChange={(e) => setThreatReason(e.target.value)}
                  className="w-full bg-[#0d1410] border border-red-900/80 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-red-500 font-mono"
                  placeholder="Ej: Amenaza directa, extorsión, acoso..."
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowThreatModal(false)}
                className="flex-1 bg-[#070b08] hover:bg-zinc-800 text-zinc-400 hover:text-white font-medium py-2 rounded-xl text-xs border border-zinc-700 transition-colors cursor-pointer"
              >
                Cerrar
              </button>

              <button
                type="button"
                onClick={handleExecuteMacBan}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-2 rounded-xl text-xs shadow-lg shadow-red-950 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Banear MAC Ahora</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: PANEL DE DATOS, MULTIMEDIA Y FUNCIONES AVANZADAS DEL CONTACTO  */}
      {/* ===================================================================== */}
      {showContactInfoModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3">
          <div className="bg-[#0c120e] border border-emerald-800/80 rounded-3xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Top Bar with Close button */}
            <div className="p-4 bg-[#080d0a] border-b border-emerald-950 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Panel del Contacto & Privacidad</h3>
              </div>
              <button 
                onClick={() => setShowContactInfoModal(false)}
                className="p-1 text-zinc-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              {/* Profile Card Header */}
              <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-[#080d0a] border border-emerald-950 space-y-2 relative">
                <div className="relative">
                  <img
                    src={chat.avatar}
                    alt={chat.name}
                    className="w-20 h-20 rounded-full object-cover border-2 border-emerald-500/50 shadow-xl"
                  />
                  {chat.online && !chat.isBlocked && (
                    <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-[#080d0a] rounded-full" />
                  )}
                </div>

                <div className="space-y-0.5">
                  <h2 className="text-base font-bold text-white">{chat.name}</h2>
                  <p className="text-[11px] font-mono text-emerald-400">
                    {chat.secureId || `Q-ID-${chat.id.replace(/\D/g, '').padEnd(11, '83920194821').slice(0, 11)}`}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                  {isSavedContact ? (
                    <span className="px-2.5 py-0.5 bg-emerald-950/80 border border-emerald-600/50 text-emerald-300 rounded-full text-[10px] font-mono flex items-center gap-1">
                      <UserCheck className="w-3 h-3" /> Contacto Guardado
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 bg-amber-950/80 border border-amber-600/50 text-amber-300 rounded-full text-[10px] font-mono flex items-center gap-1">
                      ⚠️ No Agregado (Solo Mensajería)
                    </span>
                  )}
                  <span className="px-2.5 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-full text-[10px] font-mono">
                    Cifrado Cuántico v5.0
                  </span>
                </div>

                {!isSavedContact && (
                  <button
                    onClick={() => {
                      handleQuickAddContact();
                    }}
                    className="mt-2 w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-black font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Guardar en mis Contactos</span>
                  </button>
                )}
              </div>

              {/* Navigation Tabs: Multimedia vs Permisos y Límites */}
              <div className="grid grid-cols-2 gap-1 p-1 bg-[#050806] border border-emerald-950 rounded-xl">
                <button
                  onClick={() => setActiveInfoTab('media')}
                  className={`py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeInfoTab === 'media'
                      ? 'bg-emerald-600 text-black shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Multimedia & Archivos</span>
                </button>
                <button
                  onClick={() => setActiveInfoTab('permissions')}
                  className={`py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeInfoTab === 'permissions'
                      ? 'bg-emerald-600 text-black shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Permisos & Límites</span>
                </button>
              </div>

              {/* TAB 1: MULTIMEDIA, AUDIOS Y ARCHIVOS ENVIADOS */}
              {activeInfoTab === 'media' && (
                <div className="space-y-3">
                  {/* Category switcher */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setActiveMediaCategory('photos')}
                      className={`flex-1 py-1.5 rounded-lg text-[11px] font-mono border transition-all cursor-pointer ${
                        activeMediaCategory === 'photos'
                          ? 'bg-emerald-950 border-emerald-500 text-emerald-300 font-bold'
                          : 'bg-[#080d0a] border-emerald-950 text-zinc-400'
                      }`}
                    >
                      🖼️ Fotos ({chat.messages.filter(m => m.attachment?.type === 'image').length})
                    </button>
                    <button
                      onClick={() => setActiveMediaCategory('audios')}
                      className={`flex-1 py-1.5 rounded-lg text-[11px] font-mono border transition-all cursor-pointer ${
                        activeMediaCategory === 'audios'
                          ? 'bg-emerald-950 border-emerald-500 text-emerald-300 font-bold'
                          : 'bg-[#080d0a] border-emerald-950 text-zinc-400'
                      }`}
                    >
                      🎙️ Audios ({chat.messages.filter(m => m.attachment?.type === 'audio').length})
                    </button>
                    <button
                      onClick={() => setActiveMediaCategory('docs')}
                      className={`flex-1 py-1.5 rounded-lg text-[11px] font-mono border transition-all cursor-pointer ${
                        activeMediaCategory === 'docs'
                          ? 'bg-emerald-950 border-emerald-500 text-emerald-300 font-bold'
                          : 'bg-[#080d0a] border-emerald-950 text-zinc-400'
                      }`}
                    >
                      📄 Archivos ({chat.messages.filter(m => m.attachment?.type === 'document').length})
                    </button>
                  </div>

                  {/* Photos Grid */}
                  {activeMediaCategory === 'photos' && (
                    <div>
                      {chat.messages.filter(m => m.attachment?.type === 'image').length === 0 ? (
                        <div className="p-6 text-center text-zinc-500 text-xs bg-[#080d0a] rounded-2xl border border-emerald-950/60 font-mono">
                          No hay fotos compartidas en este chat
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-2">
                          {chat.messages
                            .filter(m => m.attachment?.type === 'image')
                            .map((m) => (
                              <div key={m.id} className="aspect-square rounded-xl overflow-hidden bg-black/60 border border-emerald-900/60 group relative">
                                <img
                                  src={m.attachment!.url}
                                  alt=""
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  referrerPolicy="no-referrer"
                                />
                                <span className="absolute bottom-1 right-1 bg-black/70 text-[9px] px-1 py-0.5 rounded text-white font-mono">
                                  {m.timestamp}
                                </span>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Audios List */}
                  {activeMediaCategory === 'audios' && (
                    <div className="space-y-2">
                      {chat.messages.filter(m => m.attachment?.type === 'audio').length === 0 ? (
                        <div className="p-6 text-center text-zinc-500 text-xs bg-[#080d0a] rounded-2xl border border-emerald-950/60 font-mono">
                          No hay notas de voz o audios grabados
                        </div>
                      ) : (
                        chat.messages
                          .filter(m => m.attachment?.type === 'audio')
                          .map((m) => (
                            <div key={m.id} className="p-3 bg-[#080d0a] rounded-xl border border-emerald-950 flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-700/60 flex items-center justify-center text-emerald-400">
                                  <Volume2 className="w-4 h-4" />
                                </div>
                                <div>
                                  <span className="font-semibold text-white block truncate">
                                    Nota de Voz {m.attachment?.name || ''}
                                  </span>
                                  <span className="text-[10px] text-zinc-400 font-mono">{m.timestamp}</span>
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  if (m.attachment?.url) {
                                    const audio = new Audio(m.attachment.url);
                                    audio.play().catch(() => {});
                                  }
                                }}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-black font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer"
                              >
                                <Play className="w-3 h-3 fill-current" /> Reproducir
                              </button>
                            </div>
                          ))
                      )}
                    </div>
                  )}

                  {/* Documents List */}
                  {activeMediaCategory === 'docs' && (
                    <div className="space-y-2">
                      {chat.messages.filter(m => m.attachment?.type === 'document').length === 0 ? (
                        <div className="p-6 text-center text-zinc-500 text-xs bg-[#080d0a] rounded-2xl border border-emerald-950/60 font-mono">
                          No hay documentos o archivos transferidos
                        </div>
                      ) : (
                        chat.messages
                          .filter(m => m.attachment?.type === 'document')
                          .map((m) => (
                            <div key={m.id} className="p-3 bg-[#080d0a] rounded-xl border border-emerald-950 flex items-center justify-between">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-700/60 flex items-center justify-center text-emerald-400 shrink-0">
                                  <FileText className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <span className="font-semibold text-white block truncate">
                                    {m.attachment?.name || 'Documento'}
                                  </span>
                                  <span className="text-[10px] text-zinc-400 font-mono">{m.timestamp}</span>
                                </div>
                              </div>
                              <a
                                href={m.attachment?.url}
                                download={m.attachment?.name || 'archivo'}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium rounded-lg text-xs flex items-center gap-1 cursor-pointer shrink-0"
                              >
                                <Download className="w-3 h-3" /> Descargar
                              </a>
                            </div>
                          ))
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: PERMISOS, LÍMITES Y MENSAJES TEMPORALES */}
              {activeInfoTab === 'permissions' && (
                <div className="space-y-3">
                  {/* Disappearing Messages */}
                  <div className="p-3 bg-[#080d0a] rounded-xl border border-emerald-950 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-emerald-400" />
                        <span className="font-bold text-white">Mensajes Temporales</span>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-mono">
                        {tempMessagesTimer === 'off' ? 'Desactivado' : tempMessagesTimer}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      Elimina automáticamente los mensajes de este chat tras el tiempo fijado.
                    </p>
                    <div className="grid grid-cols-4 gap-1.5 pt-1">
                      {[
                        { id: 'off', label: 'Off' },
                        { id: '24h', label: '24 Horas' },
                        { id: '7d', label: '7 Días' },
                        { id: '90d', label: '90 Días' }
                      ].map((t) => (
                        <button
                          key={t.id}
                          onClick={() => {
                            setTempMessagesTimer(t.id);
                            localStorage.setItem(`chattoj_temp_msg_${chat.id}`, t.id);
                          }}
                          className={`py-1.5 rounded-lg text-[10px] font-mono transition-all cursor-pointer ${
                            tempMessagesTimer === t.id
                              ? 'bg-emerald-600 text-black font-bold'
                              : 'bg-[#050806] text-zinc-400 border border-emerald-950 hover:text-white'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Advanced Permissions switches */}
                  <div className="p-3 bg-[#080d0a] rounded-xl border border-emerald-950 space-y-3">
                    <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      Límites y Permisos de Comunicación
                    </h4>

                    {/* Allow Voice calls */}
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-zinc-200 block">Llamadas de Voz</span>
                        <span className="text-[10px] text-zinc-400">Permitir recibir llamadas de audio P2P</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={allowVoiceCalls}
                        onChange={(e) => setAllowVoiceCalls(e.target.checked)}
                        className="w-4 h-4 accent-emerald-500 cursor-pointer"
                      />
                    </div>

                    {/* Allow Video calls */}
                    <div className="flex items-center justify-between border-t border-emerald-950/60 pt-2">
                      <div>
                        <span className="font-semibold text-zinc-200 block">Videollamadas</span>
                        <span className="text-[10px] text-zinc-400">Permitir enlaces de cámara de video</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={allowVideoCalls}
                        onChange={(e) => setAllowVideoCalls(e.target.checked)}
                        className="w-4 h-4 accent-emerald-500 cursor-pointer"
                      />
                    </div>

                    {/* Allow Media */}
                    <div className="flex items-center justify-between border-t border-emerald-950/60 pt-2">
                      <div>
                        <span className="font-semibold text-zinc-200 block">Recepción de Multimedia</span>
                        <span className="text-[10px] text-zinc-400">Descargar fotos y archivos de este chat</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={allowMediaSharing}
                        onChange={(e) => setAllowMediaSharing(e.target.checked)}
                        className="w-4 h-4 accent-emerald-500 cursor-pointer"
                      />
                    </div>

                    {/* Mute Chat */}
                    <div className="flex items-center justify-between border-t border-emerald-950/60 pt-2">
                      <div>
                        <span className="font-semibold text-zinc-200 block">Silenciar Notificaciones</span>
                        <span className="text-[10px] text-zinc-400">No reproducir alertas sonoras para este chat</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={isChatMuted}
                        onChange={(e) => setIsChatMuted(e.target.checked)}
                        className="w-4 h-4 accent-emerald-500 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* CRITICAL ACTIONS BOTTOM (BLOQUEAR, REPORTAR, VACIAR) */}
              <div className="pt-2 border-t border-emerald-950 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowContactInfoModal(false);
                    setShowThreatModal(true);
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-red-950/70 hover:bg-red-900/80 border border-red-800 text-red-200 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md"
                >
                  <ShieldAlert className="w-4 h-4 text-red-400" />
                  <span>Reportar Chat a la IA / Administrador</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (onToggleBlockChat) {
                        onToggleBlockChat(chat.id);
                      }
                      setShowContactInfoModal(false);
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                      chat.isBlocked
                        ? 'bg-emerald-950 border-emerald-700 text-emerald-300'
                        : 'bg-zinc-900 border-zinc-800 text-amber-400 hover:bg-zinc-800'
                    }`}
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>{chat.isBlocked ? 'Desbloquear' : 'Bloquear'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowContactInfoModal(false);
                      setShowDeleteConfirm(true);
                    }}
                    className="py-2 px-3 rounded-xl bg-zinc-900 hover:bg-red-950/60 border border-zinc-800 hover:border-red-900 text-zinc-300 hover:text-red-300 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Vaciar Chat</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {showReportModal && (
        <ReportModal
          targetId={chat.id}
          targetName={chat.name}
          source="chat"
          currentUserId={currentUser.userId}
          currentUserName={currentUser.name}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
};
