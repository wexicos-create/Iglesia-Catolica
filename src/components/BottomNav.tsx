import React from 'react';
import { MessageSquare, Phone, ShieldAlert, Cpu, Server } from 'lucide-react';
import { ActiveTab } from './SidebarNav';
import { isUserAdmin } from '../utils/reportsRegistry';
import { UserProfile } from '../types';

interface BottomNavProps {
  currentUser?: UserProfile | null;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  unreadTotal: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  unreadTotal
}) => {
  const items = [
    { id: 'chats' as ActiveTab, label: 'Chats', icon: MessageSquare, badge: unreadTotal },
    { id: 'calls' as ActiveTab, label: 'Llamadas', icon: Phone },
    { id: 'forums' as ActiveTab, label: 'Foros', icon: ShieldAlert, highlight: true },
    { id: 'llama-ai' as ActiveTab, label: 'IA Offline', icon: Cpu },
  ];

  if (currentUser && isUserAdmin(currentUser.userId)) {
    items.push({ id: 'admin-panel' as ActiveTab, label: 'Admin', icon: Server });
  }

  return (
    <nav className="h-14 bg-[#0a0f0b] border-t border-emerald-950/80 flex items-center justify-around px-2 shrink-0 z-40 select-none pb-safe">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all relative group ${
              isActive ? 'text-emerald-400 font-semibold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <div className={`relative px-3 py-1 rounded-xl transition-all ${
              isActive ? 'bg-emerald-600/20 border border-emerald-500/30' : ''
            }`}>
              <Icon className="w-5 h-5" />
              {item.badge && item.badge > 0 ? (
                <span className="absolute -top-1 -right-1 bg-emerald-500 text-black text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {item.badge}
                </span>
              ) : null}
              {item.highlight && !isActive && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              )}
            </div>
            <span className="text-[10px] mt-0.5 font-medium tracking-tight">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
