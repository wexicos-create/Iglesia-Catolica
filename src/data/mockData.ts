import { Chat, CallLog, ForumTopic, ExclusiveResource } from '../types';

export const INITIAL_CHATS: Chat[] = [
  {
    id: 'chat-1',
    name: 'Llama Offline AI (Asistente & Admin)',
    avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
    isGroup: false,
    lastMessage: 'Asistente personal e IA de atención local activa. Escribe para consultas, reportes o gestión.',
    timestamp: 'Ahora',
    unreadCount: 0,
    online: true,
    secureId: 'Q-LLAMA-ADMIN-OFFLINE',
    messages: [
      {
        id: 'm-init-1',
        senderId: 'llama-ai',
        senderName: 'Llama Offline AI (Asistente & Admin)',
        text: '¡Hola! Soy tu Asistente Personal y Administrador local en Chattoj. Tus conversaciones son 100% privadas y operan exclusivamente en este dispositivo con cifrado cuántico.\n\nEstoy disponible en tiempo real para resolver dudas, orientarte en seguridad, procesar reportes de amenazas o programar tareas.',
        timestamp: 'Ahora',
        isEncrypted: true,
        quantumHash: '0x9F4C...81B2',
        status: 'verified'
      }
    ]
  }
];

export const INITIAL_CALL_LOGS: CallLog[] = [];

export const INITIAL_FORUM_TOPICS: ForumTopic[] = [];

export const INITIAL_RESOURCES: ExclusiveResource[] = [
  {
    id: 'res-1',
    title: 'Chattoj Ultra Remix APK (Versión Oficial Offline)',
    description: 'Instalador APK optimizado con motor Llama Offline Unlimited integrado, interfaz negro y verde minimalista.',
    category: 'apk',
    fileSize: '78.4 MB',
    version: 'v4.8.2-quantum',
    downloadUrl: '#download-apk',
    requiresRegistration: true
  },
  {
    id: 'res-2',
    title: 'Manual Maestro de Criptografía Cuántica Local',
    description: 'Guía técnica avanzada sobre cómo funciona la generación de contraseñas de sesión y rotación automática de claves sin base de datos.',
    category: 'quantum',
    fileSize: '4.2 MB',
    version: 'v2.1',
    downloadUrl: '#download-manual',
    requiresRegistration: true
  }
];

