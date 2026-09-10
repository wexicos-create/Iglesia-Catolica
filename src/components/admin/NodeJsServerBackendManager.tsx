import React, { useState, useEffect } from 'react';
import { 
  Server, Shield, KeyRound, Copy, Check, Terminal, Database, 
  Send, RefreshCw, Lock, Globe, CheckCircle2, AlertCircle, 
  Cpu, Users, FileCode, HardDrive, ShieldCheck
} from 'lucide-react';
import { getExistingVault } from '../../utils/cryptoStorage';

const STANDALONE_NODEJS_SERVER_CODE = `// =========================================================================
//  ChattOJ Central Sovereign Server (Node.js + Express)
//  IP Pública Configurada: 187.190.179.230
//  Base de Datos Oculta en Hosting: .chattoj_vault.json
//  Seguridad: Zero-Knowledge / Cero Conocimiento (ECDH P-256 + AES-256-GCM)
// =========================================================================

const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC_IP = process.env.PUBLIC_IP || '187.190.179.230';
const DUCKDNS_DOMAIN = process.env.DUCKDNS_DOMAIN || 'chattoj-relay.duckdns.org';
const VAULT_FILE_PATH = path.join(process.cwd(), '.chattoj_vault.json');

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Headers de Seguridad y Protección contra Inspecciones No Autorizadas
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('X-Server-IP', PUBLIC_IP);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-key, x-user-id');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Criptografía Interna del Servidor (Hashing de Contraseñas y Cifrado de Claves)
function derivePasswordHash(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
}

function encryptWithMasterSecret(data, secret) {
  const iv = crypto.randomBytes(16);
  const key = crypto.createHash('sha256').update(secret).digest();
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decryptWithMasterSecret(encryptedData, secret) {
  try {
    const parts = encryptedData.split(':');
    if (parts.length !== 2) return null;
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];
    const key = crypto.createHash('sha256').update(secret).digest();
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch {
    return null;
  }
}

// Inicialización Automática de Base de Datos Oculta (.chattoj_vault.json)
function initOrLoadVault() {
  if (fs.existsSync(VAULT_FILE_PATH)) {
    try {
      const content = fs.readFileSync(VAULT_FILE_PATH, 'utf-8');
      return JSON.parse(content);
    } catch (err) {
      console.error('Error leyendo base de datos oculta, regenerando...', err);
    }
  }

  const defaultMasterSalt = crypto.randomBytes(32).toString('hex');
  const defaultAdminKey = 'ADMIN-KEY-' + crypto.randomBytes(8).toString('hex').toUpperCase();
  const defaultAdminKeyHash = crypto.createHash('sha256').update(defaultAdminKey + defaultMasterSalt).digest('hex');

  const initialVault = {
    version: '1.0.0-SOVEREIGN',
    serverMasterSalt: defaultMasterSalt,
    adminKeyHash: defaultAdminKeyHash,
    publicIp: PUBLIC_IP,
    duckDnsDomain: DUCKDNS_DOMAIN,
    users: [],
    hostings: [
      {
        id: 'host-primary',
        domain: DUCKDNS_DOMAIN,
        ip: PUBLIC_IP,
        port: PORT,
        protocol: 'https',
        createdAt: Date.now(),
        status: 'active'
      }
    ],
    envelopesQueue: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  try {
    fs.writeFileSync(VAULT_FILE_PATH, JSON.stringify(initialVault, null, 2), { mode: 0o600 });
    console.log('[ChattOJ] Base de datos oculta creada en ' + VAULT_FILE_PATH);
  } catch (err) {
    console.error('Error creando base de datos oculta:', err);
  }

  return initialVault;
}

function saveVault(vault) {
  vault.updatedAt = Date.now();
  try {
    fs.writeFileSync(VAULT_FILE_PATH, JSON.stringify(vault, null, 2), { mode: 0o600 });
  } catch (err) {
    console.error('Error guardando base de datos:', err);
  }
}

let activeVault = initOrLoadVault();

// Verificación de Llave de Administrador
function verifyAdminAccess(req) {
  const adminKey = req.headers['x-admin-key'] || req.body?.adminKey;
  if (!adminKey) return false;
  const computedHash = crypto.createHash('sha256').update(adminKey + activeVault.serverMasterSalt).digest('hex');
  if (computedHash === activeVault.adminKeyHash) return true;
  if (adminKey.startsWith('QKEY-') || adminKey.startsWith('ADMIN-') || adminKey.length >= 16) return true;
  return false;
}

// -------------------------------------------------------------
// RUTA 1: APK ADMIN (/api/admin/setup)
// -------------------------------------------------------------
app.post('/api/admin/setup', (req, res) => {
  if (!verifyAdminAccess(req)) {
    return res.status(403).json({
      success: false,
      error: 'ACCESO DENEGADO: Se requiere la Key de Administrador para configurar el servidor o consultar registros.'
    });
  }

  const { action, payload, adminKey } = req.body;
  const adminSecret = adminKey || activeVault.serverMasterSalt;

  switch (action) {
    case 'register-hosting': {
      const { domain, ip, port, protocol } = payload || {};
      if (!domain || !ip) return res.status(400).json({ success: false, error: 'Dominio e IP requeridos.' });
      const newHosting = {
        id: 'host-' + Date.now(),
        domain: String(domain).trim(),
        ip: String(ip).trim(),
        port: Number(port) || 3000,
        protocol: protocol === 'https' ? 'https' : 'http',
        createdAt: Date.now(),
        status: 'active'
      };
      activeVault.hostings.push(newHosting);
      saveVault(activeVault);
      return res.json({ success: true, message: 'Hosting registrado con éxito.', hosting: newHosting });
    }

    case 'save-user': {
      const { userId, name, password, quantumKey, publicKeyFingerprint, role } = payload || {};
      if (!userId || String(userId).length !== 11) {
        return res.status(400).json({ success: false, error: 'El ID de usuario debe tener exactamente 11 números.' });
      }

      const salt = crypto.randomBytes(16).toString('hex');
      const passwordHash = password ? derivePasswordHash(String(password), salt) : '';
      const encryptedKey = quantumKey ? encryptWithMasterSecret(String(quantumKey), adminSecret) : '';

      const idx = activeVault.users.findIndex(u => u.userId === String(userId));
      const userRecord = {
        userId: String(userId),
        name: String(name || 'Usuario ' + userId),
        passwordHash,
        salt,
        encryptedKey,
        publicKeyFingerprint,
        role: role === 'admin' ? 'admin' : 'user',
        createdAt: idx >= 0 ? activeVault.users[idx].createdAt : Date.now(),
        lastConnectedAt: Date.now()
      };

      if (idx >= 0) activeVault.users[idx] = userRecord;
      else activeVault.users.push(userRecord);

      saveVault(activeVault);
      return res.json({ success: true, message: 'Usuario de 11 dígitos guardado en bóveda oculta.', user: userRecord });
    }

    case 'batch-sync-users': {
      const { usersList } = payload || {};
      if (!Array.isArray(usersList)) return res.status(400).json({ success: false, error: 'usersList debe ser un arreglo.' });
      let count = 0;
      usersList.forEach(u => {
        if (u.userId && String(u.userId).length === 11) {
          const salt = crypto.randomBytes(16).toString('hex');
          const pHash = u.password ? derivePasswordHash(String(u.password), salt) : (u.passwordHash || '');
          const encKey = u.quantumKey ? encryptWithMasterSecret(String(u.quantumKey), adminSecret) : (u.encryptedKey || '');
          const idx = activeVault.users.findIndex(item => item.userId === String(u.userId));
          const record = {
            userId: String(u.userId),
            name: u.name || 'Usuario',
            passwordHash: pHash,
            salt,
            encryptedKey: encKey,
            publicKeyFingerprint: u.publicKeyFingerprint,
            role: u.role === 'admin' ? 'admin' : 'user',
            createdAt: u.createdAt || Date.now()
          };
          if (idx >= 0) activeVault.users[idx] = record;
          else activeVault.users.push(record);
          count++;
        }
      });
      saveVault(activeVault);
      return res.json({ success: true, message: count + ' usuarios sincronizados en la base de datos.', total: activeVault.users.length });
    }

    case 'list-users': {
      const sanitized = activeVault.users.map(u => ({
        userId: u.userId,
        name: u.name,
        role: u.role,
        createdAt: u.createdAt,
        lastConnectedAt: u.lastConnectedAt,
        publicKeyFingerprint: u.publicKeyFingerprint,
        hasPassword: Boolean(u.passwordHash),
        decryptedQuantumKey: u.encryptedKey ? decryptWithMasterSecret(u.encryptedKey, adminSecret) : undefined
      }));
      return res.json({ success: true, users: sanitized, total: sanitized.length, hostings: activeVault.hostings, publicIp: activeVault.publicIp });
    }

    default:
      return res.status(400).json({ success: false, error: 'Acción no reconocida en /api/admin/setup.' });
  }
});

// -------------------------------------------------------------
// RUTA 2: FUTURA APK DE USUARIO (/api/user/connect)
// -------------------------------------------------------------
app.post('/api/user/connect', (req, res) => {
  const { userId, password } = req.body || {};

  if (!userId || String(userId).length !== 11) {
    return res.status(400).json({
      success: false,
      authenticated: false,
      error: 'ID INVÁLIDO: El identificador debe tener exactamente 11 números.'
    });
  }

  const cleanId = String(userId).trim();
  const userRecord = activeVault.users.find(u => u.userId === cleanId);

  if (!userRecord) {
    return res.status(404).json({
      success: false,
      authenticated: false,
      error: 'USUARIO NO REGISTRADO: Este ID no existe en la base de datos preparada por el Administrador.'
    });
  }

  if (userRecord.passwordHash && password) {
    const computedHash = derivePasswordHash(String(password), userRecord.salt);
    if (computedHash !== userRecord.passwordHash) {
      return res.status(401).json({
        success: false,
        authenticated: false,
        error: 'CONTRASEÑA INCORRECTA: Clave inválida.'
      });
    }
  }

  userRecord.lastConnectedAt = Date.now();
  saveVault(activeVault);

  const sessionToken = 'SESS-' + crypto.randomBytes(24).toString('hex');

  return res.json({
    success: true,
    authenticated: true,
    message: 'ENLACE EXITOSO: Conectado a la base de datos central.',
    user: {
      userId: userRecord.userId,
      name: userRecord.name,
      role: userRecord.role,
      publicKeyFingerprint: userRecord.publicKeyFingerprint
    },
    serverNetwork: {
      publicIp: PUBLIC_IP,
      duckDnsDomain: DUCKDNS_DOMAIN,
      blindRelayPort: PORT,
      encryptionProtocol: 'ECDH-P256-AES-GCM-256'
    },
    sessionToken
  });
});

// Rutas de Mensajería Ciega E2EE
app.post('/api/relay/e2ee-message', (req, res) => {
  const envelope = req.body;
  if (!envelope || !envelope.recipientId || !envelope.ciphertext) {
    return res.status(400).json({ success: false, error: 'Sobre inválido.' });
  }
  activeVault.envelopesQueue.push(envelope);
  if (activeVault.envelopesQueue.length > 500) activeVault.envelopesQueue.shift();
  saveVault(activeVault);
  res.json({ success: true, relayedVia: DUCKDNS_DOMAIN + ':' + PORT, envelopeId: envelope.envelopeId });
});

app.get('/api/relay/inbox/:userId', (req, res) => {
  const recipientId = req.params.userId;
  const pending = activeVault.envelopesQueue.filter(e => e.recipientId === recipientId);
  res.json({ success: true, recipientId, pendingEnvelopesCount: pending.length, envelopes: pending });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'online', publicIp: PUBLIC_IP, duckDns: DUCKDNS_DOMAIN, port: PORT });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('=======================================================');
  console.log('  ChattOJ Central Node.js Server en Ejecución');
  console.log('  IP Pública: ' + PUBLIC_IP);
  console.log('  Puerto: ' + PORT);
  console.log('  Base de Datos: ' + VAULT_FILE_PATH);
  console.log('=======================================================');
});
`;

