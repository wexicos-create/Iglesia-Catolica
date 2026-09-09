import React, { useEffect } from 'react';
import { Shield, Bell } from 'lucide-react';

interface PushNotificationToastProps {
  notification: { title: string; body: string } | null;
  onClose: () => void;
}

export const PushNotificationToast: React.FC<PushNotificationToastProps> = ({
  notification,
  onClose
}) => {
  useEffect(() => {
    if (!notification) return;
    const t = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(t);
  }, [notification, onClose]);

  if (!notification) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm w-full bg-[#0d1410] border border-emerald-500/50 rounded-2xl p-4 shadow-2xl glow-green-sm flex items-start gap-3 animate-fade-in">
      <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-700/40 flex items-center justify-center text-emerald-400 shrink-0">
        <Bell className="w-5 h-5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <h4 className="font-bold text-white text-xs flex items-center gap-1">
            <span>{notification.title}</span>
            <Shield className="w-3 h-3 text-emerald-400" />
          </h4>
          <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded">Push Local</span>
        </div>
        <p className="text-xs text-zinc-300 truncate">{notification.body}</p>
      </div>

      <button
        onClick={onClose}
        className="text-zinc-500 hover:text-white text-xs font-mono p-1"
      >
        ✕
      </button>
    </div>
  );
};
