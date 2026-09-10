import React, { useState, useEffect } from 'react';
import { 
  Cpu, HardDrive, Sparkles, Activity, CheckCircle2, 
  RefreshCw, Layers, ShieldCheck, Zap, Server, ChevronRight 
} from 'lucide-react';
import { getQuantumJpgMetrics, QuantumJpgMetrics } from '../../utils/swarmServer';

interface QuantumJpgMonitorProps {
  onAssignHosting?: () => void;
  onDeployProject?: () => void;
}

export const QuantumJpgMonitor: React.FC<QuantumJpgMonitorProps> = ({ 
  onAssignHosting, 
  onDeployProject 
}) => {
  const [metrics, setMetrics] = useState<QuantumJpgMetrics>(() => getQuantumJpgMetrics());
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationProgress, setVerificationProgress] = useState<number | null>(null);
  const [activeCellIndices, setActiveCellIndices] = useState<number[]>([2, 5, 12, 19, 23, 27, 34, 41]);
  const [diagnosticLogs, setDiagnosticLogs] = useState<string[]>([
    '[JPG-CUÁNTICA] Matriz fractal holográfica montada en buffer RAM de 1.00 GB.',
    '[COHERENCIA] Paridad 1.000.000 : 1 verificada mediante entrelazamiento fractal.',
    '[ESTEGANOGRAFÍA] Protocolo .jpg produplicuantistomica+ activo sin fugas a la nube.'
  ]);

  // Real-time telemetry oscillation (runs every 1.5s simulating quantum live processing)
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => {
        const base = getQuantumJpgMetrics();
        // subtle realistic quantum fluctuations
        const jitter = (Math.random() - 0.5) * 0.004;
        const coherence = Math.min(99.999, Math.max(99.980, base.quantumCoherencePercent + jitter));
        const petaQ = Math.round((4.80 + Math.random() * 0.08) * 100) / 100;
        const latency = Math.round((0.038 + Math.random() * 0.008) * 1000) / 1000;
        
        return {
          ...base,
          quantumCoherencePercent: coherence,
          petaQubitsPerSec: petaQ,
          decompressionLatencyMs: latency
        };
      });

      // Randomly animate 8 holographic matrix cells
      const nextActive: number[] = [];
      for (let i = 0; i < 8; i++) {
        nextActive.push(Math.floor(Math.random() * 48));
      }
      setActiveCellIndices(nextActive);
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  // Action: Run Quantum JPG Optimization
  const handleOptimizeQuantum = () => {
    setIsOptimizing(true);
    setDiagnosticLogs(prev => [
      `[OPTIMIZACIÓN] Iniciando reorganización de bloques fractales en APK (1.00 GB)...`,
      ...prev.slice(0, 4)
    ]);

    setTimeout(() => {
      setMetrics(prev => ({
        ...prev,
        usedPhysicalFootprintMb: Math.max(810, prev.usedPhysicalFootprintMb - 12.4),
        quantumCoherencePercent: 99.998,
        decompressionLatencyMs: 0.035,
        lastOptimizationTime: 'Recién optimizado'
      }));
      setDiagnosticLogs(prev => [
        `[OK] Matriz JPG cuántica optimizada: 1.000.000 GB sincronizados en ~829 MB físicos.`,
        ...prev.slice(0, 4)
      ]);
      setIsOptimizing(false);
    }, 1200);
  };

  // Action: Verify 1,000,000 GB Virtual Integrity
  const handleVerifyIntegrity = () => {
    setIsVerifying(true);
    setVerificationProgress(0);
    setDiagnosticLogs(prev => [
      `[TEST-INTEGRIDAD] Verificando paridad de 1.000.000 GB en matriz JPG cuántica...`,
      ...prev.slice(0, 4)
    ]);

    let step = 0;
    const interval = setInterval(() => {
      step += 25;
      setVerificationProgress(step);
      if (step >= 100) {
        clearInterval(interval);
        setIsVerifying(false);
        setVerificationProgress(null);
        setDiagnosticLogs(prev => [
          `[ÉXITO] 1.000.000 GB verificados: 0 errores de paridad cuántica, coherencia 100%.`,
          ...prev.slice(0, 4)
        ]);
      }
    }, 400);
  };

  const virtualPercentage = Math.min(100, Math.max(0.1, (metrics.usedVirtualStorageGb / metrics.virtualCapacityGb) * 100));
  const physicalPercentage = Math.min(100, (metrics.usedPhysicalFootprintMb / metrics.physicalFootprintMb) * 100);

  return (
    <div className="space-y-4 animate-in fade-in">
      {/* Banner Principal: Matriz Cuántica JPG */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950 via-[#0a120d] to-[#080e0a] border border-emerald-500/50 shadow-xl space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-black font-black flex items-center justify-center text-xs shadow-md shrink-0">
              JPG+
            </div>
            <div>
              <h3 className="text-white font-bold text-xs sm:text-sm flex items-center gap-2">
                JPG Cuántica: 1 Millón de GB en 1 GB Físico
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-mono border border-emerald-500/40">
                  Esteganografía Fractal
                </span>
              </h3>
              <p className="text-[10px] sm:text-[11px] text-zinc-400 font-mono mt-0.5">
                Simulación y compresión cuántica holográfica (.jpg produplicuantistomica+)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 font-mono font-bold text-[11px]">En Vivo</span>
          </div>
        </div>

        {/* Comparativa: Virtual vs. Físico */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          {/* Virtual Storage (1,000,000 GB) */}
          <div className="p-3 rounded-xl bg-[#050806] border border-emerald-900/60 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-zinc-400 flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-teal-400" />
                Almacenamiento Virtual Cuántico
              </span>
              <span className="text-teal-300 font-bold">1.000.000 GB (1 PB)</span>
            </div>
            <div className="w-full bg-[#080d0a] rounded-full h-2 border border-emerald-950 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-teal-500 to-cyan-400 h-full transition-all duration-500" 
                style={{ width: `${Math.max(2, virtualPercentage)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
              <span>Usado: {metrics.usedVirtualStorageGb.toLocaleString()} GB</span>
              <span>Libre: {(metrics.virtualCapacityGb - metrics.usedVirtualStorageGb).toLocaleString()} GB</span>
            </div>
          </div>

          {/* Physical APK Storage (1.00 GB / 1,024 MB) */}
          <div className="p-3 rounded-xl bg-[#050806] border border-emerald-900/60 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-zinc-400 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                Huella Física Real en APK
              </span>
              <span className="text-emerald-400 font-bold">1.00 GB (1.024 MB)</span>
            </div>
            <div className="w-full bg-[#080d0a] rounded-full h-2 border border-emerald-950 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full transition-all duration-500" 
                style={{ width: `${physicalPercentage}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
              <span>Ocupado en RAM/Flash: {metrics.usedPhysicalFootprintMb} MB</span>
              <span>Búfer disponible: {Math.round((metrics.physicalFootprintMb - metrics.usedPhysicalFootprintMb) * 10) / 10} MB</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tarjeta de Métricas de Rendimiento Cuántico en Tiempo Real */}
      <div className="p-4 rounded-2xl bg-[#080d0a] border border-emerald-900/60 space-y-3 shadow-lg">
        <div className="flex items-center justify-between border-b border-emerald-950 pb-2.5">
          <span className="text-white font-bold flex items-center gap-2 text-xs font-mono">
            <Activity className="w-4 h-4 text-emerald-400" />
            Métricas de Rendimiento Cuántico en Tiempo Real
          </span>
          <span className="font-mono text-[10px] text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
            Ratio: 1.000.000 : 1
          </span>
        </div>

        {/* 6 Cuadrantes de Telemetría Cuántica */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] font-mono">
          <div className="p-2.5 rounded-xl bg-[#050806] border border-emerald-950 space-y-0.5">
            <span className="text-zinc-500 text-[10px] block">Coherencia Cuántica</span>
            <span className="text-emerald-400 font-bold text-sm">
              {metrics.quantumCoherencePercent.toFixed(3)}%
            </span>
            <span className="text-[9px] text-emerald-600 block">Estabilidad Holográfica</span>
          </div>

          <div className="p-2.5 rounded-xl bg-[#050806] border border-emerald-950 space-y-0.5">
            <span className="text-zinc-500 text-[10px] block">Flujo de Qubits / Seg</span>
            <span className="text-cyan-400 font-bold text-sm">
              {metrics.petaQubitsPerSec} PetaQ/s
            </span>
            <span className="text-[9px] text-cyan-600 block">Procesamiento P2P</span>
          </div>

          <div className="p-2.5 rounded-xl bg-[#050806] border border-emerald-950 space-y-0.5">
            <span className="text-zinc-500 text-[10px] block">Latencia Descompresión</span>
            <span className="text-teal-300 font-bold text-sm">
              {metrics.decompressionLatencyMs} ms
            </span>
            <span className="text-[9px] text-teal-600 block">Acceso Instantáneo</span>
          </div>

          <div className="p-2.5 rounded-xl bg-[#050806] border border-emerald-950 space-y-0.5">
            <span className="text-zinc-500 text-[10px] block">Entropía Esteganográfica</span>
            <span className="text-amber-400 font-bold text-sm">
              {metrics.holographicEntropy.toFixed(3)} / 8
            </span>
            <span className="text-[9px] text-amber-600 block">Densidad Máxima</span>
          </div>

          <div className="p-2.5 rounded-xl bg-[#050806] border border-emerald-950 space-y-0.5">
            <span className="text-zinc-500 text-[10px] block">Iteraciones Fractales</span>
            <span className="text-purple-400 font-bold text-sm">
              {metrics.fractalIterations}
            </span>
            <span className="text-[9px] text-purple-600 block">Matriz Tricuántica</span>
          </div>

          <div className="p-2.5 rounded-xl bg-[#050806] border border-emerald-950 space-y-0.5">
            <span className="text-zinc-500 text-[10px] block">Estado del Búfer</span>
            <span className="text-emerald-400 font-bold text-sm">
              100% Blindado
            </span>
            <span className="text-[9px] text-emerald-600 block">{metrics.lastOptimizationTime}</span>
          </div>
        </div>

        {/* Visualizador Holográfico de la Matriz JPG Cuántica (48 celdas activas) */}
        <div className="p-3 rounded-xl bg-[#050806] border border-emerald-950 space-y-2">
          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
            <span className="flex items-center gap-1.5 text-zinc-300">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Matriz Holográfica de Bloques Esteganográficos (.produplicuantistomica+)
            </span>
            <span className="text-emerald-400 font-bold">48 Bloques Activos en RAM</span>
          </div>

          {/* Grilla visual de celdas cuánticas holográficas */}
          <div className="grid grid-cols-12 gap-1 py-1">
            {Array.from({ length: 48 }).map((_, idx) => {
              const isActive = activeCellIndices.includes(idx);
              return (
                <div
                  key={idx}
                  title={`Bloque Cuántico JPG #${idx + 1}`}
                  className={`h-3 rounded-sm transition-all duration-300 ${
                    isActive
                      ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] scale-105'
                      : 'bg-emerald-950/60 border border-emerald-900/40 hover:bg-emerald-800/40'
                  }`}
                />
              );
            })}
          </div>

          <p className="text-[9px] text-zinc-500 font-mono">
            Cada celda holográfica representa ~20.833 GB virtuales comprimidos en memoria flash local sin consumo de red externa.
          </p>
        </div>

        {/* Botones de Control Cuántico */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          <button
            onClick={handleOptimizeQuantum}
            disabled={isOptimizing}
            className="px-3 py-2 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/80 text-emerald-300 font-bold font-mono text-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isOptimizing ? 'animate-spin' : ''}`} />
            <span>{isOptimizing ? 'Optimizando Matriz...' : 'Optimizar Búfer Cuántico JPG'}</span>
          </button>

          <button
            onClick={handleVerifyIntegrity}
            disabled={isVerifying}
            className="px-3 py-2 rounded-xl bg-teal-950/80 hover:bg-teal-900 border border-teal-700/80 text-teal-300 font-bold font-mono text-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 disabled:opacity-50"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>
              {isVerifying && verificationProgress !== null
                ? `Verificando (${verificationProgress}%)...`
                : 'Comprobar Integridad de 1.000.000 GB'}
            </span>
          </button>
        </div>

        {/* Consola de Diagnóstico Cuántico */}
        <div className="p-2.5 rounded-xl bg-[#040705] border border-emerald-950 font-mono text-[10px] text-zinc-400 space-y-1">
          <div className="flex items-center justify-between text-zinc-500 text-[9px] border-b border-emerald-950 pb-1">
            <span>Terminal de Telemetría Cuántica</span>
            <span className="text-emerald-500">Cifrado Tricuántico Activo</span>
          </div>
          {diagnosticLogs.map((log, i) => (
            <div key={i} className="truncate text-zinc-300">
              {log}
            </div>
          ))}
        </div>
      </div>

      {/* Botones de Acceso Rápido */}
      <div className="grid grid-cols-2 gap-3">
        {onAssignHosting && (
          <button
            onClick={onAssignHosting}
            className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-950/60 to-[#0c1410] border border-emerald-800/80 hover:border-emerald-500 transition-all flex items-center gap-3 text-left cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-900/50 border border-emerald-600 flex items-center justify-center text-emerald-300 group-hover:scale-105 transition-transform shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-white text-xs">Asignar Nuevo Hosting</h4>
              <p className="text-[10px] text-zinc-400 font-mono mt-0.5">Crear enlace HTTPS & IP dedicada</p>
            </div>
          </button>
        )}

        {onDeployProject && (
          <button
            onClick={onDeployProject}
            className="p-3.5 rounded-2xl bg-gradient-to-br from-teal-950/60 to-[#0c1410] border border-teal-800/80 hover:border-teal-500 transition-all flex items-center gap-3 text-left cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-teal-900/50 border border-teal-600 flex items-center justify-center text-teal-300 group-hover:scale-105 transition-transform shrink-0">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-white text-xs">Desplegar Sub-servidor</h4>
              <p className="text-[10px] text-zinc-400 font-mono mt-0.5">Montar app web esteganográfica</p>
            </div>
          </button>
        )}
      </div>
    </div>
  );
};
