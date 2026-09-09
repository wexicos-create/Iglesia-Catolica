import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, AiTaskSchedule, AiChatSession } from '../types';
import { askLlamaOffline, ADMIN_CONTACT_INFO, LlamaAttachmentInfo } from '../utils/llamaEngine';
import { publishAnnouncement } from '../utils/announcements';
import {
  getAiAssistantPrivacyConfig,
  saveAiAssistantPrivacyConfig,
  getAiVoiceMuted,
  setAiVoiceMuted,
  AiAssistantPrivacyConfig
} from '../utils/cryptoStorage';
import { offlineAudio } from '../utils/audioAlerts';
import { 
  Cpu, Send, RefreshCw, Settings, Sparkles, Megaphone, 
  ShieldCheck, AlertTriangle, Paperclip, Check, X, Phone, 
  Instagram, Facebook, Lock, Volume2, VolumeX, Mic, MicOff,
  History, Clock, Plus, Trash2, FileText, Play, ShieldAlert,
  Calendar, Layers, CheckCircle2, ChevronRight, HelpCircle,
  Server, Globe, HardDrive
} from 'lucide-react';
import { AdminServerManager } from './AdminServerManager';

interface LlamaAiTerminalProps {
  currentUser: UserProfile;
  onOpenSettings?: () => void;
}

interface AttachedFileState {
  file: File;
  name: string;
  type: string;
  size: string;
  previewUrl?: string;
}

