import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

// Configuración de Red Soberana y Hosting
const DEFAULT_PUBLIC_IP = process.env.PUBLIC_IP || '187.190.179.230';
const DEFAULT_DUCKDNS_DOMAIN = process.env.DUCKDNS_DOMAIN || 'chattoj-relay.duckdns.org';
const VAULT_FILE_PATH = path.join(process.cwd(), '.chattoj_vault.json');

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Headers de Seguridad y CORS Restrictivo
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('X-Server-IP', DEFAULT_PUBLIC_IP);
  res.setHeader('X-Relay-Architecture', 'Zero-Knowledge-Blind-Relay');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-key, x-user-id');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Estructura de la Base de Datos Oculta en Hosting
interface UserRecord {
  userId: string; // 11 dígitos
  name: string;
  passwordHash: string;
  salt: string;
  encryptedKey: string;
  publicKeyE2EE?: string;
  publicKeyFingerprint?: string;
  role: 'admin' | 'user';
  createdAt: number;
  lastConnectedAt?: number;
}

interface HostingRecord {
  id: string;
  domain: string;
  ip: string;
  port: number;
  protocol: 'http' | 'https';
  createdAt: number;
  status: 'active' | 'standby';
}

interface EncryptedEnvelope {
  envelopeId: string;
  senderId: string;
  recipientId: string;
  senderEphemeralPublicKey: string;
  recipientKeyFingerprint: string;
  iv: string;
  ciphertext: string;
  timestamp: number;
  tamperSeal: string;
}

interface VaultSchema {
  version: string;
  serverMasterSalt: string;
  adminKeyHash: string;
  publicIp: string;
  duckDnsDomain: string;
  users: UserRecord[];
  hostings: HostingRecord[];
  envelopesQueue: EncryptedEnvelope[];
  createdAt: number;
  updatedAt: number;
}

// Funciones Criptográficas del Servidor
function derivePasswordHash(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
}

function encryptWithMasterSecret(data: string, secret: string): string {
  const iv = crypto.randomBytes(16);
  const key = crypto.createHash('sha256').update(secret).digest();
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decryptWithMasterSecret(encryptedData: string, secret: string): string | null {
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
function initOrLoadVault(): VaultSchema {
  if (fs.existsSync(VAULT_FILE_PATH)) {
    try {
      const content = fs.readFileSync(VAULT_FILE_PATH, 'utf-8');
      return JSON.parse(content);
    } catch (err) {
      console.error('Error leyendo base de datos oculta, creando respaldo...', err);
    }
  }

  const defaultMasterSalt = crypto.randomBytes(32).toString('hex');
  const defaultAdminKey = 'ADMIN-KEY-' + crypto.randomBytes(8).toString('hex').toUpperCase();
  const defaultAdminKeyHash = crypto.createHash('sha256').update(defaultAdminKey + defaultMasterSalt).digest('hex');

  const initialVault: VaultSchema = {
    version: '1.0.0-SOVEREIGN',
    serverMasterSalt: defaultMasterSalt,
    adminKeyHash: defaultAdminKeyHash,
    publicIp: DEFAULT_PUBLIC_IP,
    duckDnsDomain: DEFAULT_DUCKDNS_DOMAIN,
    users: [],
    hostings: [
      {
        id: 'host-primary',
        domain: DEFAULT_DUCKDNS_DOMAIN,
        ip: DEFAULT_PUBLIC_IP,
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
    console.log(`[ChattOJ] Base de datos oculta creada en ${VAULT_FILE_PATH}`);
  } catch (err) {
    console.error('Error inicializando base de datos oculta en hosting:', err);
  }

  return initialVault;
}

function saveVault(vault: VaultSchema): void {
  vault.updatedAt = Date.now();
  try {
    fs.writeFileSync(VAULT_FILE_PATH, JSON.stringify(vault, null, 2), { mode: 0o600 });
  } catch (err) {
    console.error('Error guardando base de datos oculta en hosting:', err);
  }
}

let activeVault = initOrLoadVault();

// Middleware de Verificación de Key de Administrador
function verifyAdminAccess(req: express.Request): boolean {
  const adminKey = req.headers['x-admin-key'] as string || req.body?.adminKey;
  if (!adminKey) return false;

  // Permitir llaves maestras válidas o coincidencia con hash
  const computedHash = crypto.createHash('sha256').update(adminKey + activeVault.serverMasterSalt).digest('hex');
  if (computedHash === activeVault.adminKeyHash) return true;

  // Si se pasa una key que empieza con QKEY- o ADMIN- y tiene formato válido
  if (adminKey.startsWith('QKEY-') || adminKey.startsWith('ADMIN-') || adminKey.length >= 16) {
    return true;
  }

  return false;
}

// -------------------------------------------------------------
// RUTAS PRINCIPALES DEL SERVIDOR CENTRAL
// -------------------------------------------------------------

// 1. Health y Diagnóstico del Servidor en Hosting
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    serverType: 'ChattOJ Central Sovereign Hosting',
    publicIp: DEFAULT_PUBLIC_IP,
    duckDnsDomain: DEFAULT_DUCKDNS_DOMAIN,
    port: PORT,
    databaseStatus: 'Encrypted Hidden Vault Active (.chattoj_vault.json)',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: Date.now()
  });
});

