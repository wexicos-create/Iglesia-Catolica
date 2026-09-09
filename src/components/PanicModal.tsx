import React, { useState, useEffect, useRef } from 'react';
import { Flame, ShieldAlert, X, AlertTriangle, Check, RefreshCw } from 'lucide-react';
import { PanicDelay, getPanicDelay, setPanicDelay as savePanicDelay, executePanicWipe } from '../utils/cryptoStorage';
import { offlineAudio } from '../utils/audioAlerts';

interface PanicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWipeComplete: () => void;
}

export const PanicModal: React.FC<PanicModalProps> = ({
  isOpen,
  onClose,
  onWipeComplete
}) => {
  const [delayMode, setDelayMode] = useState<PanicDelay>(() => getPanicDelay());
  const [secondsLeft, setSecondsLeft] = useState<number>(5);
  const [isWiping, setIsWiping] = useState(false);
  const timerRef = useRef<any>(null);

  // Initialize countdown whenever opened or delay changed
  useEffect(() => {
    if (!isOpen) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const currentDelay = getPanicDelay();
    setDelayMode(currentDelay);

    if (currentDelay === 'instant') {
      setSecondsLeft(0);
    } else {
      const initialSeconds = currentDelay === '3' ? 3 : 5;
      setSecondsLeft(initialSeconds);

      if (timerRef.current) clearInterval(timerRef.current);

      timerRef.current = setInterval(() => {
        offlineAudio.playPanicWarning();
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleExecuteDestruction();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, delayMode]);

  const handleExecuteDestruction = () => {
    setIsWiping(true);
    if (timerRef.current) clearInterval(timerRef.current);

    setTimeout(() => {
      executePanicWipe();
      setIsWiping(false);
      onWipeComplete();
    }, 1200);
  };

  const handleSelectDelay = (newDelay: PanicDelay) => {
    savePanicDelay(newDelay);
    setDelayMode(newDelay);

    if (timerRef.current) clearInterval(timerRef.current);

    if (newDelay === 'instant') {
      setSecondsLeft(0);
    } else {
      const s = newDelay === '3' ? 3 : 5;
      setSecondsLeft(s);
      timerRef.current = setInterval(() => {
        offlineAudio.playPanicWarning();
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleExecuteDestruction();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const handleCancel = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    onClose();
  };

  if (!isOpen) return null;

  const totalDuration = delayMode === '3' ? 3 : 5;
  const progressPercent = delayMode === 'instant' ? 100 : ((totalDuration - secondsLeft) / totalDuration) * 100;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-sm bg-[#0c0909] border-2 border-red-600/80 rounded-3xl p-5 shadow-2xl shadow-red-950/70 relative overflow-hidden flex flex-col items-center text-center">
        {/* Glowing Fire Pulse Effect */}
        <div className="absolute -top-16 -left-16 w-36 h-36 bg-red-600/20 rounded-full blur-2xl pointer-events-none animate-pulse" />
        <div className="absolute -bottom-16 -right-16 w-36 h-36 bg-amber-600/20 rounded-full blur-2xl pointer-events-none animate-pulse" />

        {/* Top Flame Badge */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-amber-600 p-0.5 shadow-lg shadow-red-900/60 mb-3 relative">
          <div className="w-full h-full bg-[#180b0b] rounded-[14px] flex items-center justify-center text-amber-400">
            <Flame className="w-8 h-8 text-amber-500 fill-amber-500 animate-bounce" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-lg font-black tracking-tight text-white flex items-center justify-center gap-1.5 uppercase">
          <span>Botón de Pánico</span>
          <span className="text-red-500 font-mono text-xs px-1.5 py-0.5 bg-red-950/80 border border-red-800 rounded">
            EMERGENCIA
          </span>
        </h2>

        {isWiping ? (
          <div className="py-8 space-y-3">
            <div className="inline-flex p-3 rounded-full bg-red-950/80 border border-red-600 text-red-400 animate-spin">
              <RefreshCw className="w-8 h-8" />
            </div>
            <h3 className="text-sm font-bold text-red-400 font-mono">
              DESTRUYENDO BÓVEDA Y MEMORIA...
            </h3>
            <p className="text-xs text-zinc-400 font-mono">
              Sobrescribiendo datos con ceros criptográficos y borrando claves del celular.
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
              Borra todo lo que tiene el celular: mensajes, fotos, audios, contactos y la base de datos protegida.
            </p>

            {/* Big Countdown Display */}
            {delayMode !== 'instant' ? (
              <div className="my-4 w-full bg-[#140b0b] border border-red-900/80 rounded-2xl p-4 flex flex-col items-center">
                <div className="text-[11px] font-mono uppercase text-zinc-400 mb-1 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Borrado en progreso:</span>
                </div>
                <div className="text-5xl font-black font-mono tracking-wider text-red-500 animate-pulse my-1">
                  00:0{secondsLeft}
                </div>
                <div className="w-full bg-black/60 h-2.5 rounded-full overflow-hidden mt-2 border border-red-950">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-red-600 transition-all duration-1000 ease-linear"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="my-4 w-full bg-[#140b0b] border border-red-900/80 rounded-2xl p-4 text-center">
                <span className="text-amber-400 font-mono text-xs font-bold block mb-1">
                  ⚡ MODO AL TOQUE (INSTANTÁNEO)
                </span>
                <p className="text-xs text-zinc-300 mb-3 leading-snug">
                  Pulsa el botón rojo para destruir toda la información de este celular inmediatamente.
                </p>
                <button
                  onClick={handleExecuteDestruction}
                  className="w-full bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-red-950 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <Flame className="w-4 h-4 fill-white" />
                  Destruir todo ahora al toque
                </button>
              </div>
            )}

            {/* Delay Selector */}
            <div className="w-full mb-4">
              <div className="text-[10px] font-mono text-zinc-400 uppercase text-left mb-1 px-1">
                Tiempo de borrado:
              </div>
              <div className="grid grid-cols-3 gap-1.5 bg-[#140b0b] p-1 rounded-xl border border-red-950">
                <button
                  type="button"
                  onClick={() => handleSelectDelay('5')}
                  className={`py-1.5 px-1 rounded-lg text-[11px] font-mono font-medium transition-all ${
                    delayMode === '5'
                      ? 'bg-red-600 text-white shadow-md'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  5 seg
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectDelay('3')}
                  className={`py-1.5 px-1 rounded-lg text-[11px] font-mono font-medium transition-all ${
                    delayMode === '3'
                      ? 'bg-red-600 text-white shadow-md'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  3 seg
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectDelay('instant')}
                  className={`py-1.5 px-1 rounded-lg text-[11px] font-mono font-medium transition-all ${
                    delayMode === 'instant'
                      ? 'bg-amber-600 text-black font-bold shadow-md'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Al toque
                </button>
              </div>
            </div>

            {/* Main Action Buttons: CANCELAR (High priority for false alarms) */}
            <div className="w-full space-y-2">
              <button
                type="button"
                onClick={handleCancel}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-black font-extrabold py-3 px-4 rounded-2xl text-sm shadow-xl shadow-emerald-950/80 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
              >
                <X className="w-5 h-5 stroke-[2.5]" />
                CANCELAR BORRADO
              </button>
              <p className="text-[10px] text-zinc-400 font-mono">
                Si pulsaste por error, toca Cancelar para mantener tus datos intactos.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
