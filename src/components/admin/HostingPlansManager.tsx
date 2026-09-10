import React, { useState } from 'react';
import { 
  ShoppingBag, Plus, Edit2, Trash2, Check, X, 
  Layers, DollarSign, Cpu, HardDrive, Zap, Tag 
} from 'lucide-react';
import { 
  HostingPlan, 
  getHostingPlans, 
  saveHostingPlans, 
  updateHostingPlan, 
  deleteHostingPlan 
} from '../../utils/swarmServer';

interface HostingPlansManagerProps {
  onGenerateInvitationWithPlan: (plan: HostingPlan) => void;
}

export const HostingPlansManager: React.FC<HostingPlansManagerProps> = ({
  onGenerateInvitationWithPlan
}) => {
  const [plans, setPlans] = useState<HostingPlan[]>(() => getHostingPlans());
  const [editingPlan, setEditingPlan] = useState<HostingPlan | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Form states for creating/editing plan
  const [name, setName] = useState('');
  const [priceUsd, setPriceUsd] = useState(15);
  const [period, setPeriod] = useState('USD / Mes');
  const [ramGb, setRamGb] = useState(16);
  const [storageGb, setStorageGb] = useState(5000);
  const [bandwidth, setBandwidth] = useState('Ilimitado P2P');
  const [badge, setBadge] = useState('');
  const [description, setDescription] = useState('');
  const [featuresStr, setFeaturesStr] = useState('Subdominio HTTPS Cifrado, Cifrado Cuántico, Búfer en RAM');

  const openNewPlanModal = () => {
    setEditingPlan(null);
    setName('');
    setPriceUsd(25);
    setPeriod('USD / Mes');
    setRamGb(32);
    setStorageGb(10000);
    setBandwidth('Ilimitado P2P');
    setBadge('NUEVO');
    setDescription('Plan comunitario configurado a la medida.');
    setFeaturesStr('Subdominio HTTPS, Búfer en RAM 32GB, Cero Logs');
    setShowEditModal(true);
  };

  const openEditPlanModal = (plan: HostingPlan) => {
    setEditingPlan(plan);
    setName(plan.name);
    setPriceUsd(plan.priceUsd);
    setPeriod(plan.period);
    setRamGb(plan.ramGb);
    setStorageGb(plan.storageGb);
    setBandwidth(plan.bandwidth);
    setBadge(plan.badge || '');
    setDescription(plan.description);
    setFeaturesStr(plan.features.join(', '));
    setShowEditModal(true);
  };

  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const features = featuresStr
      .split(',')
      .map(f => f.trim())
      .filter(Boolean);

    const planToSave: HostingPlan = {
      id: editingPlan ? editingPlan.id : 'plan-custom-' + Date.now(),
      name: name.trim(),
      priceUsd: Number(priceUsd),
      period: period.trim() || 'USD / Mes',
      ramGb: Number(ramGb),
      storageGb: Number(storageGb),
      bandwidth: bandwidth.trim() || 'Ilimitado',
      badge: badge.trim() || undefined,
      description: description.trim() || 'Plan de hosting comunitario configurado por el administrador.',
      features: features.length ? features : ['Subdominio HTTPS Cifrado', 'Búfer en RAM'],
      isCustom: true
    };

    updateHostingPlan(planToSave);
    setPlans(getHostingPlans());
    setShowEditModal(false);
  };

  const handleDelete = (planId: string) => {
    if (window.confirm('¿Seguro que deseas eliminar este plan de renta?')) {
      deleteHostingPlan(planId);
      setPlans(getHostingPlans());
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-white text-xs sm:text-sm flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-emerald-400" />
            <span>Configuración de Planes de Renta de Hosting</span>
          </h3>
          <p className="text-[10px] sm:text-[11px] text-zinc-400 font-mono">
            Define cuotas, memoria RAM, precios en USD y genera invitaciones directas sin restricciones.
          </p>
        </div>

        <button
          onClick={openNewPlanModal}
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-black font-bold font-mono rounded-xl text-xs flex items-center gap-1.5 shadow transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Crear Plan</span>
        </button>
      </div>

      {/* Grid de Planes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {plans.map((plan) => (
          <div 
            key={plan.id}
            className="p-4 rounded-2xl bg-[#080d0a] border border-emerald-950 hover:border-emerald-800/80 transition-all flex flex-col justify-between space-y-3 relative group shadow-md"
          >
            <div>
              {/* Header del Plan */}
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-white text-sm">{plan.name}</h4>
                    {plan.badge && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 text-[9px] font-mono font-bold border border-emerald-800">
                        {plan.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5">{plan.description}</p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditPlanModal(plan)}
                    className="p-1.5 text-zinc-400 hover:text-emerald-400 rounded-lg hover:bg-emerald-950/40 transition-colors"
                    title="Editar Plan"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  {plan.isCustom && (
                    <button
                      onClick={() => handleDelete(plan.id)}
                      className="p-1.5 text-zinc-400 hover:text-red-400 rounded-lg hover:bg-red-950/40 transition-colors"
                      title="Eliminar Plan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Precio y Especificaciones Clave */}
              <div className="flex items-baseline gap-1 my-2">
                <span className="text-2xl font-black text-emerald-400 font-mono">
                  ${plan.priceUsd}
                </span>
                <span className="text-xs text-zinc-400 font-mono">{plan.period}</span>
              </div>

              <div className="grid grid-cols-3 gap-2 py-2 font-mono text-[10px] border-y border-emerald-950/80 my-2">
                <div className="p-1.5 rounded-lg bg-[#050806] border border-emerald-950 text-center">
                  <span className="text-zinc-500 block">RAM</span>
                  <span className="text-white font-bold">{plan.ramGb > 1000 ? '1M GB' : `${plan.ramGb} GB`}</span>
                </div>
                <div className="p-1.5 rounded-lg bg-[#050806] border border-emerald-950 text-center">
                  <span className="text-zinc-500 block">Espacio</span>
                  <span className="text-teal-400 font-bold">{plan.storageGb > 1000 ? '1M GB' : `${plan.storageGb} GB`}</span>
                </div>
                <div className="p-1.5 rounded-lg bg-[#050806] border border-emerald-950 text-center">
                  <span className="text-zinc-500 block">Tráfico</span>
                  <span className="text-emerald-400 font-bold truncate">{plan.bandwidth}</span>
                </div>
              </div>

              {/* Lista de Características */}
              <ul className="space-y-1 text-[11px] text-zinc-300 font-mono">
                {plan.features.map((feat, idx) => (
                  <li key={idx} className="flex items-center gap-1.5">
                    <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Acción: Generar Invitación Personalizada con este plan */}
            <div className="pt-2 border-t border-emerald-950">
              <button
                onClick={() => onGenerateInvitationWithPlan(plan)}
                className="w-full py-2 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/80 text-emerald-300 font-bold font-mono text-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
              >
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                <span>Generar Link de Invitación HTTPS</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL PARA CREAR O EDITAR PLAN */}
      {showEditModal && (
        <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 animate-in fade-in">
          <div className="bg-[#0e1410] border border-emerald-700 rounded-3xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-emerald-950 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-emerald-400" />
                <span>{editingPlan ? 'Editar Plan de Renta' : 'Crear Nuevo Plan de Renta'}</span>
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 font-mono mb-1">Nombre del Plan</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ej. Plan Cooperativa Solidaria"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-[#060a08] border border-emerald-900 text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-zinc-400 font-mono mb-1">Precio (USD)</label>
                  <input
                    type="number"
                    value={priceUsd}
                    onChange={(e) => setPriceUsd(Number(e.target.value))}
                    min={0}
                    step={1}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-[#060a08] border border-emerald-900 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-mono mb-1">Periodo Facturación</label>
                  <input
                    type="text"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    placeholder="ej. USD / Mes o Gratis"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-[#060a08] border border-emerald-900 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-zinc-400 font-mono mb-1">RAM Asignada (GB)</label>
                  <input
                    type="number"
                    value={ramGb}
                    onChange={(e) => setRamGb(Number(e.target.value))}
                    min={1}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-[#060a08] border border-emerald-900 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-mono mb-1">Almacenamiento (GB)</label>
                  <input
                    type="number"
                    value={storageGb}
                    onChange={(e) => setStorageGb(Number(e.target.value))}
                    min={10}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-[#060a08] border border-emerald-900 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-mono mb-1">Ancho de Banda / Transferencia</label>
                <input
                  type="text"
                  value={bandwidth}
                  onChange={(e) => setBandwidth(e.target.value)}
                  placeholder="ej. Ilimitado P2P o 500 GB"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-[#060a08] border border-emerald-900 text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-mono mb-1">Distintivo / Badge (Opcional)</label>
                <input
                  type="text"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  placeholder="ej. POPULAR, PRO, SOBERANO"
                  className="w-full px-3 py-2 rounded-xl bg-[#060a08] border border-emerald-900 text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-mono mb-1">Descripción Breve</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="ej. Perfecto para nodos comunitarios de barrio"
                  className="w-full px-3 py-2 rounded-xl bg-[#060a08] border border-emerald-900 text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-mono mb-1">Características (Separadas por comas)</label>
                <textarea
                  value={featuresStr}
                  onChange={(e) => setFeaturesStr(e.target.value)}
                  placeholder="ej. Subdominio HTTPS, Búfer en RAM, Cero Logs"
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-[#060a08] border border-emerald-900 text-white font-mono focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-white font-mono cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold font-mono cursor-pointer transition-all active:scale-95"
                >
                  Guardar Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