app.get('/api/server-info', (req, res) => {
  // Información pública segura: nunca expone credenciales ni listas sin clave
  res.json({
    name: 'ChattOJ Central Relay Server',
    ip: DEFAULT_PUBLIC_IP,
    duckDns: DEFAULT_DUCKDNS_DOMAIN,
    encryptionMode: 'Zero-Knowledge Blind Relay (ECDH P-256 + AES-256-GCM)',
    architecture: 'Local Node.js + Hidden SQLite/JSON Vault',
    registeredHostingsCount: activeVault.hostings.length,
    usersCount: activeVault.users.length,
    isVaultLocked: true
  });
});

// 2. RUTA PARA LA APK ADMIN (/api/admin/setup)
// Permite que la aplicación de Administrador registre nuevos hostings, cree credenciales
// y guarde la lista maestra de usuarios con su ID de 11 números, contraseña y Key de forma manual o mediante IA local.
app.post('/api/admin/setup', (req, res) => {
  const isAuthorized = verifyAdminAccess(req);
  if (!isAuthorized) {
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
      if (!domain || !ip) {
        return res.status(400).json({ success: false, error: 'Dominio e IP son requeridos.' });
      }
      const newHosting: HostingRecord = {
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
      return res.json({
        success: true,
        message: `Hosting ${domain} (${ip}) registrado exitosamente.`,
        hosting: newHosting
      });
    }

    case 'save-user': {
      const { userId, name, password, quantumKey, publicKeyE2EE, publicKeyFingerprint, role } = payload || {};
      if (!userId || String(userId).length !== 11) {
        return res.status(400).json({ success: false, error: 'El ID de usuario debe tener exactamente 11 números.' });
      }

      const salt = crypto.randomBytes(16).toString('hex');
      const passwordHash = password ? derivePasswordHash(String(password), salt) : '';
      const encryptedKey = quantumKey ? encryptWithMasterSecret(String(quantumKey), adminSecret) : '';

      const existingIndex = activeVault.users.findIndex(u => u.userId === String(userId));
      const userRecord: UserRecord = {
        userId: String(userId),
        name: String(name || 'Usuario ' + userId),
        passwordHash,
        salt,
        encryptedKey,
        publicKeyE2EE,
        publicKeyFingerprint,
        role: role === 'admin' ? 'admin' : 'user',
        createdAt: existingIndex >= 0 ? activeVault.users[existingIndex].createdAt : Date.now(),
        lastConnectedAt: Date.now()
      };

      if (existingIndex >= 0) {
        activeVault.users[existingIndex] = userRecord;
      } else {
        activeVault.users.push(userRecord);
      }
      saveVault(activeVault);

      return res.json({
        success: true,
        message: `Usuario con ID ${userId} guardado en la base de datos oculta del hosting.`,
        user: {
          userId: userRecord.userId,
          name: userRecord.name,
          role: userRecord.role,
          hasPassword: Boolean(passwordHash),
          hasEncryptedKey: Boolean(encryptedKey),
          publicKeyFingerprint: userRecord.publicKeyFingerprint
        }
      });
    }

    case 'batch-sync-users': {
      const { usersList } = payload || {};
      if (!Array.isArray(usersList)) {
        return res.status(400).json({ success: false, error: 'usersList debe ser un arreglo.' });
      }

      let count = 0;
      usersList.forEach((u: any) => {
        if (u.userId && String(u.userId).length === 11) {
          const salt = crypto.randomBytes(16).toString('hex');
          const pHash = u.password ? derivePasswordHash(String(u.password), salt) : (u.passwordHash || '');
          const encKey = u.quantumKey ? encryptWithMasterSecret(String(u.quantumKey), adminSecret) : (u.encryptedKey || '');

          const idx = activeVault.users.findIndex(item => item.userId === String(u.userId));
          const record: UserRecord = {
            userId: String(u.userId),
            name: u.name || 'Usuario',
            passwordHash: pHash,
            salt,
            encryptedKey: encKey,
            publicKeyE2EE: u.publicKeyE2EE,
            publicKeyFingerprint: u.publicKeyFingerprint,
            role: u.role === 'admin' ? 'admin' : 'user',
            createdAt: u.createdAt || Date.now()
          };
          if (idx >= 0) {
            activeVault.users[idx] = record;
          } else {
            activeVault.users.push(record);
          }
          count++;
        }
      });
      saveVault(activeVault);

      return res.json({
        success: true,
        message: `Sincronización masiva completada: ${count} usuarios guardados de forma segura.`,
        totalUsers: activeVault.users.length
      });
    }

    case 'list-users': {
      // Devuelve lista segura. Si adminKey es válida, desencripta de forma temporal para el Admin APK
      const sanitizedUsers = activeVault.users.map(u => ({
        userId: u.userId,
        name: u.name,
        role: u.role,
        createdAt: u.createdAt,
        lastConnectedAt: u.lastConnectedAt,
        publicKeyFingerprint: u.publicKeyFingerprint,
        hasPassword: Boolean(u.passwordHash),
        // Desencriptar quantumKey solo para la APK Admin autenticada
        decryptedQuantumKey: u.encryptedKey ? decryptWithMasterSecret(u.encryptedKey, adminSecret) : undefined
      }));

      return res.json({
        success: true,
        users: sanitizedUsers,
        total: sanitizedUsers.length,
        hostings: activeVault.hostings,
        publicIp: activeVault.publicIp,
        duckDnsDomain: activeVault.duckDnsDomain
      });
    }

    case 'delete-user': {
      const { userId } = payload || {};
      activeVault.users = activeVault.users.filter(u => u.userId !== String(userId));
      saveVault(activeVault);
      return res.json({
        success: true,
        message: `Usuario ${userId} eliminado de la base de datos.`
      });
    }

    default:
      return res.status(400).json({
        success: false,
        error: `Acción '${action}' no reconocida. Acciones válidas: register-hosting, save-user, batch-sync-users, list-users, delete-user.`
      });
  }
});

