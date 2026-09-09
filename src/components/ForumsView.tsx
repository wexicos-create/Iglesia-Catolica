import React, { useState, useRef, useEffect } from 'react';
import { ForumTopic, UserProfile, ForumReply, ForumReport } from '../types';
import { ReportModal } from './ReportModal';
import {
  evaluateActivistForumCreation,
  evaluateForumReport,
  checkActivistMessageAgainstGovernmentPropaganda
} from '../utils/llamaEngine';
import {
  isUserBannedFromCreatingForums,
  isUserBannedFromActivistPanel,
  banUserFromActivistPanel,
  ACTIVIST_PRESET_PHOTOS
} from '../utils/activistGovernance';
import {
  blockOrUpdateContact,
  blockForumItem,
  unblockForumItem,
  getBlockedForums,
  getBlockedContacts
} from '../utils/cryptoStorage';
import { offlineAudio } from '../utils/audioAlerts';
import {
  Users,
  ShieldAlert,
  MessageSquare,
  Plus,
  Sparkles,
  Send,
  UserMinus,
  ArrowLeft,
  Settings,
  Flag,
  AlertTriangle,
  Check,
  Upload,
  Lock,
  MessageCircle,
  HelpCircle,
  Ban,
  Scale,
  LogOut,
  Eye,
  Paperclip,
  Image as ImageIcon,
  UserPlus,
  Shield,
  X,
  FileText
} from 'lucide-react';

interface ForumsViewProps {
  topics: ForumTopic[];
  onAddTopic: (topic: ForumTopic) => void;
  onUpdateTopic?: (topic: ForumTopic) => void;
  onDeleteTopic?: (topicId: string) => void;
  currentUser: UserProfile;
  onOpenSettings?: () => void;
}

