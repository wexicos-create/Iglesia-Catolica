import React, { useState, useEffect } from 'react';
import { Chat } from '../types';
import { Phone, Video, Mic, MicOff, VideoOff, PhoneOff, ShieldCheck } from 'lucide-react';
import { offlineAudio } from '../utils/audioAlerts';

interface CallModalProps {
  chat: Chat;
  type: 'voice' | 'video';
  isSingleUse?: boolean;
  onEndCall: () => void;
}

export const CallModal: React.FC<CallModalProps> = ({
  chat,
  type,
  isSingleUse,
  onEndCall
}) => {
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);

  useEffect(() => {
    // Initial ring tone
    offlineAudio.playCallingPulse();
    const ringInterval = setInterval(() => {
      offlineAudio.playCallingPulse();
    }, 4000);

    const timer = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);

    return () => {
      clearInterval(ringInterval);
      clearInterval(timer);
    };
  }, []);

  const handleHangup = () => {
    offlineAudio.playHangup();
    onEndCall();
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#0d1410] border border-emerald-900 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl flex flex-col items-center text-center relative overflow-hidden glow-green">
        {/* Background glow */}
        <div className="absolute inset-0 bg-emerald-500/5 pointer-events-none" />

        <div className="absolute top-4 left-4 bg-emerald-950/80 border border-emerald-800/60 px-3 py-1 rounded-full text-[10px] font-mono text-emerald-300 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Quantum Secure Call • {chat.secureId}</span>
        </div>

        {isSingleUse && (
          <div className="absolute top-4 right-4 bg-purple-950/90 border border-purple-700/80 px-2.5 py-1 rounded-full text-[10px] font-mono text-purple-300 flex items-center gap-1 shadow-sm">
            <span>① Un Solo Uso (Cero Registros)</span>
          </div>
        )}

        <div className="relative my-6">
          <div className="w-28 h-28 rounded-full border-2 border-emerald-500/60 p-1.5 animate-pulse">
            <img
              src={chat.avatar}
              alt={chat.name}
              className="w-full h-full rounded-full object-cover"
            />
          </div>
          <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-[#0d1410] rounded-full" />
        </div>

        <h2 className="text-xl font-bold text-white mb-1">{chat.name}</h2>
        <p className="text-xs font-mono text-emerald-400 mb-6">
          {type === 'video' ? 'Videollamada Cuántica P2P' : 'Llamada de Voz Cifrada'} • {formatTime(seconds)}
        </p>

        {type === 'video' && !camOff && (
          <div className="w-full h-36 bg-[#090d0a] rounded-xl border border-emerald-900 mb-6 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-20 chattoj-pattern" />
            <span className="text-xs font-mono text-emerald-400 z-10 flex items-center gap-2">
              <Video className="w-4 h-4 animate-pulse" /> Transmisión Video Cifrada (Sin Servidor)
            </span>
          </div>
        )}

        <div className="flex items-center gap-4">
          <button
            onClick={() => setMuted(!muted)}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
              muted ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800/60 hover:bg-emerald-900'
            }`}
            title={muted ? 'Activar micrófono' : 'Silenciar'}
          >
            {muted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {type === 'video' && (
            <button
              onClick={() => setCamOff(!camOff)}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                camOff ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800/60 hover:bg-emerald-900'
              }`}
              title={camOff ? 'Encender cámara' : 'Apagar cámara'}
            >
              {camOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </button>
          )}

          <button
            onClick={handleHangup}
            className="w-14 h-14 rounded-2xl bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg transition-all cursor-pointer"
            title="Colgar llamada"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};
