import React, { useState } from 'react';
import { CallLog, Chat, UserProfile } from '../types';
import { Phone, Video, ShieldCheck, PhoneIncoming, PhoneOutgoing, PhoneMissed, Settings, Plus, UserPlus, Users } from 'lucide-react';
import { ContactsScreen } from './ContactsScreen';

interface CallsViewProps {
  callLogs: CallLog[];
  chats: Chat[];
  onStartCall: (chat: Chat, type: 'voice' | 'video', isSingleUse?: boolean) => void;
  currentUser?: UserProfile | null;
  onCreateNewChat?: (name: string, isGroup: boolean, contactId?: string) => void;
  onOpenSettings?: () => void;
}

export const CallsView: React.FC<CallsViewProps> = ({
  callLogs,
  chats,
  onStartCall,
  currentUser,
  onCreateNewChat,
  onOpenSettings
}) => {
  const [showContactsScreen, setShowContactsScreen] = useState(false);
  const [selectedChatForCall, setSelectedChatForCall] = useState<Chat | null>(chats[0] || null);
  const [isSingleUseCall, setIsSingleUseCall] = useState(true); // Default to 1 solo uso cero registros

  // If user tapped +, show Contacts Screen to pick contact or add a new one
  if (showContactsScreen) {
    return (
      <ContactsScreen
        currentUser={currentUser || { userId: 'me', name: 'Usuario', status: 'online', bio: '', avatar: '', isCustomBio: false }}
        chats={chats}
        onBack={() => setShowContactsScreen(false)}
        onSelectContact={(name, isGroup, contactId) => {
          if (onCreateNewChat) {
            onCreateNewChat(name, isGroup, contactId);
          }
          const matched = chats.find(c => c.name.toLowerCase() === name.toLowerCase()) || {
            id: 'call-chat-' + Date.now(),
            name,
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            online: true,
            isGroup,
            unreadCount: 0,
            messages: []
          };
          setSelectedChatForCall(matched);
          setShowContactsScreen(false);
        }}
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#070b08] chattoj-pattern overflow-hidden select-none">
      {/* Top Mobile Bar with + button on the right */}
      <div className="h-14 px-3.5 bg-[#0d1410] border-b border-emerald-950 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-950 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shadow-md">
            <Phone className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-bold text-white text-base tracking-tight leading-none">
              Llamadas
            </h1>
            <p className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-2.5 h-2.5" /> P2P Cuántico • Cero Servidores
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="w-8 h-8 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 flex items-center justify-center transition-colors border border-emerald-800/40 cursor-pointer"
              title="Ajustes de llamada"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Clean Call Initiation Section */}
        <div className="bg-[#0d1410] border border-emerald-900/60 rounded-2xl p-3.5 shadow-lg space-y-3">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setIsSingleUseCall(!isSingleUseCall)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-mono border transition-all cursor-pointer flex items-center gap-1.5 ${
                isSingleUseCall 
                  ? 'bg-purple-950/90 border-purple-500 text-purple-300 font-bold shadow-md shadow-purple-950' 
                  : 'bg-zinc-900 border-zinc-700 text-zinc-400'
              }`}
            >
              <span>① 1 Solo Uso (Cero Registros)</span>
            </button>

            <button
              type="button"
              onClick={() => setShowContactsScreen(true)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-black font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-emerald-950 transition-all cursor-pointer active:scale-95 shrink-0"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Contactos</span>
            </button>
          </div>

          {/* Contact selector on its own row */}
          <div>
            <select
              value={selectedChatForCall?.id || ''}
              onChange={(e) => {
                const found = chats.find(c => c.id === e.target.value);
                if (found) setSelectedChatForCall(found);
              }}
              className="w-full bg-[#070b08] border border-emerald-900/80 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-medium"
            >
              {chats.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
              {chats.length === 0 && (
                <option value="">Pulsa + Contactos para agregar uno</option>
              )}
            </select>
          </div>

          {/* Full-width responsive call buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              disabled={!selectedChatForCall}
              onClick={() => {
                if (selectedChatForCall) onStartCall(selectedChatForCall, 'voice', isSingleUseCall);
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-black font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all glow-green-sm cursor-pointer"
              title="Llamada de voz"
            >
              <Phone className="w-4 h-4" /> Voz
            </button>

            <button
              disabled={!selectedChatForCall}
              onClick={() => {
                if (selectedChatForCall) onStartCall(selectedChatForCall, 'video', isSingleUseCall);
              }}
              className="w-full bg-emerald-950 hover:bg-emerald-900 disabled:opacity-40 text-emerald-300 border border-emerald-700/60 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              title="Videollamada"
            >
              <Video className="w-4 h-4" /> Video
            </button>
          </div>
        </div>

        {/* Call Logs History */}
        <div className="space-y-1.5">
          <p className="text-[11px] font-mono uppercase text-zinc-400 px-1">
            Recientes ({callLogs.length})
          </p>

          {callLogs.length === 0 ? (
            <div className="p-8 text-center bg-[#0d1410]/40 border border-emerald-950/60 rounded-2xl">
              <Phone className="w-8 h-8 text-emerald-600/60 mx-auto mb-2" />
              <p className="text-xs text-zinc-300 font-medium">No hay llamadas recientes</p>
              <p className="text-[10px] text-zinc-500 font-mono mt-1">
                Toca el botón + para seleccionar a un contacto e iniciar una llamada P2P
              </p>
            </div>
          ) : (
            <div className="bg-[#0d1410]/70 border border-emerald-950 rounded-2xl divide-y divide-emerald-950/40 overflow-hidden">
              {callLogs.map((log) => {
                const matchedChat = chats.find(c => c.name === log.contactName) || chats[0];
                return (
                  <div
                    key={log.id}
                    className="p-3 flex items-center justify-between hover:bg-emerald-950/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={log.avatar}
                        alt={log.contactName}
                        className="w-10 h-10 rounded-full object-cover border border-emerald-900/60"
                      />
                      <div>
                        <h4 className="font-semibold text-white text-xs sm:text-sm">
                          {log.contactName}
                        </h4>
                        <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                          {log.direction === 'incoming' && <PhoneIncoming className="w-3 h-3 text-emerald-400" />}
                          {log.direction === 'outgoing' && <PhoneOutgoing className="w-3 h-3 text-emerald-400" />}
                          {log.direction === 'missed' && <PhoneMissed className="w-3 h-3 text-red-400" />}
                          <span>{log.timestamp}</span>
                          <span>•</span>
                          <span className="font-mono text-[10px] text-emerald-400">{log.duration}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          if (matchedChat) onStartCall(matchedChat, 'voice', isSingleUseCall);
                        }}
                        className="w-8 h-8 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800/40 flex items-center justify-center text-emerald-400 cursor-pointer"
                        title="Llamar de nuevo"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (matchedChat) onStartCall(matchedChat, 'video', isSingleUseCall);
                        }}
                        className="w-8 h-8 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800/40 flex items-center justify-center text-emerald-400 cursor-pointer"
                        title="Videollamada"
                      >
                        <Video className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
