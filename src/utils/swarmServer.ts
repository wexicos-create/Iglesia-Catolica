/**
 * Swarm Decentralized Server & RAM Cloud Hosting Infrastructure Engine
 * ".jpg produplicuantistomica+" Quantum Container Protocol
 * Real-time Quantum JPG Simulation: 1,000,000 GB storage optimized into 1.00 GB physical APK footprint.
 * Strictly enforces HTTPS and real IP/localhost subdomain extensions.
 */

export interface HostedProject {
  id: string;
  name: string;
  category: 'website' | 'webapp' | 'subserver' | 'database' | 'file';
  generatedIp: string;
  port: number;
  url: string; // Strictly HTTPS
  steganoImageName: string;
  storageUsedMb: number;
  status: 'online' | 'syncing' | 'encrypted';
  deployedAt: string;
  htmlContent?: string;
  description: string;
}

export interface HostingAccount {
  id: string;
  clientName: string;
  planId: string;
  planName: string;
  monthlyPriceUsd: number;
  rentalPeriod: 'Mensual' | 'Anual' | 'Permanente';
  ramGb: number;
  storageGb: number;
  bandwidthGb: number | string;
  domain: string;
  ipAddress: string;
  accessKey: string;
  invitationUrl?: string;
  status: 'activo' | 'suspendido' | 'mantenimiento' | 'pausado';
  createdAt: string;
}

export interface HostingPlan {
  id: string;
  name: string;
  priceUsd: number;
  period: string;
  ramGb: number;
  storageGb: number;
  bandwidth: string;
  description: string;
  badge?: string;
  features: string[];
  isCustom?: boolean;
}

export interface HostingInvitationLink {
  id: string;
  clientName: string;
  planId: string;
  planName: string;
  priceUsd: number;
  rentalPeriod: 'Mensual' | 'Anual' | 'Permanente';
  hostingType: 'real_ip_extension' | 'localhost';
  realIp: string;
  subdomain: string;
  fullHttpsUrl: string;
  accessKey: string;
  expiresIn: string;
  unrestrictedAccess: boolean;
  createdAt: string;
  status: 'activa' | 'usada' | 'revocada';
}

export type HostingInvitation = HostingInvitationLink;

export interface QuantumJpgMetrics {
  virtualCapacityGb: number; // 1,000,000 GB
  physicalFootprintMb: number; // 1,024 MB (1.00 GB)
  usedVirtualStorageGb: number; // dynamic
  usedPhysicalFootprintMb: number; // dynamic ~842 MB
  compressionRatio: number; // 1,000,000 : 1
  quantumCoherencePercent: number; // e.g. 99.988%
  holographicEntropy: number; // 7.998 bits/byte
  decompressionLatencyMs: number; // 0.04 ms
  petaQubitsPerSec: number; // 4.82 PetaQubits/s
  fractalIterations: number;
  lastOptimizationTime: string;
}

export interface CommunityInfrastructureConfig {
  unrestrictedMode: boolean;
  bypassBandwidthCaps: boolean;
  infiniteNodeMesh: boolean;
  realIpHost: string;
  defaultHttpsPort: number;
  activeRelayNodes: number;
  totalQubitTrafficGb: number;
}

export const DEFAULT_HOSTING_PLANS: HostingPlan[] = [
  {
    id: 'plan-comunitario',
    name: 'Plan Comunitario Libre',
    priceUsd: 0,
    period: 'Gratis / Mes',
    ramGb: 4,
    storageGb: 500,
    bandwidth: '500 GB P2P Ilimitado',
    description: 'Ideal para nodos comunitarios de barrio y foros civiles sin costo.',
    features: ['Subdominio HTTPS Cifrado', 'Cifrado Cuántico Atómico', 'Soporte P2P Mesh', 'Búfer en RAM 4GB']
  },
  {
    id: 'plan-pro-enjambre',
    name: 'Plan Pro Enjambre',
    priceUsd: 15,
    period: 'USD / Mes',
    ramGb: 16,
    storageGb: 5000,
    bandwidth: 'Ilimitado P2P',
    badge: 'MÁS POPULAR',
    description: 'Para comunidades activas, llamadas seguras y foros de alta concurrencia.',
    features: ['Subdominio extensión IP Real / Localhost', 'Cifrado 4096-BIT', 'Cero Logs de Servidor', 'Servidor de Voz Dedicado', 'Búfer en RAM 16GB']
  },
  {
    id: 'plan-empresarial-matriz',
    name: 'Plan Activista Corporativo',
    priceUsd: 49,
    period: 'USD / Mes',
    ramGb: 64,
    storageGb: 50000,
    bandwidth: 'Infinito Ultra-Low Latency',
    badge: 'ALTA CAPACIDAD',
    description: 'Organizaciones y colectivos de prensa libre que exigen máxima soberanía.',
    features: ['Dominio HTTPS Personalizado', 'Aislamiento de Nube 100%', 'Base de Datos RAM Dedicada', 'Soporte Multinodo 24/7']
  },
  {
    id: 'plan-soberano-matriz-jpg',
    name: 'Plan Matriz JPG Cuántica (1M GB)',
    priceUsd: 99,
    period: 'USD / Mes',
    ramGb: 1024000,
    storageGb: 1000000,
    bandwidth: 'Ilimitado Cuántico Total',
    badge: 'SIN RESTRICCIONES',
    description: 'Infraestructura esteganográfica cuántica completa (.produplicuantistomica+).',
    features: ['1.000.000 GB virtualizados en 1 GB APK', 'Control Maestro Absoluto desde APK', 'Sub-servidores Web HTTPS Ilimitados', 'Multi-tenant Comunitario Sin Restricciones']
  }
];

