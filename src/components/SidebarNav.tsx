import React from 'react';
import { MessageSquare, Users, Phone, MessageCircleCode, BookOpen, Cpu, Settings, ShieldAlert, LogOut, Server } from 'lucide-react';
import { isUserAdmin } from '../utils/reportsRegistry';
import { UserProfile } from '../types';

export type ActiveTab = 'chats' | 'calls' | 'forums' | 'debates' | 'resources' | 'llama-ai' | 'settings' | 'admin-panel';

interface SidebarNavProps {
  currentUser?: UserProfile | null;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  unreadTotal: number;
  onLogout: () => void;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  unreadTotal,
  onLogout
}) => {
  const navItems = [
    { id: 'chats' as ActiveTab, label: 'Chats & Grupos', icon: MessageSquare, badge: unreadTotal },
    { id: 'calls' as ActiveTab, label: 'Llamadas Cuánticas', icon: Phone },
    { id: 'forums' as ActiveTab, label: 'Foros Activistas', icon: ShieldAlert, highlight: true },
    { id: 'llama-ai' as ActiveTab, label: 'IA Llama Offline', icon: Cpu, highlight: true },
    { id: 'resources' as ActiveTab, label: 'Recursos APK', icon: BookOpen },
    { id: 'settings' as ActiveTab, label: 'Configuración', icon: Settings },
  ];

  if (currentUser && isUserAdmin(currentUser.userId)) {
    // Insert Admin Panel right after IA Llama
    navItems.splice(4, 0, { id: 'admin-panel' as ActiveTab, label: 'Infraestructura Admin', icon: Server, highlight: true });
  }

  return (
    <aside className="w-20 lg:w-72 bg-[#090d0a] border-r border-emerald-950 flex flex-col justify-between shrink-0 select-none">
      {/* Top Brand header */}
      <div>
        <div className="p-4 lg:p-6 border-b border-emerald-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400 glow-green-sm shrink-0">
              <MessageCircleCode className="w-6 h-6" />
            </div>
            <div className="hidden lg:block">
              <h2 className="font-bold text-lg text-white tracking-tight flex items-center gap-1.5">
                CHATT<span className="text-emerald-400">OJ</span>
                <span className="text-[10px] bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-800">PRO</span>
              </h2>
              <p className="text-[11px] text-zinc-400 font-mono">Llama Offline Unlimited</p>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl transition-all relative group ${
                  isActive
                    ? 'bg-emerald-600/15 text-emerald-300 border border-emerald-500/30 font-medium'
                    : 'text-zinc-400 hover:text-white hover:bg-emerald-950/40'
                } ${item.highlight && !isActive ? 'border border-emerald-500/20 bg-emerald-950/20 text-emerald-400' : ''}`}
                title={item.label}
              >
                <div className={`relative ${isActive ? 'text-emerald-400' : 'text-zinc-400 group-hover:text-emerald-300'}`}>
                  <Icon className="w-5 h-5" />
                  {item.badge && item.badge > 0 ? (
                    <span className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-black text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                      {item.badge}
                    </span>
                  ) : null}
                </div>
                <span className="hidden lg:block text-sm">{item.label}</span>
                {item.highlight && (
                  <span className="hidden lg:inline-block ml-auto text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono">
                    AI
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Node status & logout */}
      <div className="p-3 lg:p-4 border-t border-emerald-950 space-y-3">
        <div className="hidden lg:flex items-center gap-2.5 p-2.5 rounded-xl bg-[#0d1410] border border-emerald-900/40">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <div className="text-xs">
            <p className="text-zinc-300 font-medium">Nodo Descentralizado</p>
            <p className="text-[10px] text-emerald-400/80 font-mono">100% Cifrado Sin Nube</p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center lg:justify-start gap-2.5 p-2.5 rounded-xl text-zinc-400 hover:text-red-400 hover:bg-red-950/20 transition-all text-xs font-medium"
          title="Cerrar sesión"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden lg:inline">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
};
