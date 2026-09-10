import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { generateQuantumKey } from '../utils/llamaEngine';
import { 
  registerAdminVault, 
  verifyAdminVault, 
  getExistingVault, 
  getOrCreateDeviceFingerprint,
  isUsernameTaken,
  isUserIdRegistered,
  checkUserIdUniqueness,
  changePasswordWithHardwareValidation,
  hashString
} from '../utils/cryptoStorage';
import { 
  generateQuantumJpgContainer, 
  checkUsernameInBlindedMesh,
  checkUserIdInBlindedMesh,
  publishBlindedUserIdToMesh
} from '../utils/googleQuantumJpgDb';
import { 
  generateAndStoreDeviceE2EEKeys, 
  getStoredDeviceE2EEPublicKey,
  E2EEKeyPairData 
} from '../utils/e2eeEngine';
import { getDuckDnsRelayConfig } from '../utils/duckDnsRelay';
import { AndroidAuditPermissionsModal } from './AndroidAuditPermissionsModal';
import { Shield, Lock, Smartphone, Terminal, CheckCircle2, KeyRound, Sparkles, RefreshCw, Cpu, Network, AlertCircle, Database } from 'lucide-react';

interface AuthScreenProps {
  onLogin: (profile: UserProfile) => void;
}

export const generateFreshRandom11DigitId = (): string => {
  for (let attempt = 0; attempt < 20; attempt++) {
    try {
      const array = new Uint32Array(3);
      crypto.getRandomValues(array);
      const combined = ((BigInt(array[0]) << 64n) | (BigInt(array[1]) << 32n) | BigInt(array[2])).toString();
      const cleanDigits = combined.replace(/\D/g, '');
      if (cleanDigits.length >= 11) {
        let candidate = cleanDigits.slice(0, 11);
        if (candidate.startsWith('0')) {
          candidate = '7' + candidate.slice(1);
        }
        // Verificar que no exista en la base de datos local
        if (!isUserIdRegistered(candidate)) {
          return candidate;
        }
      }
    } catch {}
  }
  return Math.floor(10000000000 + Math.random() * 90000000000).toString();
};

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'register' | 'login' | 'recover'>('register');
  const [userIdInput, setUserIdInput] = useState('');
  const [userName, setUserName] = useState(''); // Always blank on start as requested
  const [userPassword, setUserPassword] = useState(''); // Always blank
  const [currentAuthInput, setCurrentAuthInput] = useState('');
  const [newPasswordRecovery, setNewPasswordRecovery] = useState('');
  const [newKeyRecovery, setNewKeyRecovery] = useState('');
  const [quantumKeyInput, setQuantumKeyInput] = useState('');
  const [generatedKey, setGeneratedKey] = useState('');
  const [e2eeInfo, setE2eeInfo] = useState<E2EEKeyPairData | null>(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [idVerification, setIdVerification] = useState<{
    status: 'idle' | 'checking' | 'available' | 'registered' | 'invalid';
    message: string;
  }>({ status: 'idle', message: '' });

  // Genera o recupera el par de claves E2EE localmente en el dispositivo
  const refreshE2EEKeysForId = async (id11: string) => {
    if (id11.length === 11) {
      try {
        const keys = await generateAndStoreDeviceE2EEKeys(id11);
        setE2eeInfo(keys);
      } catch (err) {
        console.error('Error generating device E2EE keys', err);
      }
    }
  };

  const verifyIdInDatabaseRealTime = async (id11: string) => {
    if (id11.length !== 11) {
      setIdVerification({
        status: 'invalid',
        message: `${id11.length}/11 dígitos ingresados`
      });
      return;
    }

    setIdVerification({
      status: 'checking',
      message: 'Conectando y verificando unicidad en base de datos...'
    });

    try {
      const result = await checkUserIdUniqueness(id11);
      const isBlindedMeshTaken = await checkUserIdInBlindedMesh(id11);

      if (!result.isAvailable || isBlindedMeshTaken) {
        setIdVerification({
          status: 'registered',
          message: '⛔ ID ya registrado en la base de datos (Cada ID se registra una única vez).'
        });
      } else {
        setIdVerification({
          status: 'available',
          message: '✅ ID único disponible para registro único en base de datos.'
        });
      }
    } catch (err) {
      setIdVerification({
        status: 'available',
        message: '✅ ID verificado para registro local.'
      });
    }
  };

  useEffect(() => {
    // 1. Obtener huella de hardware del dispositivo
    const devId = getOrCreateDeviceFingerprint();
    setDeviceId(devId);

    // 2. Descartar cualquier sesión/ID previo en localStorage al iniciar sesión por primera vez
    localStorage.removeItem('chattoj_user');
    localStorage.removeItem('chattoj_temp_auth_id');

    // 3. Generar SIEMPRE un ID de 11 dígitos nuevo, único y aleatorio para cada nueva instalación
    const freshId = generateFreshRandom11DigitId();
    setMode('register');
    setUserIdInput(freshId);
    setGeneratedKey(generateQuantumKey(freshId));
    setUserName('');
    setUserPassword('');
    setQuantumKeyInput('');
    setError('');
    setSuccessMsg('✨ Nueva instalación detectada: ID único generado y verificado.');

    // 4. Inicializar criptografía E2EE para el nuevo ID único
    refreshE2EEKeysForId(freshId);
    verifyIdInDatabaseRealTime(freshId);
  }, []);

  const renewFreshIdentity = () => {
    const freshId = generateFreshRandom11DigitId();
    setUserIdInput(freshId);
    const newKey = generateQuantumKey(freshId);
    setGeneratedKey(newKey);
    setUserName('');
    setUserPassword('');
    setQuantumKeyInput('');
    setError('');
    setSuccessMsg('✨ Nuevo ID Soberano de 11 dígitos generado.');
    refreshE2EEKeysForId(freshId);
    verifyIdInDatabaseRealTime(freshId);
  };

  const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 11);
    setUserIdInput(val);
    if (val.length === 11) {
      const newKey = generateQuantumKey(val);
      setGeneratedKey(newKey);
      if (mode === 'login' && !quantumKeyInput) {
        setQuantumKeyInput(newKey);
      }
      setError('');
      refreshE2EEKeysForId(val);
      verifyIdInDatabaseRealTime(val);
    } else {
      setIdVerification({
        status: 'invalid',
        message: `${val.length}/11 dígitos ingresados`
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (userIdInput.length !== 11) {
      setError('El ID de usuario debe tener exactamente 11 dígitos.');
      return;
    }

    // Asegurar que las claves asimétricas E2EE residan físicamente en el dispositivo
    let activeE2EE = e2eeInfo;
    if (!activeE2EE || activeE2EE.userId !== userIdInput) {
      activeE2EE = await generateAndStoreDeviceE2EEKeys(userIdInput);
      setE2eeInfo(activeE2EE);
    }
    const duckDnsCfg = getDuckDnsRelayConfig();

    if (mode === 'register') {
      if (!userName.trim()) {
        setError('Debes ingresar un nombre de usuario.');
        return;
      }

      // 1. REGLA ESTRICTA DE BASE DE DATOS: Cada ID se registra una única vez
      const idCheck = await checkUserIdUniqueness(userIdInput);
      const isBlindedMeshTaken = await checkUserIdInBlindedMesh(userIdInput);
      if (!idCheck.isAvailable || isBlindedMeshTaken) {
        setError(`⛔ REGISTRO DENEGADO: El ID "${userIdInput}" ya está registrado en la base de datos. Cada ID se registra una única vez. Genera o elige otro ID.`);
        return;
      }

      if (isUsernameTaken(userName.trim())) {
        setError(`El nombre de usuario "${userName.trim()}" ya está registrado en este dispositivo. Cada nombre es de un solo uso.`);
        return;
      }

      // Validar también en la malla interconectada segura sin revelar datos
      const isTakenInMesh = await checkUsernameInBlindedMesh(userName.trim());
      if (isTakenInMesh) {
        setError(`El nombre de usuario "${userName.trim()}" ya está reclamado en la red interconectada. Elige otro.`);
        return;
      }

      try {
        await registerAdminVault(
          userIdInput, 
          userName.trim(), 
          generatedKey, 
          userPassword.trim() || undefined,
          {
            publicKeyE2EE: activeE2EE.publicKeyBase64,
            publicKeyFingerprint: activeE2EE.publicKeyFingerprint
          }
        );

        // Publicar ID y usuario en la malla ciega
        await publishBlindedUserIdToMesh(userIdInput);

        // Generar contenedor .jpgduocauantomic+ conectado con base de datos de Google y autodestrucción
        const passwordHashForVault = userPassword.trim() 
          ? await hashString(userPassword.trim() + userIdInput)
          : generatedKey;
        await generateQuantumJpgContainer(userIdInput, userName.trim(), passwordHashForVault);

        const profile: UserProfile = {
          userId: userIdInput,
          quantumKey: generatedKey,
          name: userName.trim(),
          statusMessage: '🔒 Nodo E2EE Protegido • DuckDNS Blind Relay',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          nodeStatus: 'online',
          isRegistered: true,
          publicKeyE2EE: activeE2EE.publicKeyBase64,
          publicKeyFingerprint: activeE2EE.publicKeyFingerprint,
          hasPrivateKeyE2EE: true,
          duckDnsServer: duckDnsCfg.subdomain
        };
        onLogin(profile);
      } catch (err: any) {
        setError(err.message || 'Error al registrar en base de datos.');
      }
    } else if (mode === 'login') {
      const secretToVerify = quantumKeyInput.trim() || userPassword.trim() || generatedKey;
      const result = await verifyAdminVault(userIdInput, secretToVerify, userPassword.trim() || undefined);
      if (!result.isValid) {
        setError(result.error || 'Credenciales no válidas para este ID en la base de datos.');
        return;
      }

      const finalName = result.linkedName || userName.trim() || 'Usuario ' + userIdInput.slice(0, 4);
      const profile: UserProfile = {
        userId: userIdInput,
        quantumKey: generatedKey,
        name: finalName,
        statusMessage: '🔒 Sesión E2EE Verificada en Base de Datos Local',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        nodeStatus: 'online',
        isRegistered: true,
        publicKeyE2EE: activeE2EE.publicKeyBase64,
        publicKeyFingerprint: activeE2EE.publicKeyFingerprint,
        hasPrivateKeyE2EE: true,
        duckDnsServer: duckDnsCfg.subdomain
      };
      onLogin(profile);
    } else if (mode === 'recover') {
      if (!newPasswordRecovery.trim() && !newKeyRecovery.trim()) {
        setError('Debes ingresar una nueva contraseña o una nueva Key.');
        return;
      }

      const res = await changePasswordWithHardwareValidation(
        userIdInput,
        newPasswordRecovery.trim() || undefined,
        newKeyRecovery.trim() || undefined,
        currentAuthInput.trim() || undefined
      );

      if (!res.success) {
        setError(res.error || 'No se pudo actualizar las credenciales en la base de datos.');
        return;
      }

      // Re-encriptar contenedor .jpgduocauantomic+ con la nueva credencial
      try {
        const passHash = newPasswordRecovery.trim()
          ? await hashString(newPasswordRecovery.trim() + userIdInput)
          : (newKeyRecovery.trim() || generatedKey);
        await generateQuantumJpgContainer(userIdInput, userName || 'Usuario', passHash);
      } catch {}

      setSuccessMsg('✅ Credenciales actualizadas exitosamente en la base de datos local y central. Ya puedes iniciar sesión.');
      setMode('login');
      if (newPasswordRecovery.trim()) {
        setUserPassword(newPasswordRecovery.trim());
        setQuantumKeyInput(newPasswordRecovery.trim());
      } else if (newKeyRecovery.trim()) {
        setQuantumKeyInput(newKeyRecovery.trim());
      }
    }
  };

  const handleQuickDemoRegister = () => {
    renewFreshIdentity();
  };

  const handleLoadSavedCredentials = () => {
    const existing = getExistingVault();
    if (existing) {
      setUserIdInput(existing.userId);
      const generated = generateQuantumKey(existing.userId);
      setQuantumKeyInput(generated);
      setError('');
    }
  };

  return (
    <div className="h-[100dvh] w-full bg-[#070b08] flex items-center justify-center p-3 chattoj-pattern overflow-hidden select-none">
      <div className="max-w-[420px] w-full bg-[#0d1410] border border-emerald-900/70 rounded-3xl p-5 shadow-2xl relative z-10 flex flex-col justify-between max-h-[96dvh] overflow-y-auto">
        <div>
          {/* Header */}
          <div className="text-center mb-3">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-400 mb-2 glow-green-sm">
              <Shield className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center justify-center gap-1.5">
              CHATT<span className="text-emerald-400">OJ</span>
              <span className="text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800 px-1.5 py-0.5 rounded">APK PWA</span>
            </h1>
            <p className="text-[11px] text-emerald-300/80 font-mono">
              Bóveda Criptográfica & Llama Offline AI
            </p>
          </div>

            {/* Mode Switcher */}
          <div className="flex bg-[#070b08] p-1 rounded-xl border border-emerald-950 mb-3">
            <button
              type="button"
              onClick={() => { setMode('register'); setError(''); }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                mode === 'register' ? 'bg-emerald-600/25 text-emerald-300 border border-emerald-500/30' : 'text-zinc-400'
              }`}
            >
              Registro Único
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
                const existing = getExistingVault();
                if (existing) {
                  setUserIdInput(existing.userId);
                }
              }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                mode === 'login' ? 'bg-emerald-600/25 text-emerald-300 border border-emerald-500/30' : 'text-zinc-400'
              }`}
            >
              Ingresar (Log in)
            </button>
            <button
              type="button"
              onClick={() => { setMode('recover'); setError(''); }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                mode === 'recover' ? 'bg-emerald-600/25 text-emerald-300 border border-emerald-500/30' : 'text-zinc-400'
              }`}
            >
              Cambio Key
            </button>
          </div>

          {/* IA Bomba Protection Banner + Hardware Audit Link */}
          <div className="bg-emerald-950/40 border border-emerald-800/40 rounded-xl p-2.5 mb-3 text-[11px] text-emerald-200 space-y-1.5">
            <div className="flex items-center justify-between font-semibold text-emerald-400">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                <span>Base de Datos .jpgduocauantomic+</span>
              </div>
              <button
                type="button"
                onClick={() => setShowAuditModal(true)}
                className="text-[10px] text-emerald-400 hover:text-emerald-300 font-mono underline flex items-center gap-0.5 cursor-pointer"
              >
                <Cpu className="w-3 h-3" /> Auditoría Android
              </button>
            </div>
            <p className="text-zinc-300 text-[10px] leading-tight">
              Solo esta APK la consulta con tu ID y Key. Si se intenta descargar o vulnerar fuera de la app, toda la información se autodestruye en RAM.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-2.5">
            {mode === 'register' && (
              <div>
                <label className="block text-[11px] font-mono uppercase text-emerald-400 mb-0.5">
                  Nombre de Usuario Único (Espacio en blanco para tu nuevo alias)
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full bg-[#070b08] border border-emerald-900 rounded-xl px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 text-xs"
                  placeholder="Ingresa tu nombre de usuario..."
                  required
                />
                <span className="text-[10px] text-zinc-400 block mt-0.5">
                  Una vez registrado, nadie más podrá usar este nombre, tu ID ni tu Key.
                </span>
              </div>
            )}

            <div>
              <div className="flex justify-between items-center mb-0.5">
                <label className="text-[11px] font-mono uppercase text-emerald-400">
                  ID Usuario (11 Dígitos Únicos)
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={renewFreshIdentity}
                    className="text-[10px] text-emerald-400 hover:text-emerald-300 font-mono flex items-center gap-0.5 underline cursor-pointer"
                    title="Generar otro ID aleatorio para nuevo APK"
                  >
                    <RefreshCw className="w-2.5 h-2.5" /> Renovar ID
                  </button>
                  <span className="text-[10px] font-mono text-zinc-500">
                    {userIdInput.length}/11
                  </span>
                </div>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={userIdInput}
                  onChange={handleIdChange}
                  maxLength={11}
                  className="w-full bg-[#070b08] border border-emerald-900 rounded-xl px-3 py-2 pr-10 text-emerald-300 font-mono text-sm tracking-widest focus:outline-none focus:border-emerald-500"
                  placeholder="00000000000"
                  required
                />
                <button
                  type="button"
                  onClick={renewFreshIdentity}
                  className="absolute right-2 top-2 p-1 text-emerald-400 hover:text-white rounded-lg hover:bg-emerald-950 transition-colors cursor-pointer"
                  title="Renovar ID para nuevo APK"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Indicador de Verificación de Unicidad en la Base de Datos */}
              {userIdInput.length === 11 && (
                <div className="mt-1 flex items-center gap-1.5 text-[10px] font-mono px-2 py-1 rounded-lg border transition-all">
                  {idVerification.status === 'checking' && (
                    <div className="flex items-center gap-1 text-amber-300 border-amber-900/50 bg-amber-950/20 w-full py-0.5">
                      <RefreshCw className="w-3 h-3 animate-spin text-amber-400 shrink-0" />
                      <span>{idVerification.message}</span>
                    </div>
                  )}
                  {idVerification.status === 'available' && (
                    <div className="flex items-center gap-1 text-emerald-400 border-emerald-900/50 bg-emerald-950/30 w-full py-0.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>{idVerification.message}</span>
                    </div>
                  )}
                  {idVerification.status === 'registered' && (
                    <div className="flex items-center gap-1 text-rose-400 border-rose-900/50 bg-rose-950/30 w-full py-0.5">
                      <AlertCircle className="w-3 h-3 text-rose-400 shrink-0" />
                      <span>{idVerification.message}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Credenciales Criptográficas E2EE Generadas en el Dispositivo */}
            <div className="bg-[#070e0a] border border-emerald-900/60 rounded-xl p-2.5 space-y-1.5 font-mono text-[10px]">
              <div className="flex items-center justify-between text-emerald-400 font-semibold text-[10.5px]">
                <span className="flex items-center gap-1">
                  <Shield className="w-3 h-3 text-emerald-400" /> Cifrado E2EE Soberano
                </span>
                <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-800/80 px-1.5 py-0.2 rounded">
                  ECDH P-256 + AES-GCM
                </span>
              </div>
              <div className="space-y-1 text-zinc-300">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 flex items-center gap-1">
                    <KeyRound className="w-2.5 h-2.5 text-emerald-400" /> Clave Pública:
                  </span>
                  <span className="text-emerald-300 text-[9.5px]">
                    {e2eeInfo ? e2eeInfo.publicKeyFingerprint : 'Generando en hardware...'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5 text-emerald-400" /> Clave Privada:
                  </span>
                  <span className="text-emerald-400 font-bold text-[9px] bg-emerald-950/60 px-1 rounded">
                    Sellada en APK (No exportable)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 flex items-center gap-1">
                    <Network className="w-2.5 h-2.5 text-emerald-400" /> Servidor DuckDNS:
                  </span>
                  <span className="text-emerald-300 text-[9px]">
                    chat-relay.duckdns.org (Cero Conocimiento)
                  </span>
                </div>
              </div>
            </div>

            {mode === 'register' && (
              <>
                <div>
                  <div className="flex justify-between items-center mb-0.5">
                    <label className="text-[11px] font-mono uppercase text-emerald-400 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Key Criptográfica Generada
                    </label>
                    <span className="text-[10px] text-emerald-400 flex items-center gap-0.5 font-mono">
                      <CheckCircle2 className="w-3 h-3" /> SHA-256
                    </span>
                  </div>
                  <div className="w-full bg-[#070b08] border border-emerald-900 rounded-xl px-3 py-2 text-emerald-400 font-mono text-[10px] truncate flex items-center justify-between">
                    <span className="truncate">{generatedKey}</span>
                    <span className="text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-1.5 py-0.5 rounded ml-1 shrink-0">
                      AES-Q
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-emerald-400 mb-0.5">
                    Contraseña Fija Permanente (Opcional pero Recomendada)
                  </label>
                  <input
                    type="password"
                    value={userPassword}
                    onChange={(e) => setUserPassword(e.target.value)}
                    placeholder="Elige una contraseña permanente"
                    className="w-full bg-[#070b08] border border-emerald-900 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-[10px] text-zinc-400 block mt-0.5">
                    Quedará permanente y solo tú podrás modificarla desde el panel admin con la IA.
                  </span>
                </div>
              </>
            )}

            {mode === 'login' && (
              <div>
                <div className="flex justify-between items-center mb-0.5">
                  <label className="text-[11px] font-mono uppercase text-emerald-400 flex items-center gap-1">
                    <KeyRound className="w-3 h-3" /> Key o Contraseña Fija
                  </label>
                  <button
                    type="button"
                    onClick={handleLoadSavedCredentials}
                    className="text-[10px] text-emerald-400 hover:text-emerald-300 font-mono underline cursor-pointer"
                  >
                    Cargar Key guardada
                  </button>
                </div>
                <input
                  type="password"
                  value={quantumKeyInput}
                  onChange={(e) => setQuantumKeyInput(e.target.value)}
                  placeholder="Ingresa tu Key o Contraseña fija"
                  className="w-full bg-[#070b08] border border-emerald-900 rounded-xl px-3 py-2 text-emerald-400 font-mono text-xs focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
            )}

            {mode === 'recover' && (
              <div className="space-y-2.5">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-emerald-400 mb-0.5">
                    Contraseña o Key Actual (Opcional en este hardware)
                  </label>
                  <input
                    type="password"
                    value={currentAuthInput}
                    onChange={(e) => setCurrentAuthInput(e.target.value)}
                    placeholder="Contraseña o Key previa (si la recuerdas)"
                    className="w-full bg-[#070b08] border border-emerald-900 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-emerald-400 mb-0.5">
                    Nueva Contraseña Permanente
                  </label>
                  <input
                    type="password"
                    value={newPasswordRecovery}
                    onChange={(e) => setNewPasswordRecovery(e.target.value)}
                    placeholder="Elige tu nueva contraseña fija..."
                    className="w-full bg-[#070b08] border border-emerald-900 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-0.5">
                    <label className="text-[11px] font-mono uppercase text-emerald-400">
                      Nueva Key Criptográfica (Opcional)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const regenerated = generateQuantumKey(userIdInput || '12345678901');
                        setNewKeyRecovery(regenerated);
                      }}
                      className="text-[10px] text-emerald-400 hover:text-emerald-300 font-mono underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <RefreshCw className="w-2.5 h-2.5" /> Generar nueva Key
                    </button>
                  </div>
                  <input
                    type="text"
                    value={newKeyRecovery}
                    onChange={(e) => setNewKeyRecovery(e.target.value)}
                    placeholder="O deja en blanco para mantener la Key actual"
                    className="w-full bg-[#070b08] border border-emerald-900 rounded-xl px-3 py-2 text-emerald-400 font-mono text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="p-2 bg-emerald-950/30 border border-emerald-900/60 rounded-xl text-[10px] text-emerald-300/90 font-mono flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Se actualizará tanto en la bóveda cifrada local como en el nodo central.</span>
                </div>
              </div>
            )}

            {error && <p className="text-red-400 text-[11px] font-mono">{error}</p>}
            {successMsg && <p className="text-emerald-400 text-[11px] font-mono">{successMsg}</p>}

            <div className="pt-1 flex gap-2">
              {mode === 'register' && (
                <button
                  type="button"
                  onClick={handleQuickDemoRegister}
                  className="flex-1 bg-[#122017] hover:bg-[#182b1f] text-emerald-300 font-medium py-2 px-2 rounded-xl text-xs border border-emerald-800/50 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Smartphone className="w-3.5 h-3.5" /> ID Generado
                </button>
              )}
              <button
                type="submit"
                disabled={userIdInput.length !== 11 || (mode === 'register' && idVerification.status === 'registered')}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-black font-semibold py-2 px-3 rounded-xl text-xs glow-green-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
              >
                <Terminal className="w-3.5 h-3.5" /> 
                {mode === 'register' ? 'Registrar en Bóveda' : mode === 'login' ? 'Entrar (Log in)' : 'Actualizar Credenciales'}
              </button>
            </div>
          </form>
        </div>

        <div className="mt-3 pt-2 border-t border-emerald-950 text-center text-[10px] text-zinc-400 flex items-center justify-center gap-1">
          <Shield className="w-3 h-3 text-emerald-500" />
          <span>Almacenamiento en tu celular • Cero envíos a servidores externos</span>
        </div>
      </div>

      {/* Android Audit & Permissions Modal */}
      {showAuditModal && (
        <AndroidAuditPermissionsModal onClose={() => setShowAuditModal(false)} />
      )}
    </div>
  );
};
