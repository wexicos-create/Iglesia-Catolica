import React, { useState, useEffect } from 'react';
import { Chat, UserProfile } from '../types';
import { Plus, Settings, Users, MessageSquare, Lock, Flame, Search, AlertTriangle, Check, Megaphone } from 'lucide-react';
import { ContactsScreen } from './ContactsScreen';
import { PanicModal } from './PanicModal';
import { getActiveAnnouncement, dismissAnnouncement, SystemAnnouncement } from '../utils/announcements';

interface ChatListViewProps {
  chats: Chat[];
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
  currentUser: UserProfile;
  onCreateNewChat: (name: string, isGroup: boolean, contactId?: string) => void;
  onOpenSettings?: () => void;
  onPanicWipe?: () => void;
}

export const ChatListView: React.FC<ChatListViewProps> = ({
  chats,
  selectedChatId,
  onSelectChat,
  currentUser,
  onCreateNewChat,
  onOpenSettings,
  onPanicWipe
}) => {
  const [showContactsScreen, setShowContactsScreen] = useState(false);
  const [showPanicModal, setShowPanicModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeAnnouncement, setActiveAnnouncement] = useState<SystemAnnouncement | null>(() => getActiveAnnouncement());

  // Listen for announcement updates (e.g. when published via IA Terminal or dismissed)
  useEffect(() => {
    const handleUpdate = () => {
      setActiveAnnouncement(getActiveAnnouncement());
    };
    window.addEventListener('chattoj-announcement-updated', handleUpdate);
    return () => window.removeEventListener('chattoj-announcement-updated', handleUpdate);
  }, []);

  const handleDismissAnnouncement = (id: string) => {
    dismissAnnouncement(id);
    setActiveAnnouncement(null);
  };

  const filteredChats = chats.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.lastMessage && c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // If user tapped +, show the Contacts Screen strictly formatted according to user screenshot
  if (showContactsScreen) {
    return (
      <ContactsScreen
        currentUser={currentUser}
        chats={chats}
        onBack={() => setShowContactsScreen(false)}
        onSelectContact={(name, isGroup, contactId) => {
          onCreateNewChat(name, isGroup, contactId);
          setShowContactsScreen(false);
        }}
      />
    );
  }

  return (
    <div className="w-full flex-1 flex flex-col h-full bg-[#070b08] overflow-hidden select-none relative">
      {/* Top Mobile Header: Distinct Chattoj Logo on Left, Flame (Panic), + and Settings on Right */}
      <div className="h-14 px-3.5 bg-[#0d1410] border-b border-emerald-950/80 flex items-center justify-between shrink-0 z-10 shadow-sm">
        {/* Left: Distinct Chattoj Logo and Name with White Contour on OJ */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-950 to-[#09110b] border border-emerald-500/50 flex items-center justify-center shadow-md relative shrink-0">
            <svg
              className="w-5 h-5 text-emerald-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              <circle cx="12" cy="11.5" r="2.5" fill="#10b981" stroke="#ffffff" strokeWidth="0.8" />
            </svg>
          </div>

          <div className="flex flex-col">
            <div className="flex items-baseline">
              <span className="text-lg font-black tracking-tight text-white leading-none">
                CHATT
                <span
                  className="text-[#10b981] font-black"
                  style={{
                    WebkitTextStroke: '0.6px #ffffff',
                    textShadow: '0 0 1px #ffffff, 0 0 2px rgba(255,255,255,0.7)'
                  }}
                >
                  OJ
                </span>
              </span>
            </div>
            <span className="text-[9px] font-mono text-emerald-400 flex items-center gap-1 leading-none mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> 100% Offline
            </span>
          </div>
        </div>

        {/* Right: Flame Panic Button next to + Button & Settings */}
        <div className="flex items-center gap-1.5">
          {/* Flame Panic Button */}
          <button
            onClick={() => setShowPanicModal(true)}
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-amber-200 border border-red-500/50 flex items-center justify-center transition-all shadow-md shadow-red-950/80 cursor-pointer active:scale-95"
            title="Botón de Pánico (Flama: Borra todo el celular)"
          >
            <Flame className="w-5 h-5 fill-amber-300 text-amber-300 animate-pulse" />
          </button>

          {/* + Button */}
          <button
            onClick={() => setShowContactsScreen(true)}
            className="w-9 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-black flex items-center justify-center transition-all shadow-md shadow-emerald-950 cursor-pointer active:scale-95"
            title="Seleccionar contacto / Nuevo"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </button>

          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="w-9 h-9 rounded-xl bg-[#090f0b] hover:bg-emerald-950/70 text-emerald-400 border border-emerald-900/60 flex items-center justify-center transition-colors active:scale-95"
              title="Ajustes"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* WhatsApp style Search Bar */}
      {chats.length > 0 && (
        <div className="px-3 py-2 bg-[#0a0f0b] border-b border-emerald-950/50 shrink-0">
          <div className="relative flex items-center bg-[#070b08] border border-emerald-900/60 rounded-xl px-2.5 py-1.5 focus-within:border-emerald-500/80">
            <Search className="w-3.5 h-3.5 text-zinc-400 mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Buscar o empezar un chat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs text-white placeholder:text-zinc-500 w-full focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-zinc-400 hover:text-white text-xs px-1 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}

      {/* AVISO IMPORTANTE NOTIFICATION BANNER (Requested: Title in bold red, disappears on 'Aceptar') */}
      {activeAnnouncement && (
        <div id="aviso-importante-banner" className="mx-3 my-2.5 p-3.5 bg-gradient-to-br from-[#240808] via-[#1a0707] to-[#120404] border-2 border-red-600/80 rounded-2xl shadow-2xl shadow-red-950/70 shrink-0 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-red-950/90 border border-red-500/70 flex items-center justify-center text-red-500 shrink-0">
                <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-red-500 text-sm sm:text-base tracking-wide uppercase leading-tight">
                  {activeAnnouncement.title}
                </h3>
                <span className="text-[10px] text-zinc-400 font-mono">
                  Emitido por: <span className="text-red-300 font-medium">{activeAnnouncement.authorName}</span>
                </span>
              </div>
            </div>
            <span className="text-[9px] font-mono text-red-300 bg-red-950/70 border border-red-800/60 px-2 py-0.5 rounded-full shrink-0">
              {activeAnnouncement.timestamp}
            </span>
          </div>

          <p className="text-xs text-zinc-100 font-medium leading-relaxed my-2.5 bg-[#120505]/70 p-2.5 rounded-xl border border-red-900/40 select-text whitespace-pre-wrap">
            {activeAnnouncement.content}
          </p>

          <div className="flex items-center justify-end pt-1">
            <button
              onClick={() => handleDismissAnnouncement(activeAnnouncement.id)}
              className="bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-bold text-xs px-5 py-2 rounded-xl shadow-lg shadow-red-950/60 transition-all cursor-pointer active:scale-95 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Aceptar</span>
            </button>
          </div>
        </div>
      )}

      {/* Messages Inbox Content (Clean, ready for sending) */}
      <div className="flex-1 overflow-y-auto">
        {chats.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#0d1410] border border-emerald-900/50 flex items-center justify-center text-emerald-400 mb-4 shadow-xl">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-white mb-1.5">
              Bandeja de Mensajes Privada
            </h3>
            <p className="text-xs text-zinc-300 max-w-xs mb-2 leading-relaxed">
              El almacenamiento es en tu dispositivo. Todo lo que hables o recibas se queda guardado en este celular y nada sale a la nube.
            </p>
            <p className="text-[11px] text-emerald-400/90 font-mono max-w-xs mb-5">
              Toca el botón + para elegir o añadir a quién escribirle.
            </p>
            <button
              onClick={() => setShowContactsScreen(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-black font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-950 transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              Iniciar un chat
            </button>
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="p-8 text-center text-zinc-400 text-xs font-mono">
            No se encontraron chats que coincidan con "{searchQuery}"
          </div>
        ) : (
          <div className="divide-y divide-emerald-950/40">
            {filteredChats.map((chat) => {
              const isSelected = selectedChatId === chat.id;
              return (
                <div
                  key={chat.id}
                  onClick={() => onSelectChat(chat.id)}
                  className={`p-3.5 flex items-center gap-3 cursor-pointer transition-colors active:bg-emerald-950/60 ${
                    isSelected ? 'bg-emerald-950/50' : 'hover:bg-emerald-950/20'
                  }`}
                >
                  <div className="relative shrink-0">
                    <img
                      src={chat.avatar}
                      alt={chat.name}
                      className="w-11 h-11 rounded-full object-cover border border-emerald-900/60"
                    />
                    {chat.online && !chat.isBlocked && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#070b08] rounded-full" />
                    )}
                    {chat.isGroup && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-950 border border-emerald-600 rounded-full flex items-center justify-center text-[9px] text-emerald-400 font-bold">
                        <Users className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h4 className="font-semibold text-white text-xs sm:text-sm truncate flex items-center gap-1">
                        <span>{chat.name}</span>
                        {chat.isBlocked ? (
                          <span className="text-[9px] text-red-400 bg-red-950/70 border border-red-800/60 px-1.5 py-0.2 rounded">Bloqueado</span>
                        ) : (
                          <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
                        )}
                      </h4>
                      <span className="text-[10px] font-mono text-zinc-400 shrink-0 ml-1">
                        {chat.timestamp}
                      </span>
                    </div>

                    <p className="text-[11px] text-zinc-400 truncate">
                      {chat.isBlocked ? 'Contacto bloqueado' : (chat.lastMessage || 'Listo para enviar mensajes...')}
                    </p>
                  </div>

                  {chat.unreadCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-emerald-500 text-black text-[10px] font-bold flex items-center justify-center shrink-0">
                      {chat.unreadCount}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Emergency Panic Purge Modal */}
      <PanicModal
        isOpen={showPanicModal}
        onClose={() => setShowPanicModal(false)}
        onWipeComplete={() => {
          setShowPanicModal(false);
          if (onPanicWipe) {
            onPanicWipe();
          }
        }}
      />
    </div>
  );
};
