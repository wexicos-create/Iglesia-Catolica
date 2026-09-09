import React, { useState } from 'react';
import { ShieldAlert, X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { submitReport } from '../utils/reportsRegistry';

interface ReportModalProps {
  targetId: string;
  targetName: string;
  source: 'chat' | 'forum' | 'user';
  currentUserId: string;
  currentUserName: string;
  onClose: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  targetId,
  targetName,
  source,
  currentUserId,
  currentUserName,
  onClose
}) => {
  const [reason, setReason] = useState('Acoso o comportamiento hostil');
  const [details, setDetails] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [accumulatedInfo, setAccumulatedInfo] = useState<number | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = submitReport({
      targetId,
      targetName,
      reporterId: currentUserId,
      reporterName: currentUserName,
      source,
      reason,
      details
    });

    setAccumulatedInfo(result.accumulatedCount);
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-70 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 animate-in fade-in">
      <div className="bg-[#0c120e] border border-red-900/80 rounded-3xl w-full max-w-md p-5 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-red-950 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-950/80 border border-red-500/50 flex items-center justify-center text-red-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Reportar a la IA / Administrador</h2>
              <p className="text-[10px] text-zinc-400 font-mono">Registro General de Moderación</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="p-5 text-center space-y-3 bg-[#080d0a] border border-emerald-900/60 rounded-2xl">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <h3 className="text-sm font-bold text-white">Reporte Almacenado Exitosamente</h3>
            <p className="text-xs text-zinc-300">
              Tu reporte contra <strong className="text-emerald-400">{targetName}</strong> ha sido registrado en la base de datos general de enjambre.
            </p>
            <p className="text-[11px] font-mono text-emerald-300 bg-emerald-950/60 p-2 rounded-xl border border-emerald-800/40">
              Reportes acumulados actuales para este objetivo: <span className="font-bold text-white">{accumulatedInfo}</span>
              {accumulatedInfo && accumulatedInfo >= 2 && (
                <span className="block text-[10px] text-amber-400 mt-1">
                  ⚠️ Se ha superado el umbral de similitud. La IA ha enviado una alerta privada al Administrador (Admin ID) para revisión.
                </span>
              )}
            </p>
            <button
              onClick={onClose}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-black font-bold rounded-xl text-xs cursor-pointer"
            >
              Cerrar y Continuar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            <div className="p-3 bg-[#080d0a] border border-red-950 rounded-xl space-y-1">
              <span className="text-[10px] text-zinc-400 font-mono block">Objetivo del Reporte:</span>
              <span className="font-bold text-white text-sm">{targetName}</span>
              <span className="text-[10px] text-zinc-500 font-mono block">Tipo: {source.toUpperCase()}</span>
            </div>

            <div>
              <label className="block text-zinc-300 font-medium mb-1">Motivo principal:</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-[#080d0a] border border-red-950 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-red-500"
              >
                <option value="Acoso o comportamiento hostil">Acoso o comportamiento hostil</option>
                <option value="Amenazas directas de violencia">Amenazas directas de violencia</option>
                <option value="Spam masivo o estafa">Spam masivo o estafa</option>
                <option value="Contenido ilegal o prohibido">Contenido ilegal o prohibido</option>
                <option value="Suplantación de identidad">Suplantación de identidad</option>
              </select>
            </div>

            <div>
              <label className="block text-zinc-300 font-medium mb-1">Detalles adicionales (opcional):</label>
              <textarea
                rows={3}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Describe qué ocurrió, enlaces o contexto para la IA..."
                className="w-full bg-[#080d0a] border border-red-950 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-red-500 font-mono"
              />
            </div>

            <div className="p-3 bg-amber-950/30 border border-amber-900/60 rounded-xl text-[11px] text-amber-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                Los reportes se acumulan de forma anónima. Cuando suficientes usuarios reportan comportamientos similares, la IA notificará directamente al Administrador para aplicar restricciones o bloqueos definitivos.
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-medium cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Enviar Reporte a IA / Admin</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
