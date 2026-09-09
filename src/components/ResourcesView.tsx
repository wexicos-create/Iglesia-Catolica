import React, { useState } from 'react';
import { ExclusiveResource, UserProfile } from '../types';
import { BookOpen, Download, ShieldCheck, Cpu, CheckCircle2, FileText, Smartphone } from 'lucide-react';

interface ResourcesViewProps {
  resources: ExclusiveResource[];
  currentUser: UserProfile;
}

export const ResourcesView: React.FC<ResourcesViewProps> = ({
  resources,
  currentUser
}) => {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleDownload = (res: ExclusiveResource) => {
    setDownloadingId(res.id);
    setTimeout(() => {
      setDownloadingId(null);
      setSuccessMsg(`Descarga iniciada: ${res.title} (Verificado con Key Cuántica: ${currentUser.quantumKey.slice(0, 12)}...)`);
      setTimeout(() => setSuccessMsg(null), 5000);
    }, 1200);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#070b08] chattoj-pattern overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="bg-[#0d1410] border border-emerald-900/60 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-emerald-400" />
              <span>Recursos Exclusivos para Usuarios Registrados</span>
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Descarga instaladores APK, manuales de criptografía cuántica y herramientas de comunicación mesh sin intermediarios.
            </p>
          </div>

          <div className="bg-emerald-950/80 border border-emerald-800/60 rounded-xl p-3 text-right">
            <span className="text-[10px] font-mono text-emerald-400 block uppercase">Estado de Usuario</span>
            <span className="text-xs font-semibold text-white flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> ID: {currentUser.userId}
            </span>
          </div>
        </div>

        {successMsg && (
          <div className="bg-emerald-950/90 border border-emerald-500 text-emerald-300 px-4 py-3 rounded-xl text-xs flex items-center gap-2 glow-green-sm animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Resources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {resources.map((res) => (
            <div
              key={res.id}
              className="bg-[#0d1410] border border-emerald-900/60 rounded-2xl p-6 flex flex-col justify-between hover:border-emerald-700/80 transition-all shadow-xl group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase bg-emerald-950 text-emerald-400 px-2.5 py-1 rounded border border-emerald-900 flex items-center gap-1">
                    {res.category === 'apk' ? <Smartphone className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                    {res.category}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400">{res.version} • {res.fileSize}</span>
                </div>

                <h3 className="font-bold text-white text-base group-hover:text-emerald-300 transition-colors">
                  {res.title}
                </h3>

                <p className="text-xs text-zinc-400 leading-relaxed">
                  {res.description}
                </p>
              </div>

              <div className="pt-6 mt-4 border-t border-emerald-950 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-500">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Acceso verificado</span>
                </div>

                <button
                  onClick={() => handleDownload(res)}
                  disabled={downloadingId === res.id}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 text-black font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all glow-green-sm cursor-pointer disabled:cursor-not-allowed"
                >
                  <Download className="w-4 h-4" />
                  {downloadingId === res.id ? 'Descargando...' : 'Descargar Recurso'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
