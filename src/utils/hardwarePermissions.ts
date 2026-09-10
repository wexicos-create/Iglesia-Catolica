/**
 * Módulo de Auditoría Técnica y Parámetros Estrictos de Android
 * Gestiona permisos reales de hardware: Micrófono, Cámara, Videollamadas,
 * Notificaciones, Almacenamiento Local y Red P2P.
 */

export interface HardwarePermissionStatus {
  microphone: 'granted' | 'denied' | 'prompt' | 'unsupported';
  camera: 'granted' | 'denied' | 'prompt' | 'unsupported';
  notifications: 'granted' | 'denied' | 'default' | 'unsupported';
  storage: 'granted' | 'denied';
  networkP2P: 'active' | 'offline';
  lastChecked: number;
}

export async function checkAllHardwarePermissions(): Promise<HardwarePermissionStatus> {
  let micStatus: 'granted' | 'denied' | 'prompt' | 'unsupported' = 'prompt';
  let camStatus: 'granted' | 'denied' | 'prompt' | 'unsupported' = 'prompt';
  let notifStatus: 'granted' | 'denied' | 'default' | 'unsupported' = 'default';

  // 1. Micrófono
  if (navigator.permissions && navigator.permissions.query) {
    try {
      const micPermission = await navigator.permissions.query({ name: 'microphone' as any });
      micStatus = micPermission.state as any;
    } catch {
      micStatus = 'prompt';
    }
  }

  // 2. Cámara
  if (navigator.permissions && navigator.permissions.query) {
    try {
      const camPermission = await navigator.permissions.query({ name: 'camera' as any });
      camStatus = camPermission.state as any;
    } catch {
      camStatus = 'prompt';
    }
  }

  // 3. Notificaciones
  if ('Notification' in window) {
    notifStatus = Notification.permission as any;
  } else {
    notifStatus = 'unsupported';
  }

  // 4. Almacenamiento
  let storageStatus: 'granted' | 'denied' = 'granted';
  try {
    localStorage.setItem('__perm_test', '1');
    localStorage.removeItem('__perm_test');
    storageStatus = 'granted';
  } catch {
    storageStatus = 'denied';
  }

  // 5. Red
  const networkStatus = navigator.onLine ? 'active' : 'offline';

  return {
    microphone: micStatus,
    camera: camStatus,
    notifications: notifStatus,
    storage: storageStatus,
    networkP2P: networkStatus,
    lastChecked: Date.now()
  };
}

/**
 * Solicita de forma explícita el permiso de Micrófono
 */
export async function requestMicrophoneAccess(): Promise<{ granted: boolean; error?: string }> {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return { granted: false, error: 'API de medios no soportada en este entorno.' };
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Detener tracks inmediatamente tras la prueba de acceso
    stream.getTracks().forEach(track => track.stop());
    return { granted: true };
  } catch (err: any) {
    return { granted: false, error: err.name || 'Permiso de micrófono denegado por Android.' };
  }
}

/**
 * Solicita de forma explícita el permiso de Cámara (Videollamada / Fotos)
 */
export async function requestCameraAccess(): Promise<{ granted: boolean; error?: string }> {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return { granted: false, error: 'API de medios no soportada en este entorno.' };
    }
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
    stream.getTracks().forEach(track => track.stop());
    return { granted: true };
  } catch (err: any) {
    return { granted: false, error: err.name || 'Permiso de cámara denegado por Android.' };
  }
}

/**
 * Solicita permiso de notificaciones push
 */
export async function requestNotificationAccess(): Promise<{ granted: boolean; status: string }> {
  if (!('Notification' in window)) {
    return { granted: false, status: 'unsupported' };
  }
  try {
    const perm = await Notification.requestPermission();
    return { granted: perm === 'granted', status: perm };
  } catch (err: any) {
    return { granted: false, status: 'error' };
  }
}
