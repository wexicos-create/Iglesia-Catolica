import React, { useState, useEffect } from 'react';
import { 
  Server, Globe, HardDrive, Cpu, Plus, ExternalLink, Copy, 
  Trash2, X, Check, Code, ShieldCheck, RefreshCw, Eye, Sparkles, Database, Layers, Network, Users, Ban, ShieldAlert,
  DollarSign, Key, PauseCircle, PlayCircle, ShoppingBag, Tag, CheckCircle2, AlertCircle, Shield
} from 'lucide-react';
import { 
  HostedProject, getHostedProjects, deployProjectToSwarm, 
  deleteHostedProject, INITIAL_SWARM_STATS, HostingAccount, 
  getHostingAccounts, createHostingAccount, deleteHostingAccount,
  RamDatabaseTable, getRamDatabaseTables, HOSTING_PLANS, HostingPlan, toggleHostingAccountStatus
} from '../utils/swarmServer';
import { getGeneralReports, GeneralReport, dismissReports, authorizeAdminAction } from '../utils/reportsRegistry';
import { tricuanticoEncrypt } from '../utils/cryptoEngine';
import { QuantumJpgMonitor } from './admin/QuantumJpgMonitor';
import { HostingPlansManager } from './admin/HostingPlansManager';
import { InvitationsManager } from './admin/InvitationsManager';
import { CommunityInfraControls } from './admin/CommunityInfraControls';
import { NodeJsServerBackendManager } from './admin/NodeJsServerBackendManager';

interface AdminServerManagerProps {
  onClose: () => void;
}