export const HOSTING_PLANS: HostingPlan[] = DEFAULT_HOSTING_PLANS;

export interface RamDatabaseTable {
  name: string;
  recordsCount: number;
  ramMb: number;
  status: 'sincronizada' | 'optimizando';
}

export interface SwarmServerStats {
  totalCapacityGb: number;
  usedStorageGb: number;
  availableStorageGb: number;
  totalRamMb: number;
  usedRamMb: number;
  activeNodesCount: number;
  meshEncryption: string;
  protocolVersion: string;
}

const STORAGE_KEY_PROJECTS = 'chattoj_swarm_hosted_projects';
const STORAGE_KEY_HOSTING = 'chattoj_swarm_hosting_accounts';
const STORAGE_KEY_HOSTING_PLANS = 'chattoj_swarm_configured_plans';
const STORAGE_KEY_INVITATIONS = 'chattoj_swarm_invitations';
const STORAGE_KEY_RAM_DB = 'chattoj_swarm_ram_db_tables';
const STORAGE_KEY_INFRA_CONFIG = 'chattoj_community_infra_config';

export const INITIAL_SWARM_STATS: SwarmServerStats = {
  totalCapacityGb: 1000000, // 1,000,000 GB Cuánticos (Traducidos a 1 GB físico APK)
  usedStorageGb: 14.5,
  availableStorageGb: 999985.5,
  totalRamMb: 1024000000, // 1,000,000 GB RAM Cuántica
  usedRamMb: 14200,  // ~14.2 GB buffer en uso
  activeNodesCount: 14892,
  meshEncryption: 'PRODUPLICUANTISTOMICA+ 4096-BIT (MATRIZ JPG 1GB)',
  protocolVersion: 'v6.0.0-APK-ISOLATED'
};

export const DEFAULT_HOSTING_ACCOUNTS: HostingAccount[] = [
  {
    id: 'host-1',
    clientName: 'Nodo Soberano Alpha',
    planId: 'plan-pro-enjambre',
    planName: 'Plan Pro Enjambre',
    monthlyPriceUsd: 15,
    rentalPeriod: 'Mensual',
    ramGb: 16,
    storageGb: 5000,
    bandwidthGb: 'Ilimitado P2P',
    domain: 'alpha-node.192.168.1.100.nip.io',
    ipAddress: '192.168.1.100:8443',
    accessKey: 'KEY_APK_ALPHA_991823',
    invitationUrl: 'https://alpha-node.192.168.1.100.nip.io:8443/join?key=KEY_APK_ALPHA_991823',
    status: 'activo',
    createdAt: 'Hoy, 09:00 AM'
  },
  {
    id: 'host-2',
    clientName: 'Bóveda de Prensa Libre',
    planId: 'plan-empresarial-matriz',
    planName: 'Plan Activista Corporativo',
    monthlyPriceUsd: 49,
    rentalPeriod: 'Anual',
    ramGb: 64,
    storageGb: 50000,
    bandwidthGb: 'Infinito Ultra-Low Latency',
    domain: 'prensa-libre.localhost:3000',
    ipAddress: '127.0.0.1:3000',
    accessKey: 'KEY_APK_PRENSA_881204',
    invitationUrl: 'https://prensa-libre.localhost:3000/join?key=KEY_APK_PRENSA_881204',
    status: 'activo',
    createdAt: 'Ayer, 04:30 PM'
  }
];