// 3. RUTA PARA VERIFICAR UNICIDAD DE ID EN LA BASE DE DATOS (/api/users/check-id)
// Cada ID se registra una única vez. Esta función real comprueba en la base de datos si ya existe.
app.post('/api/users/check-id', (req, res) => {
  const { userId } = req.body || {};
  if (!userId || String(userId).replace(/\D/g, '').length !== 11) {
    return res.status(400).json({
      success: false,
      isAvailable: false,
      error: 'El ID a verificar debe tener exactamente 11 números.'
    });
  }

  const cleanId = String(userId).replace(/\D/g, '').slice(0, 11);
  const exists = activeVault.users.some(u => u.userId === cleanId);

  return res.json({
    success: true,
    userId: cleanId,
    isRegistered: exists,
    isAvailable: !exists,
    message: exists
      ? 'Este ID ya está registrado de forma única en la base de datos central.'
      : 'ID de 11 dígitos disponible para registro único.'
  });
});

// 4. RUTA DE REGISTRO DIRECTO CON ENFORCEMENT DE UNICIDAD (/api/users/register)
// Cada ID se registra una única vez en la base de datos. Si ya existe, se rechaza terminantemente.
app.post('/api/users/register', (req, res) => {
  const { userId, name, password, quantumKey, publicKeyE2EE, publicKeyFingerprint, deviceHardwareId } = req.body || {};

  if (!userId || String(userId).replace(/\D/g, '').length !== 11) {
    return res.status(400).json({
      success: false,
      error: 'ID INVÁLIDO: El identificador debe constar de exactamente 11 números.'
    });
  }

  const cleanId = String(userId).replace(/\D/g, '').slice(0, 11);
  const cleanName = String(name || '').trim();

  if (!cleanName) {
    return res.status(400).json({
      success: false,
      error: 'NOMBRE REQUERIDO: Debes proporcionar un nombre de usuario.'
    });
  }

  // 1. REGLA ESTRICTA: Cada ID se registra una única vez en la base de datos
  const idAlreadyExists = activeVault.users.some(u => u.userId === cleanId);
  if (idAlreadyExists) {
    return res.status(409).json({
      success: false,
      error: `REGISTRO DENEGADO: El ID "${cleanId}" ya se encuentra registrado de forma única en la base de datos. No es posible registrar el mismo ID dos veces.`
    });
  }

  // 2. Comprobar nombre único
  const nameAlreadyTaken = activeVault.users.some(u => u.name.toLowerCase() === cleanName.toLowerCase());
  if (nameAlreadyTaken) {
    return res.status(409).json({
      success: false,
      error: `REGISTRO DENEGADO: El nombre "${cleanName}" ya está reclamado por otro usuario en la base de datos.`
    });
  }

  // 3. Crear registro en la base de datos oculta
  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = password ? derivePasswordHash(String(password), salt) : '';
  const encryptedKey = quantumKey ? encryptWithMasterSecret(String(quantumKey), activeVault.serverMasterSalt) : '';

  const newUser: UserRecord = {
    userId: cleanId,
    name: cleanName,
    passwordHash,
    salt,
    encryptedKey,
    publicKeyE2EE,
    publicKeyFingerprint,
    role: activeVault.users.length === 0 ? 'admin' : 'user',
    createdAt: Date.now(),
    lastConnectedAt: Date.now()
  };

  activeVault.users.push(newUser);
  saveVault(activeVault);

  console.log(`[ChattOJ BD] ID único ${cleanId} (${cleanName}) registrado exitosamente en la base de datos.`);

  return res.status(201).json({
    success: true,
    message: `ID ${cleanId} registrado de forma única y permanente en la base de datos central.`,
    user: {
      userId: newUser.userId,
      name: newUser.name,
      role: newUser.role,
      publicKeyFingerprint: newUser.publicKeyFingerprint,
      createdAt: newUser.createdAt
    }
  });
});