export const AdminServerManager: React.FC<AdminServerManagerProps> = ({ onClose }) => {
  const [activeSubTab, setActiveSubTab] = useState<'server_node' | 'infrastructure' | 'plans' | 'invitations' | 'community' | 'hosting' | 'ram_db' | 'projects' | 'users'>('server_node');
  const [selectedPlanForInvite, setSelectedPlanForInvite] = useState<HostingPlan | null>(null);
  
  const [projects, setProjects] = useState<HostedProject[]>(() => getHostedProjects());
  const [hostingAccounts, setHostingAccounts] = useState<HostingAccount[]>(() => getHostingAccounts());
  const [ramTables, setRamTables] = useState<RamDatabaseTable[]>(() => getRamDatabaseTables());
  
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Deploy project modal state
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectCategory, setProjectCategory] = useState<HostedProject['category']>('website');
  const [projectDesc, setProjectDesc] = useState('');
  const [customIp, setCustomIp] = useState('');

  // Create hosting account modal state
  const [showHostingModal, setShowHostingModal] = useState(false);
  const [clientName, setClientName] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('plan-pro-enjambre');
  const [rentalPeriod, setRentalPeriod] = useState<'Mensual' | 'Anual' | 'Permanente'>('Mensual');
  const [customPriceUsd, setCustomPriceUsd] = useState<number>(15);
  const [customDomain, setCustomDomain] = useState('');

  useEffect(() => {
    const handleUpdate = () => {
      setProjects(getHostedProjects());
      setHostingAccounts(getHostingAccounts());
      setRamTables(getRamDatabaseTables());
      // Trigger a re-render if reports are viewed
      if (activeSubTab === 'users') {
          // hacky way to force re-render for reports inline map
          setCopiedUrl(null);
      }
    };
    window.addEventListener('chattoj-swarm-projects-updated', handleUpdate);
    window.addEventListener('chattoj-swarm-hosting-updated', handleUpdate);
    window.addEventListener('chattoj-reports-updated', handleUpdate);
    return () => {
      window.removeEventListener('chattoj-swarm-projects-updated', handleUpdate);
      window.removeEventListener('chattoj-swarm-hosting-updated', handleUpdate);
      window.removeEventListener('chattoj-reports-updated', handleUpdate);
    };
  }, [activeSubTab]);

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url).catch(() => {});
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const handleDeploySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) return;
    deployProjectToSwarm(
      projectName.trim(),
      projectCategory,
      projectDesc.trim(),
      undefined,
      customIp.trim() || undefined
    );
    setProjectName('');
    setProjectDesc('');
    setCustomIp('');
    setShowDeployModal(false);
  };

  const handleHostingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) return;
    createHostingAccount(
      clientName.trim(), 
      selectedPlanId, 
      customDomain.trim() || undefined,
      rentalPeriod,
      customPriceUsd
    );
    setClientName('');
    setCustomDomain('');
    setShowHostingModal(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#0b100d] animate-in fade-in">
      {/* Top Header */}
      <div className="p-4 bg-[#070b08] border-b border-emerald-950 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-emerald-950 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shadow-inner">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Infraestructura & Cloud Hosting</span>
              <span className="px-2 py-0.5 bg-emerald-950 border border-emerald-600/60 text-emerald-300 rounded-full text-[9px] font-mono">
                Admin Master
              </span>
            </h2>
            <p className="text-[10px] text-zinc-400 font-mono">
              Servidor Enjambre P2P • Nube Cuántica
            </p>
          </div>
        </div>
      </div>

        {/* Navigation Tabs Bar */}
        <div className="px-4 py-2.5 bg-[#080d0a] border-b border-emerald-950 flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('server_node')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
              activeSubTab === 'server_node' 
                ? 'bg-emerald-500 text-black font-bold shadow-[0_0_10px_rgba(16,185,129,0.3)]' 
                : 'bg-[#0f1712] text-zinc-400 hover:text-white border border-emerald-950'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Servidor Node.js (IP 187.190.179.230)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('infrastructure')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
              activeSubTab === 'infrastructure' 
                ? 'bg-emerald-600 text-black font-bold shadow' 
                : 'bg-[#0f1712] text-zinc-400 hover:text-white border border-emerald-950'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>JPG Cuántica (1M GB)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('plans')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
              activeSubTab === 'plans' 
                ? 'bg-emerald-600 text-black font-bold shadow' 
                : 'bg-[#0f1712] text-zinc-400 hover:text-white border border-emerald-950'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Planes de Renta</span>
          </button>

          <button
            onClick={() => setActiveSubTab('invitations')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
              activeSubTab === 'invitations' 
                ? 'bg-emerald-600 text-black font-bold shadow' 
                : 'bg-[#0f1712] text-zinc-400 hover:text-white border border-emerald-950'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Links Invitación HTTPS</span>
          </button>

          <button
            onClick={() => setActiveSubTab('community')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
              activeSubTab === 'community' 
                ? 'bg-emerald-600 text-black font-bold shadow' 
                : 'bg-[#0f1712] text-zinc-400 hover:text-white border border-emerald-950'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            <span>Infraestructura Libre</span>
          </button>

          <button
            onClick={() => setActiveSubTab('hosting')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
              activeSubTab === 'hosting' 
                ? 'bg-emerald-600 text-black font-bold shadow' 
                : 'bg-[#0f1712] text-zinc-400 hover:text-white border border-emerald-950'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Hosting Asignado ({hostingAccounts.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('ram_db')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
              activeSubTab === 'ram_db' 
                ? 'bg-emerald-600 text-black font-bold shadow' 
                : 'bg-[#0f1712] text-zinc-400 hover:text-white border border-emerald-950'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Base de Datos en RAM</span>
          </button>

          <button
            onClick={() => setActiveSubTab('projects')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
              activeSubTab === 'projects' 
                ? 'bg-emerald-600 text-black font-bold shadow' 
                : 'bg-[#0f1712] text-zinc-400 hover:text-white border border-emerald-950'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Sub-servidores Web ({projects.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('users')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
              activeSubTab === 'users' 
                ? 'bg-emerald-600 text-black font-bold shadow' 
                : 'bg-[#0f1712] text-zinc-400 hover:text-white border border-emerald-950'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Control Nodos & Usuarios</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          
          {/* TAB 0: CENTRAL NODE.JS SOVEREIGN SERVER & HIDDEN VAULT */}
          {activeSubTab === 'server_node' && (
            <NodeJsServerBackendManager />
          )}

          {/* TAB 1: QUANTUM JPG MONITOR & INFRASTRUCTURE */}
          {activeSubTab === 'infrastructure' && (
            <QuantumJpgMonitor 
              onAssignHosting={() => setActiveSubTab('invitations')}
              onDeployProject={() => setShowDeployModal(true)}
            />
          )}

          {/* TAB 2: HOSTING RENTAL PLANS CONFIGURATION */}
          {activeSubTab === 'plans' && (
            <HostingPlansManager
              onGenerateInvitationWithPlan={(plan) => {
                setSelectedPlanForInvite(plan);
                setActiveSubTab('invitations');
              }}
            />
          )}

          {/* TAB 3: PERSONALIZED INVITATION LINKS GENERATOR */}
          {activeSubTab === 'invitations' && (
            <InvitationsManager
              initialPlan={selectedPlanForInvite}
              onClearInitialPlan={() => setSelectedPlanForInvite(null)}
            />
          )}

          {/* TAB 4: UNRESTRICTED COMMUNITY INFRASTRUCTURE CONTROLS */}
          {activeSubTab === 'community' && (
            <CommunityInfraControls />
          )}

          {/* TAB 2: HOSTING & CLOUD ACCESS PANEL */}
          {activeSubTab === 'hosting' && (
            <div className="space-y-4 animate-in fade-in">
              {/* Financial & Revenue Summary Header */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-[#0a120d] to-[#080e0a] border border-emerald-800/60 shadow-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-emerald-400" />
                    <h3 className="font-bold text-white text-xs">Sistema de Venta y Renta de Hosting Comunitario</h3>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedPlanId('plan-pro-enjambre');
                      setCustomPriceUsd(15);
                      setShowHostingModal(true);
                    }}
                    className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl text-xs flex items-center gap-1.5 shadow transition-all cursor-pointer active:scale-95"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>Rentar Nuevo Hosting</span>
                  </button>
                </div>

                {/* Metrics Summary */}
                <div className="grid grid-cols-4 gap-2 pt-1 font-mono text-[10px]">
                  <div className="p-2.5 rounded-xl bg-[#050806] border border-emerald-950 text-center">
                    <span className="text-zinc-500 block mb-0.5">Ingreso Estimado</span>
                    <span className="text-emerald-400 font-bold text-xs">
                      ${hostingAccounts.reduce((acc, a) => acc + (a.status === 'activo' ? (a.monthlyPriceUsd || 0) : 0), 0)} USD/Mes
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#050806] border border-emerald-950 text-center">
                    <span className="text-zinc-500 block mb-0.5">Hosting Rentados</span>
                    <span className="text-white font-bold text-xs">{hostingAccounts.length} Nodos</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#050806] border border-emerald-950 text-center">
                    <span className="text-zinc-500 block mb-0.5">RAM Asignada</span>
                    <span className="text-teal-400 font-bold text-xs">
                      {hostingAccounts.reduce((acc, a) => acc + (a.ramGb || 0), 0)} GB
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#050806] border border-emerald-950 text-center">
                    <span className="text-zinc-500 block mb-0.5">Control APK</span>
                    <span className="text-emerald-300 font-bold text-xs">Soberano Sin Limite</span>
                  </div>
                </div>
              </div>

              {/* HOSTING PLANS CATALOG */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5 font-mono">
                    <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Catálogo de Planes Comercializables</span>
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {HOSTING_PLANS.map((plan) => (
                    <div key={plan.id} className="p-3.5 rounded-2xl bg-[#080d0a] border border-emerald-900/60 hover:border-emerald-700/80 transition-all flex flex-col justify-between space-y-2">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-xs font-bold text-white">{plan.name}</span>
                            <p className="text-[10px] text-zinc-400 mt-0.5">{plan.description}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-sm font-black text-emerald-400 font-mono">
                              {plan.priceUsd === 0 ? 'GRATIS' : `$${plan.priceUsd}`}
                            </span>
                            {plan.priceUsd > 0 && <span className="text-[9px] text-zinc-500 block font-mono">/mes</span>}
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-1 my-2 font-mono text-[9px] text-center">
                          <span className="p-1 rounded bg-[#050806] border border-emerald-950 text-emerald-300">{plan.ramGb > 1000 ? '1M GB' : `${plan.ramGb} GB`} RAM</span>
                          <span className="p-1 rounded bg-[#050806] border border-emerald-950 text-zinc-300">{plan.storageGb > 1000 ? '1M GB' : `${plan.storageGb} GB`} SSD</span>
                          <span className="p-1 rounded bg-[#050806] border border-emerald-950 text-teal-300">{plan.bandwidth}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedPlanId(plan.id);
                          setCustomPriceUsd(plan.priceUsd);
                          setShowHostingModal(true);
                        }}
                        className="w-full py-1.5 rounded-xl bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 text-[10px] font-bold font-mono transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                      >
                        <Tag className="w-3 h-3" />
                        <span>Rentar Plan a Cliente (${plan.priceUsd}/mes)</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* RENTED ACCOUNTS MANAGEMENT LIST */}
              <div className="space-y-2.5 pt-2">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5 font-mono">
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Cuentas de Hosting Activas y Rentadas ({hostingAccounts.length})</span>
                </h4>

                {hostingAccounts.length === 0 ? (
                  <div className="p-6 text-center border border-dashed border-emerald-900/50 rounded-2xl">
                    <Layers className="w-8 h-8 text-emerald-800 mx-auto mb-2" />
                    <p className="text-zinc-500 font-mono text-[11px]">No hay cuentas de hosting asignadas actualmente.</p>
                  </div>
                ) : (
                  hostingAccounts.map((acc) => (
                    <div key={acc.id} className="p-3.5 rounded-2xl bg-[#080d0a] border border-emerald-950 hover:border-emerald-800 transition-all space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-white text-sm">{acc.clientName}</h4>
                            <span className="px-2 py-0.5 rounded-md bg-emerald-950 border border-emerald-800 text-emerald-400 text-[9px] font-mono font-bold">
                              {acc.planName || 'Plan Pro Enjambre'}
                            </span>
                          </div>
                          <p className="text-[11px] font-mono text-emerald-400">{acc.domain}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${
                            acc.status === 'activo' ? 'bg-emerald-950 text-emerald-300 border-emerald-800' :
                            acc.status === 'pausado' ? 'bg-amber-950 text-amber-300 border-amber-800' :
                            'bg-red-950 text-red-300 border-red-800'
                          }`}>
                            {acc.status}
                          </span>

                          <button
                            onClick={() => {
                              toggleHostingAccountStatus(acc.id);
                              setHostingAccounts(getHostingAccounts());
                            }}
                            className="p-1.5 text-zinc-400 hover:text-amber-300 rounded-lg hover:bg-amber-950/30 transition-colors"
                            title="Cambiar Estado (Activo/Pausado/Suspendido)"
                          >
                            {acc.status === 'activo' ? <PauseCircle className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
                          </button>

                          <button
                            onClick={() => {
                              deleteHostingAccount(acc.id);
                              setHostingAccounts(getHostingAccounts());
                            }}
                            className="p-1.5 text-zinc-400 hover:text-red-400 rounded-lg hover:bg-red-950/30 transition-colors"
                            title="Revocar y Eliminar Hosting"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-2 pt-1 font-mono text-[10px]">
                        <div className="p-2 rounded-xl bg-[#050806] border border-emerald-950">
                          <span className="text-zinc-500 block">Renta Mensual</span>
                          <span className="text-emerald-400 font-bold">${acc.monthlyPriceUsd || 0} USD</span>
                        </div>
                        <div className="p-2 rounded-xl bg-[#050806] border border-emerald-950">
                          <span className="text-zinc-500 block">RAM / Disco</span>
                          <span className="text-white font-bold">{acc.ramGb > 1000 ? '1M' : acc.ramGb}GB / {acc.storageGb > 1000 ? '1M' : acc.storageGb}GB</span>
                        </div>
                        <div className="p-2 rounded-xl bg-[#050806] border border-emerald-950">
                          <span className="text-zinc-500 block">IP P2P</span>
                          <span className="text-teal-400 font-bold">{acc.ipAddress}</span>
                        </div>
                        <div className="p-2 rounded-xl bg-[#050806] border border-emerald-950">
                          <span className="text-zinc-500 block">Periodo</span>
                          <span className="text-zinc-300 font-bold">{acc.rentalPeriod || 'Mensual'}</span>
                        </div>
                      </div>

                      {/* APK Access Key Row */}
                      <div className="p-2 rounded-xl bg-[#050806] border border-emerald-900/50 flex items-center justify-between text-[10px] font-mono">
                        <div className="flex items-center gap-1.5 overflow-hidden">
                          <Key className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="text-zinc-400">Llave APK Cliente:</span>
                          <span className="text-emerald-300 font-bold truncate">{acc.accessKey || 'KEY_APK_CLIENT_309182'}</span>
                        </div>
                        <button
                          onClick={() => handleCopy(acc.accessKey || 'KEY_APK_CLIENT_309182')}
                          className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 shrink-0 ml-2 cursor-pointer"
                        >
                          <Copy className="w-3 h-3" />
                          <span>{copiedUrl === (acc.accessKey || 'KEY_APK_CLIENT_309182') ? '¡Copiado!' : 'Copiar Llave'}</span>
                        </button>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-emerald-950 text-[10px] font-mono text-zinc-400">
                        <span>Creado: {acc.createdAt}</span>
                        <button
                          onClick={() => handleCopy(`https://${acc.domain}`)}
                          className="text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3 h-3" />
                          {copiedUrl === `https://${acc.domain}` ? '¡Copiado!' : 'Copiar URL Dominio (HTTPS)'}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: RAM DATABASE */}
          {activeSubTab === 'ram_db' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-xs">Base de Datos Montada en Memoria RAM</h3>
                  <p className="text-[10px] text-zinc-400 font-mono">Tablas de alta velocidad indexadas directamente en RAM del servidor.</p>
                </div>
                <button
                  onClick={() => setRamTables([...getRamDatabaseTables()])}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs flex items-center gap-1.5 font-mono cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Sincronizar</span>
                </button>
              </div>

              <div className="space-y-2">
                {ramTables.map((tbl, idx) => (
                  <div key={idx} className="p-3 rounded-2xl bg-[#080d0a] border border-emerald-950 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-950/80 border border-emerald-800 flex items-center justify-center text-emerald-400">
                        <Database className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-mono text-white text-xs font-bold">{tbl.name}</h4>
                        <p className="text-[10px] text-zinc-400 font-mono">{tbl.recordsCount.toLocaleString()} registros indexados</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-emerald-300 font-bold text-xs">{tbl.ramMb} MB</span>
                      <span className="block text-[9px] font-mono text-teal-400 uppercase">{tbl.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: PROJECTS / SUB-SERVERS */}
          {activeSubTab === 'projects' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-xs">Sub-servidores Web Esteganográficos</h3>
                  <p className="text-[10px] text-zinc-400 font-mono">Contenedores .jpg produplicuantistomica+ alojados en el enjambre.</p>
                </div>
                <button
                  onClick={() => setShowDeployModal(true)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-black font-bold rounded-xl text-xs flex items-center gap-1.5 shadow transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Subir Proyecto</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {projects.map((proj) => (
                  <div key={proj.id} className="p-3.5 rounded-2xl bg-[#080d0a] border border-emerald-950 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-white text-sm">{proj.name}</h4>
                        <p className="text-[11px] font-mono text-teal-400">{proj.url}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopy(proj.url)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-300 hover:bg-emerald-900 border border-emerald-800 text-[10px] font-mono flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3 h-3" />
                          {copiedUrl === proj.url ? '¡Copiado!' : 'Copiar URL'}
                        </button>
                        <button
                          onClick={() => deleteHostedProject(proj.id)}
                          className="p-1.5 text-zinc-400 hover:text-red-400 rounded-lg hover:bg-red-950/30 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-[11px] text-zinc-300">{proj.description}</p>
                    <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 pt-1 border-t border-emerald-950">
                      <span>Contenedor: {proj.steganoImageName}</span>
                      <span>Uso: {proj.storageUsedMb} MB</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: USERS MANAGEMENT */}
          {activeSubTab === 'users' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-950/20 border border-emerald-900/50">
                <div>
                  <h3 className="text-emerald-400 font-bold flex items-center gap-2 mb-1">
                    <ShieldAlert className="w-4 h-4" />
                    Control de Nodos
                  </h3>
                  <p className="text-[11px] text-zinc-400">Ver y gestionar nodos reportados en la red P2P o ejecutar bloqueos tricuanticos.</p>
                </div>
              </div>

              <div className="space-y-3">
                {getGeneralReports().length === 0 ? (
                   <div className="p-6 text-center border border-dashed border-emerald-900/50 rounded-2xl">
                     <Shield className="w-8 h-8 text-emerald-800 mx-auto mb-2" />
                     <p className="text-zinc-500 font-mono text-[11px]">No hay reportes ni nodos marcados</p>
                   </div>
                ) : (
                  getGeneralReports().map((report, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-[#080d0a] border border-emerald-900/40 hover:border-emerald-700/60 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-white font-bold">{report.targetName}</span>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                              report.status === 'pendiente' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                              report.status === 'bloqueado' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                              'bg-zinc-800 text-zinc-400 border border-zinc-700'
                            }`}>
                              {report.status}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 text-[9px] font-mono">
                              Origen: {report.source}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400 mb-1">
                            <span className="text-emerald-500">Motivo:</span> {report.reason}
                          </p>
                          <p className="text-[10px] text-zinc-500 font-mono">ID Reporte: {report.id} • Cifrado de Red: {tricuanticoEncrypt(report.targetId).substring(0, 24)}...</p>
                        </div>

                        {report.status === 'pendiente' && (
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() => {
                                authorizeAdminAction(report.targetName, 'Violación de red');
                                window.dispatchEvent(new CustomEvent('chattoj-swarm-projects-updated'));
                              }}
                              className="px-2.5 py-1 rounded-lg bg-red-950/40 text-red-400 hover:bg-red-900/60 border border-red-900/50 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Ban className="w-3 h-3" /> Bloquear
                            </button>
                            <button
                              onClick={() => {
                                dismissReports(report.targetName);
                                window.dispatchEvent(new CustomEvent('chattoj-swarm-projects-updated'));
                              }}
                              className="px-2.5 py-1 rounded-lg bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800 text-[10px] font-bold cursor-pointer"
                            >
                              Ignorar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-3 bg-[#070b08] border-t border-emerald-950 flex items-center justify-between text-[11px] font-mono text-zinc-400">
          <span>Servidor Enjambre P2P • Control Raíz</span>
        </div>

      {/* MODAL: CREATE HOSTING ACCOUNT */}
      {showHostingModal && (
        <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 animate-in fade-in">
          <div className="bg-[#0e1410] border border-emerald-700 rounded-3xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-emerald-950 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-emerald-400" />
                <span>Rentar & Asignar Hosting Comunitario</span>
              </h3>
              <button onClick={() => setShowHostingModal(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleHostingSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 font-mono mb-1">Nombre de Cliente o Nodo Comunitario</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="ej. Red Libre de Medios Sur"
                  required
                  className="w-full px-3 py-2.5 rounded-xl bg-[#060a08] border border-emerald-900 text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-mono mb-1">Seleccionar Plan Comercial</label>
                <select
                  value={selectedPlanId}
                  onChange={(e) => {
                    setSelectedPlanId(e.target.value);
                    const plan = HOSTING_PLANS.find(p => p.id === e.target.value);
                    if (plan) setCustomPriceUsd(plan.priceUsd);
                  }}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#060a08] border border-emerald-900 text-white font-mono focus:outline-none focus:border-emerald-500"
                >
                  {HOSTING_PLANS.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} — ${p.priceUsd}/mes ({p.ramGb > 1000 ? '1M' : p.ramGb}GB RAM)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-zinc-400 font-mono mb-1">Periodo de Renta</label>
                  <select
                    value={rentalPeriod}
                    onChange={(e) => setRentalPeriod(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#060a08] border border-emerald-900 text-white font-mono focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Mensual">Mensual</option>
                    <option value="Anual">Anual (Descuento)</option>
                    <option value="Permanente">Permanente / Comunitario</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 font-mono mb-1">Precio Cobrado (USD/Mes)</label>
                  <input
                    type="number"
                    value={customPriceUsd}
                    onChange={(e) => setCustomPriceUsd(Number(e.target.value))}
                    min={0}
                    step={1}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#060a08] border border-emerald-900 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-mono mb-1">Subdominio / Dominio Personalizado</label>
                <input
                  type="text"
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  placeholder="ej. redmedios.chattoj.net o mi-dominio.com"
                  className="w-full px-3 py-2.5 rounded-xl bg-[#060a08] border border-emerald-900 text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-[#050806] border border-emerald-950 font-mono text-[10px] space-y-1">
                <div className="flex justify-between text-zinc-400">
                  <span>Generador de Llave APK:</span>
                  <span className="text-emerald-400 font-bold">KEY_APK_AUTO_ENABLED</span>
                </div>
                <p className="text-zinc-500 text-[9px]">El cliente utilizará esta llave en su APK para vincularse al servidor local.</p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowHostingModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-white font-mono cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold font-mono cursor-pointer transition-all active:scale-95"
                >
                  Confirmar y Activar Hosting
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DEPLOY WEB PROJECT */}
      {showDeployModal && (
        <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 animate-in fade-in">
          <div className="bg-[#0e1410] border border-emerald-700 rounded-3xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-emerald-950 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-400" />
                <span>Desplegar Sub-servidor Web</span>
              </h3>
              <button onClick={() => setShowDeployModal(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDeploySubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 font-mono mb-1">Nombre del Proyecto</label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="ej. Blog Libre P2P"
                  required
                  className="w-full px-3 py-2.5 rounded-xl bg-[#060a08] border border-emerald-900 text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-mono mb-1">Categoría</label>
                <select
                  value={projectCategory}
                  onChange={(e) => setProjectCategory(e.target.value as any)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#060a08] border border-emerald-900 text-white font-mono focus:outline-none focus:border-emerald-500"
                >
                  <option value="website">Sitio Web Estático</option>
                  <option value="webapp">Web App Interactiva</option>
                  <option value="subserver">Sub-servidor de Red</option>
                  <option value="database">Base de Datos</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 font-mono mb-1">Descripción</label>
                <textarea
                  value={projectDesc}
                  onChange={(e) => setProjectDesc(e.target.value)}
                  placeholder="Breve descripción del servicio o sitio web..."
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#060a08] border border-emerald-900 text-white font-mono focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-mono mb-1">IP o Subred Personalizada (Opcional)</label>
                <input
                  type="text"
                  value={customIp}
                  onChange={(e) => setCustomIp(e.target.value)}
                  placeholder="ej. 102.34.00.88"
                  className="w-full px-3 py-2.5 rounded-xl bg-[#060a08] border border-emerald-900 text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeployModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-white font-mono cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-black font-bold font-mono cursor-pointer"
                >
                  Desplegar en Enjambre
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
