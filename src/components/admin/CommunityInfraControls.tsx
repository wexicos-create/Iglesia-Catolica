import React, { useState } from 'react';
import { 
  Network, ShieldAlert, Cpu, Check, Save, 
  Radio, Lock, Unlock, Server, Globe, Sparkles 
} from 'lucide-react';
import { 
  CommunityInfrastructureConfig, 
  getCommunityInfraConfig, 
  saveCommunityInfraConfig 
} from '../../utils/swarmServer';

export const CommunityInfraControls: React.FC = () => {
  const [config, setConfig] = useState<CommunityInfrastructureConfig>(() => getCommunityInfraConfig());
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleToggleUnrestricted = () => {
    const updated: CommunityInfrastructureConfig = {
      ...config,
      unrestrictedMode: !config.unrestrictedMode,
      bypassBandwidthCaps: !config.unrestrictedMode,
      infiniteNodeMesh: !config.unrestrictedMode
    };
    setConfig(updated);
    saveCommunityInfraConfig(updated);
    showSaveToast();
  };

  const handleToggleBypassCaps = () => {
    const updated = { ...config, bypassBandwidthCaps: !config.bypassBandwidthCaps };
    setConfig(updated);
    saveCommunityInfraConfig(updated);
    showSaveToast();
  };

  const handleToggleInfiniteMesh = () => {
    const updated = { ...config, infiniteNodeMesh: !config.infiniteNodeMesh };
    setConfig(updated);
    saveCommunityInfraConfig(updated);
    showSaveToast();
  };

  const handleSaveIpAndPort = (e: React.FormEvent) => {
    e.preventDefault();
    saveCommunityInfraConfig(config);
    showSaveToast();
  };

  const showSaveToast = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="space-y-4 animate-in fade-in">
      {/* Banner de Control Comunitario */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950 via-[#0a120d] to-[#080e0a] border border-emerald-600/60 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500 text-emerald-400 flex items-center justify-center">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-white font-bold text-xs sm:text-sm flex items-center gap-2">
                Control de Infraestructura Comunitaria
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-mono border border-emerald-500/40">
                  Sin Restricciones
                </span>
              </h3>
              <p className="text-[10px] sm:text-[11px] text-zinc-400 font-mono">
                Gestión total de nodos de retransmisión, subdominios sobre IP real y seguridad HTTPS
              </p>
            </div>
          </div>

          {savedSuccess && (
            <span className="px-2.5 py-1 rounded-lg bg-emerald-950 border border-emerald-500 text-emerald-300 font-mono text-[10px] flex items-center gap-1 animate-in fade-in">
              <Check className="w-3 h-3" /> ¡Guardado!
            </span>
          )}
        </div>
      </div>

      {/* Interruptores de Infraestructura Libre y Soberana */}
      <div className="p-4 rounded-2xl bg-[#080d0a] border border-emerald-900/60 space-y-3 shadow-lg">
        <h4 className="text-white font-bold text-xs font-mono flex items-center gap-2 border-b border-emerald-950 pb-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          Políticas de Red y Rendimiento Libre
        </h4>

        <div className="space-y-2.5">
          {/* Modo Sin Restricciones Maestro */}
          <div className="p-3 rounded-xl bg-[#050806] border border-emerald-900/50 flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-white font-bold text-xs">Modo Maestro Sin Restricciones</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 text-[9px] font-mono font-bold">
                  RECOMENDADO
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                Desbloquea el ancho de banda total, anula límites de transferencia y habilita subdominios ilimitados.
              </p>
            </div>

            <button
              type="button"
              onClick={handleToggleUnrestricted}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                config.unrestrictedMode 
                  ? 'bg-emerald-500 text-black shadow' 
                  : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
              }`}
            >
              {config.unrestrictedMode ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              <span>{config.unrestrictedMode ? 'ACTIVADO' : 'LIMITADO'}</span>
            </button>
          </div>

          {/* Bypass de Cuotas de Ancho de Banda */}
          <div className="p-3 rounded-xl bg-[#050806] border border-emerald-950 flex items-center justify-between gap-3">
            <div>
              <span className="text-white font-bold text-xs">Bypass de Cuotas de Tráfico P2P</span>
              <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                Permite descargas y streaming sin corte a ningún nodo comunitario invitado.
              </p>
            </div>

            <button
              type="button"
              onClick={handleToggleBypassCaps}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                config.bypassBandwidthCaps 
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' 
                  : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {config.bypassBandwidthCaps ? 'LIBRE (ILIMITADO)' : 'LIMITADO'}
            </button>
          </div>

          {/* Malla Infinita de Nodos */}
          <div className="p-3 rounded-xl bg-[#050806] border border-emerald-950 flex items-center justify-between gap-3">
            <div>
              <span className="text-white font-bold text-xs">Malla de Nodos Concurrente</span>
              <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                Multiplica el enrutamiento fractal para evitar puntos únicos de fallo.
              </p>
            </div>

            <button
              type="button"
              onClick={handleToggleInfiniteMesh}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                config.infiniteNodeMesh 
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' 
                  : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {config.infiniteNodeMesh ? 'ACTIVA (14.892 NODOS)' : 'REDUCIDA'}
            </button>
          </div>
        </div>
      </div>

      {/* Configuración de IP Real del Host y Puertos HTTPS */}
      <div className="p-4 rounded-2xl bg-[#080d0a] border border-emerald-900/60 space-y-3 shadow-lg">
        <h4 className="text-white font-bold text-xs font-mono flex items-center gap-2 border-b border-emerald-950 pb-2">
          <Globe className="w-4 h-4 text-emerald-400" />
          Enrutamiento de Hosting: Subdominios como Extensión de tu IP Real
        </h4>

        <p className="text-[11px] text-zinc-300">
          El sistema fuerza estrictamente conexiones bajo <strong>HTTPS</strong>. Cada subdominio generado para un cliente o proyecto se resuelve como una extensión directa de tu IP real (o tipo localhost).
        </p>

        <form onSubmit={handleSaveIpAndPort} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-400 font-mono text-[11px] mb-1">
                Tu Dirección IP Real (LAN / Pública)
              </label>
              <input
                type="text"
                value={config.realIpHost}
                onChange={(e) => setConfig({ ...config, realIpHost: e.target.value })}
                placeholder="ej. 192.168.1.100 o tu IP pública"
                required
                className="w-full px-3 py-2 rounded-xl bg-[#050806] border border-emerald-900 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[9px] text-zinc-500 font-mono mt-0.5 block">
                Los subdominios usarán formato: https://[cliente].{config.realIpHost || '192.168.1.100'}.nip.io:{config.defaultHttpsPort}
              </span>
            </div>

            <div>
              <label className="block text-zinc-400 font-mono text-[11px] mb-1">
                Puerto Seguro HTTPS
              </label>
              <input
                type="number"
                value={config.defaultHttpsPort}
                onChange={(e) => setConfig({ ...config, defaultHttpsPort: Number(e.target.value) })}
                placeholder="ej. 8443 o 3000"
                min={1}
                max={65535}
                required
                className="w-full px-3 py-2 rounded-xl bg-[#050806] border border-emerald-900 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[9px] text-zinc-500 font-mono mt-0.5 block">
                Puerto SSL/TLS cuántico local para túneles HTTPS.
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#050806] border border-emerald-950 font-mono text-[10px] text-zinc-400 space-y-1">
            <span className="text-emerald-400 font-bold block">Vista Previa de URL de Hosting Generada:</span>
            <div className="text-zinc-200 truncate font-semibold">
              https://comunidad.{config.realIpHost || '192.168.1.100'}.nip.io:{config.defaultHttpsPort || 8443}
            </div>
            <div className="text-zinc-400 truncate">
              O modo Localhost: https://comunidad.localhost:3000
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-black font-bold font-mono text-xs flex items-center gap-1.5 shadow cursor-pointer transition-all active:scale-95"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Guardar Configuración de Infraestructura</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