export const DEFAULT_RAM_TABLES: RamDatabaseTable[] = [
  { name: 'users_vault_ram', recordsCount: 1420, ramMb: 340, status: 'sincronizada' },
  { name: 'mesh_sessions_cache', recordsCount: 890, ramMb: 180, status: 'sincronizada' },
  { name: 'encrypted_payloads_buffer', recordsCount: 4500, ramMb: 4200, status: 'sincronizada' },
  { name: 'quantum_jpg_matrix_cache', recordsCount: 1000000, ramMb: 842, status: 'sincronizada' },
  { name: 'node_relays_routing', recordsCount: 12890, ramMb: 1250, status: 'optimizando' }
];

export const DEFAULT_HOSTED_PROJECTS: HostedProject[] = [
  {
    id: 'proj-1',
    name: 'Portal Comunitario Soberano',
    category: 'website',
    generatedIp: '192.168.1.100',
    port: 8443,
    url: 'https://portal.192.168.1.100.nip.io:8443',
    steganoImageName: 'portal_soberano.jpg.produplicuantistomica+',
    storageUsedMb: 24.5,
    status: 'online',
    deployedAt: 'Hoy, 10:15 AM',
    description: 'Portal web descentralizado de noticias libres y foros comunitarios P2P.',
    htmlContent: `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Portal Comunitario Soberano</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #070b08; color: #10b981; margin: 0; padding: 2rem; }
    .card { background: #0d1410; border: 1px solid #059669; border-radius: 1rem; padding: 2rem; max-width: 600px; margin: 0 auto; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
    h1 { color: #fff; margin-top: 0; }
    p { color: #d1d5db; line-height: 1.6; }
    .badge { display: inline-block; background: #064e3b; color: #6ee7b7; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.8rem; font-family: monospace; }
  </style>
</head>
<body>
  <div class="card">
    <span class="badge">NODO ACTIVO HTTPS: portal.192.168.1.100.nip.io:8443</span>
    <h1>🌐 Portal Comunitario Soberano</h1>
    <p>Sub-servidor descentralizado con certificado HTTPS cuántico montado sobre contenedor <strong>.jpg produplicuantistomica+</strong>.</p>
    <p>Capacidad cuántica holográfica: <strong>1.000.000 GB</strong> en entorno de 1 GB físico.</p>
  </div>
</body>
</html>`
  }
];

/**
 * Ensures any URL strictly uses https:// and cleans up legacy http://
 */
export function ensureHttps(url: string): string {
  if (!url) return 'https://localhost:3000';
  let clean = url.trim();
  if (clean.startsWith('http://')) {
    clean = 'https://' + clean.slice(7);
  } else if (!clean.startsWith('https://')) {
    clean = 'https://' + clean;
  }
  return clean;
}

/**
 * Builds a subdomain URL based on real IP extension or localhost hosting style
 */
export function buildSubdomainHostingUrl(
  subdomain: string,
  hostIp: string = '192.168.1.100',
  mode: 'real_ip_extension' | 'localhost' = 'real_ip_extension',
  port: number = 8443
): { fullUrl: string; domain: string } {
  const cleanSub = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'nodo';
  const cleanIp = hostIp.trim() || '192.168.1.100';

  if (mode === 'localhost') {
    const domain = `${cleanSub}.localhost:${port === 8443 ? 3000 : port}`;
    return {
      domain,
      fullUrl: `https://${domain}`
    };
  } else {
    // Real IP extension mode using standard nip.io wildcard DNS (resolves directly to the real IP over HTTPS)
    const domain = `${cleanSub}.${cleanIp}.nip.io:${port}`;
    return {
      domain,
      fullUrl: `https://${domain}`
    };
  }
}

// ----------------------------------------------------
// STORAGE & CRUD: HOSTED PROJECTS
// ----------------------------------------------------
export function getHostedProjects(): HostedProject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROJECTS);
    if (raw) {
      const parsed: HostedProject[] = JSON.parse(raw);
      return parsed.map(p => ({ ...p, url: ensureHttps(p.url) }));
    }
  } catch {}
  localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(DEFAULT_HOSTED_PROJECTS));
  return DEFAULT_HOSTED_PROJECTS;
}

export function saveHostedProjects(projects: HostedProject[]): void {
  const fixed = projects.map(p => ({ ...p, url: ensureHttps(p.url) }));
  localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(fixed));
  window.dispatchEvent(new CustomEvent('chattoj-swarm-projects-updated'));
}