export const ForumsView: React.FC<ForumsViewProps> = ({
  topics,
  onAddTopic,
  onUpdateTopic,
  onDeleteTopic,
  currentUser,
  onOpenSettings
}) => {
  // Navigation & selection
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'mine' | 'open' | 'closed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showBlockPanelModal, setShowBlockPanelModal] = useState(false);
  const [blockedCreatorIds, setBlockedCreatorIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('chattoj_blocked_forum_creators');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const toggleBlockCreator = (creatorId: string, creatorName: string) => {
    let updated: string[];
    if (blockedCreatorIds.includes(creatorId)) {
      updated = blockedCreatorIds.filter(id => id !== creatorId);
      alert(`Has desbloqueado al creador ${creatorName}. Sus foros volverán a ser visibles.`);
    } else {
      updated = [...blockedCreatorIds, creatorId];
      alert(`Has bloqueado al creador ${creatorName}. Sus foros y publicaciones han sido ocultados.`);
    }
    setBlockedCreatorIds(updated);
    localStorage.setItem('chattoj_blocked_forum_creators', JSON.stringify(updated));
  };
  const [showViewersModal, setShowViewersModal] = useState<ForumReply | null>(null);
  const [topicToReport, setTopicToReport] = useState<ForumTopic | null>(null);
  const [showClosureInfoModal, setShowClosureInfoModal] = useState<ForumTopic | null>(null);
  const [topicToJoinPrompt, setTopicToJoinPrompt] = useState<ForumTopic | null>(null);
  const [topicViewModes, setTopicViewModes] = useState<Record<string, { mode: 'all' | 'from_now'; joinedAt: number }>>(() => {
    const saved = localStorage.getItem('chattoj_forum_view_modes');
    return saved ? JSON.parse(saved) : {};
  });

  // Creation form state
  const [newTitle, setNewTitle] = useState('');
  const [newIdeology, setNewIdeology] = useState('');
  const [newOpposingView, setNewOpposingView] = useState('');
  const [newContent, setNewContent] = useState('');
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string>(ACTIVIST_PRESET_PHOTOS[0].url);
  const [isEvaluatingCreation, setIsEvaluatingCreation] = useState(false);
  const [creationError, setCreationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Chat conversation state
  const [replyText, setReplyText] = useState('');
  const [isOpposingViewMessage, setIsOpposingViewMessage] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [chatWarning, setChatWarning] = useState<string | null>(null);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [attachedFileName, setAttachedFileName] = useState<string | null>(null);
  const chatAttachmentInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Add member state
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberId, setNewMemberId] = useState('');

  // Report state
  const [reportReason, setReportReason] = useState('Propaganda o Contenido de Gobiernos Políticos (Estrictamente Prohibido)');
  const [reportComment, setReportComment] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  // Selected topic resolution
  const selectedTopic = topics.find(t => t.id === selectedTopicId) || null;

  // Blocked list check
  const blockedForumsList = getBlockedForums();
  const isSelectedTopicBlocked = selectedTopic ? blockedForumsList.some(f => f.id === selectedTopic.id) : false;

  // Check panel ban
  const panelBan = isUserBannedFromActivistPanel(currentUser.userId);
  const isBannedFromCreating = isUserBannedFromCreatingForums(currentUser.userId);

  // Auto scroll chat
  useEffect(() => {
    if (selectedTopic && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedTopic?.replies.length, selectedTopicId]);

  // Compute simulated active viewers for realism
  const getActiveViewers = (topic: ForumTopic) => {
    const memberCount = topic.joinedUserIds?.length || topic.participants?.length || 1;
    return Math.max(1, Math.min(memberCount, Math.floor(memberCount * 0.4) + 2));
  };

  // Upload custom photo for new forum
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSelectedPhotoUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Upload attachment inside chat
  const handleChatAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAttachedImage(reader.result);
        setAttachedFileName(file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  // Create activist forum / photo
  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreationError(null);

    if (isBannedFromCreating) {
      setCreationError('Tu cuenta está restringida de crear más foros o fotos debido a clausuras previas por reportes de la comunidad.');
      return;
    }

    if (!newTitle.trim() || !newIdeology.trim() || !newContent.trim()) {
      setCreationError('Por favor completa todos los campos requeridos.');
      return;
    }

    setIsEvaluatingCreation(true);
    try {
      const evaluation = await evaluateActivistForumCreation({
        title: newTitle.trim(),
        content: newContent.trim(),
        ideology: newIdeology.trim(),
        opposingViewpoint: newOpposingView.trim()
      });

      if (!evaluation.isAllowed) {
        setCreationError(evaluation.reason || 'Contenido prohibido por las normas civiles.');
        offlineAudio.playPanicWarning();
        setIsEvaluatingCreation(false);
        return;
      }

      const newTopic: ForumTopic = {
        id: 'activist-' + Date.now(),
        title: newTitle.trim(),
        photoUrl: selectedPhotoUrl,
        ideology: newIdeology.trim(),
        opposingViewpoint: newOpposingView.trim() || 'Espacio abierto para voces disidentes e ideologías contrarias con respeto mutuo.',
        category: 'activist',
        creatorId: currentUser.userId,
        creatorName: currentUser.name,
        creatorAvatar: currentUser.avatar,
        timestamp: 'Justo ahora',
        content: newContent.trim(),
        repliesCount: 0,
        tags: ['Activistas', newIdeology.trim().split(' ')[0] || 'CausaCivil', 'Descentralizado'],
        quantumVerified: true,
        aiSummary: 'Foro civil independiente activo. Prohibida la propaganda de gobiernos políticos. Voces disidentes incluidas.',
        messagesEnabled: true,
        isClosed: false,
        reports: [],
        joinedUserIds: [currentUser.userId],
        bannedUserIds: [],
        activeViewersCount: 3,
        participants: [
          {
            id: currentUser.userId,
            name: currentUser.name,
            avatar: currentUser.avatar,
            role: 'admin'
          }
        ],
        replies: []
      };

      onAddTopic(newTopic);
      setSelectedTopicId(newTopic.id);
      offlineAudio.playSent();

      // Reset form
      setNewTitle('');
      setNewIdeology('');
      setNewOpposingView('');
      setNewContent('');
      setSelectedPhotoUrl(ACTIVIST_PRESET_PHOTOS[0].url);
      setShowCreateModal(false);
    } catch {
      setCreationError('Error al validar con IA local. Intenta de nuevo.');
    } finally {
      setIsEvaluatingCreation(false);
    }
  };

  // Join Forum with Mode selection
  const handleInitiateJoin = (topic: ForumTopic) => {
    if (topic.isClosed) {
      setShowClosureInfoModal(topic);
      return;
    }

    if (topic.bannedUserIds?.includes(currentUser.userId)) {
      alert('🚫 Tienes el acceso restringido a este foro porque fuiste expulsado por el administrador.');
      return;
    }

    setTopicToJoinPrompt(topic);
  };

  const confirmJoinMode = (mode: 'all' | 'from_now') => {
    if (!topicToJoinPrompt) return;
    const topic = topicToJoinPrompt;
    const joinedAt = Date.now();

    const updatedModes = {
      ...topicViewModes,
      [topic.id]: { mode, joinedAt }
    };
    setTopicViewModes(updatedModes);
    localStorage.setItem('chattoj_forum_view_modes', JSON.stringify(updatedModes));

    const currentJoined = topic.joinedUserIds || [];
    if (!currentJoined.includes(currentUser.userId)) {
      const updatedJoined = [...currentJoined, currentUser.userId];
      const updatedParticipants = [
        ...(topic.participants || []),
        { id: currentUser.userId, name: currentUser.name, avatar: currentUser.avatar, role: 'member' as const }
      ];

      const updatedTopic: ForumTopic = {
        ...topic,
        joinedUserIds: updatedJoined,
        participants: updatedParticipants
      };

      if (onUpdateTopic) {
        onUpdateTopic(updatedTopic);
      }
    }

    setSelectedTopicId(topic.id);
    setTopicToJoinPrompt(null);
    offlineAudio.playSent();
  };

  // Direct Join
  const handleJoinForum = (topic: ForumTopic) => {
    handleInitiateJoin(topic);
  };

  // Leave Forum (Salir del Foro)
  const handleLeaveForum = () => {
    if (!selectedTopic) return;

    if (window.confirm('¿Deseas salir de este foro / foto comunitaria?')) {
      const updatedJoined = (selectedTopic.joinedUserIds || []).filter(id => id !== currentUser.userId);
      const updatedParticipants = (selectedTopic.participants || []).filter(p => p.id !== currentUser.userId);

      const updatedTopic: ForumTopic = {
        ...selectedTopic,
        joinedUserIds: updatedJoined,
        participants: updatedParticipants
      };

      if (onUpdateTopic) {
        onUpdateTopic(updatedTopic);
      }

      setSelectedTopicId(null);
      offlineAudio.playHangup();
    }
  };

  // Send Message in Forum Group
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!replyText.trim() && !attachedImage) || !selectedTopic) return;

    if (selectedTopic.isClosed) {
      setChatWarning('⚠️ Este foro ha sido clausurado por la IA tras demandas comunitarias.');
      return;
    }

    if (selectedTopic.bannedUserIds?.includes(currentUser.userId)) {
      setChatWarning('🚫 Has sido expulsado de este foro y se te ha restringido volver a acceder.');
      return;
    }

    const isAdmin = selectedTopic.creatorId === currentUser.userId;
    if (selectedTopic.messagesEnabled === false && !isAdmin) {
      setChatWarning('🔒 El administrador ha configurado este foro para que solo los administradores puedan enviar mensajes.');
      return;
    }

    setIsSendingMessage(true);
    setChatWarning(null);

    // Scan for pro-government propaganda
    const govCheck = checkActivistMessageAgainstGovernmentPropaganda(replyText);
    if (govCheck.isProGovernmentViolation) {
      offlineAudio.playPanicWarning();
      banUserFromActivistPanel(currentUser.userId, govCheck.reason || 'Propaganda a favor de gobiernos políticos detectada.');
      setChatWarning(govCheck.reason || 'Has sido expulsado del panel de activistas por propaganda de gobiernos políticos.');
      setIsSendingMessage(false);
      setSelectedTopicId(null);
      return;
    }

    const newReply: ForumReply = {
      id: 'r-' + Date.now(),
      authorId: currentUser.userId,
      authorName: currentUser.name,
      authorAvatar: currentUser.avatar,
      text: replyText.trim(),
      timestamp: 'Justo ahora',
      isOpposingView: isOpposingViewMessage,
      attachment: attachedImage ? {
        type: 'image',
        url: attachedImage,
        name: attachedFileName || 'foto_adjunta.jpg'
      } : undefined,
      viewedBy: [
        {
          userId: currentUser.userId,
          userName: currentUser.name,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        },
        // Simulate other viewers in forum
        {
          userId: 'usr-sim-1',
          userName: selectedTopic.creatorName || 'Admin Comunitario',
          timestamp: 'Hace 1 min'
        }
      ]
    };

    const updatedReplies = [...selectedTopic.replies, newReply];
    const updatedTopic: ForumTopic = {
      ...selectedTopic,
      replies: updatedReplies,
      repliesCount: updatedReplies.length
    };

    if (onUpdateTopic) {
      onUpdateTopic(updatedTopic);
    }

    setReplyText('');
    setAttachedImage(null);
    setAttachedFileName(null);
    setIsOpposingViewMessage(false);
    offlineAudio.playSent();
    setIsSendingMessage(false);
  };

  // Expel member from forum (Admin)
  const handleExpelMember = (memberId: string) => {
    if (!selectedTopic || selectedTopic.creatorId !== currentUser.userId) return;

    const updatedParticipants = (selectedTopic.participants || []).filter(p => p.id !== memberId);
    const updatedJoined = (selectedTopic.joinedUserIds || []).filter(id => id !== memberId);
    const updatedBanned = Array.from(new Set([...(selectedTopic.bannedUserIds || []), memberId]));

    const updatedTopic: ForumTopic = {
      ...selectedTopic,
      participants: updatedParticipants,
      joinedUserIds: updatedJoined,
      bannedUserIds: updatedBanned
    };

    if (onUpdateTopic) {
      onUpdateTopic(updatedTopic);
    }
    offlineAudio.playHangup();
  };

  // Add Member to Forum (Admin)
  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTopic || !newMemberName.trim()) return;

    const memberId = newMemberId.trim() || 'usr-' + Math.floor(10000000000 + Math.random() * 90000000000);
    const updatedParticipants = [
      ...(selectedTopic.participants || []),
      { id: memberId, name: newMemberName.trim(), role: 'member' as const }
    ];
    const updatedJoined = Array.from(new Set([...(selectedTopic.joinedUserIds || []), memberId]));

    const updatedTopic: ForumTopic = {
      ...selectedTopic,
      participants: updatedParticipants,
      joinedUserIds: updatedJoined
    };

    if (onUpdateTopic) {
      onUpdateTopic(updatedTopic);
    }

    setNewMemberName('');
    setNewMemberId('');
    setShowAddMemberModal(false);
    offlineAudio.playSent();
  };

  // Block Forum (User level)
  const handleBlockThisForum = () => {
    if (!selectedTopic) return;
    if (window.confirm(`¿Deseas bloquear el foro "${selectedTopic.title}"? Podrás desbloquearlo en Ajustes.`)) {
      blockForumItem({
        id: selectedTopic.id,
        title: selectedTopic.title,
        photoUrl: selectedTopic.photoUrl
      });
      setSelectedTopicId(null);
      alert('Foro bloqueado con éxito.');
    }
  };

  // Block Member (User level)
  const handleBlockUserDirect = (userId: string, userName: string) => {
    if (window.confirm(`¿Bloquear a ${userName} de tus foros, llamadas y chats?`)) {
      blockOrUpdateContact({ id: userId, name: userName }, { blockChat: true, blockCalls: true, blockForums: true });
      alert(`${userName} ha sido añadido a tu lista de bloqueados en Ajustes.`);
    }
  };

  // Filter topics
  const filteredTopics = topics.filter(t => {
    // Exclude if user has blocked this forum or this creator
    if (blockedForumsList.some(b => b.id === t.id)) return false;
    if (blockedCreatorIds.includes(t.creatorId)) return false;

    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.ideology.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.content.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filter === 'mine') return t.creatorId === currentUser.userId || t.joinedUserIds?.includes(currentUser.userId);
    if (filter === 'open') return !t.isClosed;
    if (filter === 'closed') return t.isClosed;
    return true;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-[#050806] select-none overflow-hidden relative">
      {/* If banned from panel */}
      {panelBan && (
        <div className="p-4 bg-red-950 border-b border-red-800 text-red-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-400" />
            <span><strong>Acceso Restringido:</strong> Has sido expulsado del panel de activistas. Razón: {panelBan.reason}</span>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* VISTA 1: BANDEJA DE FOROS Y FOTOS ACTIVISTAS                          */}
      {/* ===================================================================== */}
      {!selectedTopic ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Header */}
          <div className="h-14 px-3 md:px-4 bg-[#0a0f0c] border-b border-emerald-950 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs md:text-sm font-bold text-white tracking-tight">
                  Foros Comunitarios
                </h2>
                <p className="text-[10px] text-zinc-400 font-mono">
                  Debates Civiles Descentralizados & Red Soberana
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowBlockPanelModal(true)}
                className="px-2.5 py-1.5 rounded-xl bg-[#070b08] text-amber-400 hover:text-white border border-amber-900/60 hover:bg-amber-950/40 transition-colors text-xs font-medium flex items-center gap-1 cursor-pointer"
                title="Panel de bloqueos de usuarios y foros"
              >
                <Ban className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Bloqueos</span>
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-black font-bold text-xs flex items-center gap-1.5 transition-all glow-green-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Crear Foro
              </button>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="p-2.5 bg-[#080d0a] border-b border-emerald-950 flex flex-col sm:flex-row gap-2 shrink-0">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar foros o ideologías..."
              className="bg-[#050806] border border-emerald-900/80 rounded-xl px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 flex-1"
            />
            <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0">
              {(['all', 'mine', 'open', 'closed'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setFilter(mode)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-mono whitespace-nowrap transition-colors cursor-pointer ${
                    filter === mode
                      ? 'bg-emerald-600 text-black font-bold'
                      : 'bg-emerald-950/60 text-zinc-400 hover:text-white border border-emerald-900/50'
                  }`}
                >
                  {mode === 'all' && 'Todos los Foros'}
                  {mode === 'mine' && 'Mis Foros'}
                  {mode === 'open' && '🟢 Abiertos'}
                  {mode === 'closed' && '🔴 Clausurados'}
                </button>
              ))}
            </div>
          </div>

          {/* GRID OF FORUMS & PHOTOS */}
          <div className="flex-1 overflow-y-auto p-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredTopics.length === 0 ? (
              <div className="col-span-full py-12 text-center text-zinc-500 text-xs">
                No se encontraron foros o fotos registradas con este filtro.
              </div>
            ) : (
              filteredTopics.map((topic) => {
                const isMember = topic.joinedUserIds?.includes(currentUser.userId) || topic.creatorId === currentUser.userId;
                const isExpelled = topic.bannedUserIds?.includes(currentUser.userId);
                const activeViewers = getActiveViewers(topic);

                return (
                  <div
                    key={topic.id}
                    className={`bg-[#0d1410] border rounded-2xl overflow-hidden flex flex-col transition-all group ${
                      topic.isClosed
                        ? 'border-red-900/50 opacity-90'
                        : 'border-emerald-950 hover:border-emerald-700/60 hover:shadow-lg'
                    }`}
                  >
                    {/* PHOTO COVER */}
                    <div className="relative aspect-video w-full overflow-hidden bg-black">
                      <img
                        src={topic.photoUrl}
                        alt={topic.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0d1410] via-transparent to-black/40" />

                      {/* Ideology Badge */}
                      <span className="absolute top-2 left-2 bg-black/75 backdrop-blur-md border border-emerald-500/40 text-emerald-300 text-[10px] font-mono px-2 py-0.5 rounded-lg">
                        {topic.ideology}
                      </span>

                      {/* Status */}
                      <span className="absolute top-2 right-2 text-[9px] font-mono px-2 py-0.5 rounded-lg backdrop-blur-md">
                        {topic.isClosed ? (
                          <span className="bg-red-950/90 text-red-300 border border-red-700 px-2 py-0.5 rounded-lg">
                            🔴 Clausurado
                          </span>
                        ) : (
                          <span className="bg-emerald-950/90 text-emerald-300 border border-emerald-600 px-2 py-0.5 rounded-lg">
                            🟢 En Vivo
                          </span>
                        )}
                      </span>

                      <div className="absolute bottom-2 left-2 right-2">
                        <h3 className="text-white font-bold text-sm line-clamp-1 drop-shadow-md">
                          {topic.title}
                        </h3>
                      </div>
                    </div>

                    {/* CONTENT & METRICS */}
                    <div className="p-3 flex-1 flex flex-col justify-between space-y-2.5">
                      <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                        {topic.content}
                      </p>

                      {/* Opposing View Callout */}
                      <div className="bg-[#070b08] border border-amber-900/40 rounded-xl p-2 text-[11px] text-amber-200/90 space-y-0.5">
                        <div className="flex items-center gap-1 text-amber-400 font-bold text-[10px] uppercase font-mono">
                          <Scale className="w-3 h-3" /> Postura Contraria Garantizada:
                        </div>
                        <p className="text-zinc-300 italic text-[11px] leading-snug">
                          "{topic.opposingViewpoint}"
                        </p>
                      </div>

                      {/* Member & Active Live Viewers Metrics */}
                      <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1.5 border-t border-emerald-950 font-mono">
                        <span className="text-emerald-400/90 truncate">
                          Admin: {topic.creatorName}
                        </span>
                        <div className="flex items-center gap-2.5 shrink-0">
                          <span className="flex items-center gap-1 text-zinc-300">
                            <Users className="w-3 h-3 text-emerald-400" />
                            {topic.joinedUserIds?.length || topic.participants?.length || 1} miembros
                          </span>
                          <span className="flex items-center gap-1 text-emerald-400 font-bold">
                            <Eye className="w-3 h-3 text-emerald-400 animate-pulse" />
                            {activeViewers} viendo
                          </span>
                        </div>
                      </div>

                      {/* ACTION BUTTONS: Unirse / Entrar al Chat */}
                      <div className="flex items-center gap-1.5 pt-1">
                        {topic.isClosed ? (
                          <button
                            onClick={() => setShowClosureInfoModal(topic)}
                            className="flex-1 bg-red-950/60 hover:bg-red-900/80 text-red-200 border border-red-800 text-xs py-1.5 rounded-xl font-medium transition-colors text-center cursor-pointer"
                          >
                            Ver Dictamen de Clausura
                          </button>
                        ) : isExpelled ? (
                          <div className="flex-1 bg-zinc-900 text-red-400 border border-red-900/50 text-[11px] py-1.5 rounded-xl text-center font-mono">
                            🚫 Expulsado
                          </div>
                        ) : isMember ? (
                          <button
                            onClick={() => handleInitiateJoin(topic)}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-black font-bold text-xs py-1.5 rounded-xl transition-all glow-green-sm flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <MessageCircle className="w-3.5 h-3.5" /> Entrar al Foro
                          </button>
                        ) : (
                          <button
                            onClick={() => handleInitiateJoin(topic)}
                            className="flex-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 font-bold text-xs py-1.5 rounded-xl transition-colors flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" /> Unirse al Foro
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        /* ===================================================================== */
        /* VISTA 2: SALA DE CHAT / GRUPO EN VIVO DEL FORO Y FOTOS ACTIVISTAS     */
        /* ===================================================================== */
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Chat Header */}
          <div className="h-14 px-3 md:px-4 bg-[#0a0f0c] border-b border-emerald-950 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setSelectedTopicId(null)}
                className="p-1 -ml-1 text-emerald-400 hover:text-white rounded-lg cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="w-8 h-8 rounded-xl overflow-hidden bg-black shrink-0 border border-emerald-500/40">
                <img src={selectedTopic.photoUrl} alt="" className="w-full h-full object-cover" />
              </div>

              <div>
                <h3 className="text-xs md:text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                  <span className="truncate max-w-[150px] md:max-w-[280px]">{selectedTopic.title}</span>
                  {selectedTopic.creatorId === currentUser.userId && (
                    <span className="text-[9px] bg-emerald-600 text-black px-1.5 py-0.2 rounded font-bold">Admin</span>
                  )}
                </h3>
                <p className="text-[10px] text-zinc-400 font-mono flex items-center gap-2">
                  <span>👥 {selectedTopic.joinedUserIds?.length || 1} miembros</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
                    <Eye className="w-3 h-3" /> {getActiveViewers(selectedTopic)} activos viendo
                  </span>
                </p>
              </div>
            </div>

            {/* Actions in Chat Header */}
            <div className="flex items-center gap-1">
              {/* Admin Menu (if creator) */}
              {selectedTopic.creatorId === currentUser.userId && (
                <button
                  onClick={() => setShowAdminModal(true)}
                  className="p-2 rounded-xl bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 hover:bg-emerald-900 transition-colors cursor-pointer"
                  title="Administrar miembros y reglas del foro"
                >
                  <Settings className="w-4 h-4" />
                </button>
              )}

              {/* Block Forum Action */}
              <button
                onClick={handleBlockThisForum}
                className="p-2 rounded-xl bg-[#070b08] text-zinc-400 hover:text-red-400 border border-emerald-900/60 hover:bg-red-950/40 transition-colors cursor-pointer"
                title="Bloquear este foro"
              >
                <Ban className="w-4 h-4" />
              </button>

              {/* Leave Forum (Salir del Foro) */}
              <button
                onClick={handleLeaveForum}
                className="p-2 rounded-xl bg-[#070b08] text-zinc-400 hover:text-amber-400 border border-emerald-900/60 hover:bg-amber-950/40 transition-colors cursor-pointer"
                title="Salir del Foro"
              >
                <LogOut className="w-4 h-4" />
              </button>

              {/* Report Forum Button */}
              <button
                onClick={() => setShowReportModal(true)}
                className="p-2 rounded-xl bg-[#070b08] text-amber-400 hover:text-white border border-amber-900/60 hover:bg-amber-950/40 transition-colors cursor-pointer"
                title="Reportar este foro a la IA / Administrador"
              >
                <ShieldAlert className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Warning Banner */}
          {chatWarning && (
            <div className="p-2.5 bg-red-950/90 border-b border-red-800 text-red-200 text-xs flex items-center justify-between">
              <span>{chatWarning}</span>
              <button onClick={() => setChatWarning(null)} className="p-1 text-red-400 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Opposing View Header Guarantee */}
          <div className="bg-[#070b08] border-b border-amber-900/40 px-3 py-2 text-[11px] text-amber-200 flex items-center justify-between">
            <span className="font-semibold flex items-center gap-1.5 truncate">
              <Scale className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              Postura Contraria: "{selectedTopic.opposingViewpoint}"
            </span>
          </div>

          {/* REPLIES / MESSAGES STREAM */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {selectedTopic.replies.length === 0 ? (
              <div className="text-center py-12 text-zinc-500 text-xs">
                Aún no hay mensajes en este foro de fotos. ¡Sé el primero en aportar una postura civil o disidente!
              </div>
            ) : (
              selectedTopic.replies.map((reply) => {
                const isMe = reply.authorId === currentUser.userId;
                return (
                  <div
                    key={reply.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                        isMe
                          ? 'bg-emerald-700 text-white rounded-tr-xs shadow-md'
                          : reply.isOpposingView
                          ? 'bg-amber-950/80 border border-amber-500/70 text-amber-100 rounded-tl-xs shadow-md'
                          : 'bg-[#0d1410] border border-emerald-900/60 text-zinc-200 rounded-tl-xs'
                      }`}
                    >
                      {/* Author & Badge */}
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-bold text-[11px] text-emerald-300">
                          {reply.authorName}
                        </span>
                        {reply.isOpposingView && (
                          <span className="text-[9px] bg-amber-500 text-black px-1.5 py-0.2 rounded font-bold">
                            Postura Contraria
                          </span>
                        )}
                      </div>

                      {/* Photo / Attachment */}
                      {reply.attachment && (
                        <div className="my-1.5 rounded-xl overflow-hidden bg-black/40 border border-emerald-500/30">
                          <img
                            src={reply.attachment.url}
                            alt=""
                            className="max-h-52 w-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}

                      {/* Text */}
                      <div className="whitespace-pre-wrap">{reply.text}</div>

                      {/* Timestamp & Seen by button (Quién vio este comentario) */}
                      <div className="flex items-center justify-between gap-2 mt-2 pt-1 border-t border-white/10 text-[10px] text-zinc-300/80 font-mono">
                        <span>{reply.timestamp}</span>
                        <button
                          onClick={() => setShowViewersModal(reply)}
                          className="flex items-center gap-1 text-emerald-300 hover:text-white cursor-pointer"
                          title="Ver quién vio este mensaje"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Visto por {reply.viewedBy?.length || 2}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Attached Image Preview */}
          {attachedImage && (
            <div className="px-3 py-2 bg-[#0c130f] border-t border-emerald-950 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <img src={attachedImage} alt="" className="w-8 h-8 object-cover rounded" />
                <span className="text-white font-medium">{attachedFileName || 'Foto adjunta'}</span>
              </div>
              <button
                onClick={() => {
                  setAttachedImage(null);
                  setAttachedFileName(null);
                }}
                className="p-1 text-zinc-400 hover:text-red-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Opposing View Toggle Bar */}
          <div className="px-3 py-1.5 bg-[#080d0a] border-t border-emerald-950 flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isOpposingViewMessage}
                onChange={(e) => setIsOpposingViewMessage(e.target.checked)}
                className="w-4 h-4 accent-amber-500 rounded"
              />
              <span className="text-[11px] text-amber-300 font-medium flex items-center gap-1">
                <Scale className="w-3 h-3" /> Publicar como Postura Contraria / Disidente
              </span>
            </label>
          </div>

          {/* Message Input */}
          <div className="p-2.5 bg-[#0a0f0c] border-t border-emerald-950 shrink-0">
            <form onSubmit={handleSendMessage} className="flex items-center gap-1.5">
              <input
                ref={chatAttachmentInputRef}
                type="file"
                accept="image/*"
                onChange={handleChatAttachment}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => chatAttachmentInputRef.current?.click()}
                className="p-2.5 rounded-xl bg-[#070b08] text-emerald-400 hover:text-emerald-300 border border-emerald-900/60 hover:bg-emerald-950/60 transition-colors cursor-pointer shrink-0"
                title="Adjuntar foto al chat"
              >
                <ImageIcon className="w-4 h-4" />
              </button>

              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Escribe en este foro (Prohibida propaganda de gobiernos)..."
                className="flex-1 bg-[#070b08] border border-emerald-900/80 rounded-xl px-3 py-2 text-xs md:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              />

              <button
                type="submit"
                disabled={(!replyText.trim() && !attachedImage) || isSendingMessage}
                className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-black font-bold transition-all glow-green-sm cursor-pointer shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: VER QUIÉN VIO CADA MENSAJE (Leído por)                         */}
      {/* ===================================================================== */}
      {showViewersModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-[#0c120e] border border-emerald-900/80 rounded-2xl w-full max-w-sm p-4 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between border-b border-emerald-950 pb-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <Eye className="w-4 h-4" />
                <span>Visto por Miembros</span>
              </div>
              <button onClick={() => setShowViewersModal(null)} className="p-1 text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {(showViewersModal.viewedBy || []).map((v, i) => (
                <div key={i} className="p-2 rounded-xl bg-[#080d0a] border border-emerald-950 flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">{v.userName}</span>
                  <span className="text-zinc-400 font-mono text-[10px]">{v.timestamp}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: CREAR NUEVO FORO COMUNITARIO                                   */}
      {/* ===================================================================== */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-[#0c120e] border border-emerald-900/80 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-3.5 bg-[#080d0a] border-b border-emerald-950 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Crear Nuevo Foro Comunitario</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="p-1 text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTopic} className="flex-1 overflow-y-auto p-4 space-y-3.5">
              {creationError && (
                <div className="p-3 rounded-xl bg-red-950 border border-red-800 text-red-200 text-xs">
                  {creationError}
                </div>
              )}

              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">Título del Foro:</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ej. Red de Defensa Civil y Soberanía Tecnológica"
                  className="w-full bg-[#050806] border border-emerald-900 rounded-xl p-2.5 text-xs text-white"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">Ideología o Causa que Representa:</label>
                <input
                  type="text"
                  value={newIdeology}
                  onChange={(e) => setNewIdeology(e.target.value)}
                  placeholder="Ej. Descentralización, Privacidad Ciudadana, Ecologismo"
                  className="w-full bg-[#050806] border border-emerald-900 rounded-xl p-2.5 text-xs text-white"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">Espacio para Postura Contraria / Disidente:</label>
                <input
                  type="text"
                  value={newOpposingView}
                  onChange={(e) => setNewOpposingView(e.target.value)}
                  placeholder="Ej. Espacio para posturas centralistas o de libre mercado"
                  className="w-full bg-[#050806] border border-emerald-900 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">Descripción del Debate / Foro:</label>
                <textarea
                  rows={3}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Planteamiento de la causa y debate ciudadano..."
                  className="w-full bg-[#050806] border border-emerald-900 rounded-xl p-2.5 text-xs text-white resize-none"
                  required
                />
              </div>

              {/* Photo Selector */}
              <div>
                <label className="text-[11px] text-zinc-400 block mb-1.5">Foto de Perfil / Portada del Foro:</label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {ACTIVIST_PRESET_PHOTOS.map((p, i) => (
                    <div
                      key={i}
                      onClick={() => setSelectedPhotoUrl(p.url)}
                      className={`relative aspect-video rounded-lg overflow-hidden cursor-pointer border-2 ${
                        selectedPhotoUrl === p.url ? 'border-emerald-500 scale-95' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={p.url} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>

                <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2 rounded-xl bg-[#080d0a] hover:bg-emerald-950/40 text-emerald-400 border border-emerald-900 text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" /> Subir Foto Personalizada
                </button>
              </div>

              <button
                type="submit"
                disabled={isEvaluatingCreation}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-black font-bold text-xs transition-all glow-green-sm cursor-pointer flex items-center justify-center gap-2"
              >
                {isEvaluatingCreation ? 'Validando con IA local...' : 'Crear y Publicar Foro'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: ADMINISTRACIÓN DEL FORO (Admin Creator Only)                   */}
      {/* ===================================================================== */}
      {showAdminModal && selectedTopic && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-[#0c120e] border border-emerald-900/80 rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-3.5 bg-[#080d0a] border-b border-emerald-950 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Administración del Foro</h3>
              </div>
              <button onClick={() => setShowAdminModal(false)} className="p-1 text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              {/* Toggle Messages */}
              <div className="p-3 rounded-xl bg-[#080d0a] border border-emerald-950 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-white">Solo Administradores Envían Mensajes</h4>
                  <p className="text-[11px] text-zinc-400">Si está activo, los miembros solo pueden leer</p>
                </div>
                <input
                  type="checkbox"
                  checked={selectedTopic.messagesEnabled === false}
                  onChange={() => {
                    const updated = { ...selectedTopic, messagesEnabled: !selectedTopic.messagesEnabled };
                    if (onUpdateTopic) onUpdateTopic(updated);
                  }}
                  className="w-5 h-5 accent-emerald-500 cursor-pointer"
                />
              </div>

              {/* Add Member Button */}
              <button
                onClick={() => setShowAddMemberModal(true)}
                className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-black font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" /> Agregar / Invitar Miembro
              </button>

              {/* Participants List */}
              <div>
                <h4 className="font-semibold text-white mb-2">Miembros del Foro ({selectedTopic.participants?.length || 1})</h4>
                <div className="space-y-2">
                  {(selectedTopic.participants || []).map((p) => (
                    <div key={p.id} className="p-2.5 rounded-xl bg-[#080d0a] border border-emerald-950 flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-white block">{p.name}</span>
                        <span className="text-[10px] text-zinc-400 font-mono">{p.role === 'admin' ? '👑 Creador' : 'Miembro'}</span>
                      </div>
                      {p.id !== currentUser.userId && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleExpelMember(p.id)}
                            className="px-2 py-1 bg-red-950 text-red-300 hover:bg-red-900 rounded-lg text-[10px] font-mono cursor-pointer"
                          >
                            Expulsar
                          </button>
                          <button
                            onClick={() => handleBlockUserDirect(p.id, p.name)}
                            className="p-1 bg-[#050806] text-zinc-400 hover:text-red-400 rounded-lg"
                            title="Bloquear usuario"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: AGREGAR MIEMBRO DIRECTO (Admin)                                */}
      {/* ===================================================================== */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-[#0c120e] border border-emerald-900/80 rounded-2xl w-full max-w-sm p-4 space-y-3.5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Agregar Miembro al Foro</h3>
              <button onClick={() => setShowAddMemberModal(false)} className="p-1 text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddMember} className="space-y-3">
              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">Nombre o Alias:</label>
                <input
                  type="text"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="Ej. Activista Ciudadano"
                  className="w-full bg-[#050806] border border-emerald-900 rounded-lg p-2 text-xs text-white"
                  required
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddMemberModal(false)}
                  className="px-3 py-1.5 rounded-xl bg-zinc-900 text-zinc-400 text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 text-black font-bold text-xs"
                >
                  Agregar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: PREFERENCIA DE INGRESO AL FORO (DESDE INICIO O DESDE AHORA)     */}
      {/* ===================================================================== */}
      {topicToJoinPrompt && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-[#0c120e] border border-emerald-800 rounded-2xl w-full max-w-sm p-4 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-emerald-950 pb-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Unirse al Foro</h3>
              </div>
              <button onClick={() => setTopicToJoinPrompt(null)} className="p-1 text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-3 p-2 rounded-xl bg-[#080d0a] border border-emerald-950">
              <img src={topicToJoinPrompt.photoUrl} alt="" className="w-12 h-12 object-cover rounded-lg" />
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-white truncate">{topicToJoinPrompt.title}</h4>
                <p className="text-[10px] text-zinc-400 font-mono">{topicToJoinPrompt.ideology}</p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <p className="text-zinc-300 font-medium">¿Cómo prefieres visualizar los mensajes de este foro?</p>

              <button
                onClick={() => confirmJoinMode('all')}
                className="w-full p-3 rounded-xl bg-[#080d0a] hover:bg-emerald-950/60 border border-emerald-800/80 text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2 font-bold text-white group-hover:text-emerald-400">
                  <span>📜 Ver desde el inicio</span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-1">
                  Accede al historial completo de publicaciones, fotos y comentarios previos.
                </p>
              </button>

              <button
                onClick={() => confirmJoinMode('from_now')}
                className="w-full p-3 rounded-xl bg-[#080d0a] hover:bg-emerald-950/60 border border-emerald-800/80 text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2 font-bold text-emerald-400 group-hover:text-emerald-300">
                  <span>⚡ Ver desde este momento</span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-1">
                  Empieza a ver únicamente los nuevos mensajes y fotos que se publiquen a partir de ahora.
                </p>
              </button>
            </div>

            <button
              onClick={() => setTopicToJoinPrompt(null)}
              className="w-full py-2 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white text-xs font-mono"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
      {showBlockPanelModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-[#0c120e] border border-amber-900/80 rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-3.5 bg-[#080d0a] border-b border-amber-950 flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <Ban className="w-4 h-4" />
                <span>Panel de Bloqueos & Restricciones</span>
              </div>
              <button onClick={() => setShowBlockPanelModal(false)} className="p-1 text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-900/60 text-amber-200">
                <p className="font-semibold mb-1">🛡️ Control Total de Tu Red de Foros y Fotos</p>
                <p className="text-[11px] text-zinc-300">
                  Aquí puedes bloquear o desbloquear creadores, restringir ver foros de ciertos usuarios, y gestionar fotos bloqueadas.
                </p>
              </div>

              {/* Blocked Creators / Users */}
              <div className="space-y-2">
                <h4 className="font-bold text-white uppercase font-mono text-[11px]">Creadores y Usuarios Bloqueados ({blockedCreatorIds.length})</h4>
                {blockedCreatorIds.length === 0 ? (
                  <p className="text-[11px] text-zinc-500 italic p-2 bg-[#080d0a] rounded-xl border border-emerald-950">
                    No has bloqueado a ningún creador de foros o fotos.
                  </p>
                ) : (
                  blockedCreatorIds.map(id => {
                    const sampleTopic = topics.find(t => t.creatorId === id);
                    const name = sampleTopic ? sampleTopic.creatorName : `Usuario ID: ${id}`;
                    return (
                      <div key={id} className="p-2.5 rounded-xl bg-[#080d0a] border border-red-950 flex items-center justify-between">
                        <span className="font-semibold text-white">{name}</span>
                        <button
                          onClick={() => toggleBlockCreator(id, name)}
                          className="px-2.5 py-1 bg-emerald-950 text-emerald-300 hover:bg-emerald-900 rounded-lg text-[10px] font-mono cursor-pointer border border-emerald-800"
                        >
                          Desbloquear Creador
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Blocked Forums Items */}
              <div className="space-y-2">
                <h4 className="font-bold text-white uppercase font-mono text-[11px]">Foros y Fotos Ocultos ({blockedForumsList.length})</h4>
                {blockedForumsList.length === 0 ? (
                  <p className="text-[11px] text-zinc-500 italic p-2 bg-[#080d0a] rounded-xl border border-emerald-950">
                    No hay foros o fotos bloqueados individualmente.
                  </p>
                ) : (
                  blockedForumsList.map(f => (
                    <div key={f.id} className="p-2.5 rounded-xl bg-[#080d0a] border border-emerald-950 flex items-center justify-between">
                      <span className="font-semibold text-white truncate max-w-[200px]">{f.title}</span>
                      <button
                        onClick={() => {
                          unblockForumItem(f.id);
                          setBlockedCreatorIds([...blockedCreatorIds]);
                        }}
                        className="px-2.5 py-1 bg-emerald-950 text-emerald-300 hover:bg-emerald-900 rounded-lg text-[10px] font-mono cursor-pointer border border-emerald-800"
                      >
                        Desbloquear Foro
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="p-3 bg-[#080d0a] border-t border-amber-950 text-right">
              <button
                onClick={() => setShowBlockPanelModal(false)}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-black font-bold text-xs cursor-pointer"
              >
                Cerrar Panel
              </button>
            </div>
          </div>
        </div>
      )}

      {showReportModal && selectedTopic && (
        <ReportModal
          targetId={selectedTopic.id}
          targetName={selectedTopic.title}
          source="forum"
          currentUserId={currentUser.userId}
          currentUserName={currentUser.name}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
};
