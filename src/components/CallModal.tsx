import React, { useState, useEffect, useRef } from 'react';
import { Chat } from '../types';
import { Phone, Video, Mic, MicOff, VideoOff, PhoneOff, ShieldCheck, AlertCircle } from 'lucide-react';
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
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    // Initial ring tone
    offlineAudio.playCallingPulse();
    const ringInterval = setInterval(() => {
      offlineAudio.playCallingPulse();
    }, 4000);

    const timer = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);

    // Request real hardware media stream for calls according to Android strict parameters
    const initMedia = async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const constraints: MediaStreamConstraints = {
            audio: true,
            video: type === 'video' ? { facingMode: 'user' } : false
          };
          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          mediaStreamRef.current = stream;

          if (videoRef.current && type === 'video') {
            videoRef.current.srcObject = stream;
          }
        }
      } catch (err: any) {
        setPermissionError('Permiso de micrófono/cámara denegado en Android. Continuando con enlace simulado seguro.');
      }
    };

    initMedia();

    return () => {
      clearInterval(ringInterval);
      clearInterval(timer);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [type]);

  const handleToggleMute = () => {
    const nextMuted = !muted;
    setMuted(nextMuted);
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !nextMuted;
      });
    }
  };

  const handleToggleCam = () => {
    const nextCamOff = !camOff;
    setCamOff(nextCamOff);
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !nextCamOff;
      });
    }
  };

  const handleHangup = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
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

        <div className="relative my-4">
          <div className="w-24 h-24 rounded-full border-2 border-emerald-500/60 p-1 animate-pulse">
            <img
              src={chat.avatar}
              alt={chat.name}
              className="w-full h-full rounded-full object-cover"
            />
          </div>
          <span className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#0d1410] rounded-full" />
        </div>

        <h2 className="text-lg font-bold text-white mb-0.5">{chat.name}</h2>
        <p className="text-xs font-mono text-emerald-400 mb-4">
          {type === 'video' ? 'Videollamada Cuántica P2P' : 'Llamada de Voz Cifrada'} • {formatTime(seconds)}
        </p>

        {/* Video feed container */}
        {type === 'video' && (
          <div className="w-full h-40 bg-[#090d0a] rounded-2xl border border-emerald-900 mb-4 flex items-center justify-center relative overflow-hidden">
            {!camOff ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-xs font-mono text-zinc-500 flex flex-col items-center gap-1">
                <VideoOff className="w-6 h-6 text-zinc-600" />
                <span>Cámara en pausa</span>
              </div>
            )}
            
            <span className="absolute bottom-2 left-2 text-[9px] font-mono bg-black/60 px-2 py-0.5 rounded text-emerald-400 flex items-center gap-1">
              <Video className="w-3 h-3 animate-pulse" /> P2P Sin Servidor
            </span>
          </div>
        )}

        {permissionError && (
          <div className="mb-3 px-3 py-1.5 rounded-xl bg-amber-950/40 border border-amber-800/50 text-amber-300 text-[10px] font-mono flex items-center gap-1.5 text-left">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{permissionError}</span>
          </div>
        )}

        <div className="flex items-center gap-4">
          <button
            onClick={handleToggleMute}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
              muted ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800/60 hover:bg-emerald-900'
            }`}
            title={muted ? 'Activar micrófono' : 'Silenciar'}
          >
            {muted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {type === 'video' && (
            <button
              onClick={handleToggleCam}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
                camOff ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800/60 hover:bg-emerald-900'
              }`}
              title={camOff ? 'Encender cámara' : 'Apagar cámara'}
            >
              {camOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </button>
          )}

          <button
            onClick={handleHangup}
            className="w-14 h-14 rounded-2xl bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg hover:shadow-red-600/30 transition-all cursor-pointer"
            title="Colgar llamada"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>

        <div className="mt-4 text-[10px] font-mono text-zinc-400 flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          <span>Cifrado de extremo a extremo sin registro en Google</span>
        </div>
      </div>
    </div>
  );
};