export function deployProjectToSwarm(
  name: string,
  category: HostedProject['category'],
  description: string,
  htmlContent?: string,
  customIp?: string
): HostedProject {
  const current = getHostedProjects();
  const cleanIp = customIp?.trim() || '192.168.1.100';
  const port = 8443;
  const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const { fullUrl } = buildSubdomainHostingUrl(slug, cleanIp, 'real_ip_extension', port);

  const steganoName = `${slug}.jpg.produplicuantistomica+`;

  const newProject: HostedProject = {
    id: 'proj-' + Date.now(),
    name,
    category,
    generatedIp: cleanIp,
    port,
    url: fullUrl,
    steganoImageName: steganoName,
    storageUsedMb: Math.floor(Math.random() * 45) + 5,
    status: 'online',
    deployedAt: 'Justo ahora',
    description: description || 'Proyecto web montado en el enjambre de sub-servidores .jpg produplicuantistomica+ (HTTPS Cuántico)',
    htmlContent: htmlContent || `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${name}</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #070b08; color: #34d399; padding: 2rem; margin: 0; }
    .panel { background: #0d1410; border: 1px solid #059669; padding: 2rem; border-radius: 1rem; max-width: 600px; margin: auto; }
    h1 { color: #fff; margin-top: 0; }
    p { color: #cbd5e1; line-height: 1.6; }
    .ip { background: #064e3b; padding: 0.25rem 0.5rem; border-radius: 4px; font-family: monospace; color: #a7f3d0; }
  </style>
</head>
<body>
  <div class="panel">
    <h1>🚀 ${name}</h1>
    <p><span class="ip">${fullUrl}</span></p>
    <p>${description}</p>
    <p>Alojado con éxito mediante la matriz JPG cuántica (.produplicuantistomica+) de 1.000.000 GB en 1 GB físico.</p>
  </div>
</body>
</html>`
  };

  const updated = [newProject, ...current];
  saveHostedProjects(updated);
  return newProject;
}

export function deleteHostedProject(projectId: string): void {
  const current = getHostedProjects();
  const updated = current.filter(p => p.id !== projectId);
  saveHostedProjects(updated);
}

// ----------------------------------------------------
// STORAGE & CRUD: HOSTING PLANS CONFIGURATION
// ----------------------------------------------------
export function getHostingPlans(): HostingPlan[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HOSTING_PLANS);
    if (raw) return JSON.parse(raw);
  } catch {}
  localStorage.setItem(STORAGE_KEY_HOSTING_PLANS, JSON.stringify(DEFAULT_HOSTING_PLANS));
  return DEFAULT_HOSTING_PLANS;
}

export function saveHostingPlans(plans: HostingPlan[]): void {
  localStorage.setItem(STORAGE_KEY_HOSTING_PLANS, JSON.stringify(plans));
  window.dispatchEvent(new CustomEvent('chattoj-swarm-plans-updated'));
}

export function updateHostingPlan(plan: HostingPlan): void {
  const plans = getHostingPlans();
  const idx = plans.findIndex(p => p.id === plan.id);
  if (idx !== -1) {
    plans[idx] = plan;
  } else {
    plans.push(plan);
  }
  saveHostingPlans(plans);
}

export function deleteHostingPlan(planId: string): void {
  const plans = getHostingPlans().filter(p => p.id !== planId);
  saveHostingPlans(plans);
}

// ----------------------------------------------------
// STORAGE & CRUD: HOSTING ACCOUNTS & INVITATIONS
// ----------------------------------------------------
export function getHostingAccounts(): HostingAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HOSTING);
    if (raw) {
      const parsed: HostingAccount[] = JSON.parse(raw);
      return parsed.map(a => ({
        ...a,
        invitationUrl: ensureHttps(a.invitationUrl || `https://${a.domain}/join?key=${a.accessKey}`)
      }));
    }
  } catch {}
  localStorage.setItem(STORAGE_KEY_HOSTING, JSON.stringify(DEFAULT_HOSTING_ACCOUNTS));
  return DEFAULT_HOSTING_ACCOUNTS;
}

export function saveHostingAccounts(accounts: HostingAccount[]): void {
  localStorage.setItem(STORAGE_KEY_HOSTING, JSON.stringify(accounts));
  window.dispatchEvent(new CustomEvent('chattoj-swarm-hosting-updated'));
}

