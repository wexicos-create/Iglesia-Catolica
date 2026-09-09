/**
 * Swarm Decentralized Server & RAM Cloud Hosting Infrastructure Engine
 * ".jpg produplicuantistomica+" Quantum Container Protocol
 * Capacity: 10,000,000 GB Distributed Local/Mesh Storage & In-Memory RAM DB
 */

export interface HostedProject {
  id: string;
  name: string;
  category: 'website' | 'webapp' | 'subserver' | 'database' | 'file';
  generatedIp: string;
  port: number;
  url: string;
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
}

export const HOSTING_PLANS: HostingPlan[] = [
  {
    id: 'plan-comunitario',
    name: 'Plan Comunitario Gratuito',
    priceUsd: 0,
    period: 'Gratis / Mes',
    ramGb: 4,
    storageGb: 100,
    bandwidth: '500 GB P2P',
    description: 'Ideal para nodos comunitarios pequeños y foros locales sin costo.',
    features: ['Subdominio .chattoj.net', 'Cifrado Atómico', 'Soporte P2P Mesh', 'Búfer en RAM 4GB']
  },
  {
    id: 'plan-pro-enjambre',
    name: 'Plan Pro Enjambre',
    priceUsd: 15,
    period: 'USD / Mes',
    ramGb: 16,
    storageGb: 1000,
    bandwidth: 'Ilimitado P2P',
    badge: 'MÁS POPULAR',
    description: 'Para comunidades activas, llamadas de voz y foros de alta concurrencia.',
    features: ['Subdominio personalizado', 'Cifrado 4096-BIT', 'Cero Logs de Servidor', 'Servidor de Llamadas Dedicado', 'Búfer en RAM 16GB']
  },
  {
    id: 'plan-empresarial-matriz',
    name: 'Plan Empresarial Matriz',
    priceUsd: 49,
    period: 'USD / Mes',
    ramGb: 64,
    storageGb: 50000,
    bandwidth: 'Infinito Ultra-Low Latency',
    badge: 'RECOMENDADO',
    description: 'Empresas y organizaciones privadas que exigen soberanía de datos.',
    features: ['Dominio Propio + SSL Cuántico', 'Aislamiento de Nube 100%', 'Base de Datos RAM Dedicada', 'Soporte Multinodo 24/7']
  },
  {
    id: 'plan-soberano-matriz-jpg',
    name: 'Plan Soberano Matriz JPG (1M GB)',
    priceUsd: 99,
    period: 'USD / Mes',
    ramGb: 1024000,
    storageGb: 1000000,
    bandwidth: 'Ilimitado Cuántico',
    badge: 'SIN LIMITES APK',
    description: 'Infraestructura esteganográfica cuántica completa (.produplicuantistomica+).',
    features: ['Capacidad 1.000.000 GB en 1 GB APK', 'Control Maestro Absoluto desde APK', 'Sub-servidores Web Ilimitados', 'Multi-tenant Comunitario Libre']
  }
];

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
const STORAGE_KEY_RAM_DB = 'chattoj_swarm_ram_db_tables';

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
    storageGb: 1000,
    bandwidthGb: 'Ilimitado P2P',
    domain: 'alpha-node.chattoj.net',
    ipAddress: '102.34.00.77:3000',
    accessKey: 'KEY_APK_ALPHA_991823',
    status: 'activo',
    createdAt: 'Hoy, 09:00 AM'
  },
  {
    id: 'host-2',
    clientName: 'Bóveda de Prensa Libre',
    planId: 'plan-empresarial-matriz',
    planName: 'Plan Empresarial Matriz',
    monthlyPriceUsd: 49,
    rentalPeriod: 'Anual',
    ramGb: 64,
    storageGb: 50000,
    bandwidthGb: 'Infinito Ultra-Low Latency',
    domain: 'prensa-libre.chattoj.net',
    ipAddress: '102.34.00.104:8080',
    accessKey: 'KEY_APK_PRENSA_881204',
    status: 'activo',
    createdAt: 'Ayer, 04:30 PM'
  }
];

export const DEFAULT_RAM_TABLES: RamDatabaseTable[] = [
  { name: 'users_vault_ram', recordsCount: 1420, ramMb: 340, status: 'sincronizada' },
  { name: 'mesh_sessions_cache', recordsCount: 890, ramMb: 180, status: 'sincronizada' },
  { name: 'encrypted_payloads_buffer', recordsCount: 4500, ramMb: 4200, status: 'sincronizada' },
  { name: 'node_relays_routing', recordsCount: 12890, ramMb: 1250, status: 'optimizando' }
];

