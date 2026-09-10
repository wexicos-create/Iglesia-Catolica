import React, { useState } from 'react';
import { 
  Key, Copy, ExternalLink, Trash2, Plus, Check, 
  Globe, ShieldCheck, Zap, X, Clock, Layers, Lock 
} from 'lucide-react';
import { 
  HostingInvitation, 
  getHostingInvitations, 
  createHostingInvitation, 
  revokeHostingInvitation,
  getHostingPlans, 
  HostingPlan,
  getCommunityInfraConfig,
  buildSubdomainHostingUrl,
  ensureHttps
} from '../../utils/swarmServer';

interface InvitationsManagerProps {
  initialPlan?: HostingPlan | null;
  onClearInitialPlan?: () => void;
}

export const InvitationsManager: React.FC<InvitationsManagerProps> = ({
  initialPlan,
  onClearInitialPlan
}) => {
  const [invitations, setInvitations] = useState<HostingInvitation[]>(() => getHostingInvitations());
  const [showModal, setShowModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const plans = getHostingPlans();
  const infraConfig = getCommunityInfraConfig();

  // Form states
  const [clientName, setClientName] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState<string>(
    initialPlan ? initialPlan.id : (plans[1]?.id || plans[0]?.id || 'plan-pro-enjambre')
  );
  const [hostingType, setHostingType] = useState<'real_ip_extension' | 'localhost'>('real_ip_extension');
  const [customRealIp, setCustomRealIp] = useState(infraConfig.realIpHost);
  const [expiresIn, setExpiresIn] = useState<'24 Horas' | '7 Días' | '30 Días' | 'Permanente / Sin Restricciones'>('Permanente / Sin Restricciones');
  const [isUnrestricted, setIsUnrestricted] = useState(true);

  // If opened via initialPlan trigger
  React.useEffect(() => {
    if (initialPlan) {
      setSelectedPlanId(initialPlan.id);
      setShowModal(true);
      if (onClearInitialPlan) onClearInitialPlan();
    }
  }, [initialPlan]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) return;

    createHostingInvitation(
      clientName.trim(),
      selectedPlanId,
      expiresIn,
      hostingType,
      customRealIp.trim() || undefined,
      isUnrestricted
    );

    setClientName('');
    setShowModal(false);
    setInvitations(getHostingInvitations());
  };

  const handleRevoke = (id: string) => {
    if (window.confirm('¿Deseas revocar esta invitación?')) {
      revokeHostingInvitation(id);
      setInvitations(getHostingInvitations());
    }
  };

  // Preview URL for modal
  const previewSlug = clientName.trim() ? clientName.toLowerCase().replace(/[^a-z0-9]/g, '-') : 'cliente';
  const previewInfo = buildSubdomainHostingUrl(
    previewSlug,
    customRealIp || infraConfig.realIpHost,
    hostingType,
    infraConfig.defaultHttpsPort
  );
  const previewUrl = previewInfo.fullUrl;

  return (
    <div className="space-y-4 animate-in fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-white text-xs sm:text-sm flex items-center gap-2">
            <Key className="w-4 h-4 text-emerald-400" />
            <span>Links de Invitación Personalizados</span>
          </h3>
          <p className="text-[10px] sm:text-[11px] text-zinc-400 font-mono">
            Genera accesos cifrados con subdominios sobre tu IP real o localhost sin restricciones.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-black font-bold font-mono rounded-xl text-xs flex items-center gap-1.5 shadow transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Generar Link</span>
        </button>
      </div>

      {/* Lista de Invitaciones Generadas */}
      <div className="space-y-3">
        {invitations.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-emerald-900/50 rounded-2xl bg-[#080d0a]/60">
            <Key className="w-8 h-8 text-emerald-700 mx-auto mb-2 opacity-60" />
            <h4 className="text-zinc-300 font-bold text-xs mb-1">No hay links de invitación generados</h4>
            <p className="text-zinc-500 font-mono text-[11px] max-w-sm mx-auto">
              Crea links personalizados para invitar colectivos o clientes a desplegar sus servicios en tu servidor sin restricciones.
            </p>
          </div>
        ) : (
          invitations.map((inv) => (
            <div 
              key={inv.id}
              className={`p-4 rounded-2xl border transition-all space-y-3 ${
                inv.status === 'activa' 
                  ? 'bg-[#080d0a] border-emerald-950 hover:border-emerald-800' 
                  : 'bg-[#060907] border-zinc-900 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-white text-sm">{inv.clientName}</h4>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-950 border border-emerald-800 text-emerald-300 text-[9px] font-mono font-bold">
                      {inv.planName}
                    </span>
                    {inv.isUnrestricted && (
                      <span className="px-1.5 py-0.5 rounded bg-teal-950 text-teal-300 text-[9px] font-mono border border-teal-800">
                        Sin Restricciones
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-zinc-400 font-mono mt-0.5 flex items-center gap-2">
                    <span>Expira: {inv.expiresIn}</span>
                    <span>•</span>
                    <span>Creado: {inv.createdAt}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase border ${
                    inv.status === 'activa'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                      : 'bg-red-950 text-red-400 border-red-800'
                  }`}>
                    {inv.status}
                  </span>

                  {inv.status === 'activa' && (
                    <button
                      onClick={() => handleRevoke(inv.id)}
                      className="p-1.5 text-zinc-400 hover:text-red-400 rounded-lg hover:bg-red-950/40 transition-colors"
                      title="Revocar Invitación"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* URL HTTPS Generada (Con botón de 1-click copy) */}
              <div className="p-2.5 rounded-xl bg-[#050806] border border-emerald-900/50 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-zinc-400 flex items-center gap-1">
                    <Globe className="w-3 h-3 text-emerald-400" />
                    Enlace de Acceso HTTPS (Subdominio Asignado):
                  </span>
                  <span className="text-teal-400 font-bold">
                    {inv.hostingType === 'real_ip_extension' ? 'Extensión IP Real' : 'Localhost'}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-emerald-300 font-mono text-xs font-semibold truncate select-all">
                    {inv.invitationUrl}
                  </span>
                  <button
                    onClick={() => handleCopy(inv.invitationUrl, inv.id + '-url')}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-black font-bold font-mono text-[10px] flex items-center gap-1 shrink-0 cursor-pointer transition-all active:scale-95"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedId === inv.id + '-url' ? '¡Copiado!' : 'Copiar Enlace'}</span>
                  </button>
                </div>
              </div>

              {/* Llave Criptográfica APK */}
              <div className="flex items-center justify-between text-[10px] font-mono px-2 py-1 rounded-lg bg-[#040705] border border-emerald-950">
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <Key className="w-3 h-3 text-emerald-500" />
                  <span>Llave Token APK:</span>
                  <span className="text-zinc-200 font-semibold">{inv.invitationKey}</span>
                </div>
                <button
                  onClick={() => handleCopy(inv.invitationKey, inv.id + '-key')}
                  className="text-emerald-400 hover:underline cursor-pointer"
                >
                  {copiedId === inv.id + '-key' ? '¡Copiado!' : 'Copiar Llave'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL: GENERADOR DE INVITACIÓN PERSONALIZADA */}
      {showModal && (
        <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 animate-in fade-in">
          <div className="bg-[#0e1410] border border-emerald-700 rounded-3xl w-full max-w-lg p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-emerald-950 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-emerald-400" />
                <span>Generador de Links de Invitación de Hosting</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-zinc-300 font-mono mb-1">
                  Nombre del Colectivo / Cliente / Nodo Invitado
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="ej. Radio Comunitaria Libre, Colectivo Norte, Dr. Carlos"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-[#060a08] border border-emerald-900 text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-mono mb-1">Plan de Renta Asignado</label>
                <select
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#060a08] border border-emerald-900 text-white font-mono focus:outline-none focus:border-emerald-500"
                >
                  {plans.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} — ${p.priceUsd} ({p.ramGb > 1000 ? '1M GB' : `${p.ramGb}GB`} RAM / {p.storageGb > 1000 ? '1M GB' : `${p.storageGb}GB`} Disco)
                    </option>
                  ))}
                </select>
              </div>

              {/* Selector de Tipo de Hosting: Extensión de IP Real vs. Localhost */}
              <div>
                <label className="block text-zinc-300 font-mono mb-1">
                  Tipo de Enrutamiento de Subdominio (Estricto HTTPS)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setHostingType('real_ip_extension')}
                    className={`p-2.5 rounded-xl border text-left font-mono cursor-pointer transition-all ${
                      hostingType === 'real_ip_extension'
                        ? 'bg-emerald-950 border-emerald-500 text-white'
                        : 'bg-[#060a08] border-emerald-950 text-zinc-400'
                    }`}
                  >
                    <span className="font-bold block text-[11px] text-emerald-300">Extensión de IP Real</span>
                    <span className="text-[9px] text-zinc-400 block mt-0.5">.[IP_REAL].nip.io:8443</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setHostingType('localhost')}
                    className={`p-2.5 rounded-xl border text-left font-mono cursor-pointer transition-all ${
                      hostingType === 'localhost'
                        ? 'bg-emerald-950 border-emerald-500 text-white'
                        : 'bg-[#060a08] border-emerald-950 text-zinc-400'
                    }`}
                  >
                    <span className="font-bold block text-[11px] text-emerald-300">Tipo Localhost</span>
                    <span className="text-[9px] text-zinc-400 block mt-0.5">.localhost:3000</span>
                  </button>
                </div>
              </div>

              {/* IP Real Personalizada para esta invitación */}
              {hostingType === 'real_ip_extension' && (
                <div>
                  <label className="block text-zinc-400 font-mono mb-1">
                    Dirección IP Real del Host
                  </label>
                  <input
                    type="text"
                    value={customRealIp}
                    onChange={(e) => setCustomRealIp(e.target.value)}
                    placeholder="ej. 192.168.1.100"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-[#060a08] border border-emerald-900 text-white font-mono focus:outline-none focus:border-emerald-500 text-xs"
                  />
                </div>
              )}

              {/* Tiempo de Expiración */}
              <div>
                <label className="block text-zinc-300 font-mono mb-1">Vigencia de la Invitación</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['24 Horas', '7 Días', '30 Días', 'Permanente / Sin Restricciones'] as const).map((exp) => (
                    <button
                      key={exp}
                      type="button"
                      onClick={() => setExpiresIn(exp)}
                      className={`py-1.5 px-2 rounded-xl text-[10px] font-mono border text-center transition-all cursor-pointer ${
                        expiresIn === exp
                          ? 'bg-emerald-500 text-black font-bold border-emerald-400'
                          : 'bg-[#060a08] text-zinc-400 border-emerald-950 hover:text-white'
                      }`}
                    >
                      {exp === 'Permanente / Sin Restricciones' ? 'Permanente' : exp}
                    </button>
                  ))}
                </div>
              </div>

              {/* Checkbox: Infraestructura Sin Restricciones */}
              <div className="p-3 rounded-xl bg-[#060a08] border border-emerald-950 flex items-center justify-between">
                <div>
                  <span className="text-white font-bold text-xs">Acceso Libre Sin Restricciones</span>
                  <p className="text-[10px] text-zinc-400 font-mono">
                    Elimina límites de ancho de banda y cuotas de subdominios
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={isUnrestricted}
                  onChange={(e) => setIsUnrestricted(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 cursor-pointer"
                />
              </div>

              {/* Vista previa en vivo del Link HTTPS */}
              <div className="p-3 rounded-xl bg-[#040705] border border-emerald-900/60 font-mono space-y-1">
                <span className="text-[10px] text-emerald-400 font-bold block flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Vista Previa del Enlace HTTPS Generado:
                </span>
                <div className="text-zinc-200 text-[11px] truncate font-semibold select-all">
                  {previewUrl}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-white font-mono cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold font-mono cursor-pointer transition-all active:scale-95"
                >
                  Generar y Guardar Enlace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