export function createHostingAccount(
  clientName: string, 
  planId: string = 'plan-pro-enjambre',
  customDomain?: string,
  rentalPeriod: 'Mensual' | 'Anual' | 'Permanente' = 'Mensual',
  customPriceUsd?: number,
  hostIp: string = '192.168.1.100',
  mode: 'real_ip_extension' | 'localhost' = 'real_ip_extension'
): HostingAccount {
  const accounts = getHostingAccounts();
  const slug = clientName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'cliente';
  const plans = getHostingPlans();
  const selectedPlan = plans.find(p => p.id === planId) || plans[1] || DEFAULT_HOSTING_PLANS[1];

  const { fullUrl, domain } = customDomain?.trim() 
    ? { fullUrl: ensureHttps(customDomain.trim()), domain: customDomain.trim().replace(/^https?:\/\//, '') }
    : buildSubdomainHostingUrl(slug, hostIp, mode, 8443);

  const accessKey = `KEY_APK_${slug.toUpperCase().replace(/-/g, '_')}_${Math.floor(Math.random() * 899999 + 100000)}`;
  const invitationUrl = `${fullUrl}/join?key=${accessKey}&plan=${selectedPlan.id}&secure=tls_quantum`;

  const newAccount: HostingAccount = {
    id: 'host-' + Date.now(),
    clientName,
    planId: selectedPlan.id,
    planName: selectedPlan.name,
    monthlyPriceUsd: customPriceUsd !== undefined ? customPriceUsd : selectedPlan.priceUsd,
    rentalPeriod,
    ramGb: selectedPlan.ramGb,
    storageGb: selectedPlan.storageGb,
    bandwidthGb: selectedPlan.bandwidth,
    domain,
    ipAddress: `${hostIp}:8443`,
    accessKey,
    invitationUrl,
    status: 'activo',
    createdAt: 'Justo ahora'
  };

  const updated = [newAccount, ...accounts];
  saveHostingAccounts(updated);

  // Automatically register an invitation record
  createHostingInvitation({
    clientName,
    planId: selectedPlan.id,
    planName: selectedPlan.name,
    priceUsd: newAccount.monthlyPriceUsd,
    rentalPeriod,
    hostingType: mode,
    realIp: hostIp,
    subdomain: slug,
    fullHttpsUrl: invitationUrl,
    accessKey,
    expiresIn: rentalPeriod === 'Permanente' ? 'Permanente' : '30 Días',
    unrestrictedAccess: true
  });

  return newAccount;
}

export function toggleHostingAccountStatus(id: string, newStatus?: HostingAccount['status']): void {
  const accounts = getHostingAccounts();
  const updated = accounts.map(acc => {
    if (acc.id === id) {
      const nextStatus = newStatus || (acc.status === 'activo' ? 'pausado' : acc.status === 'pausado' ? 'suspendido' : 'activo');
      return { ...acc, status: nextStatus };
    }
    return acc;
  });
  saveHostingAccounts(updated);
}

export function deleteHostingAccount(id: string): void {
  const accounts = getHostingAccounts();
  const updated = accounts.filter(a => a.id !== id);
  saveHostingAccounts(updated);
}

// ----------------------------------------------------
// INVITATION LINKS MANAGEMENT
// ----------------------------------------------------
export function getHostingInvitations(): HostingInvitationLink[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_INVITATIONS);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export function saveHostingInvitations(invites: HostingInvitationLink[]): void {
  localStorage.setItem(STORAGE_KEY_INVITATIONS, JSON.stringify(invites));
  window.dispatchEvent(new CustomEvent('chattoj-swarm-invitations-updated'));
}

export function createHostingInvitation(
  param: Omit<HostingInvitationLink, 'id' | 'createdAt' | 'status'> | string,
  planIdArg?: string,
  expiresInArg?: string,
  hostingTypeArg?: 'real_ip_extension' | 'localhost',
  customRealIpArg?: string,
  unrestrictedArg?: boolean
): HostingInvitationLink {
  const existing = getHostingInvitations();
  const infra = getCommunityInfraConfig();
  const plans = getHostingPlans();

  let inviteData: Omit<HostingInvitationLink, 'id' | 'createdAt' | 'status'>;

  if (typeof param === 'string') {
    const clientName = param;
    const planId = planIdArg || 'plan-pro-enjambre';
    const plan = plans.find(p => p.id === planId) || plans[1] || plans[0];
    const hostingType: 'real_ip_extension' | 'localhost' = hostingTypeArg || 'real_ip_extension';
    const realIp = customRealIpArg || infra.realIpHost || '192.168.1.100';
    const subdomain = clientName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(Math.random() * 1000);
    const urlInfo = buildSubdomainHostingUrl(subdomain, realIp, hostingType, infra.defaultHttpsPort);
    const fullHttpsUrl = urlInfo.fullUrl;
    const accessKey = 'APK_KEY_' + Math.random().toString(36).substring(2, 10).toUpperCase() + '_' + Date.now().toString().slice(-4);

    inviteData = {
      clientName,
      planId: plan.id,
      planName: plan.name,
      priceUsd: plan.priceUsd,
      rentalPeriod: (plan.period?.includes('Anual') ? 'Anual' : plan.period?.includes('Gratis') ? 'Permanente' : 'Mensual') as any,
      hostingType,
      realIp,
      subdomain,
      fullHttpsUrl,
      accessKey,
      expiresIn: expiresInArg || 'Permanente / Sin Restricciones',
      unrestrictedAccess: unrestrictedArg !== undefined ? unrestrictedArg : true
    };
  } else {
    inviteData = param;
  }

  const newInvite: HostingInvitationLink = {
    ...inviteData,
    id: 'inv-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    fullHttpsUrl: ensureHttps(inviteData.fullHttpsUrl),
    createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString([], { day: '2-digit', month: '2-digit' }),
    status: 'activa'
  };
  const updated = [newInvite, ...existing];
  saveHostingInvitations(updated);
  return newInvite;
}

export function revokeHostingInvitation(inviteId: string): void {
  const existing = getHostingInvitations();
  const updated = existing.map(i => i.id === inviteId ? { ...i, status: 'revocada' as const } : i);
  saveHostingInvitations(updated);
}

export function deleteHostingInvitation(inviteId: string): void {
  const existing = getHostingInvitations().filter(i => i.id !== inviteId);
  saveHostingInvitations(existing);
}

// ----------------------------------------------------
// COMMUNITY INFRASTRUCTURE CONFIG
// ----------------------------------------------------
export function getCommunityInfraConfig(): CommunityInfrastructureConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_INFRA_CONFIG);
    if (raw) return JSON.parse(raw);
  } catch {}
  const defaults: CommunityInfrastructureConfig = {
    unrestrictedMode: true,
    bypassBandwidthCaps: true,
    infiniteNodeMesh: true,
    realIpHost: '192.168.1.100',
    defaultHttpsPort: 8443,
    activeRelayNodes: 14892,
    totalQubitTrafficGb: 48921.6
  };
  localStorage.setItem(STORAGE_KEY_INFRA_CONFIG, JSON.stringify(defaults));
  return defaults;
}