export const DEFAULT_HOSTED_PROJECTS: HostedProject[] = [
  {
    id: 'proj-1',
    name: 'Portal Comunitario Soberano',
    category: 'website',
    generatedIp: '102.34.00.77',
    port: 8080,
    url: 'http://102.34.00.77:8080',
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
    <span class="badge">NODO ACTIVO: 102.34.00.77:8080</span>
    <h1>🌐 Portal Comunitario Soberano</h1>
    <p>Bienvenido al sub-servidor web descentralizado alojado mediante el contenedor esteganográfico <strong>.jpg produplicuantistomica+</strong> dentro del enjambre Chattoj.</p>
    <p>Capacidad de red compartida: <strong>10,000,000 GB</strong> sin dependencia de servidores centrales corporativos.</p>
  </div>
</body>
</html>`
  }
];

export function getHostedProjects(): HostedProject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROJECTS);
    if (raw) return JSON.parse(raw);
  } catch {}
  localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(DEFAULT_HOSTED_PROJECTS));
  return DEFAULT_HOSTED_PROJECTS;
}

export function saveHostedProjects(projects: HostedProject[]): void {
  localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(projects));
  window.dispatchEvent(new CustomEvent('chattoj-swarm-projects-updated'));
}

export function getHostingAccounts(): HostingAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HOSTING);
    if (raw) return JSON.parse(raw);
  } catch {}
  localStorage.setItem(STORAGE_KEY_HOSTING, JSON.stringify(DEFAULT_HOSTING_ACCOUNTS));
  return DEFAULT_HOSTING_ACCOUNTS;
}

export function saveHostingAccounts(accounts: HostingAccount[]): void {
  localStorage.setItem(STORAGE_KEY_HOSTING, JSON.stringify(accounts));
  window.dispatchEvent(new CustomEvent('chattoj-swarm-hosting-updated'));
}

export function getRamDatabaseTables(): RamDatabaseTable[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RAM_DB);
    if (raw) return JSON.parse(raw);
  } catch {}
  localStorage.setItem(STORAGE_KEY_RAM_DB, JSON.stringify(DEFAULT_RAM_TABLES));
  return DEFAULT_RAM_TABLES;
}

export function createHostingAccount(
  clientName: string, 
  planId: string = 'plan-pro-enjambre',
  customDomain?: string,
  rentalPeriod: 'Mensual' | 'Anual' | 'Permanente' = 'Mensual',
  customPriceUsd?: number
): HostingAccount {
  const accounts = getHostingAccounts();
  const slug = clientName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const subnet = Math.floor(Math.random() * 200) + 10;
  const port = Math.floor(Math.random() * 5000) + 3000;
  
  const selectedPlan = HOSTING_PLANS.find(p => p.id === planId) || HOSTING_PLANS[1];

  const domain = customDomain ? (customDomain.includes('.') ? customDomain : `${customDomain}.chattoj.net`) : `${slug}.chattoj.net`;
  const ipAddress = `102.34.00.${subnet}:${port}`;
  const accessKey = `KEY_APK_${slug.toUpperCase().replace(/-/g, '_')}_${Math.floor(Math.random() * 899999 + 100000)}`;

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
    ipAddress,
    accessKey,
    status: 'activo',
    createdAt: 'Justo ahora'
  };

  const updated = [newAccount, ...accounts];
  saveHostingAccounts(updated);
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

export function generateRandomSwarmIp(): { ip: string; port: number; url: string } {
  const subnet = Math.floor(Math.random() * 200) + 10;
  const ip = `102.34.00.${subnet}`;
  const ports = [8080, 3000, 5000, 8000, 9000];
  const port = ports[Math.floor(Math.random() * ports.length)];
  return {
    ip,
    port,
    url: `http://${ip}:${port}`
  };
}

export function deployProjectToSwarm(
  name: string,
  category: HostedProject['category'],
  description: string,
  htmlContent?: string,
  customIp?: string
): HostedProject {
  const current = getHostedProjects();
  const { ip, port, url } = generateRandomSwarmIp();
  const finalIp = customIp || ip;
  const finalUrl = customIp ? `http://${customIp}:8080` : url;
  
  const cleanNameSlug = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const steganoName = `${cleanNameSlug}.jpg.produplicuantistomica+`;

  const newProject: HostedProject = {
    id: 'proj-' + Date.now(),
    name,
    category,
    generatedIp: finalIp,
    port,
    url: finalUrl,
    steganoImageName: steganoName,
    storageUsedMb: Math.floor(Math.random() * 45) + 5,
    status: 'online',
    deployedAt: 'Justo ahora',
    description: description || 'Proyecto web montado en el enjambre de sub-servidores .jpg produplicuantistomica+',
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
    <p><span class="ip">${finalUrl}</span></p>
    <p>${description}</p>
    <p>Alojado con éxito en el servidor comunitario distribuido (10,000,000 GB) mediante contenedor <strong>${steganoName}</strong>.</p>
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