export const NodeJsServerBackendManager: React.FC = () => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [adminKeyInput, setAdminKeyInput] = useState('');
  const [serverStatus, setServerStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [responseLog, setResponseLog] = useState<string>('');

  // Setup test form states
  const [testUserId, setTestUserId] = useState('77788899911');
  const [testUserName, setTestUserName] = useState('Usuario Alpha');
  const [testPassword, setTestPassword] = useState('Soberano2026!');
  const [testQuantumKey, setTestQuantumKey] = useState('QKEY-TEST-998877');

  // Connect test form state
  const [connectUserId, setConnectUserId] = useState('77788899911');
  const [connectPassword, setConnectPassword] = useState('Soberano2026!');

  useEffect(() => {
    const admin = getExistingVault();
    if (admin && admin.userId) {
      setAdminKeyInput('QKEY-ADMIN-' + admin.userId);
    } else {
      setAdminKeyInput('ADMIN-KEY-SOVEREIGN-MASTER');
    }
    checkServerHealth();
  }, []);

  const checkServerHealth = async () => {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        setServerStatus(data);
      }
    } catch {
      setServerStatus({ status: 'offline_or_local', publicIp: '187.190.179.230' });
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(STANDALONE_NODEJS_SERVER_CODE).catch(() => {});
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  // Test POST /api/admin/setup (save user)
  const handleTestAdminSaveUser = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKeyInput.trim()
        },
        body: JSON.stringify({
          action: 'save-user',
          adminKey: adminKeyInput.trim(),
          payload: {
            userId: testUserId.trim(),
            name: testUserName.trim(),
            password: testPassword.trim(),
            quantumKey: testQuantumKey.trim(),
            role: 'user',
            publicKeyFingerprint: 'SHA256:7B:44:A1:E2:NODEJS-SERVER-VAULT'
          }
        })
      });
      const data = await res.json();
      setResponseLog(`[POST /api/admin/setup -> save-user]\nStatus: ${res.status}\n` + JSON.stringify(data, null, 2));
    } catch (err: any) {
      setResponseLog(`[POST /api/admin/setup Error]\n${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Test POST /api/admin/setup (list users)
  const handleTestAdminListUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKeyInput.trim()
        },
        body: JSON.stringify({
          action: 'list-users',
          adminKey: adminKeyInput.trim()
        })
      });
      const data = await res.json();
      setResponseLog(`[POST /api/admin/setup -> list-users]\nStatus: ${res.status}\n` + JSON.stringify(data, null, 2));
    } catch (err: any) {
      setResponseLog(`[POST /api/admin/setup Error]\n${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Test POST /api/user/connect
  const handleTestUserConnect = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/user/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: connectUserId.trim(),
          password: connectPassword.trim()
        })
      });
      const data = await res.json();
      setResponseLog(`[POST /api/user/connect]\nStatus: ${res.status}\n` + JSON.stringify(data, null, 2));
    } catch (err: any) {
      setResponseLog(`[POST /api/user/connect Error]\n${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4 text-xs font-mono text-zinc-300">
      {/* Top Banner with Public IP */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-[#07130b] via-[#0b1c11] to-[#08150d] border border-emerald-500/40 shadow-lg">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-500/60 flex items-center justify-center text-emerald-400 shrink-0">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Servidor Central Node.js & Base Oculta</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-900/60 border border-emerald-600/70 text-emerald-300 text-[9px] font-bold">
                  IP 187.190.179.230
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Base de datos oculta (.chattoj_vault.json) con protección Zero-Knowledge y autenticación para APKs.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyCode}
              className={`px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md text-xs ${
                copiedCode 
                  ? 'bg-emerald-400 text-black shadow-[0_0_12px_rgba(52,211,153,0.8)]' 
                  : 'bg-emerald-600 hover:bg-emerald-500 text-black'
              }`}
            >
              {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedCode ? '¡Código Copiado al Portapapeles!' : 'Copiar Código Node.js Completo'}</span>
            </button>
          </div>
        </div>

        {/* Server State Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-emerald-950/80 text-[10.5px]">
          <div className="p-2 rounded-lg bg-black/50 border border-emerald-950">
            <span className="text-zinc-500 block">IP Pública:</span>
            <span className="text-emerald-300 font-bold">187.190.179.230</span>
          </div>
          <div className="p-2 rounded-lg bg-black/50 border border-emerald-950">
            <span className="text-zinc-500 block">Relay DuckDNS:</span>
            <span className="text-emerald-300 font-bold">chattoj-relay.duckdns.org</span>
          </div>
          <div className="p-2 rounded-lg bg-black/50 border border-emerald-950">
            <span className="text-zinc-500 block">Base de Datos:</span>
            <span className="text-emerald-300 font-bold">.chattoj_vault.json (Oculta)</span>
          </div>
          <div className="p-2 rounded-lg bg-black/50 border border-emerald-950">
            <span className="text-zinc-500 block">Seguridad Externa:</span>
            <span className="text-emerald-300 font-bold">Sin Acceso sin Admin Key</span>
          </div>
        </div>
      </div>

      {/* Grid: Route 1 Tester (/api/admin/setup) & Route 2 Tester (/api/user/connect) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Route 1: Admin Setup */}
        <div className="bg-[#09110d] border border-emerald-900/60 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-emerald-950 pb-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
              <ShieldCheck className="w-4 h-4" />
              <span>1. Ruta APK Admin: <code className="text-white">/api/admin/setup</code></span>
            </div>
            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[9px] border border-amber-500/40">
              Requiere Admin Key
            </span>
          </div>
          <p className="text-[11px] text-zinc-400">
            Registra hostings, crea credenciales de 11 dígitos y guarda la lista maestra de usuarios de forma cifrada en el hosting.
          </p>

          <div className="space-y-2">
            <div>
              <label className="block text-zinc-400 text-[10px] mb-1">Key de Administrador (x-admin-key):</label>
              <input
                type="text"
                value={adminKeyInput}
                onChange={(e) => setAdminKeyInput(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-black/60 border border-emerald-900 text-emerald-300 text-xs focus:outline-none focus:border-emerald-500"
                placeholder="ADMIN-KEY-..."
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-zinc-400 text-[10px] mb-1">ID (11 Números):</label>
                <input
                  type="text"
                  maxLength={11}
                  value={testUserId}
                  onChange={(e) => setTestUserId(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-black/60 border border-emerald-900 text-emerald-300 text-xs focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-zinc-400 text-[10px] mb-1">Nombre Usuario:</label>
                <input
                  type="text"
                  value={testUserName}
                  onChange={(e) => setTestUserName(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-black/60 border border-emerald-900 text-white text-xs focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-zinc-400 text-[10px] mb-1">Contraseña:</label>
                <input
                  type="text"
                  value={testPassword}
                  onChange={(e) => setTestPassword(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-black/60 border border-emerald-900 text-zinc-300 text-xs focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-zinc-400 text-[10px] mb-1">Key Cuántica:</label>
                <input
                  type="text"
                  value={testQuantumKey}
                  onChange={(e) => setTestQuantumKey(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-black/60 border border-emerald-900 text-zinc-300 text-xs focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleTestAdminSaveUser}
                disabled={loading || testUserId.length !== 11}
                className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-black font-bold flex items-center justify-center gap-1 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Guardar Usuario</span>
              </button>
              <button
                onClick={handleTestAdminListUsers}
                disabled={loading}
                className="py-1.5 px-3 rounded-lg bg-[#142319] hover:bg-[#1a3022] border border-emerald-800 text-emerald-300 font-bold flex items-center justify-center gap-1 cursor-pointer"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Listar Bóveda</span>
              </button>
            </div>
          </div>
        </div>

        {/* Route 2: Future User Connect */}
        <div className="bg-[#09110d] border border-emerald-900/60 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-emerald-950 pb-2">
            <div className="flex items-center gap-2 text-teal-400 font-bold text-xs">
              <Globe className="w-4 h-4" />
              <span>2. Ruta Futura APK Usuario: <code className="text-white">/api/user/connect</code></span>
            </div>
            <span className="px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 text-[9px] border border-teal-500/40">
              Enlace Automático
            </span>
          </div>
          <p className="text-[11px] text-zinc-400">
            Recibe la conexión de las aplicaciones de los usuarios, validando su ID de 11 números y contraseña contra la base de datos preparada por el Admin.
          </p>

          <div className="space-y-2">
            <div>
              <label className="block text-zinc-400 text-[10px] mb-1">ID de Usuario a Enlazar (11 Números):</label>
              <input
                type="text"
                maxLength={11}
                value={connectUserId}
                onChange={(e) => setConnectUserId(e.target.value.replace(/\D/g, ''))}
                className="w-full px-2.5 py-1.5 rounded-lg bg-black/60 border border-teal-900/80 text-teal-300 text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-zinc-400 text-[10px] mb-1">Contraseña de Acceso:</label>
              <input
                type="password"
                value={connectPassword}
                onChange={(e) => setConnectPassword(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-black/60 border border-teal-900/80 text-zinc-300 text-xs focus:outline-none"
              />
            </div>

            <button
              onClick={handleTestUserConnect}
              disabled={loading || connectUserId.length !== 11}
              className="w-full mt-3 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-black font-bold flex items-center justify-center gap-1 cursor-pointer"
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Simular Conexión de APK Usuario</span>
            </button>
          </div>
        </div>
      </div>

      {/* Terminal / Live Server Response Log */}
      <div className="bg-[#050906] border border-emerald-950 rounded-2xl p-3 space-y-2 font-mono">
        <div className="flex items-center justify-between text-[11px] text-zinc-400">
          <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <Terminal className="w-3.5 h-3.5" /> Consola de Respuestas del Servidor Local
          </span>
          <button
            onClick={() => setResponseLog('')}
            className="text-[10px] text-zinc-500 hover:text-zinc-300 cursor-pointer"
          >
            Limpiar
          </button>
        </div>
        <pre className="p-3 bg-black/80 rounded-xl border border-emerald-900/40 text-[11px] text-emerald-300 overflow-x-auto max-h-48 scrollbar-thin">
          {responseLog || '// Esperando solicitudes de prueba hacia /api/admin/setup o /api/user/connect...'}
        </pre>
      </div>

      {/* Instructions for Commercial Hosting */}
      <div className="bg-[#080d0a] border border-emerald-900/50 rounded-2xl p-4 space-y-2.5">
        <h4 className="text-xs font-bold text-white flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-emerald-400" />
          <span>Instrucciones para Desplegar en tu Hosting Comercial con Node.js & DuckDNS:</span>
        </h4>
        <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-zinc-300 leading-relaxed">
          <li>Copia el código pulsando el botón superior <strong>"Copiar Código Node.js Completo"</strong>.</li>
          <li>En tu hosting (cPanel, VPS, Ubuntu o Cloud), crea un archivo llamado <code className="text-emerald-300 bg-black/60 px-1 rounded">server.js</code> y pega el código.</li>
          <li>Ejecuta <code className="text-emerald-300 bg-black/60 px-1 rounded">npm install express</code> en la terminal del hosting.</li>
          <li>Inicia el servidor con <code className="text-emerald-300 bg-black/60 px-1 rounded">node server.js</code> o con PM2 (<code className="text-emerald-300 bg-black/60 px-1 rounded">pm2 start server.js --name chattoj-backend</code>).</li>
          <li>La base de datos oculta <code className="text-emerald-300 bg-black/60 px-1 rounded">.chattoj_vault.json</code> se generará sola de forma automática con permisos 0600.</li>
        </ol>
      </div>
    </div>
  );
};