export function saveCommunityInfraConfig(cfg: CommunityInfrastructureConfig): void {
  localStorage.setItem(STORAGE_KEY_INFRA_CONFIG, JSON.stringify(cfg));
  window.dispatchEvent(new CustomEvent('chattoj-swarm-infra-updated'));
}

// ----------------------------------------------------
// RAM DATABASE & QUANTUM JPG ENGINE
// ----------------------------------------------------
export function getRamDatabaseTables(): RamDatabaseTable[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RAM_DB);
    if (raw) return JSON.parse(raw);
  } catch {}
  localStorage.setItem(STORAGE_KEY_RAM_DB, JSON.stringify(DEFAULT_RAM_TABLES));
  return DEFAULT_RAM_TABLES;
}

export function getQuantumJpgMetrics(): QuantumJpgMetrics {
  const projects = getHostedProjects();
  const accounts = getHostingAccounts();

  const totalUsedVirtualGb = 14.5 + projects.reduce((acc, p) => acc + (p.storageUsedMb / 1024), 0) + accounts.reduce((acc, a) => acc + (a.storageGb * 0.05), 0);
  const physicalMb = 842.3 + Math.min(150, projects.length * 1.8 + accounts.length * 2.4);

  return {
    virtualCapacityGb: 1000000,
    physicalFootprintMb: 1024,
    usedVirtualStorageGb: Math.round(totalUsedVirtualGb * 100) / 100,
    usedPhysicalFootprintMb: Math.round(physicalMb * 10) / 10,
    compressionRatio: 1000000,
    quantumCoherencePercent: 99.988,
    holographicEntropy: 7.998,
    decompressionLatencyMs: 0.04,
    petaQubitsPerSec: 4.82,
    fractalIterations: 4096,
    lastOptimizationTime: 'Activa en RAM'
  };
}