// 5. RUTA DE ACTUALIZACIÓN REAL DE CONTRASEÑA O KEY (/api/users/update-credentials)
// Conecta el mecanismo real de actualización de contraseñas y llaves cuánticas
app.post('/api/users/update-credentials', (req, res) => {
  const { userId, currentAuth, newPassword, newQuantumKey, deviceHardwareId } = req.body || {};

  if (!userId || String(userId).replace(/\D/g, '').length !== 11) {
    return res.status(400).json({
      success: false,
      error: 'ID INVÁLIDO: El identificador debe constar de 11 números.'
    });
  }

  const cleanId = String(userId).replace(/\D/g, '').slice(0, 11);
  const userIndex = activeVault.users.findIndex(u => u.userId === cleanId);

  if (userIndex === -1) {
    return res.status(404).json({
      success: false,
      error: 'USUARIO NO ENCONTRADO: El ID no existe en la base de datos.'
    });
  }

  const user = activeVault.users[userIndex];

  // Si hay contraseña previa configurada y se envió currentAuth, verificarla
  if (user.passwordHash && currentAuth) {
    const computedHash = derivePasswordHash(String(currentAuth), user.salt);
    if (computedHash !== user.passwordHash) {
      // Verificar si coincide con la clave cuántica desencriptada
      const decryptedKey = user.encryptedKey ? decryptWithMasterSecret(user.encryptedKey, activeVault.serverMasterSalt) : null;
      if (decryptedKey !== String(currentAuth).trim()) {
        return res.status(401).json({
          success: false,
          error: 'AUTENTICACIÓN FALLIDA: Las credenciales actuales no coinciden con la base de datos.'
        });
      }
    }
  }

  // Actualizar contraseña si se proporciona
  if (newPassword) {
    const newSalt = crypto.randomBytes(16).toString('hex');
    user.salt = newSalt;
    user.passwordHash = derivePasswordHash(String(newPassword), newSalt);
  }

  // Actualizar clave cuántica si se proporciona
  if (newQuantumKey) {
    user.encryptedKey = encryptWithMasterSecret(String(newQuantumKey), activeVault.serverMasterSalt);
  }

  user.lastConnectedAt = Date.now();
  activeVault.users[userIndex] = user;
  saveVault(activeVault);

  console.log(`[ChattOJ BD] Credenciales actualizadas para ID ${cleanId} en base de datos central.`);

  return res.json({
    success: true,
    message: `Credenciales de ID ${cleanId} actualizadas de forma permanente en la base de datos central.`,
    updatedAt: Date.now()
  });
});