export const LlamaAiTerminal: React.FC<LlamaAiTerminalProps> = ({ currentUser, onOpenSettings }) => {
  // Initial Start Screen vs Active Terminal State
  const [hasStarted, setHasStarted] = useState<boolean>(() => {
    return localStorage.getItem('chattoj_ai_terminal_started') === 'true';
  });

  // Sessions and Active Chat
  const [sessions, setSessions] = useState<AiChatSession[]>(() => {
    try {
      const raw = localStorage.getItem('chattoj_ai_sessions_v2');
      if (raw) return JSON.parse(raw);
    } catch {}
    return [
      {
        id: 'session-default',
        title: 'Conversación Principal',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [
          {
            id: 'm-init',
            sender: 'ai',
            text: `Hola ${currentUser.name}. Tu Asistente de Inteligencia Artificial opera 100% en el procesador interno de tu teléfono.\n\n🛡️ PRIVACIDAD & AISLAMIENTO ESTRICTO:\n• No sube datos a internet ni a servidores de terceros.\n• Por defecto NO tiene acceso a tus chats privados a menos que actives el "Modo Asistente Personal" en Ajustes.\n• Puedes dictar por voz (micrófono), escuchar respuestas (bocina), adjuntar cualquier archivo (+) y programar mensajes o reportes.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            hash: '0xQ...LOCAL',
            timeMs: 90
          }
        ]
      }
    ];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>('session-default');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Audio / Voice Controls
  const [isVoiceMuted, setIsVoiceMutedState] = useState<boolean>(() => getAiVoiceMuted());
  const [isListening, setIsListening] = useState<boolean>(false);
  const recognitionRef = useRef<any>(null);

  // Attached File State
  const [attachedFile, setAttachedFile] = useState<AttachedFileState | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modals & Panels
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showAdminConfigModal, setShowAdminConfigModal] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [showServerManagerModal, setShowServerManagerModal] = useState(false);
  const [announcementText, setAnnouncementText] = useState('');
  const [announcementToast, setAnnouncementToast] = useState<string | null>(null);

  // AI Admin Config State
  const [aiConfig, setAiConfig] = useState<AiAssistantPrivacyConfig>(() => getAiAssistantPrivacyConfig());

  // Scheduled Tasks List
  const [scheduledTasks, setScheduledTasks] = useState<AiTaskSchedule[]>(() => {
    try {
      const raw = localStorage.getItem('chattoj_ai_scheduled_tasks');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Task creation inputs
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskTime, setNewTaskTime] = useState('18:00');
  const [newTaskType, setNewTaskType] = useState<AiTaskSchedule['type']>('message');
  const [newTaskTarget, setNewTaskTarget] = useState('');
  const [newTaskPrompt, setNewTaskPrompt] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Persist sessions
  useEffect(() => {
    localStorage.setItem('chattoj_ai_sessions_v2', JSON.stringify(sessions));
  }, [sessions]);

  // Persist scheduled tasks
  useEffect(() => {
    localStorage.setItem('chattoj_ai_scheduled_tasks', JSON.stringify(scheduledTasks));
  }, [scheduledTasks]);

  // Sync active session
  const currentSession = sessions.find(s => s.id === activeSessionId) || sessions[0];
  const messages = currentSession ? currentSession.messages : [];

  // Scroll to bottom
  useEffect(() => {
    if (hasStarted && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, hasStarted]);

  // Speech Recognition Setup (Web Speech API)
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'es-MX';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => (prev ? prev + ' ' + transcript : transcript));
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  // Speak AI text response using SpeechSynthesis
  const speakText = (text: string) => {
    if (isVoiceMuted || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel(); // Stop any ongoing speech
      const cleanText = text
        .replace(/https?:\/\/\S+/g, '')
        .replace(/[*_#•\-\[\]\(\)]/g, ' ')
        .slice(0, 300); // Read first clean sentences

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'es-MX';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch {}
  };

  const toggleVoiceMute = () => {
    const next = !isVoiceMuted;
    setIsVoiceMutedState(next);
    setAiVoiceMuted(next);
    if (next && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    offlineAudio.playSent();
  };

  const handleToggleMic = () => {
    if (!recognitionRef.current) {
      alert('Tu navegador o dispositivo no soporta reconocimiento de voz nativo.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch {
        setIsListening(false);
      }
    }
  };

  // Handle File Selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeFormatted = (file.size / 1024).toFixed(1) + ' KB';
    let previewUrl: string | undefined = undefined;

    if (file.type.startsWith('image/')) {
      previewUrl = URL.createObjectURL(file);
    }

    setAttachedFile({
      file,
      name: file.name,
      type: file.type || 'application/octet-stream',
      size: sizeFormatted,
      previewUrl
    });

    offlineAudio.playSent();
  };

  // Handle Submit message to local Llama
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !attachedFile) || loading) return;

    const userText = input.trim() || (attachedFile ? `Analizar archivo adjunto ${attachedFile.name}` : '');
    const currentAttachment = attachedFile ? {
      name: attachedFile.name,
      type: attachedFile.type,
      size: attachedFile.size,
      url: attachedFile.previewUrl
    } : undefined;

    setInput('');
    setAttachedFile(null);

    const userMsg = {
      id: 'u-' + Date.now(),
      sender: 'user' as const,
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachment: currentAttachment
    };

    // Update active session messages
    const updatedMessages = [...messages, userMsg];
    updateSessionMessages(updatedMessages);
    setLoading(true);

    try {
      const attachInfo: LlamaAttachmentInfo | undefined = currentAttachment ? {
        name: currentAttachment.name,
        type: currentAttachment.type,
        size: currentAttachment.size
      } : undefined;

      const res = await askLlamaOffline(userText, currentUser.name, attachInfo);
      
      const aiMsg = {
        id: 'ai-' + Date.now(),
        sender: 'ai' as const,
        text: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        hash: res.quantumHash,
        timeMs: res.processingTimeMs,
        isAnnouncementAlert: res.actionTaken === 'announcement_published'
      };

      updateSessionMessages([...updatedMessages, aiMsg]);
      speakText(res.reply);
      offlineAudio.playReceived();
    } catch {
      const errMsg = {
        id: 'err-' + Date.now(),
        sender: 'ai' as const,
        text: '⚠️ Error en el procesamiento del modelo local. Intenta nuevamente.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      updateSessionMessages([...updatedMessages, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const updateSessionMessages = (newMsgs: AiChatSession['messages']) => {
    setSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        return {
          ...s,
          messages: newMsgs,
          updatedAt: Date.now(),
          title: s.title === 'Nueva Sesión' && newMsgs.length > 1
            ? newMsgs[1].text.slice(0, 24) + '...'
            : s.title
        };
      }
      return s;
    }));
  };

  // Create new session
  const handleCreateNewSession = () => {
    const newId = 'session-' + Date.now();
    const newSession: AiChatSession = {
      id: newId,
      title: 'Nueva Sesión ' + (sessions.length + 1),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [
        {
          id: 'm-init-' + Date.now(),
          sender: 'ai',
          text: `Nueva sesión iniciada. Asistente IA 100% offline activo. ¿En qué tarea de análisis, automatización o comunicación te asisto?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          hash: '0xQ...LOCAL',
          timeMs: 40
        }
      ]
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newId);
    setShowHistoryModal(false);
    offlineAudio.playSent();
  };

  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (sessions.length <= 1) {
      alert('Debes mantener al menos una sesión activa.');
      return;
    }
    const remaining = sessions.filter(s => s.id !== sessionId);
    setSessions(remaining);
    if (activeSessionId === sessionId) {
      setActiveSessionId(remaining[0].id);
    }
  };

  // Create Scheduled Task
  const handleCreateScheduledTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !newTaskPrompt.trim()) return;

    const task: AiTaskSchedule = {
      id: 'task-' + Date.now(),
      title: newTaskTitle.trim(),
      scheduledTime: newTaskTime,
      type: newTaskType,
      targetContactOrForum: newTaskTarget.trim() || 'General / Bóveda Local',
      promptOrText: newTaskPrompt.trim(),
      status: 'pending',
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setScheduledTasks(prev => [task, ...prev]);
    setNewTaskTitle('');
    setNewTaskPrompt('');
    setNewTaskTarget('');
    offlineAudio.playSent();
    alert(`⚡ Tarea de IA programada con éxito para ejecutarse a las ${newTaskTime}.`);
  };

  const handleToggleTaskStatus = (taskId: string) => {
    setScheduledTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          status: t.status === 'completed' ? 'pending' : 'completed'
        };
      }
      return t;
    }));
  };

  const handleDeleteTask = (taskId: string) => {
    setScheduledTasks(prev => prev.filter(t => t.id !== taskId));
  };

  // Publish Announcement
  const handlePublishAnnouncementDirect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementText.trim()) return;

    const ann = publishAnnouncement(announcementText.trim(), currentUser.name || ADMIN_CONTACT_INFO.developer);
    setShowAnnouncementModal(false);
    setAnnouncementText('');

    const confirmationMsg = {
      id: 'ann-' + Date.now(),
      sender: 'ai' as const,
      text: `📢 AVISO IMPORTANTE PUBLICADO CON ÉXITO:\n"${ann.content}"\n\nEl aviso ya está fijado en la pantalla principal de chats para todos los usuarios.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      hash: '0xQ...ADMIN',
      timeMs: 45,
      isAnnouncementAlert: true
    };
    updateSessionMessages([...messages, confirmationMsg]);
    setAnnouncementToast('¡Aviso Importante publicado en inicio!');
    setTimeout(() => setAnnouncementToast(null), 4000);
    offlineAudio.playSent();
  };

  // Save AI Config
  const handleSaveAiConfig = (updated: AiAssistantPrivacyConfig) => {
    setAiConfig(updated);
    saveAiAssistantPrivacyConfig(updated);
  };

  /* ========================================================================= */
  /* VISTA 1: PANTALLA DE INICIO (Arranque con botón en el centro)              */
  /* ========================================================================= */
  if (!hasStarted) {
    return (
      <div className="flex-1 flex flex-col h-full bg-[#050806] select-none overflow-y-auto p-4 md:p-8">
        <div className="max-w-xl mx-auto my-auto w-full text-center space-y-6">
          {/* Central Logo */}
          <div className="relative inline-block mx-auto">
            <div className="w-24 h-24 rounded-3xl bg-emerald-950/80 border-2 border-emerald-500/50 flex items-center justify-center text-emerald-400 glow-green-lg mx-auto">
              <Cpu className="w-12 h-12 animate-pulse" />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-black border border-emerald-500 text-emerald-400 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
              100% LOCAL
            </div>
          </div>

          {/* Title & Tagline */}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Llama Offline <span className="text-emerald-400">Unlimited</span>
            </h1>
            <p className="text-xs md:text-sm text-zinc-400 mt-1 font-mono">
              IA Soberana en Dispositivo • Cero Dependencias de Nube
            </p>
          </div>

          {/* Transparent Privacy & Architecture Explanation Box */}
          <div className="bg-[#0a0f0c] border border-emerald-900/60 rounded-2xl p-4 md:p-5 text-left space-y-3.5 shadow-2xl">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Transparencia y Garantía de Aislamiento Estricto</span>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Esta Inteligencia Artificial corre de forma puramente local en el procesador de este teléfono. Todos los datos, consultas y archivos se guardan exclusivamente en la base de datos interna de tu dispositivo.
            </p>

            <div className="space-y-2 pt-1 border-t border-emerald-950/80 text-[11px] text-zinc-400">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Sin filtraciones:</strong> Ningún dato sale de tu teléfono hacia servidores o empresas externas.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Privacidad en Chats:</strong> La IA <em>no tiene acceso a ningún dato de tus chats</em> a menos que tú decidas activar el Modo Asistente Personal en Ajustes para automatizar atención o tareas.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Herramientas Multimodales:</strong> Micrófono de voz, bocina de síntesis de audio, adjuntar cualquier archivo (+), programar mensajes y reportes.</span>
              </div>
            </div>
          </div>

          {/* Central Start Button */}
          <div className="pt-2">
            <button
              onClick={() => {
                setHasStarted(true);
                localStorage.setItem('chattoj_ai_terminal_started', 'true');
                offlineAudio.playSent();
              }}
              className="w-full py-3.5 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm tracking-wide transition-all shadow-lg shadow-emerald-950/80 glow-green-md flex items-center justify-center gap-2 cursor-pointer group"
            >
              <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              Iniciar Asistente IA
            </button>
            <span className="text-[11px] text-zinc-500 font-mono mt-2 block">
              Toca para acceder al panel interactivo de inferencia local
            </span>
          </div>
        </div>
      </div>
    );
  }

  /* ========================================================================= */
  /* VISTA 2: PANEL INTERACTIVO DE LA IA (Terminal de Chat, Voz y Herramientas) */
  /* ========================================================================= */
  return (
    <div className="flex-1 flex flex-col h-full bg-[#050806] select-none overflow-hidden relative">
      {/* Toast Notification */}
      {announcementToast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-black font-bold px-4 py-2 rounded-xl text-xs shadow-2xl flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4" /> {announcementToast}
        </div>
      )}

      {/* TOP HEADER */}
      <div className="h-14 px-3 md:px-4 bg-[#0a0f0c] border-b border-emerald-950 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-xs md:text-sm font-bold text-white tracking-tight truncate max-w-[140px] md:max-w-none">
                {currentSession.title}
              </h2>
              <span className="text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-700/60 px-1.5 py-0.2 rounded font-mono">
                100% LOCAL
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 font-mono">
              Inferencia en CPU del dispositivo
            </p>
          </div>
        </div>

        {/* Top Actions: Voice Mute, History, Schedule, Config, Announce */}
        <div className="flex items-center gap-1">
          {/* Mute/Unmute Voice Speaker Icon */}
          <button
            onClick={toggleVoiceMute}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              isVoiceMuted
                ? 'bg-red-950/40 text-red-400 border-red-900/60'
                : 'bg-[#070b08] text-emerald-400 border-emerald-900/60 hover:bg-emerald-950/60'
            }`}
            title={isVoiceMuted ? 'Voz de la IA silenciada (Toca para activar)' : 'Voz de la IA activa (Toca para silenciar)'}
          >
            {isVoiceMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* History Button */}
          <button
            onClick={() => setShowHistoryModal(true)}
            className="p-2 rounded-xl bg-[#070b08] text-zinc-400 hover:text-white border border-emerald-900/60 hover:bg-emerald-950/60 transition-colors cursor-pointer"
            title="Historial de Chats de la IA"
          >
            <History className="w-4 h-4" />
          </button>

          {/* Schedule Tasks Button */}
          <button
            onClick={() => setShowScheduleModal(true)}
            className="p-2 rounded-xl bg-[#070b08] text-zinc-400 hover:text-white border border-emerald-900/60 hover:bg-emerald-950/60 transition-colors cursor-pointer relative"
            title="Programar Mensajes / Tareas IA"
          >
            <Clock className="w-4 h-4" />
            {scheduledTasks.filter(t => t.status === 'pending').length > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full" />
            )}
          </button>

          {/* Admin Parameters Config */}
          <button
            onClick={() => setShowAdminConfigModal(true)}
            className="p-2 rounded-xl bg-[#070b08] text-zinc-400 hover:text-white border border-emerald-900/60 hover:bg-emerald-950/60 transition-colors cursor-pointer"
            title="Ajustes Admin de la IA"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Swarm Server & Steganography Web Hosting Button */}
          <button
            onClick={() => setShowServerManagerModal(true)}
            className="p-2 rounded-xl bg-[#070b08] text-emerald-400 hover:text-white border border-emerald-900/60 hover:bg-emerald-950/60 transition-colors cursor-pointer"
            title="Servidor Enjambre (10,000,000 GB) & Web Hosting (.jpg produplicuantistomica+)"
          >
            <Server className="w-4 h-4" />
          </button>

          {/* Megaphone Announcement */}
          <button
            onClick={() => setShowAnnouncementModal(true)}
            className="p-2 rounded-xl bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 hover:bg-emerald-900 transition-colors cursor-pointer"
            title="Publicar Aviso Importante en Inicio"
          >
            <Megaphone className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* CHAT MESSAGES STREAM */}
      <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3.5">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[88%] md:max-w-[75%] rounded-2xl p-3.5 text-xs md:text-sm leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-emerald-700 text-white rounded-tr-xs shadow-md'
                  : m.isAnnouncementAlert
                  ? 'bg-amber-950/80 border border-amber-500/70 text-amber-200 rounded-tl-xs shadow-lg'
                  : 'bg-[#0d1410] border border-emerald-900/60 text-zinc-200 rounded-tl-xs shadow-sm'
              }`}
            >
              {/* Attachment Preview in Message */}
              {m.attachment && (
                <div className="mb-2 p-2 rounded-xl bg-black/40 border border-emerald-500/30 flex items-center gap-2">
                  {m.attachment.url ? (
                    <img
                      src={m.attachment.url}
                      alt={m.attachment.name}
                      className="w-12 h-12 object-cover rounded-lg"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-emerald-950 flex items-center justify-center text-emerald-400">
                      <FileText className="w-4 h-4" />
                    </div>
                  )}
                  <div className="overflow-hidden">
                    <span className="font-semibold block truncate text-[11px] text-white">
                      {m.attachment.name}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {m.attachment.size}
                    </span>
                  </div>
                </div>
              )}

              {/* Text Body */}
              <div className="whitespace-pre-wrap">{m.text}</div>

              {/* Metadata & Local Time */}
              <div className="flex items-center justify-between gap-3 mt-2 pt-1 border-t border-white/10 text-[10px] text-zinc-400 font-mono">
                <span>{m.timestamp}</span>
                {m.timeMs !== undefined && (
                  <span className="text-emerald-400/80">
                    ⚡ {m.timeMs}ms • {m.hash}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono bg-[#0d1410] border border-emerald-900/60 px-3 py-2 rounded-xl w-fit">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            Inferencia neuronal local en progreso...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ATTACHED FILE PREVIEW CHIP (Before Sending) */}
      {attachedFile && (
        <div className="px-3 py-2 bg-[#0c130f] border-t border-emerald-950 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 truncate">
            {attachedFile.previewUrl ? (
              <img src={attachedFile.previewUrl} alt="Preview" className="w-6 h-6 object-cover rounded" />
            ) : (
              <FileText className="w-4 h-4 text-emerald-400" />
            )}
            <span className="text-white font-medium truncate">{attachedFile.name}</span>
            <span className="text-zinc-400 font-mono text-[10px]">({attachedFile.size})</span>
          </div>
          <button
            onClick={() => setAttachedFile(null)}
            className="p-1 text-zinc-400 hover:text-red-400 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* INPUT FORM WITH SPEECH AND ATTACHMENT */}
      <div className="p-2.5 md:p-3 bg-[#0a0f0c] border-t border-emerald-950 shrink-0">
        <form onSubmit={handleSubmit} className="flex items-center gap-1.5">
          {/* Hidden File Input for All file types: jpg, png, pdf, zip, txt, doc, etc. */}
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,audio/*,.pdf,.zip,.rar,.txt,.doc,.docx,.xls,.xlsx,.json,.csv"
          />

          {/* Plus / Attachment Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-xl bg-[#070b08] text-emerald-400 hover:text-emerald-300 border border-emerald-900/60 hover:bg-emerald-950/60 transition-colors cursor-pointer shrink-0"
            title="Adjuntar imágenes, audio, PDF, ZIP, TXT o cualquier archivo"
          >
            <Plus className="w-4 h-4" />
          </button>

          {/* Speech to text Mic button */}
          <button
            type="button"
            onClick={handleToggleMic}
            className={`p-2.5 rounded-xl border transition-colors cursor-pointer shrink-0 ${
              isListening
                ? 'bg-red-600 text-white border-red-500 animate-pulse'
                : 'bg-[#070b08] text-emerald-400 hover:text-emerald-300 border-emerald-900/60 hover:bg-emerald-950/60'
            }`}
            title={isListening ? 'Escuchando... Toca para detener' : 'Dictar por voz (Micrófono)'}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isListening
                ? 'Escuchando tu voz...'
                : attachedFile
                ? 'Pregunta o pide instrucciones sobre el archivo adjunto...'
                : 'Escribe a tu IA local (o comandos: comunicado: ..., quejas, soporte)...'
            }
            className="flex-1 bg-[#070b08] border border-emerald-900/80 rounded-xl px-3 py-2 text-xs md:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={(!input.trim() && !attachedFile) || loading}
            className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-black font-bold transition-all glow-green-sm cursor-pointer shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* ===================================================================== */}
      {/* MODAL: HISTORIAL DE CHATS DE LA IA                                    */}
      {/* ===================================================================== */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-[#0c120e] border border-emerald-900/80 rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-3.5 bg-[#080d0a] border-b border-emerald-950 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Historial de Conversaciones IA</h3>
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="p-1 text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-[#090e0b] border-b border-emerald-950">
              <button
                onClick={handleCreateNewSession}
                className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-black font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                <Plus className="w-4 h-4" /> Nueva Conversación
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {sessions.map((sess) => (
                <div
                  key={sess.id}
                  onClick={() => {
                    setActiveSessionId(sess.id);
                    setShowHistoryModal(false);
                  }}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                    sess.id === activeSessionId
                      ? 'bg-emerald-950/60 border-emerald-600 text-white'
                      : 'bg-[#080d0a] border-emerald-950 text-zinc-300 hover:bg-emerald-950/30'
                  }`}
                >
                  <div className="overflow-hidden pr-2">
                    <span className="font-semibold text-xs block truncate">{sess.title}</span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {sess.messages.length} mensajes • {new Date(sess.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <button
                    onClick={(e) => handleDeleteSession(sess.id, e)}
                    className="p-1.5 text-zinc-500 hover:text-red-400 rounded-lg"
                    title="Eliminar sesión"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: PROGRAMADOR DE TAREAS Y AUTOMATIZACIONES CON IA               */}
      {/* ===================================================================== */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-[#0c120e] border border-emerald-900/80 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-3.5 bg-[#080d0a] border-b border-emerald-950 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Programar Tareas y Automatizaciones</h3>
              </div>
              <button onClick={() => setShowScheduleModal(false)} className="p-1 text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Privacy Warning banner */}
              <div className="p-3 rounded-xl bg-[#080d0a] border border-amber-900/60 text-xs text-amber-200/90 leading-relaxed">
                ⚡ <strong>Automatización Local:</strong> Puedes programar a la IA para enviar mensajes a cierta hora, generar reportes automáticos o atender usuarios sin comprometer datos.
              </div>

              {/* Form to schedule a task */}
              <form onSubmit={handleCreateScheduledTask} className="space-y-3 bg-[#080d0a] p-3.5 rounded-xl border border-emerald-950">
                <h4 className="text-xs font-bold text-white">Nueva Tarea Programada</h4>
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">Título de la Tarea:</label>
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Ej. Enviar reporte nocturno / Mensaje de buenos días"
                    className="w-full bg-[#050806] border border-emerald-900 rounded-lg p-2 text-xs text-white"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">Hora programada:</label>
                    <input
                      type="time"
                      value={newTaskTime}
                      onChange={(e) => setNewTaskTime(e.target.value)}
                      className="w-full bg-[#050806] border border-emerald-900 rounded-lg p-2 text-xs text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">Tipo de Tarea:</label>
                    <select
                      value={newTaskType}
                      onChange={(e) => setNewTaskType(e.target.value as any)}
                      className="w-full bg-[#050806] border border-emerald-900 rounded-lg p-2 text-xs text-white"
                    >
                      <option value="message">Mandar Mensaje</option>
                      <option value="report">Subir Reporte</option>
                      <option value="customer_support">Atención a Clientes</option>
                      <option value="automation">Proceso Automatizado</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">Destinatario / Canal:</label>
                  <input
                    type="text"
                    value={newTaskTarget}
                    onChange={(e) => setNewTaskTarget(e.target.value)}
                    placeholder="Contacto, Foro Activista o Registro Local"
                    className="w-full bg-[#050806] border border-emerald-900 rounded-lg p-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">Contenido o Instrucción para la IA:</label>
                  <textarea
                    rows={2}
                    value={newTaskPrompt}
                    onChange={(e) => setNewTaskPrompt(e.target.value)}
                    placeholder="Texto a enviar o instrucción exacta de generación..."
                    className="w-full bg-[#050806] border border-emerald-900 rounded-lg p-2 text-xs text-white resize-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-black font-bold text-xs transition-all cursor-pointer"
                >
                  Guardar Tarea Programada
                </button>
              </form>

              {/* Existing Tasks */}
              <div>
                <h4 className="text-xs font-bold text-white mb-2">Tareas Programadas Activas ({scheduledTasks.length})</h4>
                {scheduledTasks.length === 0 ? (
                  <p className="text-xs text-zinc-500">No hay tareas programadas actualmente.</p>
                ) : (
                  <div className="space-y-2">
                    {scheduledTasks.map(t => (
                      <div key={t.id} className="p-2.5 rounded-xl bg-[#080d0a] border border-emerald-950 flex items-center justify-between text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white">{t.title}</span>
                            <span className="text-[10px] bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded font-mono">
                              ⏰ {t.scheduledTime}
                            </span>
                          </div>
                          <p className="text-zinc-400 text-[11px] mt-0.5">{t.promptOrText}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleToggleTaskStatus(t.id)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-mono cursor-pointer ${
                              t.status === 'completed'
                                ? 'bg-zinc-800 text-zinc-400'
                                : 'bg-emerald-600 text-black font-bold'
                            }`}
                          >
                            {t.status === 'completed' ? 'Completada' : 'Pendiente'}
                          </button>
                          <button
                            onClick={() => handleDeleteTask(t.id)}
                            className="p-1 text-zinc-500 hover:text-red-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: CONFIGURACIÓN ADMIN DE PARÁMETROS DE LA IA                     */}
      {/* ===================================================================== */}
      {showAdminConfigModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-[#0c120e] border border-emerald-900/80 rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-3.5 bg-[#080d0a] border-b border-emerald-950 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Parámetros del Modelo Local</h3>
              </div>
              <button onClick={() => setShowAdminConfigModal(false)} className="p-1 text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              {/* Strict Isolation Mode Toggle */}
              <div className="p-3 rounded-xl bg-[#080d0a] border border-emerald-950 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-white">Aislamiento Estricto de Datos</h4>
                  <p className="text-[11px] text-zinc-400">Impide que la IA se nutra o acceda a chats no autorizados</p>
                </div>
                <input
                  type="checkbox"
                  checked={aiConfig.strictDataIsolation}
                  onChange={(e) => handleSaveAiConfig({ ...aiConfig, strictDataIsolation: e.target.checked })}
                  className="w-5 h-5 accent-emerald-500 cursor-pointer"
                />
              </div>

              {/* Personal Assistant in Chats Toggle */}
              <div className="p-3 rounded-xl bg-[#080d0a] border border-emerald-950 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-white">Modo Asistente Personal en Chats</h4>
                  <p className="text-[11px] text-zinc-400">Permite a la IA automatizar respuestas y redactar a tus clientes</p>
                </div>
                <input
                  type="checkbox"
                  checked={aiConfig.allowChatAccess}
                  onChange={(e) => handleSaveAiConfig({ ...aiConfig, allowChatAccess: e.target.checked })}
                  className="w-5 h-5 accent-emerald-500 cursor-pointer"
                />
              </div>

              {/* Auto Reply Mode */}
              <div className="p-3 rounded-xl bg-[#080d0a] border border-emerald-950 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-white">Auto-Respuesta a Usuarios</h4>
                  <p className="text-[11px] text-zinc-400">Atención automatizada cuando te encuentres ausente</p>
                </div>
                <input
                  type="checkbox"
                  checked={aiConfig.allowAutoReply}
                  onChange={(e) => handleSaveAiConfig({ ...aiConfig, allowAutoReply: e.target.checked })}
                  className="w-5 h-5 accent-emerald-500 cursor-pointer"
                />
              </div>

              {/* Temperature Slider */}
              <div className="p-3 rounded-xl bg-[#080d0a] border border-emerald-950 space-y-2">
                <div className="flex justify-between">
                  <span className="font-semibold text-white">Temperatura de Inferencia:</span>
                  <span className="font-mono text-emerald-400">{aiConfig.localModelTemperature}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={aiConfig.localModelTemperature}
                  onChange={(e) => handleSaveAiConfig({ ...aiConfig, localModelTemperature: parseFloat(e.target.value) })}
                  className="w-full accent-emerald-500"
                />
                <div className="flex justify-between text-[10px] text-zinc-500">
                  <span>Más Preciso (0.1)</span>
                  <span>Más Creativo (1.0)</span>
                </div>
              </div>

              {/* Contact Admin */}
              <div className="p-3 rounded-xl bg-[#070b08] border border-emerald-950 text-center space-y-1.5">
                <span className="text-[11px] text-zinc-400 block font-mono">Soporte y Contacto con el Desarrollador:</span>
                <a
                  href={ADMIN_CONTACT_INFO.whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-400 font-bold inline-block hover:underline"
                >
                  WhatsApp: {ADMIN_CONTACT_INFO.whatsappNumber}
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: PUBLICAR AVISO IMPORTANTE (ADMIN)                              */}
      {/* ===================================================================== */}
      {showAnnouncementModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-[#0c120e] border border-emerald-900/80 rounded-2xl w-full max-w-md p-4 space-y-3.5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <Megaphone className="w-4 h-4" />
                <span>Publicar Aviso Importante</span>
              </div>
              <button onClick={() => setShowAnnouncementModal(false)} className="p-1 text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              El comunicado se desplegará en la pantalla principal ("Chats") para todos los usuarios.
            </p>

            <form onSubmit={handlePublishAnnouncementDirect} className="space-y-3">
              <textarea
                rows={3}
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                placeholder="Escribe el contenido del AVISO IMPORTANTE..."
                className="w-full bg-[#070b08] border border-emerald-900 rounded-xl p-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 resize-none"
                required
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAnnouncementModal(false)}
                  className="px-3 py-1.5 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-black font-bold text-xs transition-all glow-green-sm cursor-pointer"
                >
                  Publicar en Inicio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SWARM SERVER & STEGANOGRAPHY WEB HOSTING MODAL */}
      {showServerManagerModal && (
        <AdminServerManager onClose={() => setShowServerManagerModal(false)} />
      )}
    </div>
  );
};
