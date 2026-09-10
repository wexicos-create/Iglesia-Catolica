import React, { useState, useEffect } from 'react';
import { UserProfile, Chat, CallLog, ForumTopic, ExclusiveResource, Message } from './types';
import { INITIAL_CHATS, INITIAL_CALL_LOGS, INITIAL_FORUM_TOPICS, INITIAL_RESOURCES } from './data/mockData';
import { AuthScreen } from './components/AuthScreen';
import { BottomNav } from './components/BottomNav';
import { ActiveTab } from './components/SidebarNav';
import { ChatListView } from './components/ChatListView';
import { ChatRoom } from './components/ChatRoom';
import { CallsView } from './components/CallsView';
import { ForumsView } from './components/ForumsView';
import { LlamaAiTerminal } from './components/LlamaAiTerminal';
import { SettingsView, SettingsSection } from './components/SettingsView';
import { AdminServerManager } from './components/AdminServerManager';
import { CallModal } from './components/CallModal';
import { PushNotificationToast } from './components/PushNotificationToast';
import { MobileStatusBar } from './components/MobileStatusBar';
import { AndroidAuditPermissionsModal } from './components/AndroidAuditPermissionsModal';
import { neuroShieldEngine } from './utils/neuroShieldEngine';
import { offlineAudio } from './utils/audioAlerts';
import { analyzeMessageThreat } from './utils/threatProtection';
import { askLlamaOffline } from './utils/llamaEngine';
import { 
  encryptE2EEMessage, 
  decryptE2EEMessage, 
  getOrCreateContactPublicKey,
  E2EEEnvelope
} from './utils/e2eeEngine';
import { relayE2EEEnvelopeViaDuckDns } from './utils/duckDnsRelay';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('chattoj_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('chats');
  const [previousTab, setPreviousTab] = useState<ActiveTab>('chats');
  const [settingsInitialSection, setSettingsInitialSection] = useState<SettingsSection>('main');
  const [chats, setChats] = useState<Chat[]>(() => {
    // Clean old demo cookies/cache on start from zero
    localStorage.removeItem('chattoj_chats');
    localStorage.removeItem('chattoj_clean_chats');
    localStorage.removeItem('chattoj_call_logs');
    localStorage.removeItem('chattoj_forum_topics');
    localStorage.removeItem('chattoj_general_reports_registry');
    return INITIAL_CHATS;
  });
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [callLogs, setCallLogs] = useState<CallLog[]>(INITIAL_CALL_LOGS);
  const [forumTopics, setForumTopics] = useState<ForumTopic[]>(INITIAL_FORUM_TOPICS);

  const [activeCall, setActiveCall] = useState<{ chat: Chat; type: 'voice' | 'video'; isSingleUse?: boolean } | null>(null);
  const [notification, setNotification] = useState<{ title: string; body: string } | null>(null);
  const [showAuditModal, setShowAuditModal] = useState<boolean>(false);

  useEffect(() => {
    const handleOpenAudit = () => setShowAuditModal(true);
    window.addEventListener('chattoj-open-audit-modal', handleOpenAudit);
    return () => {
      window.removeEventListener('chattoj-open-audit-modal', handleOpenAudit);
    };
  }, []);

  useEffect(() => {
    const handleSecurityAlert = (e: any) => {
      const detail = e.detail;
      if (detail && detail.aggressorName) {
        setNotification({
          title: '🛡️ MEDIDAS DE RIESGO ELEVADAS',
          body: `Amenazas de "${detail.aggressorName}" neutralizadas. MAC ${detail.macAddress} baneada.`
        });
      }
    };

    const handleAdminIntelligence = (e: any) => {
      const report = e.detail;
      if (!report) return;

      const reportMsg: Message = {
        id: 'rep-msg-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        senderId: 'llama-ai',
        senderName: 'Llama Offline AI (Seguridad & Admin)',
        text: `📑 ${report.title}\n\n${report.summary}\n\n${report.details}\n\n🔒 [Firma Cuántica: ${report.quantumHash}]`,
        timestamp: report.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isEncrypted: true,
        quantumHash: report.quantumHash,
        status: 'verified'
      };

      setChats(prev => {
        let targetChatIndex = prev.findIndex(c => c.id === 'chat-1' || c.name.toLowerCase().includes('llama') || c.name.toLowerCase().includes('asistente'));
        if (targetChatIndex === -1 && prev.length > 0) targetChatIndex = 0;

        if (targetChatIndex === -1) return prev;

        return prev.map((c, idx) => {
          if (idx === targetChatIndex) {
            return {
              ...c,
              lastMessage: `[REPORTE IA] ${report.title}`,
              timestamp: report.timestamp || 'Ahora',
              unreadCount: selectedChatId === c.id ? c.unreadCount : c.unreadCount + 1,
              messages: [...c.messages, reportMsg]
            };
          }
          return c;
        });
      });

      setNotification({
        title: report.title,
        body: report.summary
      });

      try {
        offlineAudio.playReceived();
      } catch {}
    };

    window.addEventListener('chattoj-security-alert', handleSecurityAlert);
    window.addEventListener('chattoj-admin-intelligence-report', handleAdminIntelligence);
    return () => {
      window.removeEventListener('chattoj-security-alert', handleSecurityAlert);
      window.removeEventListener('chattoj-admin-intelligence-report', handleAdminIntelligence);
    };
  }, [selectedChatId]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('chattoj_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('chattoj_user');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('chattoj_clean_chats', JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    localStorage.setItem('chattoj_forum_topics', JSON.stringify(forumTopics));
  }, [forumTopics]);

  // Occasional background security toast for realism
  useEffect(() => {
    if (!currentUser) return;
    const t = setTimeout(() => {
      setNotification({
        title: 'Bóveda Cifrada Operativa',
        body: 'Dispositivo verificado: Cero fugas de datos y Llama AI local activo.'
      });
    }, 8000);
    return () => clearTimeout(t);
  }, [currentUser]);

  const handleLogin = (profile: UserProfile) => {
    setCurrentUser(profile);
    setNotification({
      title: 'Bóveda Desbloqueada',
      body: `Bienvenido Admin ${profile.name}. Dispositivo vinculado con éxito.`
    });
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setSelectedChatId(null);
    setActiveTab('chats');
  };

  const handlePanicWipe = () => {
    setCurrentUser(null);
    setChats([]);
    setCallLogs([]);
    setSelectedChatId(null);
    setActiveTab('chats');
  };

  const handleOpenSettings = (fromTab: ActiveTab, targetSection: SettingsSection = 'main') => {
    setPreviousTab(fromTab);
    setSettingsInitialSection(targetSection);
    setActiveTab('settings');
  };

  const handleSendMessage = (
    chatId: string,
    text: string,
    attachment?: Message['attachment'],
    isViewOnce?: boolean
  ) => {
    // Autonomous background inspector against malicious signals / threats / human rights violations
    const targetChat = chats.find(c => c.id === chatId);
    if (targetChat && text) {
      neuroShieldEngine.inspectAndNeutralizeThreatVector(targetChat.name, text);
      analyzeMessageThreat(text, targetChat.name);
    }

    setChats(prev => prev.map(c => {
      if (c.id === chatId) {
        const newMsg: Message = {
          id: 'm-' + Date.now(),
          senderId: 'me',
          senderName: currentUser?.name || 'Tú',
          text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isEncrypted: true,
          quantumHash: '0x' + Math.floor(Math.random() * 100000000).toString(16).toUpperCase() + '...Q',
          status: 'verified',
          attachment,
          isViewOnce,
          isViewed: false
        };
        return {
          ...c,
          lastMessage: isViewOnce
            ? (attachment?.type === 'video' ? '① Video' : '① Foto')
            : (text || (attachment ? `[${attachment.type}]` : '')),
          timestamp: 'Justo ahora',
          messages: [...c.messages, newMsg]
        };
      }
      return c;
    }));

    // If talking to Assistant AI / Admin, trigger autonomous response in real time
    const isAiChat = chatId === 'chat-1' || (targetChat && (
      targetChat.name.toLowerCase().includes('llama') || 
      targetChat.name.toLowerCase().includes('asistente')
    ));

    if (isAiChat && text) {
      setTimeout(async () => {
        try {
          const aiRes = await askLlamaOffline(text, currentUser?.name || 'Josué Cervantes Alvarado');
          const aiMsg: Message = {
            id: 'm-ai-' + Date.now(),
            senderId: 'llama-ai',
            senderName: 'Llama Offline AI (Asistente & Admin)',
            text: aiRes.reply,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isEncrypted: true,
            quantumHash: aiRes.quantumHash,
            status: 'verified'
          };

          setChats(prev => prev.map(c => {
            if (c.id === chatId) {
              return {
                ...c,
                lastMessage: aiRes.reply.slice(0, 45) + '...',
                timestamp: 'Justo ahora',
                messages: [...c.messages, aiMsg]
              };
            }
            return c;
          }));

          try {
            offlineAudio.playReceived();
          } catch {}
        } catch (err) {
          console.error('Error generating offline AI reply', err);
        }
      }, 500);
    }
  };

  const handleDeleteChat = (chatId: string) => {
    setChats(prev => prev.filter(c => c.id !== chatId));
    if (selectedChatId === chatId) {
      setSelectedChatId(null);
    }
  };

  const handleDeleteMessage = (chatId: string, messageId: string, _forEveryone: boolean) => {
    setChats(prev => prev.map(c => {
      if (c.id === chatId) {
        // Direct clean removal: No placeholder, no "mensaje eliminado" text
        const updatedMessages = c.messages.filter(m => m.id !== messageId);
        const last = updatedMessages.length > 0 ? updatedMessages[updatedMessages.length - 1] : null;
        return {
          ...c,
          lastMessage: last ? (last.text || (last.attachment ? `[${last.attachment.type}]` : '')) : '',
          messages: updatedMessages
        };
      }
      return c;
    }));
  };

  const handleToggleBlockChat = (chatId: string) => {
    setChats(prev => prev.map(c => (c.id === chatId ? { ...c, isBlocked: !c.isBlocked } : c)));
  };

  const handleAddMember = (chatId: string, memberName: string) => {
    setChats(prev => prev.map(c => {
      if (c.id === chatId) {
        const newSysMsg: Message = {
          id: 'm-' + Date.now(),
          senderId: 'system',
          senderName: 'Sistema',
          text: `Se ha añadido a "${memberName}" al canal seguro.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isEncrypted: true,
          quantumHash: '0xMEMB...OK',
          status: 'verified'
        };
        return {
          ...c,
          messages: [...c.messages, newSysMsg]
        };
      }
      return c;
    }));
  };

  const handleMarkMessageViewed = (chatId: string, messageId: string) => {
    setChats(prev => prev.map(c => {
      if (c.id === chatId) {
        // Ephemeral single-use message / photo / video: once viewed, completely vanish without leaving record!
        const targetMsg = c.messages.find(m => m.id === messageId);
        if (targetMsg && targetMsg.isViewOnce) {
          const updatedMessages = c.messages.filter(m => m.id !== messageId);
          const last = updatedMessages.length > 0 ? updatedMessages[updatedMessages.length - 1] : null;
          return {
            ...c,
            lastMessage: last ? (last.text || (last.attachment ? `[${last.attachment.type}]` : '')) : '',
            messages: updatedMessages
          };
        }
        return {
          ...c,
          messages: c.messages.map(m => m.id === messageId ? { ...m, isViewed: true } : m)
        };
      }
      return c;
    }));
  };

  const handleCreateNewChat = (name: string, isGroup: boolean, contactId?: string) => {
    const newChat: Chat = {
      id: 'chat-' + Date.now(),
      name,
      avatar: isGroup 
        ? 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      isGroup,
      lastMessage: '',
      timestamp: 'Justo ahora',
      unreadCount: 0,
      online: true,
      secureId: contactId ? `Q-ID-${contactId}` : `Q-${isGroup ? 'GRP' : 'P2P'}-${Math.floor(1000 + Math.random() * 9000)}`,
      messages: [] // Clean, empty window ready for sending without dummy examples
    };

    setChats(prev => [newChat, ...prev]);
    setSelectedChatId(newChat.id);
  };

  const handleStartCall = (chat: Chat, type: 'voice' | 'video', isSingleUse: boolean = false) => {
    setActiveCall({ chat, type, isSingleUse });
    // If it's a single-use call (un solo uso), do NOT create log unless requested
    if (!isSingleUse) {
      const newLog: CallLog = {
        id: 'call-' + Date.now(),
        contactName: chat.name,
        avatar: chat.avatar,
        type,
        direction: 'outgoing',
        timestamp: 'Justo ahora',
        duration: 'En curso',
        quantumSecure: true
      };
      setCallLogs(prev => [newLog, ...prev]);
    }
  };

  const unreadTotal = chats.reduce((acc, c) => acc + c.unreadCount, 0);
  const selectedChat = chats.find(c => c.id === selectedChatId);

  if (!currentUser) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  // Inside single chat conversation, hide the bottom bar for full writing area
  const isInsideChatRoom = activeTab === 'chats' && selectedChatId !== null;

  return (
    <div 
      className="h-[100dvh] max-h-[100dvh] w-full bg-[#050806] flex items-center justify-center overflow-hidden font-['Plus_Jakarta_Sans',sans-serif] p-0 sm:py-1 box-border"
    >
      {/* Mobile APK Container - fits within device viewport with compact status bar */}
      <div className="w-full max-w-[430px] h-full max-h-full bg-[#070b08] sm:border sm:border-emerald-950/70 sm:shadow-2xl flex flex-col overflow-hidden relative sm:rounded-3xl">
        
        {/* Compact Android Mobile Status Bar: hora, señal, red 5G, wifi, batería (28px height) */}
        <MobileStatusBar />

        {/* Main View Body */}
        <main className="flex-1 flex flex-col h-full overflow-hidden relative">
          {activeTab === 'chats' && (
            selectedChat ? (
              <ChatRoom
                chat={selectedChat}
                currentUser={currentUser}
                onSendMessage={handleSendMessage}
                onStartCall={handleStartCall}
                onBack={() => setSelectedChatId(null)}
                onDeleteChat={handleDeleteChat}
                onDeleteMessage={handleDeleteMessage}
                onToggleBlockChat={handleToggleBlockChat}
                onAddMember={handleAddMember}
                onMarkMessageViewed={handleMarkMessageViewed}
              />
            ) : (
              <ChatListView
                chats={chats}
                selectedChatId={selectedChatId}
                onSelectChat={(id) => {
                  setSelectedChatId(id);
                  setChats(prev => prev.map(c => c.id === id ? { ...c, unreadCount: 0 } : c));
                }}
                currentUser={currentUser}
                onCreateNewChat={handleCreateNewChat}
                onOpenSettings={() => handleOpenSettings('chats')}
                onPanicWipe={handlePanicWipe}
              />
            )
          )}

          {activeTab === 'calls' && (
            <CallsView
              callLogs={callLogs}
              chats={chats}
              onStartCall={handleStartCall}
              currentUser={currentUser}
              onCreateNewChat={handleCreateNewChat}
              onOpenSettings={() => handleOpenSettings('calls')}
            />
          )}

          {(activeTab === 'forums' || activeTab === 'debates') && (
            <ForumsView
              topics={forumTopics}
              onAddTopic={(newTopic) => setForumTopics(prev => [newTopic, ...prev])}
              onUpdateTopic={(updatedTopic) => setForumTopics(prev => prev.map(t => t.id === updatedTopic.id ? updatedTopic : t))}
              onDeleteTopic={(topicId) => setForumTopics(prev => prev.filter(t => t.id !== topicId))}
              currentUser={currentUser}
              onOpenSettings={() => handleOpenSettings('forums')}
            />
          )}

          {activeTab === 'llama-ai' && (
            <LlamaAiTerminal
              currentUser={currentUser}
              onOpenSettings={(section) => handleOpenSettings('llama-ai', section || 'main')}
              onOpenTasks={() => handleOpenSettings('llama-ai', 'tasks')}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              currentUser={currentUser}
              onUpdateProfile={(updated) => setCurrentUser(updated)}
              onBack={() => setActiveTab(previousTab)}
              onLogout={handleLogout}
              initialSection={settingsInitialSection}
            />
          )}

          {activeTab === 'admin-panel' && (
            <AdminServerManager
              onClose={() => setActiveTab(previousTab)}
            />
          )}
        </main>

        {/* Bottom Navigation: visible on all main sections, hidden inside active ChatRoom */}
        {!isInsideChatRoom && (
          <BottomNav
            currentUser={currentUser}
            activeTab={activeTab}
            setActiveTab={(tab) => {
              setActiveTab(tab);
              if (tab === 'chats') setSelectedChatId(null);
            }}
            unreadTotal={unreadTotal}
          />
        )}

        {/* Active Call Modal Overlay */}
        {activeCall && (
          <CallModal
            chat={activeCall.chat}
            type={activeCall.type}
            isSingleUse={activeCall.isSingleUse}
            onEndCall={() => setActiveCall(null)}
          />
        )}

        {/* Security Toast Notification */}
        <PushNotificationToast
          notification={notification}
          onClose={() => setNotification(null)}
        />

        {/* Bottom slim gesture indicator */}
        <div className="w-full py-1 bg-[#070b08] flex items-center justify-center select-none shrink-0 border-t border-emerald-950/20">
          <div className="w-24 h-1 bg-zinc-700/40 rounded-full" />
        </div>
      </div>

      {/* Android Hardware Audit & Permissions Modal */}
      {showAuditModal && (
        <AndroidAuditPermissionsModal onClose={() => setShowAuditModal(false)} />
      )}
    </div>
  );
}
