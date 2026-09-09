import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { generateQuantumKey } from '../utils/llamaEngine';
import { 
  registerAdminVault, 
  verifyAdminVault, 
  getExistingVault, 
  getOrCreateDeviceFingerprint,
  isUsernameTaken,
  changePasswordWithHardwareValidation
} from '../utils/cryptoStorage';
import { Shield, Lock, Smartphone, Terminal, CheckCircle2, KeyRound, Sparkles, RefreshCw, Key } from 'lucide-react';

interface AuthScreenProps {
  onLogin: (profile: UserProfile) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'register' | 'login' | 'recover'>('register');
  const [userIdInput, setUserIdInput] = useState('');
  const [userName, setUserName] = useState('Jo Cervantes');
  const [userPassword, setUserPassword] = useState('');
  const [newPasswordRecovery, setNewPasswordRecovery] = useState('');
  const [quantumKeyInput, setQuantumKeyInput] = useState('');
  const [generatedKey, setGeneratedKey] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [deviceId, setDeviceId] = useState('');

  useEffect(() => {
    const devId = getOrCreateDeviceFingerprint();
    setDeviceId(devId);

    const existing = getExistingVault();
    if (existing) {
      setMode('login');
      setUserIdInput(existing.userId);
      setUserName(existing.name);
    } else {
      const defaultId = '83920194821';
      setUserIdInput(defaultId);
      setGeneratedKey(generateQuantumKey(defaultId));
    }
  }, []);

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

    if (mode === 'register') {
      if (!userName.trim()) {
        setError('Debes ingresar un nombre de usuario.');
        return;
      }

      if (isUsernameTaken(userName.trim())) {
        setError(`El nombre de usuario "${userName.trim()}" ya está registrado en la base de datos. Cada nombre es de un solo uso.`);
        return;
      }

      try {
        await registerAdminVault(userIdInput, userName.trim(), generatedKey, userPassword.trim() || undefined);
        const profile: UserProfile = {
          userId: userIdInput,
          quantumKey: generatedKey,
          name: userName.trim(),
          statusMessage: '🔒 Nodo Local Protegido con Llama Offline',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          nodeStatus: 'online',
          isRegistered: true
        };
        onLogin(profile);
      } catch (err: any) {
        setError(err.message || 'Error al registrar en bóveda local.');
      }
    } else if (mode === 'login') {
      const secretToVerify = quantumKeyInput.trim() || userPassword.trim() || generatedKey;
      const result = await verifyAdminVault(userIdInput, secretToVerify);
      if (!result.isValid) {
        setError(result.error || 'Credenciales no válidas para este ID y dispositivo.');
        return;
      }

      const finalName = result.linkedName || userName.trim() || 'Admin Nodo';
      const profile: UserProfile = {
        userId: userIdInput,
        quantumKey: generatedKey,
        name: finalName,
        statusMessage: '🔒 Sesión Verificada en Hardware Local',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        nodeStatus: 'online',
        isRegistered: true
      };
      onLogin(profile);
    } else if (mode === 'recover') {
      if (!newPasswordRecovery.trim()) {
        setError('Ingresa tu nueva contraseña o clave.');
        return;
      }

      const res = await changePasswordWithHardwareValidation(userIdInput, newPasswordRecovery.trim());
      if (!res.success) {
        setError(res.error || 'No se pudo verificar el hardware del dispositivo.');
        return;
      }

      setSuccessMsg('Contraseña actualizada con éxito en la base de datos de este dispositivo. Ahora puedes iniciar sesión.');
      setMode('login');
      setUserPassword(newPasswordRecovery.trim());
    }
  };

  const handleQuickDemoRegister = () => {
    const random11 = Math.floor(10000000000 + Math.random() * 90000000000).toString();
    setUserIdInput(random11);
    const k = generateQuantumKey(random11);
    setGeneratedKey(k);
    setQuantumKeyInput(k);
    setUserName('Jo Cervantes');
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
              className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
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
              className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                mode === 'login' ? 'bg-emerald-600/25 text-emerald-300 border border-emerald-500/30' : 'text-zinc-400'
              }`}
            >
              Ingresar (Log in)
            </button>
            <button
              type="button"
              onClick={() => { setMode('recover'); setError(''); }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                mode === 'recover' ? 'bg-emerald-600/25 text-emerald-300 border border-emerald-500/30' : 'text-zinc-400'
              }`}
            >
              Cambio Key
            </button>
          </div>

          {/* IA Bomba Protection Banner */}
          <div className="bg-emerald-950/40 border border-emerald-800/40 rounded-xl p-2.5 mb-3 text-[11px] text-emerald-200 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
              <Sparkles className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
              <span>Base de Datos protegida por IA Bomba</span>
            </div>
            <p className="text-zinc-300 text-[10px] leading-tight">
              Solo esta APK la consulta con tu ID y Key. Si se intenta descargar o vulnerar fuera de la app, toda la información se autodestruye.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-2.5">
            {mode === 'register' && (
              <div>
                <label className="block text-[11px] font-mono uppercase text-emerald-400 mb-0.5">
                  Nombre de Usuario Único (No repetible)
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full bg-[#070b08] border border-emerald-900 rounded-xl px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 text-xs"
                  placeholder="Ej: Jo Cervantes"
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
                  ID Usuario (11 Dígitos)
                </label>
                <span className="text-[10px] font-mono text-zinc-500">
                  {userIdInput.length}/11
                </span>
              </div>
              <input
                type="text"
                value={userIdInput}
                onChange={handleIdChange}
                maxLength={11}
                className="w-full bg-[#070b08] border border-emerald-900 rounded-xl px-3 py-2 text-emerald-300 font-mono text-sm tracking-widest focus:outline-none focus:border-emerald-500"
                placeholder="00000000000"
                required
              />
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
              <div>
                <label className="block text-[11px] font-mono uppercase text-emerald-400 mb-0.5">
                  Nueva Contraseña / Key (Verificada por Hardware de este Dispositivo)
                </label>
                <input
                  type="password"
                  value={newPasswordRecovery}
                  onChange={(e) => setNewPasswordRecovery(e.target.value)}
                  placeholder="Nueva contraseña permanente"
                  className="w-full bg-[#070b08] border border-emerald-900 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                  required
                />
                <span className="text-[10px] text-amber-300/80 block mt-0.5">
                  Se verificará con la base de datos que este hardware ({deviceId.slice(0, 12)}...) es el dueño del ID.
                </span>
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
                disabled={userIdInput.length !== 11}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-black font-semibold py-2 px-3 rounded-xl text-xs glow-green-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
              >
                <Terminal className="w-3.5 h-3.5" /> 
                {mode === 'register' ? 'Registrar en Bóveda' : mode === 'login' ? 'Entrar (Log in)' : 'Actualizar Key'}
              </button>
            </div>
          </form>
        </div>

        <div className="mt-3 pt-2 border-t border-emerald-950 text-center text-[10px] text-zinc-400 flex items-center justify-center gap-1">
          <Shield className="w-3 h-3 text-emerald-500" />
          <span>Almacenamiento en tu celular • Cero envíos a servidores externos</span>
        </div>
      </div>
    </div>
  );
};