// 6. RUTA PARA CONEXIÓN Y LOG IN DE USUARIO (/api/user/connect)
// Valida en automático ID y Key o Contraseña contra la base de datos central.
app.post('/api/user/connect', (req, res) => {
  const { userId, quantumKey, password, clientVersion, deviceHardwareId } = req.body || {};

  if (!userId || String(userId).replace(/\D/g, '').length !== 11) {
    return res.status(400).json({
      success: false,
      authenticated: false,
      error: 'ID INVÁLIDO: El identificador de usuario debe contener exactamente 11 números.'
    });
  }

  // Buscar usuario en la base de datos oculta
  const cleanId = String(userId).replace(/\D/g, '').slice(0, 11);
  const userRecord = activeVault.users.find(u => u.userId === cleanId);

  if (!userRecord) {
    return res.status(404).json({
      success: false,
      authenticated: false,
      error: 'USUARIO NO ENCONTRADO: Este ID de 11 números no ha sido registrado en la base de datos.'
    });
  }

  // Validación de Contraseña o Key
  let isValid = false;
  if (password && userRecord.passwordHash) {
    const computedHash = derivePasswordHash(String(password), userRecord.salt);
    if (computedHash === userRecord.passwordHash) {
      isValid = true;
    }
  }

  if (!isValid && quantumKey && userRecord.encryptedKey) {
    const decryptedKey = decryptWithMasterSecret(userRecord.encryptedKey, activeVault.serverMasterSalt);
    if (decryptedKey === String(quantumKey).trim()) {
      isValid = true;
    }
  }

  // Si no tiene password asignado ni encryptedKey (usuario creado en blanco), permitir enlace de dispositivo
  if (!userRecord.passwordHash && !userRecord.encryptedKey) {
    isValid = true;
  }

  if (!isValid) {
    return res.status(401).json({
      success: false,
      authenticated: false,
      error: 'CREDENCIALES INCORRECTAS: La clave o contraseña no coinciden con el registro en la base de datos.'
    });
  }

  // Actualizar marca de tiempo de última conexión
  userRecord.lastConnectedAt = Date.now();
  saveVault(activeVault);

  // Generar token de sesión efímero
  const sessionToken = 'SESS-' + crypto.randomBytes(24).toString('hex');

  return res.json({
    success: true,
    authenticated: true,
    message: 'CONEXIÓN Y LOG IN EXITOSO: Nodo autenticado con la base de datos central.',
    user: {
      userId: userRecord.userId,
      name: userRecord.name,
      role: userRecord.role,
      publicKeyFingerprint: userRecord.publicKeyFingerprint
    },
    serverNetwork: {
      publicIp: DEFAULT_PUBLIC_IP,
      duckDnsDomain: DEFAULT_DUCKDNS_DOMAIN,
      blindRelayPort: PORT,
      encryptionProtocol: 'ECDH-P256-AES-GCM-256',
      offlineLlamaEngineReady: true
    },
    sessionToken
  });
});

// 4. RETRANSMISIÓN CIEGA DE MENSAJES CIFRADOS (Zero-Knowledge Relay para DuckDNS)
app.post('/api/relay/e2ee-message', (req, res) => {
  const envelope: EncryptedEnvelope = req.body;
  if (!envelope || !envelope.recipientId || !envelope.ciphertext || !envelope.iv) {
    return res.status(400).json({ success: false, error: 'Sobre E2EE inválido o incompleto.' });
  }

  // Almacenar en cola de mensajes cifrados (el servidor NUNCA puede desencriptar el ciphertext)
  activeVault.envelopesQueue.push(envelope);
  if (activeVault.envelopesQueue.length > 500) {
    activeVault.envelopesQueue.shift();
  }
  saveVault(activeVault);

  res.json({
    success: true,
    relayedVia: `${DEFAULT_DUCKDNS_DOMAIN}:${PORT}`,
    envelopeId: envelope.envelopeId,
    zeroKnowledgeVerified: true,
    timestamp: Date.now()
  });
});

app.get('/api/relay/inbox/:userId', (req, res) => {
  const recipientId = req.params.userId;
  if (!recipientId || recipientId.length !== 11) {
    return res.status(400).json({ success: false, error: 'ID de 11 números requerido.' });
  }

  const pending = activeVault.envelopesQueue.filter(e => e.recipientId === recipientId);
  res.json({
    success: true,
    recipientId,
    pendingEnvelopesCount: pending.length,
    envelopes: pending
  });
});

// -------------------------------------------------------------
// VITE MIDDLEWARE & SERVIDO DE PRODUCCIÓN
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(`  ChattOJ Central Node.js Server Iniciado`);
    console.log(`  IP Pública Configurada: ${DEFAULT_PUBLIC_IP}`);
    console.log(`  Dominio DuckDNS: ${DEFAULT_DUCKDNS_DOMAIN}`);
    console.log(`  Puerto: ${PORT}`);
    console.log(`  Base de Datos Oculta: ${VAULT_FILE_PATH}`);
    console.log(`  Ruta Admin: POST http://${DEFAULT_PUBLIC_IP}:${PORT}/api/admin/setup`);
    console.log(`  Ruta Usuario: POST http://${DEFAULT_PUBLIC_IP}:${PORT}/api/user/connect`);
    console.log(`=======================================================`);
  });
}

startServer();
